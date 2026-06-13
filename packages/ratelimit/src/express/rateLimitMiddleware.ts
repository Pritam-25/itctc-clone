import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { TokenBucketRateLimiter } from "../token-bucket/TokenBucketRateLimiter.js";

export interface RateLimitMiddlewareOptions {
  /** The token bucket limiter instance (backed by Redis). */
  limiter: TokenBucketRateLimiter;

  /**
   * Extracts the rate-limit key from the request.
   * Typical: `(req) => req.headers['x-user-id'] ?? req.ip`
   */
  keyFn: (req: Request) => string;

  /** Max tokens in the bucket. */
  capacity: number;

  /** Tokens added per second. */
  refillPerSec: number;

  /**
   * Optional custom handler when rate limit is exceeded.
   * If not provided, responds with 429 and a JSON body.
   */
  onLimit?: (req: Request, res: Response) => void;
}

/**
 * Creates an Express middleware that enforces token-bucket rate limiting.
 *
 * Sets standard rate-limit headers on every response:
 * - `X-RateLimit-Limit`     — bucket capacity
 * - `X-RateLimit-Remaining` — tokens left after this request
 * - `Retry-After`           — seconds until next token (only on 429)
 */
export function createRateLimitMiddleware(
  opts: RateLimitMiddlewareOptions,
): RequestHandler {
  const { limiter, keyFn, capacity, refillPerSec, onLimit } = opts;

  return async (req: Request, res: Response, next: NextFunction) => {
    let key: string;
    try {
      key = keyFn(req);
    } catch (err) {
      next(err);
      return;
    }

    let result;
    try {
      result = await limiter.consume(key, { capacity, refillPerSec });
    } catch {
      // If the rate limiter is down, fail open — don't block traffic
      next();
      return;
    }

    res.setHeader("X-RateLimit-Limit", capacity);
    res.setHeader("X-RateLimit-Remaining", result.remaining);

    if (result.allowed) {
      next();
      return;
    }

    // Denied — set Retry-After (in seconds, rounded up)
    const retryAfterSec = Math.ceil(result.resetMs / 1000);
    res.setHeader("Retry-After", retryAfterSec);

    if (onLimit) {
      try {
        onLimit(req, res);
      } catch (err) {
        next(err);
      }
      return;
    }

    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
      retryAfterMs: result.resetMs,
    });
  };
}
