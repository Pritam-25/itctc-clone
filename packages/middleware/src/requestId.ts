import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { runWithRequestContext } from "@irctc/http";
import { logger } from "@irctc/logger";

const MAX_REQUEST_ID_LENGTH = 64;
const SAFE_REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidRequestId = (value: string): boolean => {
  if (!value || value.length > MAX_REQUEST_ID_LENGTH) {
    return false;
  }
  return SAFE_REQUEST_ID_PATTERN.test(value) || UUID_V4_PATTERN.test(value);
};

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const incoming = req.headers["x-request-id"];
  const normalizedIncoming = Array.isArray(incoming)
    ? (incoming[0] ?? "")
    : incoming !== undefined
      ? String(incoming)
      : "";
  const trimmedIncoming = normalizedIncoming.trim();
  const requestId = isValidRequestId(trimmedIncoming)
    ? trimmedIncoming
    : randomUUID();

  runWithRequestContext({ requestId }, () => {
    (req as any).requestId = requestId;
    (req as any).logger = logger.child({ requestId });
    res.setHeader("X-Request-Id", requestId);
    // Write back to incoming headers so proxy and other middleware
    // can read req.headers["x-request-id"] consistently.
    req.headers["x-request-id"] = requestId;
    next();
  });
};
