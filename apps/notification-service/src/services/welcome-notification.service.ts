import { UserLoggedInV1, type UserLoggedInV1Type } from "@irctc/contracts";
import type { Logger } from "pino";
import type { EmailProvider } from "@providers/email/email-provider.js";
import { renderWelcomeEmail } from "@templates/welcome-email.template.js";
import { IdempotencyRepository } from "@repositories/idempotency.repository.js";
import {
  PROCESSING_STATUS,
  type ProcessingStatus,
} from "@constants/notification.constants.js";

/**
 * Application service for the user-logged-in use case.
 *
 * Receives a decoded JSON event (not a Buffer) from the transport
 * adapter. The transport boundary — `UserLoggedInConsumer` — is the
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
export class WelcomeNotificationService {
  constructor(
    private readonly idempotency: IdempotencyRepository,
    private readonly email: EmailProvider,
    private readonly logger: Logger,
  ) {}

  async process(event: unknown): Promise<ProcessingStatus> {
    const parsed = this.tryValidate(event);
    if (!parsed) return PROCESSING_STATUS.INVALID;

    const isNew = await this.idempotency.markIfNew(parsed.eventId);
    if (!isNew) {
      this.logger.info(
        { eventId: parsed.eventId, email: parsed.email },
        "Duplicate UserLoggedInV1 skipped",
      );
      return PROCESSING_STATUS.DUPLICATE;
    }

    const command = renderWelcomeEmail({
      email: parsed.email,
      firstName: parsed.firstName,
      loggedInAt: parsed.loggedInAt,
    });

    await this.email.send(command);

    this.logger.info(
      { eventId: parsed.eventId, email: parsed.email },
      "Welcome email delivered",
    );
    return PROCESSING_STATUS.PROCESSED;
  }

  private tryValidate(event: unknown): UserLoggedInV1Type | null {
    const result = UserLoggedInV1.safeParse(event);
    if (!result.success) {
      this.logger.warn(
        { issues: result.error.issues, event },
        "UserLoggedInV1 schema validation failed",
      );
      return null;
    }
    return result.data;
  }
}
