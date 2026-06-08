import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PORT: z.string().default("4002"),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
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
    SERVICE_NAME: z.string().default("notification-service"),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
    OTEL_DEBUG: z.enum(["true", "false"]).default("false"),
    LOKI_HOST: z.url().optional(),
    PUBLIC_URL: z.string().optional(),
    BASE_URL: z.string().optional(),
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
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
