import type { RegisterRequestDto } from "@dto/auth";
import type { UserResponseDto } from "@dto/user";
import { statusCode, successResponse } from "@irctc/http";
import { UserMapper } from "@mappers/index.js";
import type { AuthService } from "@services/auth.service.js";
import type { Request, Response } from "express";

export class AuthController {
  /**
   * Creates controller instance for auth HTTP handlers.
   * @param service - Auth service instance
   */

  /**
   * Registers a user and issues authentication cookie.
   * @param req - Express request
   * @param res - Express response
   */
  async register(req: Request, res: Response) {
    const payload = req.body as RegisterRequestDto;
    const authResponse = await this.service.register(payload);

    return res
      .status(statusCode.created)
      .json(successResponse("Registration successful", authResponse));
  }

  constructor(private service: AuthService) {}
}
