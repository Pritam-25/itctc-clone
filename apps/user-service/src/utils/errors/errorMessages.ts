import { ERROR_CODES, type ErrorCode } from "./errorCodes.js";

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.USER_ALREADY_EXISTS]: "User already exists.",
  [ERROR_CODES.INVALID_CREDENTIALS]: "Invalid credentials.",
  [ERROR_CODES.EMAIL_NOT_VERIFIED]: "Email not verified.",
  [ERROR_CODES.REFRESH_TOKEN_INVALID]: "Refresh token is invalid.",
  [ERROR_CODES.OTP_INVALID]: "The provided OTP is incorrect.",
  [ERROR_CODES.OTP_EXPIRED]: "The OTP has expired. Please request a new one.",
  [ERROR_CODES.REGISTRATION_SESSION_EXPIRED]:
    "Your registration session has expired. Please start over.",
};
