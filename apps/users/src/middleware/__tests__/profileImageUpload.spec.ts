import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import {
  profileImageUpload,
  uploadErrorHandler,
  validateFilePresence,
} from "../profileImageUpload";

jest.mock("@org/errors", () => ({
  CritukError: jest.fn().mockImplementation((message, code, statusCode) => ({
    message,
    code,
    statusCode,
  })),
  ErrorCodes: {
    VALIDATION: {
      INVALID_FORMAT: "INVALID_FORMAT",
      INVALID_VALUE: "INVALID_VALUE",
    },
    SERVICE: {
      UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
    },
  },
}));

const app = express();
app.use(express.json());

app.post(
  "/upload",
  profileImageUpload.single("file"),
  validateFilePresence,
  (req: Request, res: Response) => {
    res.status(200).send("File uploaded successfully");
  },
  uploadErrorHandler
);

app.post(
  "/upload-error",
  (req: Request, res: Response, next: NextFunction) => {
    next(new Error("Simulated unexpected error"));
  },
  profileImageUpload.single("file"),
  (req: Request, res: Response) => {
    res.status(200).send({ message: "File uploaded successfully!" });
  },
  uploadErrorHandler
);

describe("ProfileImageUpload - middleware", () => {
  it("should allow valid image files (jpeg, jpg, png)", async () => {
    const response = await request(app)
      .post("/upload")
      .attach("file", Buffer.from("valid image data"), "image.jpg")
      .expect(200);

    expect(response.text).toBe("File uploaded successfully");
  });

  it("should reject invalid file formats", async () => {
    const response = await request(app)
      .post("/upload")
      .attach("file", Buffer.from("invalid file data"), "image.gif")
      .expect(409);

    expect(response.body.message).toBe("Image must be JPEG or PNG");
    expect(response.body.code).toBe("INVALID_FORMAT");
    expect(response.body.statusCode).toBe(409);
  });

  it("should reject files exceeding size limit", async () => {
    const largeFileBuffer = Buffer.alloc(6 * 1024 * 1024, "a"); // 6MB

    const response = await request(app)
      .post("/upload")
      .attach("file", largeFileBuffer, "large-image.jpg")
      .expect(413);

    expect(response.body.message).toBe("File size exceeds the limit of 5MB");
    expect(response.body.code).toBe("INVALID_FORMAT");
    expect(response.body.statusCode).toBe(413);
  });

  it("should reject requests with no file", async () => {
    const response = await request(app).post("/upload").expect(400);

    expect(response.body.message).toBe("No file provided.");
    expect(response.body.code).toBe("INVALID_VALUE");
    expect(response.body.statusCode).toBe(400);
  });

  it("should handle unexpected errors", async () => {
    const response = await request(app)
      .post("/upload-error")
      .attach("file", Buffer.from("valid image data"), "image.jpg")
      .expect(500);

    expect(response.body.message).toBe("An unexpected error occurred");
    expect(response.body.code).toBe("UNEXPECTED_ERROR");
    expect(response.body.statusCode).toBe(500);
  });
});
