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

    let spanEnded = false;
    const endSpan = () => {
      if (!spanEnded) {
        spanEnded = true;
        span.end();
      }
    };

    res.on("finish", endSpan);
    res.on("close", endSpan);

    next();
  });
};
