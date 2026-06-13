import type { Redis } from "ioredis";
import type {
  LoggerLike,
  RateLimitResult,
  TokenBucketOptions,
} from "../types.js";

/**
 * Atomic Redis Lua script implementing the token bucket algorithm.
 *
 * KEYS[1] = rate limit key (e.g. "rl:user:123")
 * ARGV[1] = capacity (max tokens)
 * ARGV[2] = refillPerSec (tokens added per second)
 * ARGV[3] = nowMs (current time in milliseconds)
 *
 * Returns: { allowed (0|1), remaining (int), resetMs (int) }
 */
const LUA_SCRIPT = `
local key          = KEYS[1]
local capacity     = tonumber(ARGV[1])
local refillPerSec = tonumber(ARGV[2])
local nowMs        = tonumber(ARGV[3])

local tokens     = tonumber(redis.call("HGET", key, "tokens"))
local lastRefill = tonumber(redis.call("HGET", key, "lastRefill"))

if tokens == nil then
  tokens     = capacity
  lastRefill = nowMs
end

local elapsedMs  = math.max(0, nowMs - lastRefill)
local elapsedSec = elapsedMs / 1000.0
local refill     = elapsedSec * refillPerSec
tokens       = math.min(capacity, tokens + refill)
lastRefill   = nowMs

local allowed   = 0
local remaining = math.floor(tokens)
local resetMs   = 0

if tokens >= 1 then
  tokens    = tokens - 1
  allowed   = 1
  remaining = math.floor(tokens)
else
  local deficit = 1 - tokens
  resetMs = math.ceil((deficit / refillPerSec) * 1000)
end

redis.call("HSET", key, "tokens", tostring(tokens), "lastRefill", tostring(lastRefill))

local ttlSec = math.ceil(capacity / refillPerSec) + 1
redis.call("EXPIRE", key, ttlSec)

return { allowed, remaining, resetMs }
`;

/**
 * Token bucket rate limiter backed by an atomic Redis Lua script.
 *
 * Each call to `consume()` is a single Redis round-trip (EVALSHA with
 * EVAL fallback). The Lua script handles refill, consume, TTL, and
 * retry-after computation atomically — no race conditions.
 */
export class TokenBucketRateLimiter {
  private readonly redis: Redis;
  private readonly logger?: LoggerLike;
  private scriptSha: string | null = null;

  constructor(redis: Redis, logger?: LoggerLike) {
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Attempt to consume one token from the bucket identified by `key`.
   *
   * @param key     — unique rate-limit key, e.g. `"rl:user:123"` or `"rl:ip:1.2.3.4"`
   * @param opts    — bucket configuration (capacity and refill rate)
   * @returns         whether the request is allowed, remaining tokens, and retry-after ms
   */
  async consume(
    key: string,
    opts: TokenBucketOptions,
  ): Promise<RateLimitResult> {
    const { capacity, refillPerSec } = opts;

    if (!Number.isFinite(capacity) || capacity < 1) {
      throw new RangeError(
        `capacity must be a finite number >= 1, got ${capacity}`,
      );
    }
    if (!Number.isFinite(refillPerSec) || refillPerSec <= 0) {
      throw new RangeError(
        `refillPerSec must be a finite number > 0, got ${refillPerSec}`,
      );
    }

    const nowMs = Date.now();

    try {
      const result = await this.evalLua(key, capacity, refillPerSec, nowMs);
      return result;
    } catch (err) {
      this.logger?.error(
        { module: "token-bucket", key, err },
        "Rate limiter Lua eval failed",
      );
      throw err;
    }
  }

  /**
   * Evaluates the Lua script via EVALSHA (with EVAL fallback on first call
   * or after a Redis SCRIPT FLUSH).
   */
  private async evalLua(
    key: string,
    capacity: number,
    refillPerSec: number,
    nowMs: number,
  ): Promise<RateLimitResult> {
    // Try EVALSHA first (fast path) if we have a cached SHA
    if (this.scriptSha) {
      try {
        const raw = await this.redis.evalsha(
          this.scriptSha,
          1,
          key,
          capacity.toString(),
          refillPerSec.toString(),
          nowMs.toString(),
        );
        return this.parseResult(raw);
      } catch (err: unknown) {
        // NOSCRIPT — script was flushed, fall through to EVAL
        if (err instanceof Error && err.message.includes("NOSCRIPT")) {
          this.scriptSha = null;
        } else {
          throw err;
        }
      }
    }

    // Load script via SCRIPT LOAD and then EVALSHA
    const sha = (await this.redis.script("LOAD", LUA_SCRIPT)) as string;
    this.scriptSha = sha;

    const raw = await this.redis.evalsha(
      sha,
      1,
      key,
      capacity.toString(),
      refillPerSec.toString(),
      nowMs.toString(),
    );
    return this.parseResult(raw);
  }

  private parseResult(raw: unknown): RateLimitResult {
    const arr = raw as [number, number, number];
    return {
      allowed: arr[0] === 1,
      remaining: arr[1]!,
      resetMs: arr[2]!,
    };
  }
}
