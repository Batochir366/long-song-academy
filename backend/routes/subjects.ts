import express from "express";
import { getAllSubjects, getSubjectById } from "../controllers/subjectController";

const router = express.Router();

router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);

export default router;

