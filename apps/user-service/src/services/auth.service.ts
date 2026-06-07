import { randomUUID, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { redis } from "@config/redis.js";
import { env } from "@config/env.js";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import { ERROR_CODES } from "@utils/errors";
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
import { emailService } from "./email.service.js";

export class AuthService {
  constructor(private repo: AuthRepository) {}

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
      logger.warn(
        { module: "auth", email: data.email },
        "Login failed: User not found",
      );
      throw new ApiError(
        statusCode.unauthorized,
        ERROR_CODES.INVALID_CREDENTIALS,
      );
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      logger.warn(
        { module: "auth", email: data.email },
        "Login failed: Invalid password",
      );
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
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    await redis.set(
      `auth:session:${sessionId}`,
      JSON.stringify(sessionData),
      "EX",
      30 * 24 * 60 * 60, // 30 days in seconds
    );

    // Track session for this user to support logout-all
    await redis.sadd(`auth:user:${user.id}:sessions`, sessionId);
    await redis.expire(`auth:user:${user.id}:sessions`, 30 * 24 * 60 * 60);

    logger.info(
      { module: "auth", userId: user.id, sessionId },
      "User logged in successfully",
    );

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
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as any;
      const { sub: userId, sessionId } = decoded;

      if (decoded.type !== "refresh") {
        throw new ApiError(statusCode.unauthorized, "Invalid token type");
      }

      // 1. Load session from Redis
      const sessionKey = `auth:session:${sessionId}`;
      const sessionJson = await redis.get(sessionKey);
      if (!sessionJson) {
        logger.warn(
          { module: "auth", sessionId },
          "Refresh failed: Session not found",
        );
        throw new ApiError(
          statusCode.unauthorized,
          "Session expired or invalid",
        );
      }

      const session = JSON.parse(sessionJson);

      // 2. Verify Fingerprint (Optional but recommended)
      if (session.fingerprint !== fingerprint) {
        logger.warn(
          { module: "auth", sessionId, userId },
          "Fingerprint mismatch detected",
        );
      }

      // 3. Hash incoming refresh token and compare (Reuse Detection)
      const incomingHash = createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      if (session.refreshTokenHash !== incomingHash) {
        logger.error(
          { module: "auth", sessionId, userId },
          "Refresh token reuse detected! Revoking all sessions.",
        );
        await this.logoutAll(userId);
        throw new ApiError(
          statusCode.unauthorized,
          "Refresh token reuse detected",
        );
      }

      // 4. Generate NEW tokens (Rotation)
      const user = await this.repo.findById(userId);
      if (!user) throw new ApiError(statusCode.notFound, "User not found");

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
        30 * 24 * 60 * 60,
      );

      logger.info(
        { module: "auth", userId, sessionId },
        "Token refreshed successfully",
      );
      return AuthMapper.toAuthResponseDto(user, accessToken, newRefreshToken);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(statusCode.unauthorized, "Invalid refresh token");
    }
  }

  /**
   * Retrieves all active sessions for a user.
   */
  async getSessions(userId: string): Promise<any[]> {
    const sessionsKey = `auth:user:${userId}:sessions`;
    const sessionIds = await redis.smembers(sessionsKey);

    const sessions = await Promise.all(
      sessionIds.map(async (id) => {
        const data = await redis.get(`auth:session:${id}`);
        if (!data) return null;
        const parsed = JSON.parse(data);
        return { sessionId: id, ...parsed };
      }),
    );

    return sessions.filter(Boolean);
  }

  /**
   * Revokes a specific session.
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await redis.del(`auth:session:${sessionId}`);
    await redis.srem(`auth:user:${userId}:sessions`, sessionId);
    logger.info({ module: "auth", sessionId, userId }, "Session revoked");
  }

  /**
   * Logs out the current device by deleting the session.
   */
  async logout(sessionId: string, userId: string): Promise<void> {
    logger.info(
      { module: "auth", sessionId, userId },
      "Logging out current device",
    );

    await redis.del(`auth:session:${sessionId}`);
    await redis.srem(`auth:user:${userId}:sessions`, sessionId);

    logger.info({ module: "auth", sessionId }, "Session deleted successfully");
  }

  /**
   * Logs out all devices for a user by deleting all their sessions.
   */
  async logoutAll(userId: string): Promise<void> {
    logger.info({ module: "auth", userId }, "Logging out all devices");

    const sessionsKey = `auth:user:${userId}:sessions`;
    const sessions = await redis.smembers(sessionsKey);

    if (sessions.length > 0) {
      const sessionKeys = sessions.map((id) => `auth:session:${id}`);
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
   * Sends an OTP to the user's email and stores registration state in Redis.
   */
  async sendOtp(data: RegisterRequestDto): Promise<string> {
    // 1. Check if user already exists to prevent spam/duplicate registrations
    const existingUser = await this.repo.findUserByEmail(data.email);
    if (existingUser) {
      logger.warn(
        { module: "auth", email: data.email },
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

    // 4. Send email
    try {
      await emailService.sendOtpEmail(data.email, otp);
    } catch (error) {
      // Rollback OTP and registration session to prevent stale state
      await OtpService.deleteRegistrationSession(sessionId);
      throw error;
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
        { module: "auth", sessionId },
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
      logger.warn(
        { module: "auth", sessionId, error },
        "Session cleanup failed",
      );
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
      { module: "auth", userId: user.id, email: user.email },
      "User registered successfully",
    );

    return AuthMapper.toAuthResponseDto(user, accessToken, refreshToken);
  }
}
