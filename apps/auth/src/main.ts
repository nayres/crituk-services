import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { authRoutes } from "./routes";
import { errorMiddleware } from "@org/errors";

const app = express();
const envFilePath = path.resolve(
  process.cwd(),
  "./env",
  `.env.${process.env.NODE_ENV || "development"}`
);
dotenv.config({ path: envFilePath });
const PORT = process.env.AUTH_PORT || 3001;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/v1", authRoutes);
app.use(errorMiddleware);

app.listen(PORT, (error?: NodeJS.ErrnoException) => {
  if (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  } else {
    console.log(`Server is running on http://localhost:${PORT}`);
  }
});
