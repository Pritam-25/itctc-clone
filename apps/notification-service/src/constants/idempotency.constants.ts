/**
 * Redis key prefixes used by the idempotency repository. Centralised so
 * ops can grep for every key a service touches.
 */
export const IDEMPOTENCY_KEYS = {
  OTP_REQUESTED: "notification:processed:otp-requested",
  USER_LOGGED_IN: "notification:processed:user-logged-in",
} as const;

/** Values stored at each idempotency key — distinguishes in-flight work from completed dedupe. */
export const IDEMPOTENCY_STATE = {
  PROCESSING: "PROCESSING",
  PROCESSED: "PROCESSED",
} as const;

export type IdempotencyState =
  (typeof IDEMPOTENCY_STATE)[keyof typeof IDEMPOTENCY_STATE];
