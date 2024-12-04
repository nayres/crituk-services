import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { apiClient } from "../repositories";
import { IUser } from "../types";
import { CritukError, ErrorCodes } from "@org/errors";

export class AuthService {
  registerUser = async (userData: Partial<IUser>) => {
    if (typeof userData.password === "undefined") {
      throw new CritukError(
        "Invalid credentials",
        ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
        401
      );
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const response = await apiClient.post("/users", {
      ...userData,
      password: hashedPassword,
    });
    return response;
  };

  authenticateUser = async (userEmail: string, userPassword: string) => {
    const response = await apiClient.get(`/users?email=${userEmail}`);
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
