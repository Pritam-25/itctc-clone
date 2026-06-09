import type { Consumer, EachMessagePayload } from "kafkajs";

/**
 * Minimal logger surface — the @irctc/logger returns a Pino logger, but
 * the kafka package shouldn't depend on pino directly. Any object that
 * exposes the standard levels works.
 */
export interface LoggerLike {
  info: (obj: Record<string, unknown>, msg: string) => void;
  warn: (obj: Record<string, unknown>, msg: string) => void;
  error: (obj: Record<string, unknown>, msg: string) => void;
}

/**
 * Type-safe message handler. Receives the raw kafkajs payload; the
 * business adapter is responsible for decoding it to a typed event.
 */
export type MessageHandler = (payload: EachMessagePayload) => Promise<void>;

/**
 * Generic Kafka consumer runner.
 *
 * Wraps the boilerplate around a `Consumer` instance:
 *   - connect
 *   - subscribe to a topic (fromBeginning=false — never replay)
 *   - run the message loop
 *
 * No DLQ. Transient failures are handled by the consumer's own `retry`
 * config (passed to the constructor in `client/consumer.ts`). Anything
 * the handler throws after kafkajs's retry budget is exhausted will
 * crash the consumer; a pod restart re-delivers the message. This is
 * intentional: the runner is generic infrastructure, not a per-service
 * DLQ policy.
 */
export class KafkaConsumerRunner {
  constructor(
    private readonly consumer: Consumer,
    private readonly logger: LoggerLike,
  ) {}

  async run(topic: string, handler: MessageHandler): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic,
      fromBeginning: false,
    });

    this.logger.info(
      { module: "kafka-consumer-runner", topic },
      "Consumer subscribed",
    );

    await this.consumer.run({
      eachMessage: async (payload) => {
        await handler(payload);
      },
    });
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }
}
