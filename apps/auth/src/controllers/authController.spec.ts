import { AuthController } from "@org/auth/controllers";
import { AuthService } from "@org/auth/services";
import { Request, Response } from "express";
import { CritukError, ErrorCodes } from "@org/errors";

jest.mock("@org/auth/services");

const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;
const mockCritukError = CritukError as jest.MockedClass<typeof CritukError>;

jest.mock("@org/errors", () => {
  return {
    CritukError: jest.fn().mockImplementation((message, code, statusCode) => ({
      message,
      code,
      statusCode,
    })),
    ErrorCodes: {
      AUTH: {
        UNEXPECTED_ERROR: "AUTH:UNEXPECTED_ERROR",
      },
    },
  };
});

describe("AuthController", () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    authController = new AuthController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should successfully log in and send a token in the response", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";
      const token = "fake-jwt-token";
      mockRequest.body = { email, password };
      mockAuthService.prototype.authenticateUser = jest
        .fn()
        .mockResolvedValue(token);

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.prototype.authenticateUser).toHaveBeenCalledWith(
        email,
        password
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Logged in successfully.",
        token,
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "showtell_token",
        token,
        expect.any(Object)
      );
    });

    it("should handle axios errors during login", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";
      const axiosError = {
        isAxiosError: true,
        response: { status: 500, data: "Server Error" },
      };
      mockRequest.body = { email, password };
      mockAuthService.prototype.authenticateUser = jest
        .fn()
        .mockRejectedValue(axiosError);

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith("Server Error");
    });

    it("should handle unexpected errors during login", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";
      const errorMessage = "An unexpected error occured during login";
      mockRequest.body = { email, password };
      mockAuthService.prototype.authenticateUser = jest.fn().mockRejectedValue({
        message: errorMessage,
        code: ErrorCodes.AUTH.UNEXPECTED_ERROR,
        statusCode: 401,
      });

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: errorMessage,
        code: ErrorCodes.AUTH.UNEXPECTED_ERROR,
        statusCode: 401,
      });
    });
  });

  describe("register", () => {
    it("should successfully register a user", async () => {
      // Arrange
      const userData = { email: "test@example.com", password: "password123" };
      const userResponse = { data: { id: "1", ...userData } };
      mockRequest.body = userData;
      mockAuthService.prototype.registerUser = jest
        .fn()
        .mockResolvedValue(userResponse);

      // Act
      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.prototype.registerUser).toHaveBeenCalledWith(
        userData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(userResponse.data);
    });

    it("should handle axios errors during registration", async () => {
      // Arrange
      const userData = { email: "test@example.com", password: "password123" };
      const axiosError = {
        isAxiosError: true,
        response: { status: 500, data: "Server Error" },
      };
      mockRequest.body = userData;
      mockAuthService.prototype.registerUser = jest
        .fn()
        .mockRejectedValue(axiosError);

      // Act
      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Server Error",
        code: "AUTH:UNEXPECTED_ERROR",
        statusCode: 500,
      });
    });

    it("should handle unexpected errors during registration", async () => {
      // Arrange
      const userData = { email: "test@example.com", password: "password123" };
      const errorMessage = "An unexpected error occured registering user";
      mockRequest.body = userData;
      mockAuthService.prototype.registerUser = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));
      mockCritukError.mockImplementationOnce(() => ({
        name: "CritukError",
        message: "An unexpected error occured registering user",
        code: ErrorCodes.AUTH.UNEXPECTED_ERROR,
        statusCode: 401,
      }));

      // Act
      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        name: "CritukError",
        message: "An unexpected error occured registering user",
        code: ErrorCodes.AUTH.UNEXPECTED_ERROR,
        statusCode: 401,
      });
    });
  });

  describe("validate", () => {
    it("should validate token and respond with decoded data", async () => {
      // Arrange
      const token = "valid-jwt-token";
      const decoded = { userId: "1", email: "test@example.com" };
      mockRequest.headers = { authorization: `Bearer ${token}` };
      mockAuthService.prototype.validateToken = jest
        .fn()
        .mockResolvedValue(decoded);

      // Act
      await authController.validate(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.prototype.validateToken).toHaveBeenCalledWith(
        token
      );
      expect(mockResponse.json).toHaveBeenCalledWith(decoded);
    });

    it("should return error if token is missing", async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authController.validate(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "No auth token provided.",
      });
    });

    it("should handle unexpected errors during token validation", async () => {
      // Arrange
      const token = "invalid-token";
      const errorMessage = "Invalid token";
      mockRequest.headers = { authorization: `Bearer ${token}` };
      mockAuthService.prototype.validateToken = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));
      mockCritukError.mockImplementationOnce(() => ({
        name: "CritukError",
        message: "An unexpected error occured during validation",
        code: ErrorCodes.AUTH.UNEXPECTED_ERROR,
        statusCode: 401,
      }));

      // Act
      await authController.validate(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        name: "CritukError",
        message: "An unexpected error occured during validation",
        code: ErrorCodes.AUTH.UNEXPECTED_ERROR,
        statusCode: 401,
      });
    });
  });
});
