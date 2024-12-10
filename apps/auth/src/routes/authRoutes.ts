import { Router } from "express";
import { AuthController } from "../controllers";
import { userServiceClient as UserServiceClient } from "../repositories";
import { AuthService } from "../services";

const userServiceClient = UserServiceClient;
const authService = new AuthService(userServiceClient);
const authController = new AuthController(authService);

const router = Router();

router.post("/auth/login", authController.login);
router.post("/auth/register", authController.register);
router.get("/auth/validate", authController.validate);
router.post("/auth/token", authController.issueToken);

export { router };
