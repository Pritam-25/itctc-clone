import {
  TokenBucketRateLimiter,
  createRateLimitMiddleware,
} from "@irctc/ratelimit";
import { redis } from "../config/redis.js";
import { logger } from "@irctc/logger";
import { RATELIMIT_PRESETS, type RateLimitPresetName } from "./presets.js";
import type { Request, RequestHandler } from "express";

export const rateLimiter = new TokenBucketRateLimiter(redis, logger);

export const getRateLimitMiddleware = (
  presetName: RateLimitPresetName,
): RequestHandler => {
  const preset = RATELIMIT_PRESETS[presetName];

  return createRateLimitMiddleware({
    limiter: rateLimiter,
    keyFn: (req: Request) => {
      // Key on verified userId when authenticated, fall back to IP for anonymous requests
      const user = (req as Request & { user?: any }).user;
      const ip = req.ip || req.socket.remoteAddress || "unknown-ip";

      if (user?.userId) {
        return `rl:${user.userId}`;
      }
      return `rl:${ip}`;
    },
    capacity: preset.capacity,
    refillPerSec: preset.refillPerSec,
  });
};
