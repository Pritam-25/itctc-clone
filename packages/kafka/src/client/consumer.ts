import { Kafka, Consumer, ConsumerConfig } from "kafkajs";
import { logger } from "@irctc/logger";

export const createConsumer = (
  kafka: Kafka,
  groupId: string,
  retry?: ConsumerConfig["retry"],
): Consumer => {
  logger.info(
    { module: "kafka-consumer" },
    `Creating consumer for group: ${groupId}`,
  );
  return kafka.consumer(retry ? { groupId, retry } : { groupId });
};
