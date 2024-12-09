import { Router } from "express";
import {
  createDocumentClient,
  createDynamoDBClient,
  createS3Client,
} from "@org/clients";
import { authMiddleware } from "@org/middleware";
import { UserController } from "../controllers";
import {
  validateRequest,
  profileImageUpload,
  uploadErrorHandler,
  validateFilePresence,
} from "../middleware";
import { userSchema } from "../schema";
import { UserService } from "../services";
import { UserRepository } from "../repositories";

const router = Router();
const dynamoClient = createDynamoDBClient();
const documentClient = createDocumentClient(dynamoClient);
const s3Client = createS3Client();

const userRepository = new UserRepository(documentClient, s3Client);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

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
  validateFilePresence,
  validateRequest(userSchema),
  userController.updateCurrentUser
);
router.put(
  "/users/account/profile-image",
  authMiddleware.authenticate,
  profileImageUpload.single("profileImage"),
  userController.uploadProfileImage,
  uploadErrorHandler
);

/* Admin */
router.get("/users/admin", userController.listUsers);
router.delete("/users/admin/:id", userController.deleteUserById);

export { router as userRoutes };
