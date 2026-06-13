import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import { ERROR_CODES } from "@irctc/errors";
import {
  HEADER_USER_ID,
  HEADER_USER_EMAIL,
  HEADER_SESSION_ID,
} from "@irctc/auth-headers";
import { COOKIE_NAMES } from "./cookieNames.js";
import { verifyAccessToken } from "./jwtVerifier.js";

export const gatewayAuthMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1. Scrub any inbound X-User-* headers to defend against forgery
  for (const key of Object.keys(req.headers)) {
    if (key.startsWith("x-user-")) {
      delete req.headers[key];
    }
  }

  // 2. Read the access-token cookie
  const token = req.cookies?.[COOKIE_NAMES.accessToken];

  if (!token) {
    throw new ApiError(
      statusCode.unauthorized,
      ERROR_CODES.UNAUTHORIZED,
      "Access token is missing",
    );
  }

  // 3. Call verifyAccessToken()
  const user = verifyAccessToken(token);

  if (!user) {
    throw new ApiError(
      statusCode.unauthorized,
      ERROR_CODES.UNAUTHORIZED,
      "Access token is invalid or expired",
    );
  }

  // 4. Inject verified user context headers
  req.headers[HEADER_USER_ID] = user.userId;
  req.headers[HEADER_USER_EMAIL] = user.email;
  req.headers[HEADER_SESSION_ID] = user.sessionId;

  // 5. Set Vary header for cache safety (append X-User-Id if not present)
  const currentVary = res.getHeader("Vary");
  const current = Array.isArray(currentVary)
    ? currentVary.join(",")
    : String(currentVary ?? "");
  const varyParts = current
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const hasUserId = varyParts.some((v) => v.toLowerCase() === "x-user-id");
  if (!hasUserId) {
    varyParts.push("X-User-Id");
  }
  res.setHeader("Vary", varyParts.join(", "));

  next();
};
