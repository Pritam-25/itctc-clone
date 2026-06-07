import type { ApiError } from "./apiError.js";
import { ERROR_MESSAGES } from "./errorMessages.js";
import { getMessageFromRegistry } from "./registry.js";
import type { ErrorContract } from "./errorContract.js";
import type { ErrorCode } from "./errorCodes.js";

type ErrorInput = {
  code: string;
  message?: string;
  details?: unknown;
};

export const createErrorResponse = (
  input: ApiError | ErrorInput,
): ErrorContract => {
  const code = input.code;
  const message =
    "message" in input && input.message && input.message !== input.code
      ? input.message
      : (getMessageFromRegistry(code) ??
        ERROR_MESSAGES[code as ErrorCode] ??
        code);
  const details = "details" in input ? input.details : undefined;

  return {
    error: {
      code,
      message,
      details,
    },
  };
};
