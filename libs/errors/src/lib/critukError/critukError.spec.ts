import { CritukError } from "./CritukError";

describe("CritukError", () => {
  it("should correctly set message, code, and statusCode properties", () => {
    const message = "This is a test error";
    const code = "TEST:ERROR_CODE";
    const statusCode = 400;

    const error = new CritukError(message, code, statusCode);

    // Verify properties
    expect(error.message).toBe(message);
    expect(error.code).toBe(code);
    expect(error.statusCode).toBe(statusCode);

    // Verify stack trace
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("Error: This is a test error");
  });

  it("should be an instance of Error and CritukError", () => {
    const error = new CritukError("Test message", "TEST:ERROR_CODE", 500);

    // Ensure the error is an instance of both Error and CritukError
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CritukError);
  });
});
