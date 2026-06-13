import { ERROR_MESSAGES as SHARED_MESSAGES } from "@irctc/errors";

export const ERROR_MESSAGES = {
  ...SHARED_MESSAGES,
  ACCESS_TOKEN_MISSING: "Access token is missing",
  ACCESS_TOKEN_INVALID: "Access token is invalid or expired",
} as const;
