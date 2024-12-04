export class CritukError extends Error {
  public code: string;
  public statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;

    Object.defineProperty(this, "message", {
      enumerable: true,
    });

    Error.captureStackTrace(this, this.constructor);
  }
}
