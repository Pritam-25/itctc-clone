import type { Request, Response, NextFunction } from "express";
import { getTraceId } from "@irctc/http";
import { logger } from "@irctc/logger";

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();
  let logged = false;

  const logRequest = () => {
    if (logged) return;
    logged = true;
    const duration = Date.now() - start;
    const rawPath = req.originalUrl ?? req.url ?? req.path ?? "/";
    const sanitizedPath = rawPath.split("?")[0] || "/";

    const logMeta = {
      method: req.method,
      path: sanitizedPath,
      requestId: (req as any).requestId,
      traceId: getTraceId(),
      statusCode: res.statusCode,
      durationMs: duration,
      remoteAddress: req.ip,
      module: "http",
    };

    const message = "request completed";
    const log = (req as any).logger ?? logger;

    if (res.statusCode >= 500) {
      log.error(logMeta, message);
    } else if (res.statusCode >= 400) {
      log.warn(logMeta, message);
    } else {
      log.info(logMeta, message);
    }
  };

  res.on("finish", logRequest);
  res.on("close", logRequest);

  next();
};
