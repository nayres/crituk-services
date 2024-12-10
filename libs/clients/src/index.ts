import path from "path";
import dotenv from "dotenv";

const envFilePath = path.resolve(
  process.cwd(),
  "./env",
  `.env.${process.env["NODE_ENV"] || "development"}`
);

dotenv.config({ path: envFilePath });

export * from "./lib";
