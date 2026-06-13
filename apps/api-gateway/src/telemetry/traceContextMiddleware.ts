import { trace, type Span } from "@opentelemetry/api";
import type { Request, Response, NextFunction, RequestHandler } from "express";

const tracer = trace.getTracer("api-gateway");

export const traceContextMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  tracer.startActiveSpan("http_request", (span: Span) => {
    const traceId = span.spanContext().traceId;
    res.setHeader("X-Trace-Id", traceId);

    res.on("finish", () => {
      span.end();
    });

    next();
  });
};
