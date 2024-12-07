import { UserService } from "../services";
import { ErrorCodes, handleError } from "@org/errors";
import { HttpRequest, HttpResponse } from "../types";

export class UserController {
  constructor(private readonly userService: UserService) {}

  private handleResponse = (res: HttpResponse, status: number, data: any) => {
    return res.status(status).json(data);
  };

  private ensureAuthenticated = (req: HttpRequest, next: Function) => {
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
   * @param {Function} next - The next middleware function.
   *
   * @returns {Promise<void>}
   */
  getUser = async (req: HttpRequest, res: HttpResponse, next: Function) => {
    try {
      const { email, username } = req.query;

      if (email) {
        const user = await this.userService.getUserByEmail(email as string);
        return this.handleResponse(res, 200, { status: 200, user });
      }

      if (username) {
        const user = await this.userService.getUserByUsername(
          username as string
        );
        return this.handleResponse(res, 200, { status: 200, user });
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
   * @param {Function} next - The next middleware function.
   *
   * @returns {Promise<void>}
   */
  createUser = async (req: HttpRequest, res: HttpResponse, next: Function) => {
    try {
      const newUser = await this.userService.createUser(req.body);
      return this.handleResponse(res, 201, { status: 201, user: newUser });
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
   * @param {Function} next - The next middleware function.
   *
   * @returns {Promise<void>}
   */
  getCurrentUser = async (
    req: HttpRequest,
    res: HttpResponse,
    next: Function
  ) => {
    try {
      const userId = this.ensureAuthenticated(req, next);
      const user = await this.userService.getUserById(userId);
      return this.handleResponse(res, 200, { status: 200, user });
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
   * @param {Function} next - The next middleware function.
   *
   * @returns {Promise<void>}
   */
  deleteCurrentUser = async (
    req: HttpRequest,
    res: HttpResponse,
    next: Function
  ) => {
    try {
      const userId = this.ensureAuthenticated(req, next);
      await this.userService.deleteUser(userId);
      return this.handleResponse(res, 204, { status: 204 });
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
   * @param {Function} next - The next middleware function.
   *
   * @returns {Promise<void>}
   */
  updateCurrentUser = async (
    req: HttpRequest,
    res: HttpResponse,
    next: Function
  ) => {
    try {
      const userId = this.ensureAuthenticated(req, next);
      await this.userService.updateUser(userId, req.body);
      return this.handleResponse(res, 201, { status: 201 });
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
   * @param {Function} next - The next middleware function.
   *
   * @returns {Promise<void>}
   */
  uploadProfileImage = async (
    req: HttpRequest,
    res: HttpResponse,
    next: Function
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
      return this.handleResponse(res, 200, { status: 200 });
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
   * @param {Function} next - The next middleware function.
   *
   * @returns {Promise<void>}
   */
  listUsers = async (req: HttpRequest, res: HttpResponse, next: Function) => {
    try {
      const users = await this.userService.listUsers();
      return this.handleResponse(res, 200, { status: 200, users });
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
   * @param {Function} next - The next middleware function.
   *
   * @returns {Promise<void>}
   */
  deleteUserById = async (
    req: HttpRequest,
    res: HttpResponse,
    next: Function
  ) => {
    try {
      const userId = req.params.id;
      await this.userService.deleteUser(userId);
      return this.handleResponse(res, 204, { status: 204 });
    } catch (error) {
      next(error);
    }
  };
}
