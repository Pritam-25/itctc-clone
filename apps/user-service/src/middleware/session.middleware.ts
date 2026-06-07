import type { Request, Response, NextFunction } from "express";
import { redis } from "@config/redis.js";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import type { AuthUser } from "./auth.middleware.js";

export const sessionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as any).user as AuthUser;

  if (!user || !user.sessionId) {
    throw new ApiError(statusCode.unauthorized, "User session context missing");
  }

  const sessionKey = `auth:session:${user.sessionId}`;
  const sessionJson = await redis.get(sessionKey);

  if (!sessionJson) {
    throw new ApiError(statusCode.unauthorized, "Session expired or revoked");
  }

  // Optional: update lastUsedAt
  const session = JSON.parse(sessionJson);
  session.lastUsedAt = new Date().toISOString();
  await redis.set(sessionKey, JSON.stringify(session), "EX", 30 * 24 * 60 * 60);

  next();
};
