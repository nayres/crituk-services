import { UserService } from "../services";
import { handleResponse } from "@org/response";
import { ErrorCodes, handleError } from "@org/errors";
import { HttpRequest, HttpResponse, NextFunction } from "../types";

export class UserController {
  constructor(private readonly userService: UserService) {}

  private ensureAuthenticated = (req: HttpRequest, next: NextFunction) => {
    if (!req?.user?.id) {
      throw handleError(
        "User not authorized",
        ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
        401
      );
    }
    return req.user.id;
  };

  /**
   * @description Retrieves queried user's details.
   * @route GET /users
   * @access Public (Temp)
   *
   * @param {HttpRequest} req - The HTTP request object.
   * @param {HttpResponse} res - The HTTP response object.
   * @param {NextFunction} next - The next middleware NextFunction.
   *
   * @returns {Promise<void>}
   */
  getUser = async (req: HttpRequest, res: HttpResponse, next: NextFunction) => {
    try {
      const { email, username } = req.query;

      if (email) {
        const user = await this.userService.getUserByEmail(email as string);
        return handleResponse(res, {
          status: 200,
          success: true,
          data: { user },
        });
      }

      if (username) {
        const user = await this.userService.getUserByUsername(
          username as string
        );

        return handleResponse(res, {
          status: 200,
          success: true,
          data: { user },
        });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Create a new user account.
   * @route POST /users
   * @access Public
   *
   * @param {HttpRequest} req - The HTTP request object.
   * @param {HttpResponse} res - The HTTP response object.
   * @param {NextFunction} next - The next middleware NextFunction.
   *
   * @returns {Promise<void>}
   */
  createUser = async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      const user = await this.userService.createUser(req.body);
      return handleResponse(res, {
        status: 201,
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Retrieves the authenticated user's details.
   * @route GET /users/account
   * @access Private
   *
   * @param {HttpRequest} req - The HTTP request object.
   * @param {HttpResponse} res - The HTTP response object.
   * @param {NextFunction} next - The next middleware NextFunction.
   *
   * @returns {Promise<void>}
   */
  getCurrentUser = async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      const userId = this.ensureAuthenticated(req, next);
      const user = await this.userService.getUserById(userId);
      return handleResponse(res, {
        status: 200,
        success: true,
        data: { account: user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Delete authenticated user's account.
   * @route DELETE /users/account
   * @access Private
   *
   * @param {HttpRequest} req - The HTTP request object.
   * @param {HttpResponse} res - The HTTP response object.
   * @param {NextFunction} next - The next middleware NextFunction.
   *
   * @returns {Promise<void>}
   */
  deleteCurrentUser = async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      const userId = this.ensureAuthenticated(req, next);
      await this.userService.deleteUser(userId);
      return handleResponse(res, { status: 204, success: true });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Update authenticated user's account.
   * @route PATCH /users/account
   * @access Private
   *
   * @param {HttpRequest} req - The HTTP request object.
   * @param {HttpResponse} res - The HTTP response object.
   * @param {NextFunction} next - The next middleware NextFunction.
   *
   * @returns {Promise<void>}
   */
  updateCurrentUser = async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      const userId = this.ensureAuthenticated(req, next);
      await this.userService.updateUser(userId, req.body);
      return handleResponse(res, { status: 201, success: true });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Upload authenticated user's profile image.
   * @route PUT /users/account/profile-image
   * @access Private
   *
   * @param {HttpRequest} req - The HTTP request object.
   * @param {HttpResponse} res - The HTTP response object.
   * @param {NextFunction} next - The next middleware NextFunction.
   *
   * @returns {Promise<void>}
   */
  uploadProfileImage = async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      if (!req.file) {
        return next(
          handleError(
            "No image was provided for uploading a profile image.",
            ErrorCodes.AWS.SERVICE_ERROR,
            400
          )
        );
      }

      const userId = this.ensureAuthenticated(req, next);
      await this.userService.uploadProfileImage(userId, req.file);
      return handleResponse(res, { status: 200, success: true });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Retrieves a list of all users.
   * @route GET /users/admin
   * @access Public (Temp)
   *
   * @param {HttpRequest} req - The HTTP request object.
   * @param {HttpResponse} res - The HTTP response object.
   * @param {NextFunction} next - The next middleware NextFunction.
   *
   * @returns {Promise<void>}
   */
  listUsers = async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      const users = await this.userService.listUsers();
      return handleResponse(res, {
        status: 200,
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @description Delete a specified user's account.
   * @route DELETE /users/admin/:id
   * @access Public (Temp)
   *
   * @param {HttpRequest} req - The HTTP request object.
   * @param {HttpResponse} res - The HTTP response object.
   * @param {NextFunction} next - The next middleware NextFunction.
   *
   * @returns {Promise<void>}
   */
  deleteUserById = async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      const userId = req.params.id;
      await this.userService.deleteUser(userId);
      return handleResponse(res, { status: 204, success: true });
    } catch (error) {
      next(error);
    }
  };
}
