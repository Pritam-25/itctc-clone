import { CircuitBreaker } from "./CircuitBreaker.js";
import { type CircuitBreakerOptions } from "./types.js";
import { type CircuitBreakerState } from "./CircuitBreakerState.js";

export class CircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();
  private readonly onStateChange?: (
    name: string,
    from: CircuitBreakerState,
    to: CircuitBreakerState,
  ) => void;

  constructor(options?: {
    onStateChange?: (
      name: string,
      from: CircuitBreakerState,
      to: CircuitBreakerState,
    ) => void;
  }) {
    this.onStateChange = options?.onStateChange;
  }

  /**
   * Retrieves an existing circuit breaker or creates a new one with the given options.
   */
  get(
    name: string,
    options?: Omit<CircuitBreakerOptions, "name">,
  ): CircuitBreaker {
    let breaker = this.breakers.get(name);
    if (!breaker) {
      breaker = new CircuitBreaker({
        ...options,
        name,
        onStateChange: (from, to) => {
          if (this.onStateChange) {
            this.onStateChange(name, from, to);
          }
        },
      });
      this.breakers.set(name, breaker);
    } else if (options && Object.keys(options).length > 0) {
      throw new Error(
        `CircuitBreaker "${name}" already exists; options can only be set on first registration`,
      );
    }
    return breaker;
  }

  /**
   * Clears the registry. Mainly useful for tests.
   */
  clear(): void {
    this.breakers.clear();
  }
}
