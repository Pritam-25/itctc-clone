/**
 * Provider-agnostic email interface. The notification-service depends on
 * this abstraction, not on a concrete SDK, so we can swap SendGrid for
 * Resend / SES / Postmark without touching the consumer or service layer.
 *
 * Providers must reject (throw) on terminal failures so the consumer
 * runner's retry logic can take over.
 */

/** Rendered email body produced by a template. */
export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/** Vendor-agnostic command sent to an EmailProvider. */
export interface SendEmailCommand {
  to: string;
  content: EmailContent;
}

export interface EmailProvider {
  send(command: SendEmailCommand): Promise<void>;
}
