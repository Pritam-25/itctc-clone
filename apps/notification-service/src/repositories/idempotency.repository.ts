import type { Redis } from "ioredis";

/**
 * Redis-backed idempotency repository for Kafka consumers.
 *
 * Two-phase API:
 *
 *   - `reserveIfNew(eventId)` — atomically claims the event for processing
 *     using `SET key value NX EX ttl`. Returns true exactly once per
 *     eventId within the configured TTL. A subsequent `markProcessed` is
 *     expected to follow on success.
 *   - `markProcessed(eventId)` — re-arms the key with the full processing
 *     TTL, signaling the work completed. Called AFTER the side effect
 *     (e.g. email send) succeeds.
 *   - `release(eventId)` — drops the reservation so a redelivery can retry.
 *     Used when a side effect fails and the runner will redeliver.
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
    private readonly ttlSeconds: number,
    private readonly keyspace: string,
  ) {}

  private buildKey(eventId: string): string {
    return `${this.keyspace}:${eventId}`;
  }

  async reserveIfNew(eventId: string): Promise<boolean> {
    const res = await this.redis.set(
      this.buildKey(eventId),
      "1",
      "EX",
      this.ttlSeconds,
      "NX",
    );
    return res === "OK";
  }

  async markProcessed(eventId: string): Promise<void> {
    // Re-arm with the full TTL to mark the work as complete. We don't
    // need NX here — overwriting an existing key with the sentinel is
    // safe and idempotent.
    await this.redis.set(
      this.buildKey(eventId),
      "1",
      "EX",
      this.ttlSeconds,
    );
  }

  async release(eventId: string): Promise<void> {
    await this.redis.del(this.buildKey(eventId));
  }
}
