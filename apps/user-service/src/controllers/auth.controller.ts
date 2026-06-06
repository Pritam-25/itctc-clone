import type { RegisterRequestDto, VerifyOtpRequestDto } from "@dto/auth";
import { statusCode, successResponse } from "@irctc/http";
import type { AuthService } from "@services/auth.service.js";
import type { Request, Response } from "express";
import { env } from "@config/env.js";
import { COOKIE_NAMES, COOKIE_MAX_AGE } from "@utils/constants.js";

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
      return res.status(statusCode.badRequest).json({
        success: false,
        message: "OTP session not found. Please request a new OTP.",
      });
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

    return res
      .status(statusCode.created)
      .json(successResponse("Registration successful", authResponse.user));
  }
}
