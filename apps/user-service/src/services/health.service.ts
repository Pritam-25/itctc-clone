import { prisma } from "@config/prisma.js";
import { redis } from "@config/redis.js";
import { kafka } from "@config/kafka.js";
import { logger } from "@irctc/logger";

export type HealthChecks = {
  database: boolean;
  redis: boolean;
  kafka: boolean;
};

const probeDatabase = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    logger.warn({ module: "health", err }, "Database readiness probe failed");
    return false;
  }
};

const probeRedis = async (): Promise<boolean> => {
  try {
    if (redis.status !== "ready") return false;
    const pong = await redis.ping();
    return pong === "PONG";
  } catch (err) {
    logger.warn({ module: "health", err }, "Redis readiness probe failed");
    return false;
  }
};

/**
 * Real Kafka broker readiness check.
 *
 * We rely on the cluster's own health by listing topics, which round-trips
 * to a broker. This is a strong signal that the producer's connection is
 * still alive — far stronger than `instance !== null`, which can be true
 * even when `connect()` failed or the broker has since become unreachable.
 */
const KAFKA_PROBE_TIMEOUT_MS = 5000;

const probeKafka = async (): Promise<boolean> => {
  const probe = async (): Promise<boolean> => {
    try {
      const admin = kafka.admin();
      try {
        await admin.connect();
        await admin.listTopics();
        return true;
      } finally {
        await admin.disconnect().catch(() => {
          // Disconnect failures are non-fatal for a readiness probe.
        });
      }
    } catch (err) {
      logger.warn({ module: "health", err }, "Kafka readiness probe failed");
      return false;
    }
  };

  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timeoutHandle = setTimeout(() => {
      logger.warn({ module: "health" }, "Kafka readiness probe timed out");
      resolve(false);
    }, KAFKA_PROBE_TIMEOUT_MS);
  });

  try {
    return await Promise.race([probe(), timeout]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
};

export class HealthService {
  static async runReadinessChecks(): Promise<HealthChecks> {
    const [database, redisOk, kafka] = await Promise.all([
      probeDatabase(),
      probeRedis(),
      probeKafka(),
    ]);

    return { database, redis: redisOk, kafka };
  }
}
