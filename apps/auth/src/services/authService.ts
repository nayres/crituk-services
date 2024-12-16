import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { CritukError, ErrorCodes } from "@org/errors";
import { IUser } from "../types";
import { validClients } from "./validClients";
import { AxiosInstance } from "axios";

export class AuthService {
  constructor(private readonly userServiceClient: AxiosInstance) {}

  private createAccessToken = ({
    id,
    email,
    first_name,
    last_name,
    user_name,
  }: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_name: string;
  }) => {
    return jwt.sign(
      { id, email, first_name, last_name, user_name },
      process.env.AUTH_SECRET_KEY || "",
      {
        expiresIn: process.env.AUTH_ACCESS_TOKEN_EXPIRY,
      }
    );
  };

  private createRefreshToken = ({
    id,
    email,
    first_name,
    last_name,
    user_name,
  }: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_name: string;
  }) => {
    return jwt.sign(
      { id, email, first_name, last_name, user_name },
      process.env.AUTH_REFRESH_SECRET || "",
      {
        expiresIn: process.env.AUTH_ACCESS_TOKEN_EXPIRY,
      }
    );
  };

  public issueToken = async (clientId: string, clientSecret: string) => {
    try {
      if (validClients[clientId] && validClients[clientId] === clientSecret) {
        const token = jwt.sign(
          { clientId },
          process.env.AUTH_SECRET_KEY || "",
          {
            expiresIn: "1h",
          }
        );

        return {
          access_token: token,
          token_type: "Bearer",
          expires_in: 3600,
        };
      } else {
        throw new CritukError(
          "Invalid or missing credentials",
          ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
          401
        );
      }
    } catch (error: any) {
      throw new CritukError(
        "Invalid client credentials",
        ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
        401
      );
    }
  };

  public registerUser = async (userData: Partial<IUser>) => {
    if (typeof userData.password === "undefined") {
      throw new CritukError(
        "Invalid credentials",
        ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
        401
      );
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const response = await this.userServiceClient.post("/users", {
      ...userData,
      password: hashedPassword,
    });
    return response;
  };

  public authenticateUser = async (userEmail: string, userPassword: string) => {
    try {
      const response = await this.userServiceClient.get(
        `/users?email=${userEmail}`
      );
      const data = response.data;

      if (!data || !(await bcrypt.compare(userPassword, data.user.password))) {
        throw new CritukError(
          "Invalid credentials",
          ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
          401
        );
      }

      const { id, email, first_name, last_name, user_name } = data.user;

      const accessToken = this.createAccessToken({
        id,
        email,
        first_name,
        last_name,
        user_name,
      });

      const refreshToken = this.createRefreshToken({
        id,
        email,
        first_name,
        last_name,
        user_name,
      });

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new CritukError(
        "An unexpected error occured while authenticating user.",
        ErrorCodes.AUTH.UNEXPECTED_ERROR,
        500
      );
    }
  };

  public issueRefreshToken = async (existingRefreshToken: string) => {
    try {
      const payload = await this.validateToken(
        existingRefreshToken,
        process.env.AUTH_REFRESH_SECRET || ""
      );

      if (!payload) {
        throw new CritukError(
          "Unable to issue refresh token: No JWT payload", // TODO: better error
          ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
          403
        );
      }

      const { id, email, first_name, last_name, user_name } = payload;

      const refreshToken = this.createRefreshToken({
        id,
        email,
        first_name,
        last_name,
        user_name,
      });

      const accessToken = this.createAccessToken({
        id,
        email,
        first_name,
        last_name,
        user_name,
      });

      return {
        refreshToken,
        accessToken,
      };
    } catch (error) {
      throw new CritukError(
        "An unexpected error occured while issueing a refresh token.",
        ErrorCodes.AUTH.UNEXPECTED_ERROR,
        500
      );
    }
  };

  public validateToken = async (token: string, secret: string) => {
    try {
      return jwt.verify(token, secret) as {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        user_name: string;
      };
    } catch (error) {
      throw new CritukError(
        "Invalid token or credentials",
        ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
        401
      );
    }
  };
}
