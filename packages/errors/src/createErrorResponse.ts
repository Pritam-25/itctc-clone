import type { ApiError } from "./apiError.js";
import { ERROR_MESSAGES } from "./errorMessages.js";
import type { ErrorContract } from "./errorContract.js";
import type { ErrorCode } from "./errorCodes.js";

type ErrorInput = {
  code: ErrorCode;
  message?: string;
  details?: unknown;
};

export const createErrorResponse = (
  input: ApiError | ErrorInput,
): ErrorContract => {
  const code = input.code;
  const message =
    "message" in input && input.message ? input.message : ERROR_MESSAGES[code];
  const details = "details" in input ? input.details : undefined;

  return {
    error: {
      code,
      message,
      details,
    },
  };
};
