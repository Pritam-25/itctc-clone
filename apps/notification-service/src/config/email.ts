import { env } from "@config/env.js";
import { EmailVendor } from "@providers/email/provider.factory.js";

/**
 * Email configuration boundary.
 *
 * Centralises vendor selection so the rest of the service never imports
 * `@config/env.js` to make provider decisions. New vendors (Resend, SES,
 * Mailgun, …) are added by extending the `EmailVendor` enum in
 * `provider.factory.ts` and the env schema in `env.ts`.
 */
export const getEmailVendor = (): EmailVendor => env.EMAIL_VENDOR;
