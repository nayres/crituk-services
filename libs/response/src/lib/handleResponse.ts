import { CritukResponse } from "./CritukResponse";

interface HttpResponse {
  status: (code: number) => this;
  json: (data: any) => void;
}

interface handleResponseInput<T> {
  status: number;
  success: boolean;
  data?: T;
  message?: string;
  metadata?: Record<string, unknown>;
}

export const handleResponse = <T extends Record<string, any>>(
  res: HttpResponse,
  { status, success, data, message, metadata }: handleResponseInput<T>
) => {
  const response = CritukResponse.send({
    status,
    success,
    data,
    message,
    metadata,
  });
  return res.status(status).json(response);
};
