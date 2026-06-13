export interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number;
  recoveryTimeoutMs?: number;
  halfOpenMaxTrials?: number;
  timeoutMs?: number;
}

export const DEFAULT_OPTIONS = {
  failureThreshold: 5,
  recoveryTimeoutMs: 30_000,
  halfOpenMaxTrials: 1,
  timeoutMs: 5_000,
} as const;

export class CircuitOpenError extends Error {
  constructor(name: string, message?: string) {
    super(message ?? `Circuit breaker "${name}" is OPEN`);
    this.name = "CircuitOpenError";
  }
}
