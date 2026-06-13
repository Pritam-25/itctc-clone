import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CircuitBreaker } from "../CircuitBreaker.js";
import { CircuitBreakerState } from "../CircuitBreakerState.js";
import { CircuitOpenError } from "../types.js";
import { TimeoutError } from "../../timeout/withTimeout.js";

describe("CircuitBreaker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start in CLOSED state", () => {
    const cb = new CircuitBreaker({ name: "test-service" });
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
  });

  it("CLOSED -> transitions to OPEN after failure threshold is reached", async () => {
    const cb = new CircuitBreaker({
      name: "test-service",
      failureThreshold: 3,
    });

    const failingFn = vi.fn().mockRejectedValue(new Error("failure"));

    // 1st failure
    await expect(cb.execute(failingFn)).rejects.toThrow("failure");
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);

    // 2nd failure
    await expect(cb.execute(failingFn)).rejects.toThrow("failure");
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);

    // 3rd failure - trips the breaker
    await expect(cb.execute(failingFn)).rejects.toThrow("failure");
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
    expect(failingFn).toHaveBeenCalledTimes(3);
  });

  it("OPEN -> fails fast and does not invoke wrapped function", async () => {
    const cb = new CircuitBreaker({
      name: "test-service",
      failureThreshold: 1,
    });

    const failingFn = vi.fn().mockRejectedValue(new Error("failure"));
    await expect(cb.execute(failingFn)).rejects.toThrow("failure");
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

    const targetFn = vi.fn().mockResolvedValue("success");
    await expect(cb.execute(targetFn)).rejects.toThrow(CircuitOpenError);
    expect(targetFn).not.toHaveBeenCalled();
  });

  it("OPEN -> transitions to HALF_OPEN after recoveryTimeoutMs and closed on success", async () => {
    const cb = new CircuitBreaker({
      name: "test-service",
      failureThreshold: 1,
      recoveryTimeoutMs: 5000,
    });

    // Trip the breaker
    await expect(
      cb.execute(() => Promise.reject(new Error("fail"))),
    ).rejects.toThrow("fail");
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

    // Move time forward by 4999ms (not yet elapsed)
    await vi.advanceTimersByTimeAsync(4999);
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

    // Move time forward past recoveryTimeoutMs
    await vi.advanceTimersByTimeAsync(2);
    // Should transition to HALF_OPEN when we retrieve the state or execute a call
    expect(cb.getState()).toBe(CircuitBreakerState.HALF_OPEN);

    // Success probe should transition to CLOSED immediately
    const successResult = await cb.execute(() => Promise.resolve("ok"));
    expect(successResult).toBe("ok");
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
  });

  it("HALF_OPEN -> transitions back to OPEN on probe failure", async () => {
    const cb = new CircuitBreaker({
      name: "test-service",
      failureThreshold: 1,
      recoveryTimeoutMs: 5000,
    });

    // Trip
    await expect(
      cb.execute(() => Promise.reject(new Error("fail"))),
    ).rejects.toThrow("fail");
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

    // Elapse recovery timeout
    await vi.advanceTimersByTimeAsync(5000);
    expect(cb.getState()).toBe(CircuitBreakerState.HALF_OPEN);

    // Failed probe should transition back to OPEN immediately
    await expect(
      cb.execute(() => Promise.reject(new Error("probe-fail"))),
    ).rejects.toThrow("probe-fail");
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

    // Try executing again - should fail fast immediately
    const targetFn = vi.fn().mockResolvedValue("success");
    await expect(cb.execute(targetFn)).rejects.toThrow(CircuitOpenError);
    expect(targetFn).not.toHaveBeenCalled();
  });

  it("enforces timeoutMs and counts hangs as failures", async () => {
    const cb = new CircuitBreaker({
      name: "test-service",
      failureThreshold: 2,
      timeoutMs: 100,
    });

    const slowFn = () => new Promise((resolve) => setTimeout(resolve, 500));

    // First timeout
    const p1 = cb.execute(slowFn);
    await vi.advanceTimersByTimeAsync(100);
    await expect(p1).rejects.toThrow(TimeoutError);
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);

    // Second timeout - trips
    const p2 = cb.execute(slowFn);
    await vi.advanceTimersByTimeAsync(100);
    await expect(p2).rejects.toThrow(TimeoutError);
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
  });

  it("limits concurrent probes in HALF_OPEN (halfOpenMaxTrials = 2)", async () => {
    const cb = new CircuitBreaker({
      name: "test-service",
      failureThreshold: 1,
      recoveryTimeoutMs: 5000,
      halfOpenMaxTrials: 2,
    });

    // Trip
    await expect(
      cb.execute(() => Promise.reject(new Error("fail"))),
    ).rejects.toThrow("fail");

    // Move to HALF_OPEN
    await vi.advanceTimersByTimeAsync(5000);
    expect(cb.getState()).toBe(CircuitBreakerState.HALF_OPEN);

    let resolve1: (v: string) => void = () => {};
    const probe1Promise = cb.execute(
      () =>
        new Promise<string>((resolve) => {
          resolve1 = resolve;
        }),
    );

    let resolve2: (v: string) => void = () => {};
    const probe2Promise = cb.execute(
      () =>
        new Promise<string>((resolve) => {
          resolve2 = resolve;
        }),
    );

    // Third concurrent probe should fail fast because max trials = 2
    const probe3Promise = cb.execute(() => Promise.resolve("probe3"));
    await expect(probe3Promise).rejects.toThrow(CircuitOpenError);

    // Resolve first probe -> should close circuit
    resolve1("ok1");
    expect(await probe1Promise).toBe("ok1");
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);

    // Resolve second probe (which was started in HALF_OPEN but completes when state is CLOSED)
    resolve2("ok2");
    expect(await probe2Promise).toBe("ok2");
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
  });
});
