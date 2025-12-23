import express from "express";
import {
  createBooking,
  updateBookingStatus,
  getBookings,
} from "../controllers/bookingController";

const router = express.Router();

router.get("/", getBookings);
router.post("/", createBooking);
router.patch("/:id", updateBookingStatus);

export default router;
