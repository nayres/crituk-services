import express from "express";
import dotenv from "dotenv";
import path from "path";
import { errorMiddleware } from "@org/middleware";
import { followRoutes } from "./routes/followRoutes";

const envFilePath = path.resolve(
  process.cwd(),
  "./env",
  `.env.${process.env.NODE_ENV || "development"}`
);
dotenv.config({ path: envFilePath });

const PORT = process.env.FOLLOW_PORT || 3002;
const app = express();

app.use(express.json());

app.use("/api/v1", followRoutes);
app.use(errorMiddleware);

app.listen(PORT, (error?: NodeJS.ErrnoException) => {
  if (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1); // Exit the process with a non-zero status code
  } else {
    process.env.NODE_ENV === "development" &&
      console.log(`Server is running on http://localhost:${PORT}`);
  }
});
