import dotenv from "dotenv";
import connectDB from "./config/database.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 5000;

dotenv.config();
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SERVER IS RUNNING AT PORT ${PORT}`);
    });
  })
  .catch((err) => console.error(`ERROR WHILE CONNECTING TO DB ${err.message}`));
