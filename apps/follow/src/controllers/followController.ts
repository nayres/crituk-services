import { followService } from "../services";
import { ErrorCodes, handleError } from "@org/errors";
import { HttpRequest, HttpResponse, NextFunction } from "../types";

const ensureAuthenticated = (req: HttpRequest, next: NextFunction) => {
  if (!req?.user?.id) {
    throw handleError(
      "User not authorized",
      ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
      401
    );
  }
  return req.user.id;
};

export const followController = {
  getCurrentUsersFollowers: async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      const userId = ensureAuthenticated(req, next);
      const usersFollowed = await followService.getFollowed(userId);
      return res
        .status(200)
        .json({ status: 200, followers: usersFollowed.Items });
    } catch (error) {
      next(error);
    }
  },
  getCurrentUsersFollowing: async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      const userId = ensureAuthenticated(req, next);
      const usersFollowed = await followService.getFollowing(userId);
      return res
        .status(200)
        .json({ status: 200, following: usersFollowed.Items });
    } catch (error) {
      next(error);
    }
  },
  getFollowers: async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      ensureAuthenticated(req, next);
      const usersFollowed = await followService.getFollowed(req.params.userId);
      return res
        .status(200)
        .json({ status: 200, followers: usersFollowed.Items });
    } catch (error) {
      next(error);
    }
  },
  getFollowing: async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      ensureAuthenticated(req, next);
      const usersFollowed = await followService.getFollowing(
        String(req.params.userId)
      );
      return res
        .status(200)
        .json({ status: 200, following: usersFollowed.Items });
    } catch (error) {
      next(error);
    }
  },
  followUser: async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      const userId = ensureAuthenticated(req, next);
      const { userFollowed } = req.body;

      const followedUser = await followService.follow(userId, userFollowed);
      return res.status(200).json({ status: 200, following: followedUser });
    } catch (error) {
      next(error);
    }
  },
  unfollowUser: async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      const userId = ensureAuthenticated(req, next);
      const { userFollowed } = req.body;
      const unfollowedUser = await followService.unfollow(userId, userFollowed);
      return res.status(200).json({ status: 200, unfollowedUser });
    } catch (error) {
      next(error);
    }
  },
};
