import { context, trace } from "@opentelemetry/api";
import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Reads the traceId from the auto-instrumented HTTP span and sets it
 * as the X-Trace-Id response header. No manual span creation — that's
 * handled by OpenTelemetry auto-instrumentation (loaded via --import).
 */
export const traceContextMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const span = trace.getSpan(context.active());
  if (span) {
    res.setHeader("X-Trace-Id", span.spanContext().traceId);
  }
  next();
};
