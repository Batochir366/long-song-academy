import mongoose from "mongoose";

const TimeSlotSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
      index: true, // Index for faster queries by date
    },
    startTime: {
      type: String, // HH:mm format (e.g., "08:00")
      required: true,
    },
    endTime: {
      type: String, // HH:mm format (e.g., "08:40")
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate slots for same date/time
TimeSlotSchema.index({ date: 1, startTime: 1, endTime: 1 }, { unique: true });

const TimeSlotModel = mongoose.model("TimeSlot", TimeSlotSchema);
export default TimeSlotModel;
