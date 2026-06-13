import { CircuitBreakerState } from "./CircuitBreakerState.js";
import {
  CircuitOpenError,
  DEFAULT_OPTIONS,
  type CircuitBreakerOptions,
} from "./types.js";
import { withTimeout } from "../timeout/withTimeout.js";

export class CircuitBreaker {
  public readonly name: string;
  private readonly failureThreshold: number;
  private readonly recoveryTimeoutMs: number;
  private readonly halfOpenMaxTrials: number;
  private readonly timeoutMs: number;
  private readonly onStateChange?: (
    from: CircuitBreakerState,
    to: CircuitBreakerState,
  ) => void;

  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private openedAt: number | null = null;
  private inFlightProbes = 0;

  constructor(
    options: CircuitBreakerOptions & {
      onStateChange?: (
        from: CircuitBreakerState,
        to: CircuitBreakerState,
      ) => void;
    },
  ) {
    this.name = options.name;

    const failureThreshold =
      options.failureThreshold ?? DEFAULT_OPTIONS.failureThreshold;
    if (!Number.isFinite(failureThreshold) || failureThreshold < 1) {
      throw new RangeError(
        `failureThreshold must be a finite integer >= 1, got ${failureThreshold}`,
      );
    }
    this.failureThreshold = Math.floor(failureThreshold);

    const halfOpenMaxTrials =
      options.halfOpenMaxTrials ?? DEFAULT_OPTIONS.halfOpenMaxTrials;
    if (!Number.isFinite(halfOpenMaxTrials) || halfOpenMaxTrials < 1) {
      throw new RangeError(
        `halfOpenMaxTrials must be a finite integer >= 1, got ${halfOpenMaxTrials}`,
      );
    }
    this.halfOpenMaxTrials = Math.floor(halfOpenMaxTrials);

    const recoveryTimeoutMs =
      options.recoveryTimeoutMs ?? DEFAULT_OPTIONS.recoveryTimeoutMs;
    if (!Number.isFinite(recoveryTimeoutMs) || recoveryTimeoutMs < 0) {
      throw new RangeError(
        `recoveryTimeoutMs must be a finite number >= 0, got ${recoveryTimeoutMs}`,
      );
    }
    this.recoveryTimeoutMs = recoveryTimeoutMs;

    const timeoutMs = options.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs;
    if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
      throw new RangeError(
        `timeoutMs must be a finite number >= 0, got ${timeoutMs}`,
      );
    }
    this.timeoutMs = timeoutMs;

    this.onStateChange = options.onStateChange;
  }

  /**
   * Executes the given async function wrapped in the circuit breaker rules.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.checkRecoveryTimeout();

    const currentState = this.state;

    if (currentState === CircuitBreakerState.OPEN) {
      throw new CircuitOpenError(this.name);
    }

    let isProbe = false;
    if (currentState === CircuitBreakerState.HALF_OPEN) {
      if (this.inFlightProbes >= this.halfOpenMaxTrials) {
        throw new CircuitOpenError(
          this.name,
          `Circuit breaker "${this.name}" is HALF_OPEN and has reached maximum concurrent probes`,
        );
      }
      this.inFlightProbes++;
      isProbe = true;
    }

    try {
      const promise = fn();
      const result =
        this.timeoutMs > 0
          ? await withTimeout(promise, this.timeoutMs, this.name)
          : await promise;

      this.handleSuccess(isProbe);
      return result;
    } catch (err) {
      this.handleFailure(isProbe);
      throw err;
    }
  }

  /**
   * Returns the current state of the circuit breaker.
   */
  getState(): CircuitBreakerState {
    this.checkRecoveryTimeout();
    return this.state;
  }

  /**
   * Transitions state from OPEN to HALF_OPEN if the recovery timeout has elapsed.
   */
  private checkRecoveryTimeout(): void {
    if (this.state === CircuitBreakerState.OPEN && this.openedAt !== null) {
      const elapsed = Date.now() - this.openedAt;
      if (elapsed >= this.recoveryTimeoutMs) {
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      }
    }
  }

  /**
   * Records a successful operation.
   */
  private handleSuccess(isProbe: boolean): void {
    if (isProbe) {
      this.inFlightProbes = Math.max(0, this.inFlightProbes - 1);
      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.transitionTo(CircuitBreakerState.CLOSED);
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
    }
  }

  /**
   * Records a failed operation.
   */
  private handleFailure(isProbe: boolean): void {
    if (isProbe) {
      this.inFlightProbes = Math.max(0, this.inFlightProbes - 1);
      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.transitionTo(CircuitBreakerState.OPEN);
      } else if (this.state === CircuitBreakerState.CLOSED) {
        // A concurrent probe may have already closed the circuit;
        // still count this failure to avoid undercounting.
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
          this.transitionTo(CircuitBreakerState.OPEN);
        }
      }
      return;
    } else if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.transitionTo(CircuitBreakerState.OPEN);
      }
    }
  }

  /**
   * Transitions the circuit breaker to a new state and triggers the callback.
   */
  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    if (oldState === newState) return;

    this.state = newState;

    if (newState === CircuitBreakerState.OPEN) {
      this.openedAt = Date.now();
      this.failureCount = 0;
    } else if (newState === CircuitBreakerState.CLOSED) {
      this.openedAt = null;
      this.failureCount = 0;
      this.inFlightProbes = 0;
    } else if (newState === CircuitBreakerState.HALF_OPEN) {
      this.inFlightProbes = 0;
    }

    if (this.onStateChange) {
      try {
        this.onStateChange(oldState, newState);
      } catch (err) {
        // Suppress onStateChange callback exceptions
      }
    }
  }
}
