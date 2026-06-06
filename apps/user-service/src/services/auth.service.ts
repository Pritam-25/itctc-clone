import type { RegisterRequestDto } from "@dto/auth";
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

export class AuthService {
  constructor(private repo: AuthRepository) {}

  /**
   * Generates Access JWT token for authenticated users.
   * @returns Signed Access JWT token
   */
  private generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });
  }

  /**
   * Generates Refresh JWT token for authenticated users.
   * @returns Signed Refresh JWT token
   */
  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });
  }

  /**
   * Registers a new user.
   * Performs duplicate checks and password hashing.
   * @param data - Register payload
   * @returns Auth response with token and user data
   * @throws ApiError when user already exists
   */
  async register(data: RegisterRequestDto): Promise<AuthResponseDto> {
    const existingUser = await this.repo.findUserByEmail(data.email);
    if (existingUser) {
      logger.warn(
        {
          module: "auth",
          email: data.email,
        },
        "User already exists",
      );
      throw new ApiError(statusCode.conflict, ERROR_CODES.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.repo.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
    });

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    logger.info(
      {
        module: "auth",
        userId: user.id,
      },
      "User registered successfully",
    );

    return AuthMapper.toAuthResponseDto(user, accessToken, refreshToken);
  }
}
