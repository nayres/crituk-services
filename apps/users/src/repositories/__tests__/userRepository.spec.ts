import {
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { UserRepository } from "../userRepository";
import { unmarshall } from "@aws-sdk/util-dynamodb";

jest.mock("@aws-sdk/lib-dynamodb");
jest.mock("@aws-sdk/util-dynamodb");
jest.mock("@aws-sdk/client-s3");

describe("UserRepository", () => {
  let userRepository: UserRepository;
  let mockDocClient: any;
  let mockS3Client: any;

  beforeEach(() => {
    mockDocClient = {
      send: jest.fn(),
    };
    mockS3Client = {
      send: jest.fn(),
    };
    userRepository = new UserRepository(mockDocClient, mockS3Client);
  });

  describe("listAll", () => {
    it("should return a list of users", async () => {
      const users = [
        { id: { S: "1" }, name: { S: "John Doe" } },
        { id: { S: "2" }, name: { S: "Jane Smith" } },
      ];
      mockDocClient.send.mockResolvedValue({ Items: users });
      (unmarshall as jest.Mock).mockImplementation((user) => user);

      const result = await userRepository.listAll();

      expect(result).toEqual(users.map((user) => unmarshall(user)));
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { TableName: userRepository["tableName"] },
        })
      );
    });
    it("should return an empty array if no users are found", async () => {
      mockDocClient.send.mockResolvedValue({ Items: [] });

      const result = await userRepository.listAll();

      expect(result).toEqual([]);
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { TableName: userRepository["tableName"] },
        })
      );
    });

    it("should handle DynamoDB errors", async () => {
      const error = new Error("DynamoDB error");
      mockDocClient.send.mockRejectedValue(error);

      await expect(userRepository.listAll()).rejects.toThrow(error);
    });
  });

  describe("findOneBy", () => {
    it("should return the result when called with keyConditionExpression and expressionAttributeValues", async () => {
      const options = {
        keyConditionExpression: "id = :id",
        expressionAttributeValues: { ":id": "1" },
      };
      const expectedResult = { Items: [{ id: "1", name: "John Doe" }] };
      mockDocClient.send.mockResolvedValue(expectedResult);

      const result = await userRepository.findOneBy(options);

      expect(result).toEqual(expectedResult);
      expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    });

    it("should include IndexName if provided in options", async () => {
      const options = {
        keyConditionExpression: "id = :id",
        expressionAttributeValues: { ":id": "1" },
        indexName: "UserIndex",
      };
      const expectedResult = { Items: [{ id: "1", name: "John Doe" }] };
      mockDocClient.send.mockResolvedValue(expectedResult);

      const result = await userRepository.findOneBy(options);

      expect(result).toEqual(expectedResult);
      expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    });

    it("should handle DynamoDB errors", async () => {
      const options = {
        keyConditionExpression: "id = :id",
        expressionAttributeValues: { ":id": "1" },
      };
      const error = new Error("DynamoDB error");
      mockDocClient.send.mockRejectedValue(error);

      await expect(userRepository.findOneBy(options)).rejects.toThrow(error);
    });
  });

  describe("Create", () => {
    it("should create a new user record.", async () => {
      const newUser = {
        email: "test@test.com",
        username: "pDoe",
        first_name: "Pat",
        last_name: "Doe",
        password: "TestPassword",
        id: "uuid-123",
        created_at: "2023-12-04T12:34:56.789Z",
        profile_image: null,
        bio: "",
        currently_watching: null,
        follower_count: 0,
        following_count: 0,
        reviews: [],
      };

      mockDocClient.send.mockResolvedValue(undefined);

      const result = await userRepository.create(newUser);
      expect(result).toBe(undefined);
      expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
    });
    it("should handle DynamoDB errors", async () => {
      const newUser = {
        email: "test@test.com",
        username: "pDoe",
        first_name: "Pat",
        last_name: "Doe",
        password: "TestPassword",
        id: "uuid-123",
        created_at: "2023-12-04T12:34:56.789Z",
        profile_image: null,
        bio: "",
        currently_watching: null,
        follower_count: 0,
        following_count: 0,
        reviews: [],
      };
      const error = new Error("DynamoDB error");
      mockDocClient.send.mockRejectedValue(new Error("DynamoDB error"));

      await expect(userRepository.create(newUser)).rejects.toThrow(error);
    });
  });

  describe("DeleteOne", () => {
    it("should delete a user record.", async () => {
      mockDocClient.send.mockResolvedValue(undefined);

      const result = await userRepository.deleteOne("uuid-123");
      expect(result).toBe(undefined);
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.any(DeleteCommand)
      );
    });
    it("should handle DynamoDB errors", async () => {
      const error = new Error("DynamoDB error");
      mockDocClient.send.mockRejectedValue(new Error("DynamoDB error"));

      await expect(userRepository.deleteOne("uuid-123")).rejects.toThrow(error);
    });
  });

  describe("UpdateOne", () => {
    it("should update a user record.", async () => {
      const newUserData = { first_name: "Al" };
      const newUser = {
        email: "test@test.com",
        username: "pDoe",
        first_name: "Al",
        last_name: "Doe",
        password: "TestPassword",
        id: "uuid-123",
        created_at: "2023-12-04T12:34:56.789Z",
        profile_image: null,
        bio: "",
        currently_watching: null,
        follower_count: 0,
        following_count: 0,
        reviews: [],
      };

      mockDocClient.send.mockResolvedValue({ Attributes: newUser });

      const result = await userRepository.updateOne("uuid-123", newUserData);
      expect(result).toBe(newUser);
      expect(mockDocClient.send).toHaveBeenCalledWith(
        expect.any(UpdateCommand)
      );
    });
    it("should handle DynamoDB errors", async () => {
      const error = new Error("DynamoDB error");
      mockDocClient.send.mockRejectedValue(new Error("DynamoDB error"));

      await expect(userRepository.updateOne("uuid-123", {})).rejects.toThrow(
        error
      );
    });
  });

  describe("UploadProfileImage", () => {
    it("should successfully upload an image to S3", async () => {
      const key = "profile-image/uuid-123.jpg";
      const body = Buffer.from("image-data");
      const contentType = "image/jpeg";

      process.env.AWS_PROFILE_IMAGE_S3_NAME = "test-bucket";

      mockS3Client.send.mockResolvedValue({});

      await userRepository.uploadProfileImage(key, body, contentType);

      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it("should handle S3 errors", async () => {
      const key = "profile-image/uuid-123.jpg";
      const body = Buffer.from("image-data");
      const contentType = "image/jpeg";

      process.env.AWS_PROFILE_IMAGE_S3_NAME = "test-bucket";

      const error = new Error("S3 error");
      mockS3Client.send.mockRejectedValue(new Error("S3 error"));

      await expect(
        userRepository.uploadProfileImage(key, body, contentType)
      ).rejects.toThrow(error);
    });
  });

  describe("DeleteProfileImage", () => {
    it("should successfully delete an image to S3", async () => {
      process.env.AWS_PROFILE_IMAGE_S3_NAME = "test-bucket";

      mockS3Client.send.mockResolvedValue({});

      await userRepository.deleteProfileImage("profile-image/uuid-123.jpg");

      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it("should handle S3 errors", async () => {
      process.env.AWS_PROFILE_IMAGE_S3_NAME = "test-bucket";

      const error = new Error("S3 error");
      mockS3Client.send.mockRejectedValue(new Error("S3 error"));

      await expect(
        userRepository.deleteProfileImage("profile-image/uuid-123.jpg")
      ).rejects.toThrow(error);
    });
  });
});
