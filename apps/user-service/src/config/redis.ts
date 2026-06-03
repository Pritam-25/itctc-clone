import { Redis } from "ioredis";
import { env } from "@config/env.js";
import { logger } from "@irctc/logger";

const globalForRedis = globalThis as {
  redis?: Redis;
};

const createRedisClient = (): Redis => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy: (times: number) => {
      // Exponential backoff capped at 2 seconds
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  // Wires comprehensive observability hooks for Grafana Loki/Tempo tracking
  client.on("connect", () => logger.info("Redis connection initiating"));
  client.on("ready", () => logger.info("Redis connected successfully."));
  client.on("close", () => logger.warn("Redis connection closed"));
  client.on("reconnecting", (delay: number) =>
    logger.info(`Reconnecting to Redis in ${delay}ms`),
  );
  client.on("end", () => logger.warn("Redis connection ended permanently"));
  client.on("warning", (warning: Error) =>
    logger.warn({ module: "redis", err: warning }, "Redis runtime warning"),
  );
  client.on("error", (error: Error) =>
    logger.error({ module: "redis", err: error }, "Redis execution error"),
  );

  return client;
};

// Singleton export
export const redis = globalForRedis.redis ?? createRedisClient();

/**
 * Ensures Redis is connected and ready to process commands.
 * This is critical for production bootstrap to avoid race conditions.
 */
export const initRedis = async (): Promise<void> => {
  if (redis.status === "ready") return;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Redis connection timed out during bootstrap"));
    }, 5000);

    redis.once("ready", () => {
      clearTimeout(timeout);
      logger.info("Redis connection established and ready.");
      resolve();
    });

    redis.once("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

// Cache instance on global scope during local development hot-reloads
if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// Graceful termination handler for Kubernetes/Docker lifecycle
export const disconnectRedis = async (): Promise<void> => {
  if (redis.status !== "end") {
    logger.info("Gracefully closing Redis connection channels");
    await redis.quit();
  }
};
