import { Response, NextFunction } from "express";
import { CritukError } from "../critukError";
import { ErrorCodes } from "../errorCodes";

export const errorMiddleware = (
  err: CritukError,
  req: any,
  res: Response,
  next: NextFunction
) => {
  // handle upload image errors
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

  if (err instanceof CritukError) {
    return res
      .status(err.statusCode)
      .json(new CritukError(err.message, err.code, err.statusCode));
  }

  console.error("Unexpected error:", err);
  return res
    .status(500)
    .json(
      new CritukError(
        "An unexpected error occured.",
        "MIDDLEWARE:INTERNAL_SERVER_ERROR",
        500
      )
    );
};
