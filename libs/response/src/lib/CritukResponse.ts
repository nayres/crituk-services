export class CritukResponse {
  public status: number;
  public message?: string;
  public metadata?: Record<string, unknown>;
  [key: string]: unknown;

  constructor({
    status,
    message,
    metadata,
  }: {
    status: number;
    message?: string;
    metadata?: Record<string, unknown>;
  }) {
    this.status = status;
    if (message) this.message = message;
    if (metadata) this.metadata = metadata;
  }

  static send<T extends Record<string, any> = object>({
    status,
    success,
    data,
    message,
    metadata,
  }: {
    status: number;
    success: boolean;
    data?: T;
    message?: string;
    metadata?: Record<string, unknown>;
  }): Record<string, unknown> {
    return {
      success,
      status,
      ...(data ? data : {}),
      message,
      metadata,
    };
  }
}
