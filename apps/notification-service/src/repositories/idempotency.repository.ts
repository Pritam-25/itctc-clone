import type { Redis } from "ioredis";

/**
 * Redis-backed idempotency repository for Kafka consumers.
 *
 * `markIfNew(eventId)` returns true exactly once per eventId within the
 * configured TTL window. Subsequent calls (replays, redeliveries) return
 * false and the caller short-circuits before doing side-effecting work
 * (e.g. sending an email).
 *
 * Atomicity is provided by `SET key value NX EX ttl` — Redis guarantees
 * only one client can win the race for a given key.
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

  async markIfNew(eventId: string): Promise<boolean> {
    const res = await this.redis.set(
      this.buildKey(eventId),
      "1",
      "EX",
      this.ttlSeconds,
      "NX",
    );
    return res === "OK";
  }
}
