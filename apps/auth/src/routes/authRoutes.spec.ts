import request from "supertest";
import express from "express";
import { router } from "./authRoutes";

jest.mock("../controllers", () => {
  return {
    AuthController: jest.fn().mockImplementation(() => ({
      login: jest.fn((req, res) =>
        res.status(200).json({ message: "Login successful" })
      ),
      register: jest.fn((req, res) =>
        res.status(201).json({ message: "Registration successful" })
      ),
      validate: jest.fn((req, res) =>
        res.status(200).json({ message: "Validation successful" })
      ),
    })),
  };
});

describe("Auth Router", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(router);
  });

  test("POST /auth/login calls AuthController.login", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Login successful" });
  });

  test("POST /auth/register calls AuthController.register", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: "Registration successful" });
  });

  test("GET /auth/validate calls AuthController.validate", async () => {
    const res = await request(app).get("/auth/validate");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Validation successful" });
  });
});
