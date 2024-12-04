import { Request, Response, NextFunction } from "express";
import { UserService } from "../services";
import { CritukError, ErrorCodes } from "@org/errors";

export class UserController {
  userService: UserService;
  constructor(userService = new UserService()) {
    this.userService = userService;
  }

  getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, username } = req.query;

      if (email) {
        const user = await this.userService.getUserByEmail(email as string);
        return res.status(200).json({ status: 200, user: user });
      }

      if (username) {
        const user = await this.userService.getUserByUsername(
          username as string
        );
        return res.status(200).json({ status: 200, user: user });
      }
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.listUsers();
      return res.json({ users });
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.getUserById(req.user.id);
      return res.status(200).json({ status: 200, user });
    } catch (error) {
      next(error);
    }
  };

  deleteCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await this.userService.deleteUser(req.user.id);
      return res.status(204).json({ status: 204 });
    } catch (error) {
      next(error);
    }
  };

  updateCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await this.userService.updateUser(req.user.id, req.body);
      return res.status(201).json({ status: 201 });
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newUser = await this.userService.createUser(req.body);
      return res.status(201).json({ status: 201, user: newUser });
    } catch (error) {
      next(error);
    }
  };

  deleteUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      await this.userService.deleteUser(userId);
      return res.status(204).json({ status: 204 });
    } catch (error) {
      next(error);
    }
  };

  uploadProfileImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.file) {
        const error = new CritukError(
          "No image was provided for uploading a profile image.",
          ErrorCodes.AWS.SERVICE_ERROR,
          400
        );

        return next(error);
      }

      await this.userService.uploadProfileImage(req.user.id, req.file);
      return res.status(200).json({
        status: 200,
        message: "Profile image uploaded successfuly.",
      });
    } catch (error) {
      next(error);
    }
  };
}
