import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PORT: z.string().default("4000"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    REDIS_URL: z.url().refine(
      (value) => {
        const protocol = new URL(value).protocol;
        return protocol === "redis:" || protocol === "rediss:";
      },
      {
        message: "REDIS_URL must use redis:// or rediss://",
      },
    ),
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
    USER_UPSTREAM: z.url(),
    NOTIFICATION_UPSTREAM: z.url(),
    BOOKING_UPSTREAM: z.url().optional(),
    PAYMENT_UPSTREAM: z.url().optional(),
    SEARCH_UPSTREAM: z.url().optional(),
    JWT_SECRET: z.string().min(1),
    RATE_LIMIT_DEFAULT_CAPACITY: z.coerce
      .number()
      .int()
      .positive()
      .default(100),
    RATE_LIMIT_DEFAULT_REFILL_PER_SEC: z.coerce
      .number()
      .positive()
      .default(1.6667), // 100/60s
    RATE_LIMIT_AUTH_CAPACITY: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_AUTH_REFILL_PER_SEC: z.coerce
      .number()
      .positive()
      .default(0.1667), // 10/60s
    OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
    OTEL_SERVICE_NAME: z.string().default("api-gateway"),
    SERVICE_NAME: z.string().default("api-gateway"),
    TRUST_PROXY: z.enum(["true", "false"]).default("false"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
