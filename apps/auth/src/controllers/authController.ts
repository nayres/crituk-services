import { Request, Response } from "express";
import axios from "axios";
import { AuthService } from "../services";
import { CritukError, ErrorCodes } from "@org/errors";

export class AuthController {
  authService: AuthService;
  constructor(authService = new AuthService()) {
    this.authService = authService;
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const token = await this.authService.authenticateUser(email, password);

      res.cookie("showtell_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000,
        sameSite: "strict",
      });

      res
        .status(200)
        .json({ success: true, message: "Logged in successfully.", token });
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error("Error from user service:", error.response?.data);
        res
          .status(error.response?.status || 500)
          .json(error.response?.data || error.message);
      } else {
        console.error("An unexpected error occured during login");
        res
          .status(401)
          .json(
            new CritukError(
              "An unexpected error occured during login",
              ErrorCodes.AUTH.UNEXPECTED_ERROR,
              401
            )
          );
      }
    }
  };

  register = async (req: Request, res: Response) => {
    try {
      const userData = req.body;
      const user = await this.authService.registerUser(userData);
      res.status(201).json(user.data);
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
        console.error("An unexpected error occured registering user");
        res
          .status(401)
          .json(
            new CritukError(
              "An unexpected error occured registering user",
              ErrorCodes.AUTH.UNEXPECTED_ERROR,
              401
            )
          );
      }
    }
  };

  validate = async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (typeof token === "undefined") {
        res.status(400).json({ message: "No auth token provided." });
      } else {
        const decoded = await this.authService.validateToken(token);
        res.json(decoded);
      }
    } catch (error: any) {
      console.error("An unexpected error occured during login");
      res
        .status(401)
        .json(
          new CritukError(
            "An unexpected error occured during login",
            ErrorCodes.AUTH.UNEXPECTED_ERROR,
            401
          )
        );
    }
  };
}
