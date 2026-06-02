import pino, { Logger } from "pino";
import { context, trace } from "@opentelemetry/api";
import { REDACT_PATHS } from "./constants.js";

const serviceName = process.env.SERVICE_NAME ?? "unknown-service";

const isProduction = process.env.NODE_ENV === "production";

const logLevel = isProduction ? "info" : "debug";

const transportOption = !isProduction
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: true,
      },
    }
  : undefined;

export const logger: Logger = pino({
  level: logLevel,

  redact: {
    paths: REDACT_PATHS,
    censor: "[REDACTED]",
  },

  base: {
    service: serviceName,
  },

  messageKey: "message",

  timestamp: pino.stdTimeFunctions.isoTime,

  formatters: {
    level(label: string) {
      return { level: label };
    },
  },

  mixin() {
    const currentSpan = trace.getSpan(context.active());

    if (!currentSpan) {
      return {};
    }

    const spanContext = currentSpan.spanContext();

    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  },

  transport: transportOption,
});
