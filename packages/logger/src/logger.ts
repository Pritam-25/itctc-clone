import pino, { Logger } from "pino";
import { context, trace } from "@opentelemetry/api";
import path from "path";
import { fileURLToPath } from "url";
import { REDACT_PATHS } from "./constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serviceName = process.env.SERVICE_NAME ?? "unknown-service";

const isProduction = process.env.NODE_ENV === "production";

const logLevel = isProduction ? "info" : "debug";

const transportOption = !isProduction
  ? {
      target: path.resolve(__dirname, "transport.js"),
      options: {
        ignore:
          "pid,hostname,service,module,statusCode,durationMs,method,path,remoteAddress,message",
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
