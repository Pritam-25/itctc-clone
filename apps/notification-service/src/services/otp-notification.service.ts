import { OTPRequestedV1, type OTPRequestedV1Type } from "@irctc/contracts";
import type { Logger } from "pino";
import type { EmailProvider } from "@providers/email/email-provider.js";
import { renderOtpEmail } from "@templates/otp-email.template.js";
import { IdempotencyRepository } from "@repositories/idempotency.repository.js";
import {
  PROCESSING_STATUS,
  type ProcessingStatus,
} from "@constants/notification.constants.js";

/**
 * Application service for the OTP-requested use case.
 *
 * Receives a decoded JSON event (not a Buffer) from the transport
 * adapter. The transport boundary — `OtpRequestedConsumer` — is the
 * only layer that knows Kafka exists; this service is unaware.
 *
 * Orchestrates a single workflow:
 *   1. Validate the unknown payload against the Zod schema in
 *      @irctc/contracts. Schema failures return INVALID.
 *   2. Claim the event in the idempotency store. Duplicates return
 *      DUPLICATE without sending.
 *   3. Render the email via the template.
 *   4. Hand the rendered command to the configured EmailProvider.
 *      Provider failures are re-thrown so the consumer runner can
 *      apply its retry policy. The claim stays in Redis; a
 *      redelivery is short-circuited at step 2 (intentional: a
 *      side-effect that may have partially happened should not be
 *      repeated — a human will replay from outside).
 */
export class OtpNotificationService {
  constructor(
    private readonly idempotency: IdempotencyRepository,
    private readonly email: EmailProvider,
    private readonly otpTtlSeconds: number,
    private readonly logger: Logger,
  ) {}

  async process(event: unknown): Promise<ProcessingStatus> {
    const parsed = this.tryValidate(event);
    if (!parsed) return PROCESSING_STATUS.INVALID;

    const isNew = await this.idempotency.markIfNew(parsed.eventId);
    if (!isNew) {
      this.logger.info(
        { eventId: parsed.eventId, email: parsed.email },
        "Duplicate OTPRequestedV1 skipped",
      );
      return PROCESSING_STATUS.DUPLICATE;
    }

    const command = renderOtpEmail({
      email: parsed.email,
      otp: parsed.otp,
      ttlSeconds: this.otpTtlSeconds,
    });

    await this.email.send(command);

    this.logger.info(
      { eventId: parsed.eventId, email: parsed.email },
      "OTP email delivered",
    );
    return PROCESSING_STATUS.PROCESSED;
  }

  private tryValidate(event: unknown): OTPRequestedV1Type | null {
    const result = OTPRequestedV1.safeParse(event);
    if (!result.success) {
      this.logger.warn(
        { issues: result.error.issues, event },
        "OTPRequestedV1 schema validation failed",
      );
      return null;
    }
    return result.data;
  }
}
