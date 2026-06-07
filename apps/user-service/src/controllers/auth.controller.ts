import type {
  RegisterRequestDto,
  VerifyOtpRequestDto,
  LoginRequestDto,
} from "@dto/auth";
import { statusCode, successResponse } from "@irctc/http";
import { ApiError } from "@irctc/errors";
import type { AuthService } from "@services/auth.service.js";
import type { Request, Response } from "express";
import { env } from "@config/env.js";
import { COOKIE_NAMES, COOKIE_MAX_AGE } from "@utils/constants/cookie.js";
import { ERROR_CODES } from "@utils/errors";

import { getDeviceFingerprint } from "@utils/fingerprint.js";
import jwt from "jsonwebtoken";
import { UserMapper } from "@mappers/user.mapper.js";

export class AuthController {
  /**
   * Creates controller instance for auth HTTP handlers.
   * @param service - Auth service instance
   */
  constructor(private service: AuthService) {}

  /**
   * Generic helper to set secure, httpOnly cookies.
   */
  private setCookie(
    res: Response,
    name: string,
    value: string,
    maxAge: number,
  ) {
    res.cookie(name, value, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge,
      path: "/",
    });
  }

  /**
   * Refreshes the access token using the refresh token cookie.
   */
  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      throw new ApiError(
        statusCode.unauthorized,
        ERROR_CODES.REFRESH_TOKEN_MISSING,
      );
    }

    const fingerprint = getDeviceFingerprint(req);
    const authResponse = await this.service.refresh(refreshToken, fingerprint);

    this.setCookie(
      res,
      COOKIE_NAMES.ACCESS_TOKEN,
      authResponse.tokens.accessToken,
      COOKIE_MAX_AGE.ACCESS_TOKEN,
    );
    this.setCookie(
      res,
      COOKIE_NAMES.REFRESH_TOKEN,
      authResponse.tokens.refreshToken,
      COOKIE_MAX_AGE.REFRESH_TOKEN,
    );

    return res
      .status(statusCode.success)
      .json(
        successResponse("Tokens refreshed successfully", authResponse.user),
      );
  }

  /**
   * Retrieves all active sessions for the authenticated user.
   */
  async getSessions(req: Request, res: Response) {
    const userId = (req as any).user.userId;
    const sessions = await this.service.getSessions(userId);

    return res
      .status(statusCode.success)
      .json(successResponse("Active sessions retrieved", sessions));
  }

  /**
   * Revokes a specific session by ID.
   */
  async revokeSession(req: Request, res: Response) {
    const { sessionId } = req.params;
    const userId = (req as any).user.userId;

    if (!sessionId) {
      throw new ApiError(
        statusCode.badRequest,
        ERROR_CODES.SESSION_ID_REQUIRED,
      );
    }

    await this.service.revokeSession(sessionId, userId);

    return res
      .status(statusCode.success)
      .json(successResponse("Session revoked successfully", {}));
  }

  /**
   * Retrieves the profile of the currently authenticated user.
   */
  async me(req: Request, res: Response) {
    const userId = (req as any).user.userId;

    // Use service to find user instead of accessing repo directly
    const user = await this.service.getUserById(userId);

    if (!user) {
      throw new ApiError(statusCode.notFound, ERROR_CODES.USER_NOT_FOUND);
    }
    const userDto = UserMapper.toUserResponseDto(user);

    return res
      .status(statusCode.success)
      .json(successResponse("User profile retrieved", userDto));
  }

  /**
   * Handles user login and session creation.
   */
  async login(req: Request, res: Response) {
    const payload = req.body as LoginRequestDto;
    const fingerprint = getDeviceFingerprint(req);

    const authResponse = await this.service.login(payload, fingerprint);

    this.setCookie(
      res,
      COOKIE_NAMES.ACCESS_TOKEN,
      authResponse.tokens.accessToken,
      COOKIE_MAX_AGE.ACCESS_TOKEN,
    );
    this.setCookie(
      res,
      COOKIE_NAMES.REFRESH_TOKEN,
      authResponse.tokens.refreshToken,
      COOKIE_MAX_AGE.REFRESH_TOKEN,
    );

    return res
      .status(statusCode.success)
      .json(successResponse("Login successful", authResponse.user));
  }

  /**
   * Logs out the current device.
   */
  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      throw new ApiError(
        statusCode.unauthorized,
        ERROR_CODES.REFRESH_TOKEN_MISSING,
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET) as any;
    } catch (error) {
      throw new ApiError(
        statusCode.unauthorized,
        ERROR_CODES.REFRESH_TOKEN_INVALID,
      );
    }

    const { userId, sessionId } = decoded;

    await this.service.logout(sessionId, userId);

    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, { path: "/" });
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: "/" });

    return res
      .status(statusCode.success)
      .json(successResponse("Logged out successfully", {}));
  }

  /**
   * Logs out all devices for the user.
   */
  async logoutAll(req: Request, res: Response) {
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      throw new ApiError(
        statusCode.unauthorized,
        ERROR_CODES.REFRESH_TOKEN_INVALID,
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET) as any;
    } catch (error) {
      throw new ApiError(
        statusCode.unauthorized,
        ERROR_CODES.REFRESH_TOKEN_INVALID,
      );
    }

    const { userId } = decoded;

    await this.service.logoutAll(userId);

    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, { path: "/" });
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: "/" });

    return res
      .status(statusCode.success)
      .json(successResponse("Logged out from all devices", {}));
  }

  /**
   * Handles requesting an OTP for registration.
   */
  async sendOtp(req: Request, res: Response) {
    const payload = req.body as RegisterRequestDto;
    const sessionId = await this.service.sendOtp(payload);

    this.setCookie(
      res,
      COOKIE_NAMES.OTP_SESSION,
      sessionId,
      env.OTP_TTL * 1000,
    );

    return res
      .status(statusCode.success)
      .json(successResponse("OTP sent to your email successfully", {}));
  }

  /**
   * Verifies the OTP and completes user registration.
   */
  async verifyOtp(req: Request, res: Response) {
    const sessionId = req.cookies[COOKIE_NAMES.OTP_SESSION];
    if (!sessionId) {
      throw new ApiError(
        statusCode.badRequest,
        ERROR_CODES.OTP_SESSION_NOT_FOUND,
      );
    }

    const payload = req.body as VerifyOtpRequestDto;
    const authResponse = await this.service.verifyAndRegister(
      sessionId,
      payload,
    );

    this.setCookie(
      res,
      COOKIE_NAMES.ACCESS_TOKEN,
      authResponse.tokens.accessToken,
      COOKIE_MAX_AGE.ACCESS_TOKEN,
    );
    this.setCookie(
      res,
      COOKIE_NAMES.REFRESH_TOKEN,
      authResponse.tokens.refreshToken,
      COOKIE_MAX_AGE.REFRESH_TOKEN,
    );

    // Clear the OTP session cookie after successful registration
    res.clearCookie(COOKIE_NAMES.OTP_SESSION, { path: "/" });

    return res
      .status(statusCode.created)
      .json(successResponse("Registration successful", authResponse.user));
  }
}
