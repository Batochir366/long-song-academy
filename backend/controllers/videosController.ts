import { getDriveClient } from "..";
import { Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import subjectModel from "../model/subject.model";
import ClassRoomModel from "../model/classRoom.model";

// ============================================
// SECURE VIDEO URL HELPER
// ============================================

/**
 * Creates a secure Google Drive preview URL from file ID
 * @param fileId - Google Drive file ID
 * @returns Secure preview URL
 * @throws Error if file ID format is invalid
 */
const createSecureVideoUrl = (fileId: string): string => {
  // Validate file ID format (Google Drive IDs are alphanumeric with _ and -)
  const fileIdPattern = /^[a-zA-Z0-9_-]{20,}$/;

  if (!fileIdPattern.test(fileId)) {
    throw new Error("Invalid Google Drive file ID format");
  }

  // Sanitize file ID (remove any special characters)
  const sanitizedId = fileId.replace(/[^a-zA-Z0-9_-]/g, "");

  // Create preview URL (not download URL for security)
  return `https://drive.google.com/file/d/${sanitizedId}/preview`;
};

const normalizePrefix = (raw: unknown): string => {
  if (!raw) return "1y4SUnfo-TDF5onzWB3JA9Rp6BzJhjWlD";
  if (Array.isArray(raw)) {
    return normalizePrefix(raw[0]);
  }
  if (typeof raw === "object") {
    return "1y4SUnfo-TDF5onzWB3JA9Rp6BzJhjWlD";
  }
  const prefix = String(raw).trim();
  if (!prefix) return "1y4SUnfo-TDF5onzWB3JA9Rp6BzJhjWlD";
  return prefix.replace(/^\/*/, "").replace(/\/*$/, "");
};

export const getVideos = async (req: Request, res: Response) => {
  const prefix = normalizePrefix(req.query.prefix);
  try {
    const drive = getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      return res
        .status(500)
        .json({ error: "Google Drive folder ID not configured" });
    }

    console.log("🔍 Folder ID:", folderId);
    console.log(
      "🔍 Service Account:",
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    );

    // First, try to get the folder itself to verify access
    try {
      const folderCheck = await drive.files.get({
        fileId: folderId,
        fields: "id, name, mimeType, capabilities, permissions",
        supportsAllDrives: true, // Important for shared drives
      });
      console.log("✅ Folder access OK:", folderCheck.data.name);
      console.log("✅ Folder capabilities:", folderCheck.data.capabilities);
    } catch (folderErr: any) {
      console.error("❌ Cannot access folder:", folderErr.message);
      console.error("❌ Full error:", folderErr);
      return res.status(403).json({
        error:
          "Cannot access Google Drive folder. Please verify:\n" +
          "1. The folder ID is correct\n" +
          "2. The folder is shared with: vip-604@video-storage-479605.iam.gserviceaccount.com\n" +
          "3. The service account has at least 'Viewer' access",
        details: folderErr.message,
        folderId: folderId,
        serviceAccount: "vip-604@video-storage-479605.iam.gserviceaccount.com",
      });
    }

    // Build query - make prefix filtering optional
    let query = `'${folderId}' in parents and trashed=false`;

    // Only filter by name if a specific prefix is provided via query param
    if (req.query.prefix && req.query.prefix !== "class11") {
      query += ` and name contains '${prefix}'`;
    }

    // TEMPORARILY REMOVED - Show ALL files to debug
    // query += ` and mimeType contains 'video/'`;

    console.log("🔍 Google Drive Query:", query);

    // Search for videos in the specified folder
    const response = await drive.files.list({
      q: query,
      fields: "files(id, name, mimeType, webViewLink, webContentLink)",
      orderBy: "name",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    console.log(response.data.files);
    console.log("🔍 Found files:", response.data.files?.length || 0);
    console.log(
      "🔍 Files:",
      response.data.files?.map((f) => `${f.name} (${f.mimeType})`)
    );

    const videos =
      response.data.files?.map((file) => ({
        name: file.name || "",
        key: file.id || "",
        url: `https://drive.google.com/file/d/${file.id}/preview`,
        downloadUrl: file.webContentLink,
      })) || [];

    return res.status(200).json({ videos });
  } catch (err: any | Error) {
    console.error("Error getting videos:", err);
    return res
      .status(500)
      .json({ error: "Failed to get videos", details: err?.message });
  }
};

const upload = multer({ dest: "uploads/" });

type SubjectResponse = {
  _id: string;
  subjectName: string;
  subjectVideoKey: string;
  videoUrl?: string;
  description?: string;
  thumbnailUrl?: string;
  [key: string]: unknown;
};

export const uploadVideo = [
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const rawFolder =
        typeof req.body.folder === "string" ? req.body.folder : "";
      const classroomNameRaw =
        typeof req.body.classroomName === "string"
          ? req.body.classroomName
          : null;
      const subjectSlugFromClient =
        typeof req.body.subjectSlug === "string" ? req.body.subjectSlug : null;
      const folderBase =
        classroomNameRaw && classroomNameRaw.trim().length > 0
          ? classroomNameRaw
          : rawFolder;
      const slugify = (value: string) =>
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9/]+/g, "-")
          .replace(/^-+|-+$/g, "");
      const folder =
        folderBase && folderBase.trim().length > 0
          ? slugify(folderBase)
          : "classroom";
      const filePath = req.file?.path;
      const originalName = req.file?.originalname || "video";
      const mimeType = req.file?.mimetype || "video/mp4";

      if (!filePath || !req.file) {
        return res.status(400).json({ error: "Video file is required" });
      }

      const safeName = originalName
        .replace(/\s+/g, "_")
        .replace(/[^\w.\-]/g, "");
      const extension = safeName.includes(".")
        ? safeName.substring(safeName.lastIndexOf("."))
        : "";
      const subjectNameRaw =
        typeof req.body.subjectName === "string" ? req.body.subjectName : null;

      const subjectBase =
        subjectSlugFromClient && subjectSlugFromClient.trim().length > 0
          ? subjectSlugFromClient.trim()
          : subjectNameRaw && subjectNameRaw.trim().length > 0
          ? `${slugify(subjectNameRaw)}${extension}`
          : safeName.length > 0
          ? safeName
          : `video${extension}`;
      const cleanedSubjectBase = subjectBase.replace(/^\/+/, "");
      const fileName = `${folder}_${cleanedSubjectBase}`;

      const drive = getDriveClient();

      // Get folder ID from request body, or use default from .env
      const folderId = req.body.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
      const driveOwnerEmail = process.env.GOOGLE_DRIVE_OWNER_EMAIL; // Your Gmail address

      if (!folderId) {
        return res.status(400).json({
          error:
            "Folder ID is required. Please provide folderId in request body or set GOOGLE_DRIVE_FOLDER_ID in .env",
        });
      }

      console.log(`📤 Uploading to folder: ${folderId}`);

      // WORKAROUND: Create file in the folder you own
      // The folder is in YOUR drive, so storage quota comes from YOUR account
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };
      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath),
      };

      console.log("📤 Attempting to upload to folder:", folderId);
      console.log("📁 File name:", fileName);

      try {
        const uploadResponse = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: "id, name, webViewLink, webContentLink",
          supportsAllDrives: true,
        });

        const fileId = uploadResponse.data.id!;
        console.log("✅ Upload successful! File ID:", fileId);

        // Make file publicly accessible (anyone with link can view)
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
          supportsAllDrives: true,
        });
        console.log("✅ Public permissions set");

        // Optional: If you want to transfer ownership to yourself
        if (driveOwnerEmail) {
          try {
            await drive.permissions.create({
              fileId: fileId,
              requestBody: {
                role: "owner",
                type: "user",
                emailAddress: driveOwnerEmail,
              },
              transferOwnership: true,
              supportsAllDrives: true,
            });
            console.log("✅ Ownership transferred to:", driveOwnerEmail);
          } catch (ownerErr) {
            console.log(
              "⚠️ Could not transfer ownership (this is OK):",
              ownerErr
            );
          }
        }

        let subjectDoc: SubjectResponse | null = null;
        const classroomId =
          typeof req.body.classroomId === "string"
            ? req.body.classroomId
            : null;
        const description =
          typeof req.body.description === "string"
            ? req.body.description
            : undefined;
        const thumbnailUrl =
          typeof req.body.thumbnailUrl === "string"
            ? req.body.thumbnailUrl
            : undefined;

        if (subjectNameRaw || classroomId) {
          const subjectPayload = {
            subjectName: subjectNameRaw?.trim() || folder,
            description,
            subjectVideoKey: fileId, // Store Google Drive file ID
            videoUrl: createSecureVideoUrl(fileId), // ✨ Secure preview URL
            thumbnailUrl, // ✨ Cloudinary thumbnail URL
          };
          const createdSubject = await subjectModel.create(subjectPayload);
          subjectDoc = {
            _id: createdSubject._id.toString(),
            subjectName: createdSubject.subjectName,
            subjectVideoKey: createdSubject.subjectVideoKey,
            videoUrl: createdSubject.videoUrl ?? undefined, // ✨ Include video URL
            description: createdSubject.description ?? undefined,
            thumbnailUrl: createdSubject.thumbnailUrl ?? undefined, // ✨ Include thumbnail URL
          };

          if (classroomId) {
            await ClassRoomModel.findByIdAndUpdate(classroomId, {
              $addToSet: { subjects: createdSubject._id },
            });
          }
        }

        const responsePayload: Record<string, unknown> = {
          message: "Upload амжилттай",
          key: fileId,
          url: `https://drive.google.com/file/d/${fileId}/preview`,
          downloadUrl: uploadResponse.data.webContentLink,
        };

        if (subjectDoc) {
          responsePayload.subject = subjectDoc;
        }

        res.json(responsePayload);
      } catch (uploadErr) {
        console.error("❌ Upload to Google Drive failed:", uploadErr);
        throw uploadErr; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload амжилтгүй боллоо" });
    } finally {
      const filePath = req.file?.path;
      if (filePath) {
        try {
          await fs.promises.unlink(filePath);
        } catch (unlinkErr) {
          console.error("Could not remove temp file:", unlinkErr);
        }
      }
    }
  },
];

// ============================================
// FOLDER MANAGEMENT
// ============================================

// Get list of all folders from Google Drive
export const getFolders = async (req: Request, res: Response) => {
  try {
    const drive = getDriveClient();

    // Query to get only folders
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name, createdTime, modifiedTime, parents)",
      orderBy: "name",
      pageSize: 100,
    });

    const folders =
      response.data.files?.map((folder) => ({
        id: folder.id,
        name: folder.name,
        createdTime: folder.createdTime,
        modifiedTime: folder.modifiedTime,
        parents: folder.parents,
      })) || [];

    console.log(`📁 Found ${folders.length} folders in Google Drive`);

    return res.status(200).json({
      folders,
      count: folders.length,
    });
  } catch (err: any) {
    console.error("Error getting folders:", err);
    if (err.code === 401 || err.message?.includes("invalid_grant")) {
      return res.status(401).json({
        error: "REFRESH_TOKEN_EXPIRED",
        message: "Google Drive token has expired. Please update refresh token.",
      });
    }
    return res.status(500).json({
      error: "Failed to get folders",
      details: err?.message,
    });
  }
};

// Get subfolders inside a specific parent folder
export const getSubFolders = async (req: Request, res: Response) => {
  try {
    const { parentId } = req.params;

    if (!parentId) {
      return res.status(400).json({ error: "Parent folder ID is required" });
    }

    const drive = getDriveClient();

    const response = await drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name, createdTime, modifiedTime)",
      orderBy: "name",
      pageSize: 100,
    });

    const folders =
      response.data.files?.map((folder) => ({
        id: folder.id,
        name: folder.name,
        createdTime: folder.createdTime,
        modifiedTime: folder.modifiedTime,
      })) || [];

    console.log(`📁 Found ${folders.length} subfolders in ${parentId}`);

    return res.status(200).json({
      parentId,
      folders,
      count: folders.length,
    });
  } catch (err: any) {
    console.error("Error getting subfolders:", err);
    return res.status(500).json({
      error: "Failed to get subfolders",
      details: err?.message,
    });
  }
};

// Create a new folder in Google Drive
export const createFolder = async (req: Request, res: Response) => {
  try {
    const { name, parentId } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    const drive = getDriveClient();

    const fileMetadata: any = {
      name: name.trim(),
      mimeType: "application/vnd.google-apps.folder",
    };

    // If parent folder specified, create inside it
    if (
      parentId &&
      typeof parentId === "string" &&
      parentId.trim().length > 0
    ) {
      fileMetadata.parents = [parentId.trim()];
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id, name, createdTime, parents",
    });

    console.log(
      `✅ Folder created: ${response.data.name} (${response.data.id})`
    );

    return res.status(201).json({
      message: "Folder created successfully",
      folder: {
        id: response.data.id,
        name: response.data.name,
        createdTime: response.data.createdTime,
        parents: response.data.parents,
      },
    });
  } catch (err: any) {
    console.error("Error creating folder:", err);
    if (err.code === 401 || err.message?.includes("invalid_grant")) {
      return res.status(401).json({
        error: "REFRESH_TOKEN_EXPIRED",
        message: "Google Drive token has expired. Please update refresh token.",
      });
    }
    return res.status(500).json({
      error: "Failed to create folder",
      details: err?.message,
    });
  }
};

// Get folder details by ID
export const getFolderDetails = async (req: Request, res: Response) => {
  try {
    const { folderId } = req.params;

    if (!folderId) {
      return res.status(400).json({ error: "Folder ID is required" });
    }

    const drive = getDriveClient();

    const response = await drive.files.get({
      fileId: folderId,
      fields: "id, name, createdTime, modifiedTime, parents, mimeType",
    });

    if (response.data.mimeType !== "application/vnd.google-apps.folder") {
      return res.status(400).json({
        error: "The specified ID is not a folder",
      });
    }

    return res.status(200).json({
      folder: {
        id: response.data.id,
        name: response.data.name,
        createdTime: response.data.createdTime,
        modifiedTime: response.data.modifiedTime,
        parents: response.data.parents,
      },
    });
  } catch (err: any) {
    console.error("Error getting folder details:", err);
    if (err.code === 404) {
      return res.status(404).json({
        error: "Folder not found",
      });
    }
    return res.status(500).json({
      error: "Failed to get folder details",
      details: err?.message,
    });
  }
};
