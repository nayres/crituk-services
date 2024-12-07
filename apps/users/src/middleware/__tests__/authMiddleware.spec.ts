import { authMiddleware } from "../authMiddleware";
import { apiClient } from "../../utils/clients";
import { CritukError, ErrorCodes } from "@org/errors";
import MockAdapter from "axios-mock-adapter";
import { Request, Response, NextFunction } from "express";

const mockAxios = new MockAdapter(apiClient);

describe("AuthMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    mockAxios.reset();
  });

  it("should return 401 if authorization header is missing", async () => {
    await authMiddleware.authenticate(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      new CritukError(
        "Authorization header is missing.",
        ErrorCodes.AUTH.INSUFFICIENT_CREDENTIALS,
        401
      )
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next if token is valid", async () => {
    (req as Request).headers.authorization = "Bearer valid-token";

    mockAxios.onGet("/auth/validate").reply(200, { userId: 123 });

    await authMiddleware.authenticate(req as Request, res as Response, next);

    expect(req.user).toEqual({ userId: 123 });
    expect(next).toHaveBeenCalled();
  });

  it("should return 401 for invalid or expired token", async () => {
    (req as Request).headers.authorization = "Bearer invalid-token";

    mockAxios.onGet("/auth/validate").reply(401, {
      message: "Invalid or expired token",
    });

    await authMiddleware.authenticate(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      new CritukError(
        "Invalid or expired token",
        ErrorCodes.AUTH.INSUFFICIENT_CREDENTIALS,
        401
      )
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 503 if authentication service is unavailable", async () => {
    (req as Request).headers.authorization = "Bearer token";

    mockAxios.onGet("/auth/validate").reply(() => {
      throw {
        isAxiosError: true,
        request: {},
      };
    });

    await authMiddleware.authenticate(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      new CritukError(
        "Authentication service unavailable.",
        ErrorCodes.AUTH.INSUFFICIENT_CREDENTIALS,
        503
      )
    );
    expect(next).not.toHaveBeenCalled();
  });
});
