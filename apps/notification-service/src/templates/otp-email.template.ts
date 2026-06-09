import type { SendEmailCommand } from "@providers/email/email-provider.js";

export interface OtpEmailInput {
  email: string;
  otp: string;
  ttlSeconds: number;
}

/**
 * Renders the OTP email body used by the registration flow.
 *
 * Pure: no logger, no provider, no IO. The result is a complete
 * `SendEmailCommand` ready for any `EmailProvider` to dispatch.
 */
export const renderOtpEmail = (input: OtpEmailInput): SendEmailCommand => {
  const minutes = Math.max(1, Math.floor(input.ttlSeconds / 60));
  return {
    to: input.email,
    content: {
      subject: "Your Registration OTP",
      text: `Your verification code is: ${input.otp}. It will expire in ${minutes} minutes.`,
      html: `<strong>Your verification code is: ${input.otp}.</strong><br>It will expire in ${minutes} minutes.`,
    },
  };
};
