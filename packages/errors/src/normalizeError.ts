import { ApiError } from "./apiError.js";
import { ERROR_CODES, type ErrorCode } from "./errorCodes.js";
import { ERROR_MESSAGES } from "./errorMessages.js";
import { normalizePrismaError } from "./normalizePrismaError.js";

type NormalizedError = {
  statusCode: number;
  errorCode: ErrorCode;
  message: string;
  details?: unknown;
};

const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.BAD_REQUEST]: 400,
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.INVALID_INPUT]: 400,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  [ERROR_CODES.KAFKA_ERROR]: 503,
  [ERROR_CODES.PAYMENT_FAILED]: 422,
  [ERROR_CODES.BOOKING_FAILED]: 422,
};

const normalizeFromCode = (
  code: ErrorCode,
  message?: string,
  details?: unknown,
): NormalizedError => {
  const statusCode = ERROR_STATUS_MAP[code] ?? 500;
  const fallbackMessage =
    ERROR_MESSAGES[code] ?? ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR];

  return {
    statusCode,
    errorCode: code,
    message: message && message.length > 0 ? message : fallbackMessage,
    details,
  };
};

export const normalizeError = (error: unknown): NormalizedError => {
  if (error instanceof ApiError) {
    return normalizeFromCode(error.code, error.message, error.details);
  }

  const prismaCode = normalizePrismaError(error);
  if (prismaCode) {
    return normalizeFromCode(prismaCode);
  }

  return normalizeFromCode(ERROR_CODES.INTERNAL_ERROR);
};
