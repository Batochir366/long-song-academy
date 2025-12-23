import express from "express";
import {
  getVideos,
  uploadVideo,
  getFolders,
  getSubFolders,
  createFolder,
  getFolderDetails,
} from "../controllers/videosController";

const videosRouter = express.Router();

// Video routes
videosRouter.get("/", getVideos);
videosRouter.post("/upload", uploadVideo);

// Folder management routes
videosRouter.get("/folders", getFolders); // Get all folders
videosRouter.post("/folders", createFolder); // Create new folder
videosRouter.get("/folders/:folderId/details", getFolderDetails); // Get folder details
videosRouter.get("/folders/:parentId/subfolders", getSubFolders); // Get subfolders

export default videosRouter;
