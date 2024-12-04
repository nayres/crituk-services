import { Router } from "express";
import { AuthController } from "../controllers";

const authController = new AuthController();
const router = Router();

router.post("/auth/login", authController.login);
router.post("/auth/register", authController.register);
router.get("/auth/validate", authController.validate);

export { router };
