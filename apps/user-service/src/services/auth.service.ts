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

export class AuthService {
  constructor(private repo: AuthRepository) {}

  /**
   * Generates JWT token for authenticated users.
   * @param userId - User ID
   * @returns Signed JWT token
   */
  private generateToken(userId: string, expiresIn: any) {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn,
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
      throw new ApiError(
        statusCode.conflict,
        ERROR_CODES.USER_ALREADY_EXISTS as any,
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.repo.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
    });

    const accessToken = this.generateToken(user.id, "15m");
    const refreshToken = this.generateToken(user.id, "7d");

    return AuthMapper.toAuthResponseDto(user, accessToken, refreshToken);
  }
}
