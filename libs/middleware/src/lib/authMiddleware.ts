import axios from "axios";
import jwt, { JwtPayload } from "jsonwebtoken";
import { CritukError, ErrorCodes } from "@org/errors";
import { authClient } from "@org/clients";
import { HttpRequest, HttpResponse, NextFunction } from "./types";

export const authMiddleware = {
  validateToken: (req: HttpRequest, res: HttpResponse, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization Header" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload: JwtPayload = jwt.verify(
        token,
        process.env.AUTH_SECRET_KEY || ""
      ) as JwtPayload;
      req.client_id = payload.client_id;
      return next();
    } catch (error: any) {
      console.error(error.message);
      return res.status(403).json({ error: "Invalid or expired token" });
    }
  },
  authenticate: async (
    req: HttpRequest,
    res: HttpResponse,
    next: NextFunction
  ) => {
    try {
      const authHeader = req.headers?.authorization;

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

      const response = await authClient.get("/auth/validate", {
        headers: {
          Authorization: authHeader,
        },
      });

      req.user = response.data;
      return next();
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
  },
};
