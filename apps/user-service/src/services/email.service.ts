import sgMail from "@sendgrid/mail";
import { env } from "@config/env.js";
import { logger } from "@irctc/logger";

export class EmailService {
  constructor() {
    sgMail.setApiKey(env.SENDGRID_API_KEY);
  }

  /**
   * Sends a 6-digit OTP to the specified email address.
   * @param email - Recipient email address.
   * @param otp - The 6-digit OTP.
   */
  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const msg = {
      to: email,
      from: env.SENDGRID_SENDER,
      subject: "Your Registration OTP",
      text: `Your verification code is: ${otp}. It will expire in ${env.OTP_TTL / 60} minutes.`,
      html: `<strong>Your verification code is: ${otp}.</strong><br>It will expire in ${env.OTP_TTL / 60} minutes.`,
    };

    try {
      await sgMail.send(msg);
      logger.info({ module: "email", email }, "OTP email sent successfully");
    } catch (error) {
      logger.error(
        { module: "email", error, email },
        "Failed to send OTP email",
      );
      throw error;
    }
  }
}

export const emailService = new EmailService();
