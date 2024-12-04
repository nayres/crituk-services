import express from "express";
import { errorMiddleware } from "./errorMiddleware";
import { CritukError } from "../critukError/CritukError";
import request from "supertest";

describe("errorMiddleware", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();

    app.use("/crituk-error", (req, res, next) => {
      const error = new CritukError("Test CritukError", "TEST:ERROR_CODE", 400);
      next(error);
    });

    app.use("/upload", (req, res, next) => {
      const error = new CritukError(
        "File size exceeds the limit of 5MB",
        "TEST:ERROR_CODE",
        413
      );

      error.code = "LIMIT_FILE_SIZE";
      next(error);
    });

    app.use("/unexpected-error", (req, res, next) => {
      const error = new Error("Unexpected error");
      next(error);
    });

    app.use(errorMiddleware);
  });

  it("should handle CritukError and return the correct response", async () => {
    const response = await request(app).get("/crituk-error");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Test CritukError",
      code: "TEST:ERROR_CODE",
      statusCode: 400,
    });
  });

  it("should handle unexpected errors and return a 500 response", async () => {
    const response = await request(app).get("/unexpected-error");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "An unexpected error occured.",
      code: "MIDDLEWARE:INTERNAL_SERVER_ERROR",
      statusCode: 500,
    });
  });

  it("should throw an error if a profile image upload is too large", async () => {
    const response = await request(app).get("/upload");

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      message: "File size exceeds the limit of 5MB",
      code: "VALIDATION:INVALID_FORMAT",
      statusCode: 413,
    });
  });

  it("should log unexpected errors to the console", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await request(app).get("/unexpected-error");

    expect(consoleSpy).toHaveBeenCalledWith(
      "Unexpected error:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
