import { Kafka, Consumer } from "kafkajs";
import { logger } from "@irctc/logger";

export const createConsumer = (kafka: Kafka, groupId: string): Consumer => {
  logger.info(
    { module: "kafka-consumer" },
    `Creating consumer for group: ${groupId}`,
  );
  return kafka.consumer({ groupId });
};
