import express, { Application } from "express";
import dotenv from "dotenv";
import path from "path";
import { errorMiddleware } from "@org/middleware";
import { userRoutes } from "./routes";

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.loadEnvironmentVariables();
    this.port = this.getPort();
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
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
    return Number(process.env.USERS_PORT) || 3000;
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json());
  }

  private initializeRoutes(): void {
    this.app.use("/api/v1", userRoutes);
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

const server = new Server();
server.start();
