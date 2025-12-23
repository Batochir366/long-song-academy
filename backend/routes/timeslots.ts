import express from "express";
import {
  getTimeSlots,
  createTimeSlots,
  deleteTimeSlot,
  deleteDuplicateTimeSlots,
} from "../controllers/timeslotController";

const router = express.Router();

router.get("/", getTimeSlots);
router.post("/", createTimeSlots);
router.delete(
  "/duplicates/:date/:startTime/:endTime",
  deleteDuplicateTimeSlots
);
router.delete("/:id", deleteTimeSlot);

export default router;
