import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    subjectVideoKey: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      required: false,
    },
    thumbnailUrl: {
      type: String,
      required: false,
    },
    duration: {
      type: String,
      required: false,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    keyPoints: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);
const subjectModel = mongoose.model("Subject", SubjectSchema);
export default subjectModel;
