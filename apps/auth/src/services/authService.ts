import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { CritukError, ErrorCodes } from "@org/errors";
import { IUser } from "../types";
import { validClients } from "./validClients";
import { AxiosInstance } from "axios";

export class AuthService {
  constructor(private readonly userServiceClient: AxiosInstance) {}

  issueToken = async (clientId: string, clientSecret: string) => {
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

  registerUser = async (userData: Partial<IUser>) => {
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

  authenticateUser = async (userEmail: string, userPassword: string) => {
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

    return jwt.sign(
      { id, email, first_name, last_name, user_name },
      process.env.AUTH_SECRET_KEY || "",
      { expiresIn: "1h" }
    );
  };

  validateToken = async (token: string) => {
    try {
      return jwt.verify(token, process.env.AUTH_SECRET_KEY || "");
    } catch (error) {
      throw new CritukError(
        "Invalid token or credentials",
        ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
        401
      );
    }
  };
}
