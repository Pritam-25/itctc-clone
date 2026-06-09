import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { EmailVendor } from "@providers/email/provider.factory.js";

export const env = createEnv({
  server: {
    PORT: z.string().default("4002"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    REDIS_URL: z.url().refine(
      (value) => {
        const protocol = new URL(value).protocol;
        return protocol === "redis:" || protocol === "rediss:";
      },
      { message: "REDIS_URL must use redis:// or rediss://" },
    ),
    SERVICE_NAME: z.string().default("notification-service"),
    CORS_ORIGINS: z
      .string()
      .default("http://localhost:3000")
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0),
      )
      .refine((origins) => origins.length > 0, {
        message: "CORS_ORIGINS must include at least one origin",
      }),

    KAFKA_BROKERS: z
      .string()
      .default("localhost:9092")
      .transform((value) =>
        value
          .split(",")
          .map((broker) => broker.trim())
          .filter((broker) => broker.length > 0),
      )
      .refine((brokers) => brokers.length > 0, {
        message: "KAFKA_BROKERS must include at least one broker",
      }),
    KAFKA_CLIENT_ID: z.string().default("notification-service"),
    KAFKA_CONSUMER_GROUP_ID: z.string().default("notification-service.otp"),
    KAFKA_OTP_TOPIC: z.string().default("notification.otp-requested.v1"),
    KAFKA_OTP_DLQ_TOPIC: z
      .string()
      .default("notification.otp-requested.v1.dlq"),
    KAFKA_USER_LOGIN_TOPIC: z
      .string()
      .default("notification.user-logged-in.v1"),
    KAFKA_LOGIN_CONSUMER_GROUP_ID: z
      .string()
      .default("notification-service.user-logged-in"),
    KAFKA_RETRY_MAX_RETRIES: z.coerce.number().int().nonnegative().default(5),
    KAFKA_RETRY_INITIAL_MS: z.coerce.number().int().positive().default(300),
    KAFKA_RETRY_MAX_MS: z.coerce.number().int().positive().default(30_000),

    EMAIL_VENDOR: z.enum([EmailVendor.SENDGRID]).default(EmailVendor.SENDGRID),
    SENDGRID_API_KEY: z.string().min(1),
    SENDGRID_SENDER: z.email(),
    OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),

    IDEMPOTENCY_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(7 * 24 * 60 * 60), // 7 days
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
