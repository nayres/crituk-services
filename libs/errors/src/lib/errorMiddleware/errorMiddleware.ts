import { Response, NextFunction } from "express";
import { CritukError } from "../critukError";

export const errorMiddleware = (
  err: CritukError,
  req: any,
  res: Response,
  next: NextFunction
) => {
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
