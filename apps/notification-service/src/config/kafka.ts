import {
  createKafkaClient,
  KafkaProducerManager,
  createConsumer,
} from "@irctc/kafka";
import { env } from "@config/env.js";
import { logger } from "@irctc/logger";

const kafka = createKafkaClient({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: env.KAFKA_BROKERS,
});

export { kafka };

export const getProducer = async () => {
  return await KafkaProducerManager.getProducer(kafka);
};

export const isKafkaProducerReady = () => {
  return KafkaProducerManager.isConnected();
};

export const disconnectKafka = async () => {
  await KafkaProducerManager.disconnect();
};

/**
 * Eagerly connect the producer at boot so the producer manager
 * returns a connected instance for any future DLQ writes.
 */
export const initKafka = async (): Promise<void> => {
  await getProducer();
};

export const getConsumer = (groupId: string) => {
  return createConsumer(kafka, groupId);
};
