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
  const retries = options?.retries ?? 3;
  const initialMs = options?.initialMs ?? 100;
  const maxMs = options?.maxMs ?? 1000;

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
