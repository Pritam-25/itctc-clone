/**
 * OpenTelemetry bootstrap entrypoint.
 *
 * This module MUST be loaded via `node --import` BEFORE any application
 * code, so that auto-instrumentations can monkey-patch http, express,
 * ioredis, kafkajs, etc. before they are first imported.
 *
 * Usage:
 *   node --import @irctc/telemetry/instrumentation dist/server.js
 */
import { startTelemetry } from "./index.js";

const serviceName =
  process.env.OTEL_SERVICE_NAME ??
  process.env.SERVICE_NAME ??
  "unknown-service";

const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";

startTelemetry({
  serviceName,
  otlpEndpoint,
  debug: process.env.OTEL_DEBUG === "true",
});
