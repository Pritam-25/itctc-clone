import { AllowAllServiceIdentityVerifier } from "@irctc/service-identity";
import { logger } from "@irctc/logger";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import { ERROR_CODES } from "@irctc/errors";
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
        `Service identity verification failed: ${result.reason}`,
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};
