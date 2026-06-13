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
      // Per plan: key is per userId ?? ip
      const userId = req.headers["x-user-id"];
      const ip = req.ip || req.socket.remoteAddress || "unknown-ip";

      if (Array.isArray(userId)) {
        return `rl:${userId[0]}`;
      }
      if (userId) {
        return `rl:${userId}`;
      }
      return `rl:${ip}`;
    },
    capacity: preset.capacity,
    refillPerSec: preset.refillPerSec,
  });
};
