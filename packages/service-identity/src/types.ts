import type { IncomingHttpHeaders } from "node:http";

export type ServiceIdentityResult =
  | { ok: true; serviceId: string }
  | { ok: false; reason: string };

export interface ServiceIdentityVerifier {
  verify(headers: IncomingHttpHeaders): Promise<ServiceIdentityResult>;
}

export interface LoggerLike {
  info(obj: Record<string, unknown>, msg: string): void;
  warn(obj: Record<string, unknown>, msg: string): void;
  error(obj: Record<string, unknown>, msg: string): void;
}
