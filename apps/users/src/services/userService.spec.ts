import { UserService } from "./userService";
import { UserRepository } from "../repositories";
import { CritukError, ErrorCodes } from "@org/errors";
import { v4 as uuidv4 } from "uuid";
import { getCurrentISODate, omitKeys } from "../utils";

// Mock the uuid and utils modules
jest.mock("uuid", () => ({
  v4: jest.fn(),
}));
jest.mock("../utils", () => ({
  getCurrentISODate: jest.fn(),
  omitKeys: jest.fn(),
}));
jest.mock("../repositories", () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      listAll: jest.fn(),
      findOneBy: jest.fn(),
      deleteOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
      deleteProfileImage: jest.fn(),
    })),
  };
});

describe("UserService", () => {
  let userService: UserService;
  let mockListAll: jest.Mock;
  let mockFindOneBy: jest.Mock;
  let mockDeleteOne: jest.Mock;
  let mockCreate: jest.Mock;
  let mockUpdateOne: jest.Mock;
  let mockUploadProfileImage: jest.Mock;
  let mockDeleteProfileImage: jest.Mock;

  beforeEach(() => {
    mockListAll = jest.fn();
    mockFindOneBy = jest.fn();
    mockDeleteOne = jest.fn();
    mockCreate = jest.fn();
    mockUpdateOne = jest.fn();
    mockUploadProfileImage = jest.fn();
    mockDeleteProfileImage = jest.fn();

    const mockUserRepository = new UserRepository();

    mockUserRepository.listAll = mockListAll;
    mockUserRepository.findOneBy = mockFindOneBy;
    mockUserRepository.deleteOne = mockDeleteOne;
    mockUserRepository.create = mockCreate;
    mockUserRepository.updateOne = mockUpdateOne;
    mockUserRepository.uploadProfileImage = mockUploadProfileImage;

    userService = new UserService(mockUserRepository);

    jest.clearAllMocks();
  });

  describe("ListUsers", () => {
    it("should call listAll on the userRepository", async () => {
      mockListAll.mockResolvedValueOnce([{ id: "uuid-123", name: "Pat Doe" }]); // Example data

      const result = await userService.listUsers();

      expect(mockListAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ id: "uuid-123", name: "Pat Doe" }]);
    });

    it("should return an empty array if no users are found", async () => {
      mockListAll.mockResolvedValueOnce([]);

      const result = await userService.listUsers();

      expect(mockListAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it("should throw a 500 error if an unexpected error occurs", async () => {
      mockListAll.mockRejectedValue(new Error("Database connection failed"));

      await expect(userService.listUsers()).rejects.toThrow(
        new CritukError(
          `An unexpected error occurred while fetching account.`,
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        )
      );
      expect(mockListAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("GetUserById", () => {
    it("should call findOneBy on the userRepository", async () => {
      mockFindOneBy.mockResolvedValue({
        Items: [{ id: "uuid-123", name: "Pat Doe" }],
      });

      await userService.getUserById("uuid-123");

      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
    });

    it("should return a user when one exists.", async () => {
      mockFindOneBy.mockResolvedValue({
        Items: [{ id: "uuid-123", name: "Pat Doe" }],
      });

      const result = await userService.getUserById("uuid-123");

      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: "uuid-123", name: "Pat Doe" });
    });

    it("should throw a 404 error if no user found.", async () => {
      const id = "uuid-123";
      mockFindOneBy.mockResolvedValue({
        Items: [],
      });

      await expect(userService.getUserById(id)).rejects.toThrow(
        new CritukError(
          `User does not exist. Id: ${id}.`,
          ErrorCodes.SERVICE.NOT_FOUND,
          404
        )
      );
      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
    });

    it("should throw a 500 error if an unexpected error occurs", async () => {
      mockFindOneBy.mockRejectedValue(new Error("Database connection failed"));

      await expect(userService.getUserById("uuid-123")).rejects.toThrow(
        new CritukError(
          `An unexpected error occurred while fetching account.`,
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        )
      );
      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
    });
  });

  describe("GetUserByEmail", () => {
    it("should call findOneBy on the userRepository", async () => {
      mockFindOneBy.mockResolvedValue({
        Items: [{ id: "uuid-123", name: "Pat Doe", email: "test@test.com" }],
      });

      await userService.getUserByEmail("test@test.com");

      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
    });

    it("should return a user when one exists.", async () => {
      mockFindOneBy.mockResolvedValue({
        Items: [{ id: "uuid-123", name: "Pat Doe", email: "test@test.com" }],
      });

      const result = await userService.getUserByEmail("test@test.com");

      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: "uuid-123",
        name: "Pat Doe",
        email: "test@test.com",
      });
    });

    it("should throw a 404 error if no user found.", async () => {
      const email = "test@test.com";
      mockFindOneBy.mockResolvedValue({
        Items: [],
      });

      await expect(userService.getUserByEmail(email)).rejects.toThrow(
        new CritukError(
          `User does not exist. Email: ${email}.`,
          ErrorCodes.SERVICE.NOT_FOUND,
          404
        )
      );
      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
    });

    it("should throw a 500 error if an unexpected error occurs", async () => {
      mockFindOneBy.mockRejectedValue(new Error("Database connection failed"));

      await expect(userService.getUserByEmail("test@test.com")).rejects.toThrow(
        new CritukError(
          `An unexpected error occurred while fetching account.`,
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        )
      );
      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
    });
  });

  describe("GetUserByUsername", () => {
    it("should call findOneBy on the userRepository", async () => {
      mockFindOneBy.mockResolvedValue({
        Items: [
          {
            id: "uuid-123",
            name: "Pat Doe",
            email: "test@test.com",
            username: "pDoe",
          },
        ],
      });

      await userService.getUserByUsername("pDoe");

      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
    });

    it("should return a user when one exists.", async () => {
      const user = {
        id: "uuid-123",
        name: "Pat Doe",
        email: "test@test.com",
        username: "pDoe",
      };

      mockFindOneBy.mockResolvedValue({
        Items: [user],
      });

      const result = await userService.getUserByUsername("pDoe");

      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(user);
    });

    it("should throw a 404 error if no user found.", async () => {
      const username = "pDoe";
      mockFindOneBy.mockResolvedValue({
        Items: [],
      });

      await expect(userService.getUserByUsername(username)).rejects.toThrow(
        new CritukError(
          `User does not exist. Username: ${username}.`,
          ErrorCodes.SERVICE.NOT_FOUND,
          404
        )
      );
      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
    });

    it("should throw a 500 error if an unexpected error occurs", async () => {
      mockFindOneBy.mockRejectedValue(new Error("Database connection failed"));

      await expect(userService.getUserByUsername("pDoe")).rejects.toThrow(
        new CritukError(
          `An unexpected error occurred while fetching account.`,
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        )
      );
      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
    });
  });

  describe("DeleteUser", () => {
    beforeEach(() => {
      userService.getUserById = jest.fn();
      userService.deleteProfileImage = jest.fn();
    });

    it("should call getUserById with the correct userId.", async () => {
      const mockUserId = "12345";
      const mockUser = { id: mockUserId, profile_image: "profileImageUrl" };

      (userService.getUserById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockUser);

      await userService.deleteUser(mockUserId);

      expect(userService.getUserById).toHaveBeenCalledWith(mockUserId);
    });

    it("should throw a 404 error if there is no user to delete.", async () => {
      const mockUserId = "12345";

      (userService.getUserById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);

      await expect(userService.deleteUser(mockUserId)).rejects.toThrow(
        new CritukError(
          "User does not exist and cannot be deleted.",
          ErrorCodes.SERVICE.NOT_FOUND,
          404
        )
      );
    });

    it("should call deleteProfileImage if a profile image exists.", async () => {
      const mockUser = { id: "123", profile_image: "profileImageUrl" };

      (userService.getUserById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockUser);

      mockDeleteOne.mockResolvedValue(undefined);

      (userService.deleteProfileImage as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockUser.profile_image);

      await userService.deleteUser(mockUser.id);

      expect(userService.deleteProfileImage).toHaveBeenCalledWith(
        "profileImageUrl"
      );
    });

    it("should not call deleteProfileImage if a profile image does not exists.", async () => {
      const mockUser = { id: "123", profile_image: null };

      (userService.getUserById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockUser);

      mockDeleteOne.mockResolvedValue(undefined);

      await userService.deleteUser(mockUser.id);

      expect(userService.deleteProfileImage).not.toHaveBeenCalled();
    });

    it("should throw an error if an error is thrown from repository method: deleteOne", async () => {
      const mockUser = { id: "123", profile_image: "profileImageUrl" };

      (userService.getUserById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockUser);

      mockDeleteOne.mockRejectedValue(new Error("DB Error"));

      await expect(userService.deleteUser("uuid-123")).rejects.toThrow(
        new CritukError(
          "An unexpected error occurred while deleting account.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        )
      );
      expect(mockDeleteOne).toHaveBeenCalledTimes(1);
    });
  });

  describe("CreateUser", () => {
    it("should create a user and return the newly created user.", async () => {
      const mockedUUID = "uuid-123";
      const mockedDate = "2023-12-04T12:34:56.789Z";

      (uuidv4 as jest.Mock) = jest.fn().mockReturnValue(mockedUUID);
      (getCurrentISODate as jest.Mock) = jest.fn().mockReturnValue(mockedDate);

      const userInput = {
        email: "test@test.com",
        username: "pDoe",
        password: "examplePassword",
        first_name: "Pat",
        last_name: "Doe",
      };

      const newUser = {
        email: "test@test.com",
        username: "pDoe",
        first_name: "Pat",
        last_name: "Doe",
        id: mockedUUID,
        created_at: mockedDate,
        profile_image: null,
        bio: "",
        currently_watching: null,
        follower_count: 0,
        following_count: 0,
        reviews: [],
      };

      mockFindOneBy.mockResolvedValueOnce({ Items: [] });
      mockFindOneBy.mockResolvedValueOnce({ Items: [] });
      mockCreate.mockResolvedValue({});

      const result = await userService.createUser(userInput);

      expect(mockFindOneBy).toHaveBeenCalledTimes(2);
      expect(result).toEqual(omitKeys(newUser, "password"));
    });

    it("should throw a 409 error if input email exists.", async () => {
      const mockedUUID = "uuid-123";
      const mockedDate = "2023-12-04T12:34:56.789Z";

      (uuidv4 as jest.Mock) = jest.fn().mockReturnValue(mockedUUID);
      (getCurrentISODate as jest.Mock) = jest.fn().mockReturnValue(mockedDate);

      const userInput = {
        email: "test@test.com",
        username: "pDoe",
        password: "examplePassword",
        first_name: "Pat",
        last_name: "Doe",
      };

      mockFindOneBy.mockResolvedValueOnce({ Items: [{ ...userInput }] });
      mockFindOneBy.mockResolvedValueOnce({ Items: [] });
      mockCreate.mockResolvedValue({});

      await expect(userService.createUser(userInput)).rejects.toThrow(
        new CritukError(
          `User already exists. Email: ${userInput.email}`,
          ErrorCodes.SERVICE.EMAIL_EXISTS,
          409
        )
      );
      expect(mockFindOneBy).toHaveBeenCalledTimes(1);
    });

    it("should throw a 409 error if input username exists.", async () => {
      const mockedUUID = "uuid-123";
      const mockedDate = "2023-12-04T12:34:56.789Z";

      (uuidv4 as jest.Mock) = jest.fn().mockReturnValue(mockedUUID);
      (getCurrentISODate as jest.Mock) = jest.fn().mockReturnValue(mockedDate);

      const userInput = {
        email: "test@test.com",
        username: "pDoe",
        password: "examplePassword",
        first_name: "Pat",
        last_name: "Doe",
      };

      mockFindOneBy.mockResolvedValueOnce({ Items: [] });
      mockFindOneBy.mockResolvedValueOnce({ Items: [{ ...userInput }] });
      mockCreate.mockResolvedValue({});

      await expect(userService.createUser(userInput)).rejects.toThrow(
        new CritukError(
          `User already exists. Username: ${userInput.username}`,
          ErrorCodes.SERVICE.USERNAME_EXISTS,
          409
        )
      );
    });

    it("should throw a 500 error when unexpected error occurs.", async () => {
      const mockedUUID = "uuid-123";
      const mockedDate = "2023-12-04T12:34:56.789Z";

      (uuidv4 as jest.Mock) = jest.fn().mockReturnValue(mockedUUID);
      (getCurrentISODate as jest.Mock) = jest.fn().mockReturnValue(mockedDate);

      const userInput = {
        email: "test@test.com",
        username: "pDoe",
        password: "examplePassword",
        first_name: "Pat",
        last_name: "Doe",
      };

      mockFindOneBy.mockResolvedValueOnce({ Items: [] });
      mockFindOneBy.mockResolvedValueOnce({ Items: [] });
      mockCreate.mockRejectedValue(new Error("Unexpected error occured."));

      await expect(userService.createUser(userInput)).rejects.toThrow(
        new CritukError(
          `An unexpected error occurred while creating account.`,
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        )
      );
    });
  });

  describe("UpdateUser", () => {
    it("should successfully update user", async () => {
      const mockedDate = "2023-12-04T12:34:56.789Z";
      const user = {
        email: "test@test.com",
        username: "pDoe",
        first_name: "Pat",
        last_name: "Doe",
        id: "uuid-123",
        created_at: mockedDate,
        profile_image: null,
        bio: "",
        currently_watching: null,
        follower_count: 0,
        following_count: 0,
        reviews: [],
      };

      const updatedUser = {
        ...user,
        first_name: "Sam",
        updated_at: mockedDate,
      };

      mockUpdateOne.mockResolvedValue(updatedUser);
      (getCurrentISODate as jest.Mock) = jest.fn().mockReturnValue(mockedDate);

      const result = await userService.updateUser("uuid-123", {
        first_name: "Sam",
      });

      expect(result).toEqual(updatedUser);
    });

    it("should throw a 500 error when unexpected error occurs.", async () => {
      mockUpdateOne.mockRejectedValue(
        new Error("An unexpected error occured.")
      );

      await expect(
        userService.updateUser("uuid-123", {
          first_name: "Sam",
        })
      ).rejects.toThrow(
        new CritukError(
          "An unexpected error occurred while updating account.",
          ErrorCodes.SERVICE.UNEXPECTED_ERROR,
          500
        )
      );
    });
  });

  describe("UploadProfileImage", () => {
    it("should upload profile image and update user profile", async () => {
      const userId = "uuid-123";
      const file = {
        originalname: "profile.jpg",
        buffer: Buffer.from("image data"),
        mimetype: "image/jpeg",
      } as Express.Multer.File;

      const mockedImagePath = "path/to/uploaded/image.jpg";

      mockUploadProfileImage.mockResolvedValue(mockedImagePath);

      (userService.updateUser as jest.Mock) = jest.fn().mockResolvedValue({});

      const result = await userService.uploadProfileImage(userId, file);
      expect(mockUploadProfileImage).toHaveBeenCalledWith(
        `profile-image/${userId}.jpg`,
        file.buffer,
        file.mimetype
      );
      expect(userService.updateUser).toHaveBeenCalledWith(userId, {
        profile_image: mockedImagePath,
      });
      expect(result).toEqual(mockedImagePath);
    });

    it("should throw an error if file upload fails", async () => {
      userService.updateUser = jest.fn();
      const userId = "uuid-123";
      const file = {
        originalname: "profile.jpg",
        buffer: Buffer.from("image data"),
        mimetype: "image/jpeg",
      } as Express.Multer.File;

      mockUploadProfileImage.mockRejectedValue(
        new Error("Error uploading image")
      );

      await expect(
        userService.uploadProfileImage(userId, file)
      ).rejects.toThrow(
        new CritukError(
          `An unexpected error occurred while uploading profile image.`,
          ErrorCodes.AWS.UNEXPECTED_ERROR,
          500
        )
      );

      expect(userService.updateUser).not.toHaveBeenCalled();
    });
  });

  describe("DeleteProfileImage", () => {
    it("should delete profile image successfully", async () => {
      const profileImageKey = "profile-image/uuid-123.jpg";

      mockDeleteProfileImage.mockResolvedValue("Success");

      await userService.deleteProfileImage(profileImageKey);

      expect(userService.deleteProfileImage).toHaveBeenCalledWith(
        profileImageKey
      );
    });

    it("should throw an error if deleting profile image fails", async () => {
      mockDeleteProfileImage.mockRejectedValue(
        new Error("Error deleting image")
      );

      await userService.deleteProfileImage("profile-image/uuid-123.jpg");
      await expect(mockDeleteProfileImage).rejects.toThrow(
        new CritukError(
          "Error deleting image",
          ErrorCodes.AWS.UNEXPECTED_ERROR,
          500
        )
      );
    });
  });
});
