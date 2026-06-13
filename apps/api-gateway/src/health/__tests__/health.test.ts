import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { statusCode } from "@irctc/http";

// Mock env config to bypass zod validations at test load time
vi.mock("../../config/env.js", () => {
  return {
    env: {
      PORT: "3000",
      NODE_ENV: "test",
      REDIS_URL: "redis://localhost:6379",
      CORS_ORIGINS: ["http://localhost:3000"],
      USER_UPSTREAM: "http://localhost:4001",
      NOTIFICATION_UPSTREAM: "http://localhost:4002",
      JWT_SECRET: "test-secret-key",
      RATE_LIMIT_DEFAULT_CAPACITY: 100,
      RATE_LIMIT_DEFAULT_REFILL_PER_SEC: 1.6667,
      RATE_LIMIT_AUTH_CAPACITY: 10,
      RATE_LIMIT_AUTH_REFILL_PER_SEC: 0.1667,
      TRUST_PROXY: "false",
    },
  };
});

vi.mock("../../config/redis.js", () => {
  return {
    redis: {
      status: "ready",
      ping: vi.fn(),
    },
  };
});

import { redis } from "../../config/redis.js";
import { liveCheck, readyCheck } from "../health.controller.js";

describe("Health Check Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("liveCheck", () => {
    it("should return status 200 with uptime", () => {
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      liveCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(statusCode.success);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Gateway is alive",
          data: expect.objectContaining({
            status: "alive",
            uptime: expect.any(Number),
          }),
        }),
      );
    });
  });

  describe("readyCheck", () => {
    it("should return status 200 when Redis is healthy", async () => {
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      // Mock Redis ping to resolve PONG
      vi.mocked(redis.ping).mockResolvedValue("PONG");

      await readyCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(statusCode.success);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Gateway is ready",
          data: expect.objectContaining({
            status: "ready",
            checks: { redis: true },
          }),
        }),
      );
    });

    it("should return status 503 when Redis is unhealthy", async () => {
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      // Mock Redis ping to fail
      vi.mocked(redis.ping).mockRejectedValue(new Error("Redis offline"));

      await readyCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(statusCode.serviceUnavailable);
      expect(res.json).toHaveBeenCalledWith({
        status: "unhealthy",
        checks: { redis: false },
      });
    });

    it("should return status 503 when Redis check times out", async () => {
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      // Mock Redis ping to take longer than 5s
      vi.mocked(redis.ping).mockImplementation(() => {
        return new Promise((resolve) =>
          setTimeout(() => resolve("PONG"), 6000),
        );
      });

      // Use fake timers to fast forward
      vi.useFakeTimers();

      const readyPromise = readyCheck(req, res);
      await vi.advanceTimersByTimeAsync(5000);
      await readyPromise;

      expect(res.status).toHaveBeenCalledWith(statusCode.serviceUnavailable);
      expect(res.json).toHaveBeenCalledWith({
        status: "unhealthy",
        checks: { redis: false },
      });

      vi.useRealTimers();
    });
  });
});
