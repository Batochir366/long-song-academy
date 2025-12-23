import mongoose from "mongoose";

const ClassRoomSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
    },
    joinCode: {
      type: Number,
      required: true,
      unique: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject", // холбогдох collection нэр
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // холбогдох collection нэр
      },
    ],
    endDate: {
      type: String, // эсвэл Date болгох боломжтой
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ClassRoom", ClassRoomSchema);
