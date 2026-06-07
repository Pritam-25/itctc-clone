import type { Request, Response, NextFunction } from "express";
import { redis } from "@config/redis.js";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import { ERROR_CODES } from "@utils/errors";
import { REDIS_KEYS } from "@utils/constants/redis-keys.js";
import { AUTH_DURATIONS } from "@utils/constants/auth.js";
import type { AuthUser } from "./auth.middleware.js";

export const sessionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as any).user as AuthUser;

  if (!user || !user.sessionId) {
    throw new ApiError(
      statusCode.unauthorized,
      ERROR_CODES.SESSION_CONTEXT_MISSING,
    );
  }

  const sessionKey = REDIS_KEYS.authSession(user.sessionId);
  const sessionJson = await redis.get(sessionKey);

  if (!sessionJson) {
    throw new ApiError(
      statusCode.unauthorized,
      ERROR_CODES.SESSION_EXPIRED_OR_REVOKED,
    );
  }

  // Optional: update lastUsedAt
  const session = JSON.parse(sessionJson);
  session.lastUsedAt = new Date().toISOString();
  await redis.set(
    sessionKey,
    JSON.stringify(session),
    "EX",
    AUTH_DURATIONS.SESSION_TTL_SECONDS,
  );

  // Refresh the user-sessions index TTL to keep sessions discoverable
  await redis.expire(
    REDIS_KEYS.userSessions(user.userId),
    AUTH_DURATIONS.SESSION_TTL_SECONDS,
  );

  next();
};
