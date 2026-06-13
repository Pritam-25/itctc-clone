import { Redis } from "ioredis";
import { env } from "./env.js";
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

  client.on("connect", () =>
    logger.info({ module: "redis" }, "Redis connection initiating..."),
  );
  client.on("ready", () =>
    logger.info({ module: "redis" }, "Redis connected successfully."),
  );
  client.on("close", () =>
    logger.warn({ module: "redis" }, "Redis connection closed"),
  );
  client.on("reconnecting", (delay: number) =>
    logger.info({ module: "redis" }, `Reconnecting to Redis in ${delay}ms`),
  );
  client.on("end", () =>
    logger.warn({ module: "redis" }, "Redis connection ended permanently"),
  );
  client.on("warning", (warning: Error) =>
    logger.warn({ module: "redis", err: warning }, "Redis runtime warning"),
  );
  client.on("error", (error: Error) =>
    logger.error(
      { module: "redis", err: error },
      "Redis execution error during client initialization.",
    ),
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

  return new Promise<void>((resolve, reject) => {
    const onReady = () => {
      clearTimeout(timeout);
      redis.off("error", onError);
      resolve();
    };

    const onError = (err: Error) => {
      clearTimeout(timeout);
      redis.off("ready", onReady);
      reject(err);
    };

    const timeout = setTimeout(() => {
      redis.off("ready", onReady);
      redis.off("error", onError);
      reject(new Error("Redis connection timed out during bootstrap"));
    }, 5000);

    redis.once("ready", onReady);
    redis.once("error", onError);
  });
};

// Cache instance on global scope during local development hot-reloads
if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// Graceful termination handler for Kubernetes/Docker lifecycle
export const disconnectRedis = async (): Promise<void> => {
  if (redis.status !== "end") {
    logger.info(
      { module: "redis" },
      "Gracefully closing Redis connection channels",
    );
    await redis.quit();
  }
};
