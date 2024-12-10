import { CritukError } from "@org/errors";
import { handleResponse } from "@org/response";
import { HttpResponse } from "../types";

export const errorMiddleware = (
  err: CritukError,
  req: any,
  res: HttpResponse,
  next: Function
) => {
  if (err instanceof CritukError) {
    return handleResponse(res, {
      status: err.statusCode,
      success: false,
      message: err.message,
    });
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
