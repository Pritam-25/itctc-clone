import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { redis } from "@config/redis.js";
import { env } from "@config/env.js";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import { ERROR_CODES as AUTH_ERROR_CODES } from "@utils/errors";
import { ERROR_CODES as COMMON_ERROR_CODES } from "@irctc/errors";

interface RegistrationSessionData {
  firstName: string;
  lastName: string;
  email: string;
  hashedPassword: string;
}

export class OtpService {
  private static readonly RATE_LIMIT_MAX = 5;
  private static readonly RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
  private static readonly OTP_ATTEMPT_LIMIT = 5;

  /**
   * Stores a hashed OTP in Redis and handles rate limiting.
   */
  static async storeOtp(email: string, otp: string): Promise<string> {
    const rateKey = `otp_rate:${email}`;
    const currentCount = await redis.get(rateKey);

    if (currentCount && parseInt(currentCount) >= this.RATE_LIMIT_MAX) {
      throw new ApiError(
        statusCode.tooManyRequests,
        COMMON_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      );
    }

    const sessionId = randomUUID();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await redis.set(`otp_session:${sessionId}`, hashedOtp, "EX", env.OTP_TTL);

    await redis.incr(rateKey);
    if (currentCount === null) {
      await redis.expire(rateKey, this.RATE_LIMIT_WINDOW);
    }

    return sessionId;
  }

  /**
   * Stores registration data in Redis tied to the session ID.
   */
  static async storeRegistrationSession(
    sessionId: string,
    data: RegistrationSessionData,
  ): Promise<void> {
    await redis.set(
      `reg_session:${sessionId}`,
      JSON.stringify(data),
      "EX",
      env.OTP_TTL,
    );
  }

  /**
   * Retrieves registration data from Redis.
   */
  static async getRegistrationSession(
    sessionId: string,
  ): Promise<RegistrationSessionData | null> {
    const data = await redis.get(`reg_session:${sessionId}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  /**
   * Cleans up both OTP and registration sessions.
   */
  static async deleteRegistrationSession(sessionId: string): Promise<void> {
    await redis.del(`otp_session:${sessionId}`, `reg_session:${sessionId}`);
  }

  /**
   * Verifies the provided OTP against the stored hashed OTP.
   */
  static async verifyOtp(sessionId: string, otp: string): Promise<boolean> {
    const hashedOtp = await redis.get(`otp_session:${sessionId}`);

    if (!hashedOtp) {
      throw new ApiError(statusCode.notFound, AUTH_ERROR_CODES.OTP_EXPIRED);
    }

    // 1. Track and limit OTP attempts to prevent brute-force
    const attemptKey = `otp_attempts:${sessionId}`;
    const attempts = await redis.incr(attemptKey);

    if (attempts === 1) {
      await redis.expire(attemptKey, env.OTP_TTL);
    }

    if (attempts > this.OTP_ATTEMPT_LIMIT) {
      // Delete OTP session to block further attempts
      await redis.del(`otp_session:${sessionId}`);
      throw new ApiError(statusCode.tooManyRequests, AUTH_ERROR_CODES.OTP_LOCKED);
    }

    const isValid = await bcrypt.compare(otp, hashedOtp);

    if (!isValid) {
      throw new ApiError(statusCode.badRequest, AUTH_ERROR_CODES.OTP_INVALID);
    }

    // Clear attempts on success
    await redis.del(attemptKey);

    return true;
  }
}
