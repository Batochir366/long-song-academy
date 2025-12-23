import { Request, Response } from "express";
import BookingModel from "../model/booking.model";
import TimeSlotModel from "../model/timeSlot.model";
import UserModel from "../model/user.model";

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { timeSlotId, clerkId } = req.body;

    if (!timeSlotId) {
      return res.status(400).json({
        error: "Time slot ID is required",
      });
    }

    if (!clerkId) {
      return res.status(400).json({
        error: "Clerk ID is required",
      });
    }

    // Find the time slot
    const timeSlot = await TimeSlotModel.findById(timeSlotId);
    if (!timeSlot) {
      return res.status(404).json({
        error: "Time slot not found",
      });
    }

    // Check if slot is already booked
    if (timeSlot.isBooked) {
      return res.status(409).json({
        error: "This time slot is already booked",
      });
    }

    // Find or create user by Clerk ID
    let user = await UserModel.findOne({ clerkId });
    if (!user) {
      // Create user if doesn't exist (should normally be created by webhook, but handle edge case)
      user = await UserModel.create({
        clerkId,
      });
    }

    // Check if user already has a booking for this slot
    const existingBooking = await BookingModel.findOne({
      user: user._id,
      bookingDate: timeSlot.date,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      status: { $ne: "cancelled" },
    });

    if (existingBooking) {
      return res.status(409).json({
        error: "You already have a booking for this slot",
      });
    }

    // Create booking
    const booking = await BookingModel.create({
      user: user._id,
      bookingDate: timeSlot.date,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      status: "booked",
    });

    // Mark slot as booked
    timeSlot.isBooked = true;
    await timeSlot.save();

    // Populate user details for response
    const populatedBooking = await BookingModel.findById(booking._id).populate(
      "user",
      "firstName lastName userName photo"
    );

    return res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking,
    });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return res.status(500).json({
      error: "Failed to create booking",
      details: error.message,
    });
  }
};

/**
 * PATCH /api/bookings/:id
 * Body: { status: "pending" | "confirmed" | "canceled" }
 * Updates booking status (users can cancel their own, admin can change any)
 * If canceled, frees the associated time slot
 */
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        error: "Booking ID is required",
      });
    }

    const validStatuses = ["pending", "confirmed", "canceled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Find booking
    const booking = await BookingModel.findById(id).populate(
      "user",
      "firstName lastName userName email clerkId"
    );
    if (!booking) {
      return res.status(404).json({
        error: "Booking not found",
      });
    }

    // Update booking status
    booking.status = status === "canceled" ? "cancelled" : status;
    await booking.save();

    // If canceled, free the time slot
    if (status === "canceled") {
      await TimeSlotModel.updateMany(
        {
          date: booking.bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
        },
        {
          $set: { isBooked: false },
        }
      );
    }

    // Populate user details for response
    const populatedBooking = await BookingModel.findById(booking._id).populate(
      "user",
      "firstName lastName userName email clerkId photo"
    );

    return res.status(200).json({
      message: "Booking updated successfully",
      booking: populatedBooking || booking,
    });
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return res.status(500).json({
      error: "Failed to update booking",
      details: error.message,
    });
  }
};

/**
 * GET /api/bookings
 * Query params: ?userId=xxx or ?timeSlotId=xxx or ?date=YYYY-MM-DD (optional)
 * Returns bookings for a user, by timeSlotId, by date, or all bookings
 */
export const getBookings = async (req: Request, res: Response) => {
  try {
    const { userId, timeSlotId, date } = req.query;

    let query: any = {};
    if (userId) {
      query.user = userId;
    }
    if (date) {
      query.bookingDate = date;
    }

    let bookings = await BookingModel.find(query)
      .populate("user", "firstName lastName userName email clerkId photo")
      .sort({ bookingDate: -1, startTime: 1 });

    // If timeSlotId is provided, filter by matching time slot details
    if (timeSlotId) {
      const TimeSlotModel = (await import("../model/timeSlot.model")).default;
      const timeSlot = await TimeSlotModel.findById(timeSlotId);
      if (timeSlot) {
        bookings = bookings.filter(
          (booking) =>
            booking.bookingDate === timeSlot.date &&
            booking.startTime === timeSlot.startTime &&
            booking.endTime === timeSlot.endTime &&
            booking.status !== "cancelled"
        );
      }
    }

    return res.status(200).json({ bookings });
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({
      error: "Failed to fetch bookings",
      details: error.message,
    });
  }
};
