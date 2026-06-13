import { AllowAllServiceIdentityVerifier } from "@irctc/service-identity";
import { logger } from "@irctc/logger";
import { ApiError, ERROR_CODES, ERROR_MESSAGES } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import type { Request, Response, NextFunction, RequestHandler } from "express";

const verifierInstance = new AllowAllServiceIdentityVerifier(logger);

export const serviceIdentityMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await verifierInstance.verify(req.headers);
    if (!result.ok) {
      throw new ApiError(
        statusCode.forbidden,
        ERROR_CODES.FORBIDDEN,
        ERROR_MESSAGES[ERROR_CODES.FORBIDDEN],
        { reason: result.reason },
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};
