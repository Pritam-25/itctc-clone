import type { IncomingHttpHeaders } from "node:http";
import type {
  ServiceIdentityVerifier,
  ServiceIdentityResult,
  LoggerLike,
} from "./types.js";

export class AllowAllServiceIdentityVerifier implements ServiceIdentityVerifier {
  constructor(private readonly logger?: LoggerLike) {}

  async verify(headers: IncomingHttpHeaders): Promise<ServiceIdentityResult> {
    this.logger?.info(
      { headers },
      "AllowAllServiceIdentityVerifier: verifying request (permissive allow-all)",
    );
    return { ok: true, serviceId: "unknown" };
  }
}
