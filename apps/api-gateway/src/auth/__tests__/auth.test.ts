import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import {
  HEADER_USER_ID,
  HEADER_USER_EMAIL,
  HEADER_SESSION_ID,
} from "@irctc/auth-headers";
import { verifyAccessToken } from "../jwtVerifier.js";
import { gatewayAuthMiddleware } from "../gatewayAuthMiddleware.js";
import { COOKIE_NAMES } from "../cookieNames.js";

describe("api-gateway auth module", () => {
  const secret = "test-secret-key";

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
  });

  describe("verifyAccessToken", () => {
    it("should verify and decode valid token", () => {
      const payload = {
        sub: "user-123",
        email: "user@example.com",
        sessionId: "session-456",
        type: "access",
      };

      const token = jwt.sign(payload, secret);
      const result = verifyAccessToken(token);

      expect(result).toEqual({
        userId: "user-123",
        email: "user@example.com",
        sessionId: "session-456",
      });
    });

    it("should return null for invalid token type", () => {
      const payload = {
        sub: "user-123",
        email: "user@example.com",
        sessionId: "session-456",
        type: "refresh",
      };

      const token = jwt.sign(payload, secret);
      const result = verifyAccessToken(token);

      expect(result).toBeNull();
    });

    it("should return null for missing secret key", () => {
      delete process.env.JWT_SECRET;
      const payload = {
        sub: "user-123",
        email: "user@example.com",
        sessionId: "session-456",
        type: "access",
      };

      const token = jwt.sign(payload, secret);
      const result = verifyAccessToken(token);

      expect(result).toBeNull();
    });
  });

  describe("gatewayAuthMiddleware", () => {
    it("should scrub inbound user headers, verify token and inject headers", () => {
      const payload = {
        sub: "user-123",
        email: "user@example.com",
        sessionId: "session-456",
        type: "access",
      };
      const token = jwt.sign(payload, secret);

      const req = {
        cookies: {
          [COOKIE_NAMES.accessToken]: token,
        },
        headers: {
          "x-user-id": "malicious-attacker",
          "x-user-custom": "some-forged-data",
          "other-header": "keep-me",
        },
      } as unknown as Request;

      const res = {
        setHeader: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as NextFunction;

      gatewayAuthMiddleware(req, res, next);

      expect(req.headers[HEADER_USER_ID]).toBe("user-123");
      expect(req.headers[HEADER_USER_EMAIL]).toBe("user@example.com");
      expect(req.headers[HEADER_SESSION_ID]).toBe("session-456");
      expect(req.headers["x-user-custom"]).toBeUndefined();
      expect(req.headers["other-header"]).toBe("keep-me");
      expect(res.setHeader).toHaveBeenCalledWith("Vary", "X-User-Id");
      expect(next).toHaveBeenCalled();
    });

    it("should throw ApiError if token is missing", () => {
      const req = {
        cookies: {},
        headers: {},
      } as unknown as Request;

      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      expect(() => gatewayAuthMiddleware(req, res, next)).toThrowError(
        new ApiError(
          statusCode.unauthorized,
          "UNAUTHORIZED",
          "Access token is missing",
        ),
      );
    });
  });
});
