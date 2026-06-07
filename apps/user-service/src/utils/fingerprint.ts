import type { Request } from "express";
import crypto from "crypto";

/**
 * Generates a unique fingerprint for the current device/browser session.
 * Based on User-Agent, IP address, and Accept headers.
 */
export function getDeviceFingerprint(req: Request): string {
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.ip || "";
  const accept = req.headers["accept"] || "";

  const raw = `${userAgent}|${ip}|${accept}`;

  return crypto.createHash("sha256").update(raw).digest("hex");
}
