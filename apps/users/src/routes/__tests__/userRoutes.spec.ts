import request from "supertest";
import express, { NextFunction } from "express";
import { userRoutes } from "../userRoutes";

const app = express();
app.use(express.json());
app.use("/", userRoutes);

jest.mock("../../controllers", () => {
  return {
    UserController: jest.fn().mockImplementation(() => {
      return {
        listUsers: jest.fn((req, res) => res.status(200).send("listUsers")),
        getUser: jest.fn((req, res) => res.status(200).send("getUser")),
        createUser: jest.fn((req, res) => res.status(201).send("createUser")),
        getCurrentUser: jest.fn((req, res) =>
          res.status(200).send("getCurrentUser")
        ),
        deleteCurrentUser: jest.fn((req, res) => res.status(204).send()),
        deleteUserById: jest.fn((req, res) => res.status(204).send()),
        updateCurrentUser: jest.fn((req, res) =>
          res.status(200).send("updateCurrentUser")
        ),
        uploadProfileImage: jest.fn((req, res) =>
          res.status(200).send("uploadProfileImage")
        ),
      };
    }),
  };
});
jest.mock("../../middleware", () => {
  return {
    AuthMiddleware: jest.fn().mockImplementation(() => {
      return {
        authenticate: jest.fn((req, res, next) => next()),
      };
    }),
    validateFilePresence: jest.fn((res, req, next) => next()),
    validateRequest: jest.fn(
      () => (req: Request, res: Response, next: NextFunction) => next()
    ),
    profileImageUpload: {
      single: jest.fn(
        () => (req: Request, res: Response, next: NextFunction) => next()
      ),
    },
    uploadErrorHandler: jest.fn((err, req, res, next) => next()),
  };
});

describe("User Routes", () => {
  it("should get user by email or username", async () => {
    const response = await request(app).get("/users?email=test@example.com");
    expect(response.status).toBe(200);
    expect(response.text).toBe("getUser");
  });

  it("should create a new user", async () => {
    const response = await request(app)
      .post("/users")
      .send({ username: "testuser", email: "test@example.com" });
    expect(response.status).toBe(201);
    expect(response.text).toBe("createUser");
  });

  it("should get current user account", async () => {
    const response = await request(app).get("/users/account");
    expect(response.status).toBe(200);
    expect(response.text).toBe("getCurrentUser");
  });

  it("should delete current user account", async () => {
    const response = await request(app).delete("/users/account");
    expect(response.status).toBe(204);
  });

  it("should update current user account", async () => {
    const response = await request(app)
      .patch("/users/account")
      .send({ username: "updateduser" });
    expect(response.status).toBe(200);
    expect(response.text).toBe("updateCurrentUser");
  });

  it("should upload a profile image", async () => {
    const response = await request(app).put("/users/account/profile-image");
    expect(response.status).toBe(200);
    expect(response.text).toBe("uploadProfileImage");
  });

  it("should list all users", async () => {
    const response = await request(app).get("/users/admin");
    expect(response.status).toBe(200);
    expect(response.text).toBe("listUsers");
  });

  it("should delete user by id", async () => {
    const response = await request(app).delete("/users/admin/uuid-123");
    expect(response.status).toBe(204);
  });
});
