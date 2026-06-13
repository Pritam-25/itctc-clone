import { CircuitBreakerRegistry, CircuitBreakerState } from "@irctc/resilience";
import { logger } from "@irctc/logger";
import { TIMEOUTS } from "./timeouts.js";

export const breakerRegistry = new CircuitBreakerRegistry({
  onStateChange: (
    name: string,
    from: CircuitBreakerState,
    to: CircuitBreakerState,
  ) => {
    logger.warn(
      { circuit: name, from, to },
      `Circuit breaker "${name}" state transitioned from ${from} to ${to}`,
    );
  },
});

const registeredBreakers = new Set<string>();

export const getBreaker = (circuitName: string) => {
  if (registeredBreakers.has(circuitName)) {
    return breakerRegistry.get(circuitName);
  }

  const breaker = breakerRegistry.get(circuitName, {
    failureThreshold: 5,
    recoveryTimeoutMs: 30000,
    halfOpenMaxTrials: 1,
    timeoutMs: TIMEOUTS[circuitName] ?? 5000,
  });
  registeredBreakers.add(circuitName);
  return breaker;
};
