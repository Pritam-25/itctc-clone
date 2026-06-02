import type { ErrorCode } from "./errorCodes.js";

export type ErrorContract = {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
};
