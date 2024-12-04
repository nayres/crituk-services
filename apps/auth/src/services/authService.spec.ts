import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { apiClient } from "../repositories";
import { AuthService } from "./authService";
import { CritukError, ErrorCodes } from "@org/errors";

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../repositories", () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe("AuthService", () => {
  const authService = new AuthService();
  const mockUser = {
    id: "123",
    email: "test@example.com",
    password: "hashedpassword",
    first_name: "Test",
    last_name: "User",
    user_name: "testuser",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should hash the password and send user data to the API", async () => {
      const userData = { email: "test@example.com", password: "password123" };
      const hashedPassword = "hashedpassword";

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "123" } });

      const result = await authService.registerUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(apiClient.post).toHaveBeenCalledWith("/users", {
        ...userData,
        password: hashedPassword,
      });
      expect(result).toEqual({ data: { id: "123" } });
    });
  });

  describe("authenticateUser", () => {
    it("should return a JWT token for valid credentials", async () => {
      const userEmail = "test@example.com";
      const userPassword = "password123";
      const token = "jwt-token";

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(token);

      const result = await authService.authenticateUser(
        userEmail,
        userPassword
      );

      expect(apiClient.get).toHaveBeenCalledWith(`/users?email=${userEmail}`);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        userPassword,
        mockUser.password
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
          user_name: mockUser.user_name,
        },
        process.env.AUTH_SECRET_KEY || "",
        { expiresIn: "1h" }
      );
      expect(result).toBe(token);
    });

    it("should throw an error for invalid credentials", async () => {
      const userEmail = "test@example.com";
      const userPassword = "wrongpassword";

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.authenticateUser(userEmail, userPassword)
      ).rejects.toThrowError(
        new CritukError(
          "Invalid credentials",
          ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
          401
        )
      );
    });

    it("should throw an error if the user is not found", async () => {
      const userEmail = "nonexistent@example.com";

      (apiClient.get as jest.Mock).mockResolvedValue({ data: null });

      await expect(
        authService.authenticateUser(userEmail, "password123")
      ).rejects.toThrowError(
        new CritukError(
          "Invalid credentials",
          ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
          401
        )
      );
    });
  });

  describe("validateToken", () => {
    it("should validate a token and return decoded data", async () => {
      const token = "valid-token";
      const decodedData = { id: "123", email: "test@example.com" };

      (jwt.verify as jest.Mock).mockReturnValue(decodedData);

      const result = await authService.validateToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        process.env.AUTH_SECRET_KEY || ""
      );
      expect(result).toBe(decodedData);
    });

    it("should throw an error for an invalid token", async () => {
      const token = "invalid-token";

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(authService.validateToken(token)).rejects.toThrowError(
        new CritukError(
          "Invalid token or credentials",
          ErrorCodes.AUTH.INSUFFICIENT_PERMISSIONS,
          401
        )
      );
    });
  });
});
