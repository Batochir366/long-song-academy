import { Request, Response } from "express";
import TimeSlotModel from "../model/timeSlot.model";

/**
 * GET /api/timeslots
 * Query params: ?date=YYYY-MM-DD (optional)
 * Returns all time slots or filtered by date
 */
export const getTimeSlots = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    let query: any = {};
    if (date) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date as string)) {
        return res.status(400).json({
          error: "Invalid date format. Use YYYY-MM-DD",
        });
      }
      query.date = date;
    }

    const slots = await TimeSlotModel.find(query).sort({
      date: 1,
      startTime: 1,
    });

    return res.status(200).json({ slots });
  } catch (error: any) {
    console.error("Error fetching time slots:", error);
    return res.status(500).json({
      error: "Failed to fetch time slots",
      details: error.message,
    });
  }
};

/**
 * POST /api/timeslots
 * Body: { slots: [{ date, startTime, endTime }] }
 * Creates multiple time slots (admin only)
 */
export const createTimeSlots = async (req: Request, res: Response) => {
  try {
    const { slots } = req.body;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        error: "Slots array is required",
      });
    }

    // Validate all slots before insertion
    const validatedSlots: any[] = [];
    for (const slot of slots) {
      if (!slot.date || !slot.startTime || !slot.endTime) {
        return res.status(400).json({
          error: "Each slot must have date, startTime, and endTime",
        });
      }

      // Check for duplicates
      const existing = await TimeSlotModel.findOne({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });

      if (existing) {
        continue; // Skip duplicates
      }

      validatedSlots.push({
        date: slot.date as string,
        startTime: slot.startTime as string,
        endTime: slot.endTime as string,
        isBooked: false,
      });
    }

    if (validatedSlots.length === 0) {
      return res.status(400).json({
        error: "All slots already exist",
      });
    }

    // Insert slots
    const createdSlots = await TimeSlotModel.insertMany(validatedSlots, {
      ordered: false, // Continue even if some fail (duplicates)
    });

    return res.status(201).json({
      message: `Created ${createdSlots.length} time slot(s)`,
      slots: createdSlots,
    });
  } catch (error: any) {
    console.error("Error creating time slots:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Some slots already exist",
      });
    }

    return res.status(500).json({
      error: "Failed to create time slots",
      details: error.message,
    });
  }
};

/**
 * DELETE /api/timeslots/:id
 * Deletes a time slot (admin only)
 * Also cancels any bookings associated with this slot
 */
export const deleteTimeSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Time slot ID is required",
      });
    }

    // Check if slot exists
    const slot = await TimeSlotModel.findById(id);
    if (!slot) {
      return res.status(404).json({
        error: "Time slot not found",
      });
    }

    // Cancel any bookings associated with this slot
    if (slot.isBooked) {
      const BookingModel = (await import("../model/booking.model")).default;
      await BookingModel.updateMany(
        {
          bookingDate: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
        {
          $set: { status: "cancelled" },
        }
      );
    }

    // Delete the slot
    await TimeSlotModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Time slot deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting time slot:", error);
    return res.status(500).json({
      error: "Failed to delete time slot",
      details: error.message,
    });
  }
};

/**
 * DELETE /api/timeslots/duplicates/:date/:startTime/:endTime
 * Deletes duplicate time slots for a specific date and time
 * Keeps the first one (oldest) and deletes the rest
 */
export const deleteDuplicateTimeSlots = async (req: Request, res: Response) => {
  try {
    const { date, startTime, endTime } = req.params;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        error: "Date, startTime, and endTime are required",
      });
    }

    // Find all duplicate slots
    const duplicateSlots = await TimeSlotModel.find({
      date,
      startTime,
      endTime,
    }).sort({ createdAt: 1 }); // Sort by creation time, oldest first

    if (duplicateSlots.length <= 1) {
      return res.status(200).json({
        message: "No duplicates found",
        deleted: 0,
      });
    }

    // Keep the first one, delete the rest
    const slotsToDelete = duplicateSlots.slice(1);
    const deletedIds: string[] = [];

    for (const slot of slotsToDelete) {
      // Cancel any bookings associated with this slot
      if (slot.isBooked) {
        const BookingModel = (await import("../model/booking.model")).default;
        await BookingModel.updateMany(
          {
            bookingDate: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            timeSlotId: slot._id,
          },
          {
            $set: { status: "cancelled" },
          }
        );
      }

      await TimeSlotModel.findByIdAndDelete(slot._id);
      deletedIds.push(slot._id.toString());
    }

    return res.status(200).json({
      message: `Deleted ${deletedIds.length} duplicate slot(s)`,
      deleted: deletedIds.length,
      deletedIds,
      keptSlotId: duplicateSlots[0]._id.toString(),
    });
  } catch (error: any) {
    console.error("Error deleting duplicate time slots:", error);
    return res.status(500).json({
      error: "Failed to delete duplicate time slots",
      details: error.message,
    });
  }
};
