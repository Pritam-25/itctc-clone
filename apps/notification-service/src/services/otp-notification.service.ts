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
 *   2. Reserve the event in the idempotency store. Duplicates return
 *      DUPLICATE without sending.
 *   3. Render the email via the template.
 *   4. Hand the rendered command to the configured EmailProvider.
 *   5. On success, mark the reservation processed (re-arms TTL). On
 *      failure, release the reservation so the consumer runner's
 *      retry can actually re-deliver — otherwise a single transient
 *      provider failure would permanently drop the notification.
 *      Provider failures are re-thrown so the runner can apply its
 *      retry policy.
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

    const reserved = await this.idempotency.reserveIfNew(parsed.eventId);
    if (!reserved) {
      // OTPRequestedV1 has no guaranteed userId (pre-auth flow), so
      // eventId is the only safe identifier to log.
      this.logger.info(
        { eventId: parsed.eventId },
        "Duplicate OTPRequestedV1 skipped",
      );
      return PROCESSING_STATUS.DUPLICATE;
    }

    const command = renderOtpEmail({
      email: parsed.email,
      otp: parsed.otp,
      ttlSeconds: this.otpTtlSeconds,
    });

    try {
      await this.email.send(command);
    } catch (err) {
      // Release the reservation so a redelivery can retry the side
      // effect instead of being short-circuited as a duplicate.
      await this.idempotency.release(parsed.eventId).catch((releaseErr) => {
        this.logger.warn(
          { eventId: parsed.eventId, err: releaseErr },
          "Failed to release OTP idempotency reservation after send failure",
        );
      });
      throw err;
    }

    await this.idempotency.markProcessed(parsed.eventId);

    this.logger.info({ eventId: parsed.eventId }, "OTP email delivered");
    return PROCESSING_STATUS.PROCESSED;
  }

  private tryValidate(event: unknown): OTPRequestedV1Type | null {
    const result = OTPRequestedV1.safeParse(event);
    if (!result.success) {
      // Avoid logging the full event payload — it contains PII
      // (email, otp). The Zod issues list is enough to diagnose
      // the schema mismatch.
      this.logger.warn(
        { issues: result.error.issues },
        "OTPRequestedV1 schema validation failed",
      );
      return null;
    }
    return result.data;
  }
}
