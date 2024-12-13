import { Router } from "express";
import { AuthController } from "../controllers";
import { userServiceClient as UserServiceClient } from "../repositories";
import { AuthService } from "../services";

class AuthRoutes {
  public router: Router;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.authController = this.initializeController();
    this.initializeRoutes();
  }

  private initializeController(): AuthController {
    const userServiceClient = UserServiceClient;
    const authService = new AuthService(userServiceClient);
    return new AuthController(authService);
  }

  private initializeRoutes(): void {
    this.router.post("/auth/login", this.authController.login);
    this.router.post("/auth/register", this.authController.register);
    this.router.get("/auth/validate", this.authController.validate);
    this.router.post("/auth/token", this.authController.issueToken);
  }
}

export const authRoutes = new AuthRoutes().router;
