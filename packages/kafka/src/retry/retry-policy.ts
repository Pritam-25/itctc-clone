/**
 * Retry policy factories for Kafka consumers. Centralised so every
 * service uses the same shape (initial, max, factor) and ops can tune
 * them in one place.
 */
export interface RetryPolicy {
  retries: number;
  initialRetryTime: number;
  maxRetryTime: number;
  factor: number;
  multiplier?: number;
}

export const RetryPolicies = {
  /**
   * Conservative: 5 attempts, 300ms→30s, factor 2.
   * Default for transactional consumers (notification, payment).
   */
  conservative: (): RetryPolicy => ({
    retries: 5,
    initialRetryTime: 300,
    maxRetryTime: 30_000,
    factor: 2,
  }),

  /**
   * Aggressive: 8 attempts, 100ms→5s, factor 2.
   * For non-critical consumers that should back off faster.
   */
  aggressive: (): RetryPolicy => ({
    retries: 8,
    initialRetryTime: 100,
    maxRetryTime: 5_000,
    factor: 2,
  }),

  /**
   * Custom builder when the env values are not a named pattern.
   */
  custom: (params: {
    retries: number;
    initialRetryTime: number;
    maxRetryTime: number;
    factor?: number;
  }): RetryPolicy => ({
    retries: params.retries,
    initialRetryTime: params.initialRetryTime,
    maxRetryTime: params.maxRetryTime,
    factor: params.factor ?? 2,
  }),
} as const;
