import { NextFunction, Request, Response } from "express";
import axios from "axios";
import { handleResponse } from "@org/response";
import { CritukError, ErrorCodes } from "@org/errors";
import { AuthService } from "../services";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  issueToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { client_id, client_secret } = req.body;
      const token = await this.authService.issueToken(client_id, client_secret);
      return handleResponse(res, { status: 200, success: true, data: token });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.crtk_refresh_token;

    if (!refreshToken)
      return res.status(400).json({ message: "No refresh token provided" });

    try {
      this.authService.validateToken(
        refreshToken,
        process.env.AUTH_REFRESH_SECRET || ""
      );

      return handleResponse(res.clearCookie("crtk_refresh_token"), {
        status: 200,
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
      const { accessToken, refreshToken } =
        await this.authService.authenticateUser(email, password);

      res.cookie("crtk_refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return handleResponse(res, {
        status: 200,
        success: true,
        data: { accessToken },
      });
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error("Error from user service:", error.response?.data);
        res
          .status(error.response?.status || 500)
          .json(error.response?.data || error.message);
      } else {
        next(error);
      }
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData = req.body;
      const user = await this.authService.registerUser(userData);
      return handleResponse(res, {
        status: 201,
        success: true,
        data: { user: user.data },
      });
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error("Error from user service:", error.response?.data);
        res
          .status(error.response?.status || 500)
          .json(
            new CritukError(
              error.response?.data || error.message,
              ErrorCodes.AUTH.UNEXPECTED_ERROR,
              error.response?.status || 500
            )
          );
      } else {
        next(error);
      }
    }
  };

  issueRefreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const existingRefreshToken = req.cookies.crtk_refresh_token;
    if (!existingRefreshToken) {
      return res.status(403).json({ message: "Refresh token required" });
    }

    try {
      const { accessToken, refreshToken } =
        await this.authService.issueRefreshToken(existingRefreshToken);

      return handleResponse(
        res.cookie("crtk_refresh_token", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        }),
        {
          status: 200,
          success: true,
          data: { accessToken },
          message: "Successfully issued refresh token",
        }
      );
    } catch (error) {
      next(error);
    }
  };

  validate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (typeof token === "undefined") {
        res.status(400).json({ message: "No auth token provided." });
      } else {
        const decoded = await this.authService.validateToken(
          token,
          process.env.AUTH_SECRET_KEY || ""
        );
        res.json(decoded);
      }
    } catch (error) {
      next(error);
    }
  };
}
