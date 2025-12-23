import mongoose from "mongoose";

const MerchSchema = new mongoose.Schema(
  {
    merchName: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Merch", MerchSchema);
