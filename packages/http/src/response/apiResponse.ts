import { normalizeError, createErrorResponse } from "@irctc/errors";
import { createMeta } from "./baseResponse.js";

type MetaExtra = Record<string, unknown>;

export const successResponse = <T>(
  message: string,
  data: T,
  metaExtra?: MetaExtra,
) => ({
  success: true as const,
  message,
  data,
  meta: createMeta(metaExtra),
});

export const errorResponse = (error: unknown, metaExtra?: MetaExtra) => {
  const normalizedError = normalizeError(error);
  const isInternalError = normalizedError.statusCode >= 500;

  const { error: errorPayload } = createErrorResponse({
    code: normalizedError.errorCode,
    message: normalizedError.message,
    details: normalizedError.details,
  });

  if (isInternalError && errorPayload.details !== undefined) {
    delete errorPayload.details;
  }

  return {
    success: false as const,
    error: errorPayload,
    meta: createMeta(metaExtra),
  };
};
