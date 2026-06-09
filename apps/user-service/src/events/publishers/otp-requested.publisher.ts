import type { Producer } from "kafkajs";
import type { OTPRequestedV1Type } from "@irctc/contracts";
import { env } from "@config/env.js";
import { logger } from "@irctc/logger";

export const SCHEMA_VERSION = "1" as const;
export const HEADER_EVENT_ID = "x-event-id";
export const HEADER_SCHEMA_VERSION = "x-schema-version";

export class OtpEventPublisher {
  constructor(private readonly producer: Producer) {}

  async publishOtpRequested(input: OTPRequestedV1Type): Promise<void> {
    try {
      await this.producer.send({
        topic: env.KAFKA_OTP_TOPIC,
        messages: [
          {
            // Key on userId when present (per-user ordering for the
            // authenticated path). Fall back to eventId for the
            // pre-auth registration flow where userId is absent.
            // Never key on email: PII on the wire, and ties partition
            // routing to mutable user data.
            key: input.userId ?? input.eventId,
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
          module: "otp-publisher",
          eventId: input.eventId,
        },
        "OTPRequestedV1 published",
      );
    } catch (error) {
      logger.error(
        {
          module: "otp-publisher",
          error,
          eventId: input.eventId,
        },
        "Failed to publish OTPRequestedV1",
      );

      throw error;
    }
  }
}
