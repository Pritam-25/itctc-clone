import { redis } from "../config/redis.js";
import { logger } from "@irctc/logger";

export type HealthChecks = {
  redis: boolean;
};

const probeRedis = async (): Promise<boolean> => {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    if (redis.status !== "ready") return false;

    const pingPromise = redis.ping();
    const timeoutPromise = new Promise<string>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("Redis ping timed out")),
        5000,
      );
    });

    const pong = await Promise.race([pingPromise, timeoutPromise]);
    return pong === "PONG";
  } catch (err) {
    logger.warn(
      { module: "health", err },
      "Redis readiness probe failed (gateway)",
    );
    return false;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export class HealthService {
  static async runReadinessChecks(): Promise<HealthChecks> {
    const redisOk = await probeRedis();
    return { redis: redisOk };
  }
}
