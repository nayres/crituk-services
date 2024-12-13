import { CritukError, ErrorCodes } from "@org/errors";
import { error } from "console";
import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback, MulterError } from "multer";
import path from "path";

const storage = multer.memoryStorage();
const fileLimits = { fileSize: 5 * 1024 * 1024 }; // 5MB

const fileFilterCallback = (
  req: unknown,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (fileExt === ".jpeg" || fileExt === ".jpg" || fileExt === ".png") {
    cb(null, true);
  } else {
    const error = new MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
    error.message = "Image must be JPEG or PNG";
    cb(error);
  }
};

export const profileImageUpload = multer({
  storage,
  fileFilter: fileFilterCallback,
  limits: fileLimits,
});

export const uploadErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json(
          new CritukError(
            "File size exceeds the limit of 5MB",
            ErrorCodes.VALIDATION.INVALID_FORMAT,
            413
          )
        );
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res
        .status(409)
        .json(
          new CritukError(
            err.message || "Invalid file format",
            ErrorCodes.VALIDATION.INVALID_FORMAT,
            409
          )
        );
    }
  }

  return res
    .status(500)
    .json(
      new CritukError(
        "An unexpected error occurred while uploading profile image.",
        ErrorCodes.SERVICE.UNEXPECTED_ERROR,
        500
      )
    );
};

export const validateFilePresence = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res
      .status(400)
      .json(
        new CritukError(
          "No file provided.",
          ErrorCodes.VALIDATION.INVALID_VALUE,
          400
        )
      );
  }
  next();
};
