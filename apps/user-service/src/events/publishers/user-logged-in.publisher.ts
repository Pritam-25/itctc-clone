import type { Producer } from "kafkajs";
import type { UserLoggedInV1Type } from "@irctc/contracts";
import { env } from "@config/env.js";
import { logger } from "@irctc/logger";

export const SCHEMA_VERSION = "1" as const;
export const HEADER_EVENT_ID = "x-event-id";
export const HEADER_SCHEMA_VERSION = "x-schema-version";

/**
 * Publishes the `notification.user-logged-in.v1` event after a
 * successful login. The login HTTP path awaits this — but failures
 * are best-effort and the caller swallows them (see AuthService.login).
 *
 * The OTP publisher owns the same header keys; we keep both classes
 * in sync by sharing the `HEADER_*` constants. If the headers ever
 * change in one place, update both — and the @irctc/kafka package
 * mirror in the notification service.
 */
export class UserLoggedInEventPublisher {
  constructor(private readonly producer: Producer) {}

  async publishUserLoggedIn(input: UserLoggedInV1Type): Promise<void> {
    try {
      await this.producer.send({
        topic: env.KAFKA_USER_LOGIN_TOPIC,
        messages: [
          {
            // Key on userId (stable, non-PII) for per-user ordering
            // and partition affinity. Email would expose PII on the
            // wire and tie partition routing to mutable user data.
            key: input.userId,
            value: JSON.stringify(input),
            headers: {
              [HEADER_EVENT_ID]: input.eventId,
              [HEADER_SCHEMA_VERSION]: SCHEMA_VERSION,
            },
          },
        ],
      });

      logger.info(
        {
          module: "user-logged-in-publisher",
          eventId: input.eventId,
          userId: input.userId,
        },
        "UserLoggedInV1 published",
      );
    } catch (error) {
      logger.error(
        {
          module: "user-logged-in-publisher",
          error,
          eventId: input.eventId,
          userId: input.userId,
        },
        "Failed to publish UserLoggedInV1",
      );

      throw error;
    }
  }
}
