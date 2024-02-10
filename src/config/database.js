import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`SUCCESSFULLY CONNECTED TO DB`);
  } catch (error) {
    console.error(`ERROR WHILE CONNECTING TO DB ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
