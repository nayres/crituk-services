import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { apiClient } from "../utils/clients";
import { CritukError, ErrorCodes } from "@org/errors";

export class AuthMiddleware {
  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res
          .status(401)
          .json(
            new CritukError(
              "Authorization header is missing.",
              ErrorCodes.AUTH.INSUFFICIENT_CREDENTIALS,
              401
            )
          );
      }

      const response = await apiClient.get("/auth/validate", {
        headers: {
          Authorization: authHeader,
        },
      });

      req.user = response.data;
      next();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          return res
            .status(error.response.status)
            .json(
              new CritukError(
                error.response.data.message || "Invalid or expired token",
                ErrorCodes.AUTH.INSUFFICIENT_CREDENTIALS,
                error.response.status
              )
            );
        } else if (error.request) {
          return res
            .status(503)
            .json(
              new CritukError(
                "Authentication service unavailable.",
                ErrorCodes.AUTH.INSUFFICIENT_CREDENTIALS,
                503
              )
            );
        }
      }
      return res
        .status(401)
        .json(
          new CritukError(
            "Invalid or expired token.",
            ErrorCodes.AUTH.INSUFFICIENT_CREDENTIALS,
            401
          )
        );
    }
  };
}
