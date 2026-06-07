import { Kafka, Producer } from "kafkajs";
import { logger } from "@irctc/logger";

export class KafkaProducerManager {
  private static instance: Producer | null = null;

  static async getProducer(kafka: Kafka): Promise<Producer> {
    if (this.instance) return this.instance;

    logger.info({ module: "kafka-producer" }, "Initializing Kafka producer...");

    this.instance = kafka.producer({
      allowAutoTopicCreation: false,
      idempotent: true,
      maxInFlightRequests: 5,
    });

    await this.instance.connect();
    logger.info(
      { module: "kafka-producer" },
      "Kafka producer connected successfully",
    );
    return this.instance;
  }

  static isConnected(): boolean {
    return this.instance !== null;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      logger.info(
        { module: "kafka-producer" },
        "Disconnecting Kafka producer...",
      );
      await this.instance.disconnect();
      this.instance = null;
      logger.info({ module: "kafka-producer" }, "Kafka producer disconnected");
    }
  }
}
