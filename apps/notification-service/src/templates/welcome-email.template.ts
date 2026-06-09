import type { SendEmailCommand } from "@providers/email/email-provider.js";

export interface WelcomeEmailInput {
  email: string;
  firstName: string;
  loggedInAt: Date;
}

/**
 * Renders the "Welcome back" email body sent after a successful login.
 *
 * Pure: no logger, no provider, no IO. The result is a complete
 * `SendEmailCommand` ready for any `EmailProvider` to dispatch.
 *
 * The timestamp is rendered in UTC to keep the body deterministic
 * across consumer timezones; the recipient's locale is not known to
 * the service.
 */
export const renderWelcomeEmail = (
  input: WelcomeEmailInput,
): SendEmailCommand => {
  const timestamp = input.loggedInAt.toISOString();
  return {
    to: input.email,
    content: {
      subject: `Welcome back, ${input.firstName}`,
      text:
        `Hi ${input.firstName},\n\n` +
        `You have successfully signed in to your IRCTC account at ${timestamp} UTC. ` +
        `If this was not you, please reset your password immediately.\n\n` +
        `Safe travels,\nThe IRCTC Team`,
      html:
        `<p>Hi ${input.firstName},</p>` +
        `<p>You have successfully signed in to your IRCTC account at <strong>${timestamp} UTC</strong>.</p>` +
        `<p>If this was not you, please reset your password immediately.</p>` +
        `<p>Safe travels,<br/>The IRCTC Team</p>`,
    },
  };
};
