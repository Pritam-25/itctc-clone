import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "@config/env.js";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import { ERROR_CODES } from "@utils/errors";
import { COOKIE_NAMES } from "@utils/constants/cookie.js";

export interface AuthUser {
  userId: string;
  email?: string;
  sessionId: string;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

  if (!token) {
    throw new ApiError(
      statusCode.unauthorized,
      ERROR_CODES.ACCESS_TOKEN_MISSING,
    );
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    if (decoded.type !== "access") {
      throw new ApiError(
        statusCode.unauthorized,
        ERROR_CODES.INVALID_TOKEN_TYPE,
      );
    }

    // Attach user information to the request
    (req as any).user = {
      userId: decoded.sub,
      email: decoded.email,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      statusCode.unauthorized,
      ERROR_CODES.REFRESH_TOKEN_INVALID,
    );
  }
};
