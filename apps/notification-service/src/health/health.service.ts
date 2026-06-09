import { redis } from "@config/redis.js";
import { isKafkaProducerReady } from "@config/kafka.js";
import { logger } from "@irctc/logger";

export type HealthChecks = {
  redis: boolean;
  kafka: boolean;
};

const probeRedis = async (): Promise<boolean> => {
  try {
    if (redis.status !== "ready") return false;
    const pong = await redis.ping();
    return pong === "PONG";
  } catch (err) {
    logger.warn(
      { module: "health", err },
      "Redis readiness probe failed (notification)",
    );
    return false;
  }
};

const probeKafka = (): boolean => {
  // The notification service has at least one consumer running; the
  // producer is used for DLQ writes. The shared producer manager gives
  // us a "producer is connected" signal. A more thorough check would
  // also inspect the consumer's running state, but the existing
  // HealthService in user-service is the reference pattern.
  try {
    return isKafkaProducerReady();
  } catch (err) {
    logger.warn({ module: "health", err }, "Kafka readiness probe failed");
    return false;
  }
};

export class HealthService {
  static async runReadinessChecks(): Promise<HealthChecks> {
    const [redisOk, kafka] = await Promise.all([probeRedis(), probeKafka()]);
    return { redis: redisOk, kafka };
  }
}
