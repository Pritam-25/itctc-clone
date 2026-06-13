export class TimeoutError extends Error {
  constructor(label = "operation", timeoutMs: number) {
    super(`Timeout: ${label} exceeded ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

/**
 * Wraps a promise in a timeout. If the timeout expires before the promise
 * resolves, the returned promise rejects with a TimeoutError.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label = "operation",
): Promise<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      reject(new TimeoutError(label, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
  }
}
