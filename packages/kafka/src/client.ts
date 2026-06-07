import { Kafka, KafkaConfig } from "kafkajs";
import { logger } from "@irctc/logger";

export const createKafkaClient = (config: Partial<KafkaConfig>) => {
  const finalConfig: KafkaConfig = {
    clientId: config.clientId ?? "irctc-service",
    brokers: config.brokers ?? ["localhost:9092"],
    retry: {
      initialRetryTime: 100,
      retries: 8,
      ...config.retry,
    },
    logLevel: 0,
  };

  const kafka = new Kafka(finalConfig);
  logger.info({ module: "kafka-client" }, "Kafka client initialized");
  return kafka;
};
