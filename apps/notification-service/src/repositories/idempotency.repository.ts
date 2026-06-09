import type { Redis } from "ioredis";
import { IDEMPOTENCY_STATE } from "@constants/idempotency.constants.js";

/**
 * Atomically drop a reservation only when the key still holds PROCESSING.
 * Prevents release() from deleting a PROCESSED marker if a race occurs.
 */
const RELEASE_IF_PROCESSING_SCRIPT = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end
`;

/**
 * Redis-backed idempotency repository for Kafka consumers.
 *
 * Two-phase API with explicit state values:
 *
 *   - `reserveIfNew(eventId)` — atomically claims the event with
 *     `PROCESSING` using `SET key value NX EX leaseTtl`. Returns true
 *     exactly once per in-flight window. A short lease TTL lets a
 *     crashed consumer's stale reservation expire so redelivery can
 *     retry; a live duplicate within the lease window is rejected.
 *   - `markProcessed(eventId)` — overwrites the key with `PROCESSED`
 *     and the full dedupe TTL after the side effect succeeds.
 *   - `release(eventId)` — deletes the key only when it still holds
 *     `PROCESSING`, so a transient provider failure can be retried
 *     without touching an already-completed event.
 *
 * The reserve→mark split is what lets transient provider failures be
 * safely retried: a redelivery that finds no reservation will re-process
 * the event instead of being short-circuited as a duplicate.
 *
 * Atomicity of the claim is provided by `SET … NX EX`; only one client
 * can win the race for a given key.
 */
export class IdempotencyRepository {
  constructor(
    private readonly redis: Redis,
    private readonly processingLeaseSeconds: number,
    private readonly processedTtlSeconds: number,
    private readonly keyspace: string,
  ) {}

  private buildKey(eventId: string): string {
    return `${this.keyspace}:${eventId}`;
  }

  async reserveIfNew(eventId: string): Promise<boolean> {
    const res = await this.redis.set(
      this.buildKey(eventId),
      IDEMPOTENCY_STATE.PROCESSING,
      "EX",
      this.processingLeaseSeconds,
      "NX",
    );
    return res === "OK";
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.redis.set(
      this.buildKey(eventId),
      IDEMPOTENCY_STATE.PROCESSED,
      "EX",
      this.processedTtlSeconds,
    );
  }

  async release(eventId: string): Promise<void> {
    await this.redis.eval(
      RELEASE_IF_PROCESSING_SCRIPT,
      1,
      this.buildKey(eventId),
      IDEMPOTENCY_STATE.PROCESSING,
    );
  }
}
