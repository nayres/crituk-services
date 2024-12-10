import { Router } from "express";
import { authMiddleware } from "@org/middleware";
import { followController } from "../controllers";

const router = Router();

// get authenticated user's followers
router.get(
  "/follow/followers",
  authMiddleware.authenticate,
  followController.getCurrentUsersFollowers
);
// get authenticated user's following
router.get(
  "/follow/following",
  authMiddleware.authenticate,
  followController.getCurrentUsersFollowing
);
// follow a user
router.post(
  "/follow",
  authMiddleware.authenticate,
  followController.followUser
);
// unfollow a user
router.delete(
  "/follow",
  authMiddleware.authenticate,
  followController.unfollowUser
);
// get followers by id
router.get(
  "/follow/:userId/followers",
  authMiddleware.authenticate,
  followController.getFollowers
);
// get following by id
router.get(
  "/follow/:userId/following",
  authMiddleware.authenticate,
  followController.getFollowing
);

export { router as followRoutes };
