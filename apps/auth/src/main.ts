import express, { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { errorMiddleware } from "@org/middleware";
import { authRoutes } from "./routes";

class AuthServer {
  private app: Application;
  private port: number;

  constructor() {
    this.loadEnvironmentVariables();
    this.port = this.getPort();
    this.app = express();
    this.setupServer();
  }

  private loadEnvironmentVariables(): void {
    const envFilePath = path.resolve(
      process.cwd(),
      "./env",
      `.env.${process.env.NODE_ENV || "development"}`
    );
    dotenv.config({ path: envFilePath });
  }

  private getPort(): number {
    return Number(process.env.AUTH_PORT) || 3001;
  }

  private setupServer(): void {
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use(
      cors({
        origin: "http://localhost:5173",
        credentials: true,
      })
    );
  }

  private initializeRoutes(): void {
    this.app.use("/api/v1", authRoutes);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }

  public start(): void {
    this.app.listen(this.port, (error?: NodeJS.ErrnoException) => {
      if (error) {
        console.error(`Failed to start server: ${error.message}`);
        process.exit(1);
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log(`Server is running on http://localhost:${this.port}`);
        }
      }
    });
  }
}

const server = new AuthServer();
server.start();
