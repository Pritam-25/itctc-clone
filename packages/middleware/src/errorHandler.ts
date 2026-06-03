import type { ErrorRequestHandler } from "express";
import { logger } from "@irctc/logger";
import { getRequestId } from "@irctc/http";
import { normalizeError } from "@irctc/errors";
import { errorResponse } from "@irctc/http";

const errorHandlerMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const normalizedError = normalizeError(err);
  const rawPath = req.originalUrl ?? req.url ?? req.path ?? "/";
  const sanitizedPath = rawPath.split("?")[0] || "/";

  const requestId = getRequestId();
  const log = requestId ? logger.child({ requestId }) : logger;

  log.error(
    {
      err,
      requestId,
      statusCode: normalizedError.statusCode,
      path: sanitizedPath,
      method: req.method,
      module: "http",
    },
    err instanceof Error ? err.message : "Unhandled error",
  );

  return res.status(normalizedError.statusCode).json(errorResponse(err));
};

export default errorHandlerMiddleware;
