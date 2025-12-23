import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    isPublic: {
      type: Boolean,
      default: false,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    review: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Review", ReviewSchema);
