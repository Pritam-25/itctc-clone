/**
 * Redis key prefixes used by the idempotency repository. Centralised so
 * ops can grep for every key a service touches.
 */
export const IDEMPOTENCY_KEYS = {
  OTP_REQUESTED: "notification:processed:otp-requested",
} as const;
