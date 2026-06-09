import type { Logger } from "pino";
import type { EmailProvider } from "./email-provider.js";
import { SendGridProvider } from "./sendgrid.provider.js";

/**
 * Vendor enum — the only place vendor names live in service code.
 * Add a new branch when a new provider is implemented.
 */
export const EmailVendor = {
  SENDGRID: "SENDGRID",
} as const;

export type EmailVendor = (typeof EmailVendor)[keyof typeof EmailVendor];

export interface EmailProviderFactoryDeps {
  sendgridApiKey: string;
  sendgridSender: string;
  logger: Logger;
}

export class EmailProviderFactory {
  static create(
    vendor: EmailVendor,
    deps: EmailProviderFactoryDeps,
  ): EmailProvider {
    switch (vendor) {
      case EmailVendor.SENDGRID:
        return new SendGridProvider({
          apiKey: deps.sendgridApiKey,
          sender: deps.sendgridSender,
          logger: deps.logger,
        });
      default: {
        // Exhaustiveness check: TS narrows the type, runtime guards the
        // case where a new vendor is added to the env schema but not here.
        const exhaustive: never = vendor;
        throw new Error(`Unsupported email vendor: ${String(exhaustive)}`);
      }
    }
  }
}
