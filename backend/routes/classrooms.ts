import express from "express";
import {
  createClassroom,
  getClassroomById,
  getClassrooms,
} from "../controllers/classRoomController";

const router = express.Router();

router.get("/", getClassrooms);
router.get("/:id", getClassroomById);
router.post("/", createClassroom);

export default router;

