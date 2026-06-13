import { env } from "../config/env.js";

export const RATELIMIT_PRESETS = {
  default: {
    capacity: env.RATE_LIMIT_DEFAULT_CAPACITY,
    refillPerSec: env.RATE_LIMIT_DEFAULT_REFILL_PER_SEC,
  },
  auth: {
    capacity: env.RATE_LIMIT_AUTH_CAPACITY,
    refillPerSec: env.RATE_LIMIT_AUTH_REFILL_PER_SEC,
  },
} as const;

export type RateLimitPresetName = keyof typeof RATELIMIT_PRESETS;
