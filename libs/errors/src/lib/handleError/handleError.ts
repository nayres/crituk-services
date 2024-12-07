import { CritukError } from "../critukError";

export function handleError(message: string, code: string, statusCode: number) {
  return new CritukError(message, code, statusCode);
}
