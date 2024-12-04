import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { errorMiddleware } from "@org/errors";
import { userRoutes } from "./routes";

const envFilePath = path.resolve(
  process.cwd(),
  "./env",
  `.env.${process.env.NODE_ENV || "development"}`
);
dotenv.config({ path: envFilePath });

const PORT = process.env.USERS_PORT || 3000;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/v1", userRoutes);
app.use(errorMiddleware);

app.listen(PORT, (error?: NodeJS.ErrnoException) => {
  if (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1); // Exit the process with a non-zero status code
  } else {
    console.log(`Server is running on http://localhost:${PORT}`);
  }
});
