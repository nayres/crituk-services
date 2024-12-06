import { UserController } from "./UserController";
import { UserService } from "../services";
import { Request, Response, NextFunction } from "express";
import { DeleteCommandOutput } from "@aws-sdk/lib-dynamodb";
import { CritukError, ErrorCodes } from "@org/errors";

describe("UserController", () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockUserService = {
      getUserByEmail: jest.fn(),
      getUserByUsername: jest.fn(),
      getUserById: jest.fn(),
      listUsers: jest.fn(),
      deleteUser: jest.fn(),
      updateUser: jest.fn(),
      createUser: jest.fn(),
      uploadProfileImage: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    userController = new UserController(mockUserService);
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe("GetUser", () => {
    it("should return a user by email", async () => {
      mockReq.query = { email: "test@example.com" };
      const mockUser = { id: "1", email: "test@example.com" };
      mockUserService.getUserByEmail.mockResolvedValue(mockUser);

      await userController.getUser(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 200,
        user: mockUser,
      });
    });

    it("should return a user by username", async () => {
      mockReq.query = { username: "testuser" };
      const mockUser = { id: "1", username: "testuser" };
      mockUserService.getUserByUsername.mockResolvedValue(mockUser);

      await userController.getUser(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.getUserByUsername).toHaveBeenCalledWith(
        "testuser"
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 200,
        user: mockUser,
      });
    });

    it("should call next with an error if one occurs", async () => {
      const error = new Error("UserService Error");
      mockReq.query = { email: "test@example.com" };
      mockUserService.getUserByEmail.mockRejectedValue(error);

      await userController.getUser(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("listUsers", () => {
    it("should return a list of users", async () => {
      const mockUsers = [{ id: "1", name: "Pat Doe" }];
      mockUserService.listUsers.mockResolvedValue(mockUsers);

      await userController.listUsers(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.listUsers).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ users: mockUsers });
    });

    it("should call next with an error if one occurs", async () => {
      const error = new Error("UserService Error");
      mockUserService.listUsers.mockRejectedValue(error);

      await userController.listUsers(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("GetCurrentUser", () => {
    beforeEach(() => {
      mockReq = { user: { id: "uuid-123" } };
    });

    it("should return the current user when userService.getUserById succeeds", async () => {
      const mockUser = { id: "uuid-123", name: "Pat Doe" };
      mockUserService.getUserById.mockResolvedValue(mockUser);

      await userController.getCurrentUser(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.getUserById).toHaveBeenCalledWith("uuid-123");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 200,
        user: mockUser,
      });
    });

    it("should call next with an error if userService.getUserById throws", async () => {
      const error = new Error("User not found");
      mockUserService.getUserById.mockRejectedValue(error);

      await userController.getCurrentUser(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.getUserById).toHaveBeenCalledWith("uuid-123");
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("DeleteCurrentUser", () => {
    beforeEach(() => {
      mockReq = { user: { id: "uuid-123" } };
    });

    it("should delete the current user and return status 204", async () => {
      mockUserService.deleteUser.mockResolvedValue({
        Attributes: {},
        $metadata: {},
      });

      await userController.deleteCurrentUser(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.deleteUser).toHaveBeenCalledWith("uuid-123");
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({ status: 204 });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with an error if userService.deleteUser throws", async () => {
      const error = new Error("Delete failed");
      mockUserService.deleteUser.mockRejectedValue(error);

      await userController.deleteCurrentUser(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.deleteUser).toHaveBeenCalledWith("uuid-123");
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("UpdateCurrentUser", () => {
    beforeEach(() => {
      mockReq = {
        user: { id: "uuid-123" },
        body: { name: "Updated Name", email: "updated@example.com" },
      };
    });

    it("should update the current user and return status 201", async () => {
      const mockUser = { id: "uuid-123", name: "Pat Doe" };
      mockUserService.updateUser.mockResolvedValue(mockUser);

      await userController.updateCurrentUser(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.updateUser).toHaveBeenCalledWith("uuid-123", {
        name: "Updated Name",
        email: "updated@example.com",
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ status: 201 });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with an error if userService.updateUser throws", async () => {
      const error = new Error("Update failed");
      mockUserService.updateUser.mockRejectedValue(error);

      await userController.updateCurrentUser(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.updateUser).toHaveBeenCalledWith("uuid-123", {
        name: "Updated Name",
        email: "updated@example.com",
      });
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("CreateUser", () => {
    beforeEach(() => {
      mockReq = {
        body: {
          username: "username",
          email: "email@example.com",
          first_name: "Pat",
          last_name: "Doe",
          password: "TestPassword",
        },
      };
    });

    it("successfully creates a new user", async () => {
      const newUser = {
        username: "username",
        email: "email@example.com",
        first_name: "Pat",
        last_name: "Doe",
        password: "TestPassword",
      };

      mockUserService.createUser.mockResolvedValue(newUser);

      await userController.createUser(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.createUser).toHaveBeenCalledWith(newUser);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ status: 201, user: newUser });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with an error if userService.createUser throws", async () => {
      const newUser = {
        username: "username",
        email: "email@example.com",
        first_name: "Pat",
        last_name: "Doe",
        password: "TestPassword",
      };
      const error = new Error("Update failed");
      mockUserService.createUser.mockRejectedValue(error);

      await userController.createUser(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.createUser).toHaveBeenCalledWith(newUser);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("DeleteUserById", () => {
    beforeEach(() => {
      mockReq = {
        params: { id: "uuid-123" },
      };
    });

    it("should delete the user and return status 204", async () => {
      mockUserService.deleteUser.mockResolvedValue({
        Attributes: {},
        $metadata: {},
      });

      await userController.deleteUserById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.deleteUser).toHaveBeenCalledWith("uuid-123");
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({ status: 204 });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with an error if userService.deleteUser throws", async () => {
      const error = new Error("Delete failed");
      mockUserService.deleteUser.mockRejectedValue(error);

      await userController.deleteUserById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.deleteUser).toHaveBeenCalledWith("uuid-123");
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe("UploadProfileImage", () => {
    beforeEach(() => {
      mockReq = {
        user: { id: "uuid-123" },
        file: {
          buffer: Buffer.from("file content"),
          mimetype: "image/jpeg",
        } as Express.Multer.File,
      };
    });

    it("should upload the profile image and return status 200", async () => {
      mockUserService.uploadProfileImage.mockResolvedValue("profile-image.jpg");

      await userController.uploadProfileImage(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.uploadProfileImage).toHaveBeenCalledWith(
        "uuid-123",
        mockReq.file
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 200,
        message: "Profile image uploaded successfuly.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with a CritukError if no file is provided", async () => {
      mockReq.file = undefined;

      await userController.uploadProfileImage(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      const expectedError = new CritukError(
        "No image was provided for uploading a profile image.",
        ErrorCodes.AWS.SERVICE_ERROR,
        400
      );

      expect(mockNext).toHaveBeenCalledWith(expectedError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it("should call next with an error if uploadProfileImage throws an error", async () => {
      const error = new Error("Upload failed");
      mockUserService.uploadProfileImage.mockRejectedValue(error);

      await userController.uploadProfileImage(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUserService.uploadProfileImage).toHaveBeenCalledWith(
        "uuid-123",
        mockReq.file
      );
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});
