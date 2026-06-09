import { randomUUID, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { redis } from "@config/redis.js";
import { env } from "@config/env.js";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import { ERROR_CODES } from "@utils/errors";
import { REDIS_KEYS } from "@utils/constants/redis-keys.js";
import { AUTH_DURATIONS } from "@utils/constants/auth.js";
import type { AuthRepository } from "@repository/auth.repo.js";
import jwt from "jsonwebtoken";
import type {
  AuthResponseDto,
  RegisterRequestDto,
  VerifyOtpRequestDto,
  LoginRequestDto,
} from "@dto/auth";
import { AuthMapper } from "@mappers/auth.mapper.js";
import { logger } from "@irctc/logger";
import { OtpService } from "./otp.service.js";
import { generateOtp } from "@utils/generate-otp.js";
import { OtpEventPublisher } from "../events/publishers/otp-requested.publisher.js";
import { UserLoggedInEventPublisher } from "../events/publishers/user-logged-in.publisher.js";
import type { OTPRequestedV1Type, UserLoggedInV1Type } from "@irctc/contracts";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  sessionId: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  type: "refresh";
}

export class AuthService {
  constructor(
    private repo: AuthRepository,
    private otpPublisher: OtpEventPublisher,
    private loginPublisher: UserLoggedInEventPublisher,
  ) {}

