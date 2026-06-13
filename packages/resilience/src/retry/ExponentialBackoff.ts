export interface BackoffOptions {
  retries?: number;
  initialMs?: number;
  maxMs?: number;
}

/**
 * Executes an operation with exponential backoff retries.
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options?: BackoffOptions,
): Promise<T> {
  const MAX_RETRIES_CAP = 50;
  const MAX_DELAY_CAP = 60_000; // 60 seconds

  let retries = options?.retries ?? 3;
  if (!Number.isFinite(retries) || retries < 0) {
    throw new RangeError(
      `retries must be a finite non-negative integer, got ${retries}`,
    );
  }
  retries = Math.min(Math.floor(retries), MAX_RETRIES_CAP);

  let initialMs = options?.initialMs ?? 100;
  if (!Number.isFinite(initialMs) || initialMs <= 0) {
    throw new RangeError(
      `initialMs must be a finite positive number, got ${initialMs}`,
    );
  }
  initialMs = Math.min(initialMs, MAX_DELAY_CAP);

  let maxMs = options?.maxMs ?? 1000;
  if (!Number.isFinite(maxMs) || maxMs <= 0) {
    throw new RangeError(
      `maxMs must be a finite positive number, got ${maxMs}`,
    );
  }
  maxMs = Math.min(maxMs, MAX_DELAY_CAP);

  if (maxMs < initialMs) {
    maxMs = initialMs;
  }

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > retries) {
        throw error;
      }
      const delay = Math.min(initialMs * Math.pow(2, attempt - 1), maxMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
