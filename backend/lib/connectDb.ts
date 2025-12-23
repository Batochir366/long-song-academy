import dotenv from "dotenv";
import { connect } from "mongoose";

dotenv.config();

const uri = process.env.MONGODB_URL;
const connectMongoDB = async () => {
  try {
    if (!uri) {
      throw new Error("MONGO_URI is not defined");
    }
    await connect(uri);
    console.log("connected to database");
  } catch (error) {
    console.log(error, "err");
  }
};

export default connectMongoDB;