  private generateAccessToken(
    userId: string,
    sessionId: string,
    email: string,
  ): string {
    return jwt.sign(
      { sub: userId, email, sessionId, type: "access" },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      },
    );
  }

  private generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign(
      { sub: userId, sessionId, type: "refresh" },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      },
    );
  }

  /**
   * Authenticates user and creates a new device session.
   */
  async login(
    data: LoginRequestDto,
    fingerprint: string,
  ): Promise<AuthResponseDto> {
    // 1. Find user
    const user = await this.repo.findUserByEmail(data.email);
    if (!user) {
      logger.warn({ module: "auth" }, "Login failed: User not found");
      throw new ApiError(
        statusCode.unauthorized,
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      logger.warn({ module: "auth" }, "Login failed: Invalid password");
      throw new ApiError(
        statusCode.unauthorized,
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    // 3. Generate Session and Tokens
    const sessionId = randomUUID();
    const accessToken = this.generateAccessToken(
      user.id,
      sessionId,
      user.email,
    );
    const refreshToken = this.generateRefreshToken(user.id, sessionId);

    // 4. Hash refresh token for secure storage
    const refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // 5. Store session in Redis
    const sessionData = {
      userId: user.id,
      fingerprint,
      refreshTokenHash,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + AUTH_DURATIONS.SESSION_TTL_MS,
      ).toISOString(), // 30 days
    };

    await redis.set(
      REDIS_KEYS.authSession(sessionId),
      JSON.stringify(sessionData),
      "EX",
      AUTH_DURATIONS.SESSION_TTL_SECONDS, // 30 days in seconds
    );

    // Track session for this user to support logout-all
    await redis.sadd(REDIS_KEYS.userSessions(user.id), sessionId);
    await redis.expire(
      REDIS_KEYS.userSessions(user.id),
      AUTH_DURATIONS.SESSION_TTL_SECONDS,
    );

    logger.info(
      { module: "auth", userId: user.id },
      "User logged in successfully",
    );

    // Best-effort welcome email: the user has already authenticated
    // and the session is persisted, so a degraded notification queue
    // must NOT roll back the login. The notification service will
    // dedupe on eventId if a redelivery ever lands.
    const loginEvent: UserLoggedInV1Type = {
      eventId: randomUUID(),
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      loggedInAt: new Date(),
    };

    try {
      await this.loginPublisher.publishUserLoggedIn(loginEvent);
    } catch (err) {
      logger.error(
        { module: "auth", err, userId: user.id, email: user.email },
        "Welcome email publish failed; continuing without rollback",
      );
    }

    return AuthMapper.toAuthResponseDto(user, accessToken, refreshToken);
  }

  /**
   * Refreshes the access token using a valid refresh token.
   * Implements Refresh Token Rotation and Reuse Detection.
   */
  async refresh(
    refreshToken: string,
    fingerprint: string,
  ): Promise<AuthResponseDto> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        env.JWT_SECRET,
      ) as RefreshTokenPayload;
      const { sub: userId, sessionId } = decoded;

      if (decoded.type !== "refresh") {
        throw new ApiError(
          statusCode.unauthorized,
          ERROR_CODES.INVALID_TOKEN_TYPE,
        );
      }

      // 1. Load session from Redis
      const sessionKey = REDIS_KEYS.authSession(sessionId);
      const sessionJson = await redis.get(sessionKey);
      if (!sessionJson) {
        logger.warn({ module: "auth" }, "Refresh failed: Session not found");
        throw new ApiError(
          statusCode.unauthorized,
          ERROR_CODES.SESSION_EXPIRED_OR_REVOKED,
        );
      }

      const session = JSON.parse(sessionJson);

      // 2. Verify Fingerprint (Optional but recommended)
      if (session.fingerprint !== fingerprint) {
        logger.warn(
          { module: "auth", userId },
          "Fingerprint mismatch detected",
        );
        await this.logout(sessionId, userId);
        throw new ApiError(
          statusCode.unauthorized,
          ERROR_CODES.DEVICE_FINGERPRINT_MISMATCH,
        );
      }

      // 3. Hash incoming refresh token and compare (Reuse Detection)
      const incomingHash = createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      if (session.refreshTokenHash !== incomingHash) {
        logger.error(
          { module: "auth", userId },
          "Refresh token reuse detected! Revoking all sessions.",
        );
        await this.logoutAll(userId);
        throw new ApiError(
          statusCode.unauthorized,
          ERROR_CODES.REFRESH_TOKEN_INVALID,
        );
      }

      // 4. Generate NEW tokens (Rotation)
      const user = await this.repo.findById(userId);
      if (!user)
        throw new ApiError(statusCode.notFound, ERROR_CODES.USER_NOT_FOUND);

      const accessToken = this.generateAccessToken(
        user.id,
        sessionId,
        user.email,
      );
      const newRefreshToken = this.generateRefreshToken(user.id, sessionId);
      const newRefreshTokenHash = createHash("sha256")
        .update(newRefreshToken)
        .digest("hex");

      // 5. Update session in Redis
      session.refreshTokenHash = newRefreshTokenHash;
      session.lastUsedAt = new Date().toISOString();

      await redis.set(
        sessionKey,
        JSON.stringify(session),
        "EX",
        AUTH_DURATIONS.SESSION_TTL_SECONDS,
      );

      logger.info({ module: "auth", userId }, "Token refreshed successfully");
      return AuthMapper.toAuthResponseDto(user, accessToken, newRefreshToken);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        statusCode.unauthorized,
        ERROR_CODES.INVALID_REFRESH_TOKEN,
      );
    }
  }

  /**
   * Retrieves all active sessions for a user.
   */
  async getSessions(userId: string): Promise<any[]> {
    const sessionsKey = REDIS_KEYS.userSessions(userId);
    const sessionIds = await redis.smembers(sessionsKey);

    const sessions = await Promise.all(
      sessionIds.map(async (id) => {
        const data = await redis.get(REDIS_KEYS.authSession(id));
        if (!data) return null;
        const parsed = JSON.parse(data);
        const { refreshTokenHash, ...safeSession } = parsed;
        return { sessionId: id, ...safeSession };
      }),
    );

    return sessions.filter(Boolean);
  }

  /**
   * Revokes a specific session.
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const sessionKey = REDIS_KEYS.authSession(sessionId);
    const sessionJson = await redis.get(sessionKey);

    if (!sessionJson) return;

    const session = JSON.parse(sessionJson);
    if (session.userId !== userId) {
      logger.warn(
        { module: "auth", userId, ownerId: session.userId },
        "Unauthorized session revocation attempt",
      );
      throw new ApiError(
        statusCode.forbidden,
        ERROR_CODES.SESSION_OWNERSHIP_INVALID,
      );
    }

    await redis.del(sessionKey);
    await redis.srem(REDIS_KEYS.userSessions(userId), sessionId);
    logger.info({ module: "auth", userId }, "Session revoked");
  }

  /**
   * Logs out the current device by deleting the session.
   */
  async logout(sessionId: string, userId: string): Promise<void> {
    logger.info({ module: "auth", userId }, "Logging out current device");

    await redis.del(REDIS_KEYS.authSession(sessionId));
    await redis.srem(REDIS_KEYS.userSessions(userId), sessionId);

    logger.info({ module: "auth", userId }, "Session deleted successfully");
  }

  /**
   * Logs out all devices for a user by deleting all their sessions.
   */
  async logoutAll(userId: string): Promise<void> {
    logger.info({ module: "auth", userId }, "Logging out all devices");

    const sessionsKey = REDIS_KEYS.userSessions(userId);
    const sessions = await redis.smembers(sessionsKey);

    if (sessions.length > 0) {
      const sessionKeys = sessions.map((id) => REDIS_KEYS.authSession(id));
      await redis.del(...sessionKeys);
    }

    await redis.del(sessionsKey);

    logger.info(
      { module: "auth", userId, sessionCount: sessions.length },
      "All user sessions deleted",
    );
  }

  /**
   * Retrieves a user by their ID.
   */
  async getUserById(id: string) {
    return this.repo.findById(id);
  }

  /**
   * Generates an OTP, persists registration state in Redis, and enqueues
   * the OTPRequestedV1 event for asynchronous email delivery by the
   * notification service. Returns immediately on success — the email is
   * not awaited.
   *
   * If the Kafka publish fails after Redis writes succeed, the Redis
   * state is rolled back and a 502 (KAFKA_PUBLISH_FAILED) is returned.
   * The user is never told "OTP sent" unless the event is durably
   * enqueued.
   */
  async sendOtp(data: RegisterRequestDto): Promise<string> {
    // 1. Check if user already exists to prevent spam/duplicate registrations
    const existingUser = await this.repo.findUserByEmail(data.email);
    if (existingUser) {
      logger.warn(
        { module: "auth" },
        "OTP request failed: User already exists",
      );
      throw new ApiError(statusCode.conflict, ERROR_CODES.USER_ALREADY_EXISTS);
    }

    // 2. Generate and store OTP
    const otp = generateOtp();
    const sessionId = await OtpService.storeOtp(data.email, otp);

    // 3. Hash password and store registration session in Redis
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await OtpService.storeRegistrationSession(sessionId, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      hashedPassword,
    });

    // 4. Publish OTPRequestedV1. Roll back on failure so the user can
    //    safely retry without leaving a stale registration session.
    const event: OTPRequestedV1Type = {
      eventId: randomUUID(),
      email: data.email,
      otp,
      createdAt: new Date(),
    };

    try {
      await this.otpPublisher.publishOtpRequested(event);
    } catch (err) {
      logger.error(
        { module: "auth", err, email: data.email },
        "OTP publish failed; rolling back Redis state",
      );
      await OtpService.deleteRegistrationSession(sessionId);
      throw new ApiError(
        statusCode.badGateway,
        ERROR_CODES.KAFKA_PUBLISH_FAILED,
        "Failed to enqueue OTP delivery. Please try again.",
        { cause: err },
      );
    }

    return sessionId;
  }

  /**
   * Verifies the OTP and registers the user using stored registration data.
   */
  async verifyAndRegister(
    sessionId: string,
    data: VerifyOtpRequestDto,
  ): Promise<AuthResponseDto> {
    // 1. Verify OTP
    await OtpService.verifyOtp(sessionId, data.otp);

    // 2. Retrieve registration data from Redis
    const regData = await OtpService.getRegistrationSession(sessionId);
    if (!regData) {
      logger.warn(
        { module: "auth" },
        "Registration session expired or missing",
      );
      throw new ApiError(
        statusCode.notFound,
        ERROR_CODES.REGISTRATION_SESSION_EXPIRED,
      );
    }

    // 3. Execute registration using stored data
    const authResponse = await this.registerUser(regData, sessionId);

    // 4. Clean up sessions (best-effort; do not fail completed registration)
    try {
      await OtpService.deleteRegistrationSession(sessionId);
    } catch (error) {
      logger.warn({ module: "auth", error }, "Session cleanup failed");
    }

    return authResponse;
  }

  /**
   * Internal method to handle user creation and token generation.
   * Now accepts the data already containing the hashedPassword.
   */
  private async registerUser(
    data: {
      firstName: string;
      lastName: string;
      email: string;
      hashedPassword: string;
    },
    sessionId: string,
  ): Promise<AuthResponseDto> {
    const user = await this.repo.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.hashedPassword,
      emailVerified: true,
    });

    const accessToken = this.generateAccessToken(
      user.id,
      sessionId,
      user.email,
    );
    const refreshToken = this.generateRefreshToken(user.id, sessionId);

    logger.info(
      { module: "auth", userId: user.id },
      "User registered successfully",
    );

    return AuthMapper.toAuthResponseDto(user, accessToken, refreshToken);
  }
}
