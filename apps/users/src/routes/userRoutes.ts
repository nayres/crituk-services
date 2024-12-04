import { Router } from "express";
import { UserController } from "../controllers";
import {
  AuthMiddleware,
  validateRequest,
  profileImageUpload,
} from "../middleware";
import { userSchema } from "../schema";

const userController = new UserController();
const authMiddleware = new AuthMiddleware();
const router = Router();

// /users?email=
// /users?username=
router.get("/users", userController.getUser);
router.post("/users", userController.createUser);

/* User Account */
router.get(
  "/users/account",
  authMiddleware.authenticate,
  userController.getCurrentUser
);
router.delete(
  "/users/account",
  authMiddleware.authenticate,
  userController.deleteCurrentUser
);
router.patch(
  "/users/account",
  authMiddleware.authenticate,
  validateRequest(userSchema),
  userController.updateCurrentUser
);
router.put(
  "/users/account/profile-image",
  authMiddleware.authenticate,
  profileImageUpload.single("profileImage"),
  userController.uploadProfileImage
);

/* Admin */
router.get("/users/admin", userController.listUsers);
router.delete("/users/admin/:id", userController.deleteUserById);

export { router as userRoutes };
