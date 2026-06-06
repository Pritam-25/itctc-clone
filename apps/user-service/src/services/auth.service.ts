import type { RegisterRequestDto, VerifyOtpRequestDto } from "@dto/auth";
import { ApiError } from "@irctc/errors";
import { ERROR_CODES } from "@utils/errors";
import { statusCode } from "@irctc/http";
import type { AuthRepository } from "@repository/auth.repo.js";
import { env } from "@config/env.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { AuthResponseDto } from "@dto/auth";
import { AuthMapper } from "@mappers/auth.mapper.js";
import { logger } from "@irctc/logger";
import { OtpService } from "./otp.service.js";
import { generateOtp } from "@utils/generate-otp.js";
import { emailService } from "./email.service.js";

export class AuthService {
  constructor(private repo: AuthRepository) {}

  private generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });
  }

  /**
   * Sends an OTP to the user's email and stores registration state in Redis.
   */
  async sendOtp(data: RegisterRequestDto): Promise<string> {
    logger.info(
      { module: "auth", email: data.email },
      "Initiating OTP sending flow",
    );

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
    logger.info(
      { module: "auth", sessionId },
      "Verifying OTP and completing registration",
    );

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
    const authResponse = await this.registerUser(regData);

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
  private async registerUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    hashedPassword: string;
  }): Promise<AuthResponseDto> {
    const user = await this.repo.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.hashedPassword,
      emailVerified: true,
    });

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    logger.info(
      { module: "auth", userId: user.id, email: user.email },
      "User registered successfully via OTP verification",
    );

    return AuthMapper.toAuthResponseDto(user, accessToken, refreshToken);
  }
}
