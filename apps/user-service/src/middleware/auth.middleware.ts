import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "@config/env.js";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import { COOKIE_NAMES } from "@utils/constants.js";

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
    throw new ApiError(statusCode.unauthorized, "Access token missing");
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    if (decoded.type !== "access") {
      throw new ApiError(statusCode.unauthorized, "Invalid token type");
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
      "Invalid or expired access token",
    );
  }
};
