import { Kafka, KafkaConfig, logLevel } from "kafkajs";
import { logger } from "@irctc/logger";

export const createKafkaClient = (config: Partial<KafkaConfig> = {}) => {
  // Start from the caller's config so caller-supplied options (ssl, sasl,
  // connectionTimeout, requestTimeout, logCreator, etc.) are preserved, then
  // layer our defaults on top.
  const finalConfig: KafkaConfig = {
    ...config,
    clientId: config.clientId ?? "irctc-service",
    brokers: config.brokers ?? ["localhost:9092"],
    retry: {
      initialRetryTime: 100,
      retries: 8,
      ...config.retry,
    },
    logLevel: config.logLevel ?? logLevel.NOTHING,
  };

  const kafka = new Kafka(finalConfig);
  logger.info({ module: "kafka-client" }, "Kafka client initialized");
  return kafka;
};
