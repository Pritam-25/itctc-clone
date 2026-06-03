import type { Request, Response, NextFunction } from "express";
import { ApiError, ERROR_CODES } from "@irctc/errors";
import { statusCode } from "@irctc/http";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(new ApiError(statusCode.notFound, ERROR_CODES.NOT_FOUND));
};
