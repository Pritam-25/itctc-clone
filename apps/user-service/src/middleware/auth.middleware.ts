import type { Request, Response, NextFunction } from "express";
import { readUserFromHeaders, type AuthUser } from "@irctc/auth-headers";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import { ERROR_CODES } from "@utils/errors";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}


/**
 * Middleware to require a trusted user context propagated from the API Gateway.
 * Validates the presence of identity headers and attaches the decoded user metadata.
 */
export const requireUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = readUserFromHeaders(req.headers);

  if (!user) {
    throw new ApiError(
      statusCode.unauthorized,
      ERROR_CODES.ACCESS_TOKEN_MISSING,
    );
  }

  // Attach user information to the request for downstream middlewares and controllers
  req.user = user;

  next();
};

