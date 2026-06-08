import sgMail from "@sendgrid/mail";
import type { Logger } from "pino";
import type { EmailProvider, SendEmailCommand } from "./email-provider.js";

/**
 * SendGrid implementation of the email provider.
 *
 * Behaviour mirrors the previous user-service EmailService.sendOtpEmail
 * so users see the same email format they had under the synchronous flow.
 * Errors are logged and re-thrown; the consumer runner's retry config
 * will back off on transient failures and route to the DLQ on exhaustion.
 *
 * This provider is transport-only — it never builds content. Callers
 * must hand it a fully-rendered `SendEmailCommand` produced by a
 * template in `templates/`.
 */
export class SendGridProvider implements EmailProvider {
  private readonly apiKey: string;
  private readonly sender: string;
  private readonly logger: Logger;

  constructor(deps: { apiKey: string; sender: string; logger: Logger }) {
    this.apiKey = deps.apiKey;
    this.sender = deps.sender;
    this.logger = deps.logger;
    sgMail.setApiKey(this.apiKey);
  }

  async send(command: SendEmailCommand): Promise<void> {
    const { to, content } = command;
    const msg = {
      to,
      from: this.sender,
      subject: content.subject,
      text: content.text,
      html: content.html,
    };

    try {
      await sgMail.send(msg);
      this.logger.info(
        { module: "email-sendgrid", to },
        "Email sent via SendGrid",
      );
    } catch (err) {
      this.logger.error(
        { module: "email-sendgrid", err, to },
        "Failed to send email via SendGrid",
      );
      throw err;
    }
  }
}
