import express from "express";
import { clerkWebhook } from "../controllers/webhookController";

const router = express.Router();

router.post("/clerk", clerkWebhook);

export default router;
