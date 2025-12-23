import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    userName: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    photo: { type: String },
    isPaid: { type: Boolean, default: false },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassRoom",
      required: false,
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
