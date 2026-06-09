import type { EachMessagePayload } from "kafkajs";
import type { KafkaConsumerRunner } from "@irctc/kafka";
import type { WelcomeNotificationService } from "@services/welcome-notification.service.js";
import { Topics } from "@constants/topics.constants.js";

/**
 * Business adapter for the `notification.user-logged-in.v1` topic.
 *
 * Mirrors `OtpRequestedConsumer`: the ONLY layer that knows Kafka
 * exists. It owns the Buffer → JSON decode (transport concern) and
 * delegates the typed event to the application service. The service
 * itself sees a plain `unknown` and validates it via Zod.
 *
 * The runner is generic infrastructure (connect / subscribe / run);
 * the consumer is the per-use-case glue. This split keeps each layer
 * independently testable.
 */
export class UserLoggedInConsumer {
  constructor(
    private readonly runner: KafkaConsumerRunner,
    private readonly notificationService: WelcomeNotificationService,
  ) {}

  async start(): Promise<void> {
    await this.runner.run(Topics.USER_LOGGED_IN, (payload) =>
      this.handle(payload),
    );
  }

  private async handle(payload: EachMessagePayload): Promise<void> {
    const { message, heartbeat } = payload;

    if (message.value === null) {
      // Empty tombstone — ignore without consuming retry budget.
      return;
    }

    let event: unknown;
    try {
      event = JSON.parse(message.value.toString("utf8"));
    } catch (err) {
      // Malformed bytes — the runner will re-throw and crash the
      // consumer. A pod restart re-delivers; the DLQ is not used by
      // this runner.
      throw new Error(
        `UserLoggedInV1 JSON parse failed: ${(err as Error).message}`,
      );
    }

    await this.notificationService.process(event);
    await heartbeat();
  }
}
