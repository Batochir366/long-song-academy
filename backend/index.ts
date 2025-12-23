import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { google } from "googleapis";
import connectMongoDB from "./lib/connectDb";
import webhookRouter from "./routes/webhook";
import timeslotsRouter from "./routes/timeslots";
import bookingsRouter from "./routes/bookings";
import usersRouter from "./routes/users";
import videosRouter from "./routes/videos";
import classroomsRouter from "./routes/classrooms";
import subjectsRouter from "./routes/subjects";

dotenv.config();
const app = express();

app.use(
  cors({
    credentials: true,
    origin: true,
  })
);
app.use(express.json());

// ============================================
// GOOGLE DRIVE OAUTH2 SETUP (2TB Storage)
// ============================================
const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
const clientSecret = process.env.NEXT_PUBLIC_CLIENT_SECRET;
const refreshToken = process.env.NEXT_PUBLIC_REFRESH_TOKEN;
const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
const authClient = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

authClient.setCredentials({
  refresh_token: refreshToken,
});

// Monitor token refresh
authClient.on("tokens", (tokens) => {
  if (tokens.refresh_token) {
    console.log("⚠️ ШИНЭ REFRESH TOKEN - .ENV файл шинэчил:");
    console.log(tokens.refresh_token);
  }
  if (tokens.access_token) {
    console.log("✅ Access token автоматаар шинэчлэгдлээ");
  }
});

// Export Drive client (videosController.ts ашиглана)
export const getDriveClient = () => {
  return google.drive({ version: "v3", auth: authClient });
};

// ============================================
// DATABASE & ROUTES
// ============================================

connectMongoDB();

app.get("/", (req, res) => {
  res.send("Hello from backend - Google Drive 2TB Ready! 🎥");
});

// Health check endpoint
app.get("/api/health/drive", async (req, res) => {
  try {
    const drive = getDriveClient();
    const about = await drive.about.get({ fields: "user, storageQuota" });

    res.json({
      status: "healthy",
      user: about.data.user?.emailAddress,
      storageUsed:
        (Number(about.data.storageQuota?.usage) / 1024 ** 3).toFixed(2) + " GB",
      storageLimit:
        (Number(about.data.storageQuota?.limit) / 1024 ** 4).toFixed(2) + " TB",
    });
  } catch (error: any) {
    if (error.code === 401 || error.message?.includes("invalid_grant")) {
      res.status(503).json({
        status: "token_expired",
        error: "REFRESH_TOKEN_EXPIRED",
        message:
          "Refresh token хүчингүй эсвэл хугацаа дууссан. OAuth Playground-аас шинэ токен авна уу.",
        instructions: "https://developers.google.com/oauthplayground",
      });
    } else {
      res.status(500).json({ status: "error", error: error.message });
    }
  }
});

// Your routes (admin upload автоматаар ажиллана)
app.use("/api/videos", videosRouter);
app.use("/api/classrooms", classroomsRouter);
app.use("/webhooks", webhookRouter);
app.use("/api/timeslots", timeslotsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/users", usersRouter);
app.use("/api/subjects", subjectsRouter);

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
  console.log(`🚀 Server ажиллаж байна: http://localhost:${PORT}`);
  console.log(`📹 Google Drive video storage бэлэн (2TB)`);

  // Startup health check
  try {
    const drive = getDriveClient();
    const about = await drive.about.get({ fields: "user" });
    console.log(`✅ Google Drive холбогдсон: ${about.data.user?.emailAddress}`);
  } catch (error: any) {
    console.error("❌ Google Drive холбогдох алдаа:", error.message);
    if (error.message?.includes("invalid_grant")) {
      console.error(`
🔴 INVALID_GRANT АЛДАА - REFRESH TOKEN хүчингүй

Шийдэл:
1. https://developers.google.com/oauthplayground руу орно
2. ⚙️ Settings -> "Use your own OAuth credentials"
3. Client ID болон Secret-ээ оруулна
4. Google Drive API v3 зөвшөөрч шинэ токен авна
5. .env файлд GOOGLE_REFRESH_TOKEN шинэчилнэ
6. Server дахин ажиллуулна
      `);
    }
  }
});
