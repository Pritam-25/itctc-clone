import { env } from "@config/env.js";

/**
 * Kafka topic names owned by the notification service. The runtime
 * value comes from env (so dev/staging/prod can override); the keys
 * are the single source of truth for code references.
 *
 * Consumer code should `import { Topics } from "@constants/topics.constants.js"`
 * instead of touching env directly.
 */
export const Topics = {
  OTP_REQUESTED: env.KAFKA_OTP_TOPIC,
  USER_LOGGED_IN: env.KAFKA_USER_LOGIN_TOPIC,
} as const;
