import { ERROR_CODES, type ErrorCode } from "./errorCodes.js";

type PrismaKnownError = { code: string };

export const isPrismaKnownError = (
  error: unknown,
): error is PrismaKnownError => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  return (
    "code" in error && typeof (error as { code?: unknown }).code === "string"
  );
};

export const normalizePrismaError = (error: unknown): ErrorCode | null => {
  if (!isPrismaKnownError(error)) {
    return null;
  }

  switch (error.code) {
    case "P2002":
      return ERROR_CODES.CONFLICT;

    case "P2025":
      return ERROR_CODES.NOT_FOUND;

    case "P2003":
      return ERROR_CODES.INVALID_INPUT;

    default:
      return ERROR_CODES.INTERNAL_ERROR;
  }
};
