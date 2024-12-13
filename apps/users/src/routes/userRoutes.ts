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

class UserRoutes {
  public router: Router;
  private userController: UserController;

  constructor() {
    this.router = Router();
    this.userController = this.initializeController();
    this.initializeRoutes();
  }

  private initializeController(): UserController {
    const dynamoClient = createDynamoDBClient();
    const documentClient = createDocumentClient(dynamoClient);
    const s3Client = createS3Client();

    const userRepository = new UserRepository(documentClient, s3Client);
    const userService = new UserService(userRepository);
    return new UserController(userService);
  }

  private initializeRoutes(): void {
    // Public routes
    this.router.get("/users", this.userController.getUser);
    this.router.post("/users", this.userController.createUser);

    // User Account routes
    this.router.get(
      "/users/account",
      authMiddleware.authenticate,
      this.userController.getCurrentUser
    );
    this.router.delete(
      "/users/account",
      authMiddleware.authenticate,
      this.userController.deleteCurrentUser
    );
    this.router.patch(
      "/users/account",
      authMiddleware.authenticate,
      validateRequest(userSchema),
      this.userController.updateCurrentUser
    );
    this.router.put(
      "/users/account/profile-image",
      authMiddleware.authenticate,
      profileImageUpload.single("profile-image"),
      validateFilePresence,
      this.userController.uploadProfileImage,
      uploadErrorHandler
    );

    // Admin routes
    this.router.get("/users/admin", this.userController.listUsers);
    this.router.delete("/users/admin/:id", this.userController.deleteUserById);
  }
}

export const userRoutes = new UserRoutes().router;
