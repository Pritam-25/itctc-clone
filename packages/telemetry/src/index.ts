/**
 * @irctc/telemetry
 *
 * OpenTelemetry SDK bootstrap. Each microservice calls {@link startTelemetry}
 * exactly once at boot, right after its infrastructure clients (Redis, Kafka,
 * Prisma) are initialised. The NodeSDK then auto-instruments:
 *
 *   - HTTP (incoming + outgoing)         via @opentelemetry/instrumentation-http
 *   - Express                            via @opentelemetry/instrumentation-express
 *   - ioredis (shared Redis client)      via @opentelemetry/instrumentation-ioredis
 *   - kafkajs (producers + consumers)    via @opentelemetry/instrumentation-kafkajs
 *
 * Once started, every active span is automatically picked up by the
 * `@irctc/logger` mixin (it reads the active span from `@opentelemetry/api`),
 * so `traceId` / `spanId` start appearing in log lines without any further
 * wiring at the call site.
 *
 * Producer-side Kafka trace context is written by the default W3C text-map
 * propagator as part of the `kafkajs` publish span — there is no producer
 * helper to call. Consumers MUST use {@link extractTraceContextFromKafkaHeaders}
 * (from `propagation.ts`) to re-attach the parent context before doing work.
 */
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";
import type { Context } from "@opentelemetry/api";
import os from "node:os";

const DEPLOYMENT_ENVIRONMENT =
  process.env.DEPLOYMENT_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";

/**
 * Shape of a resolved OTLP HTTP endpoint. We accept either:
 *   - a bare host (e.g. "http://otel-collector:4318") and append the default
 *     traces path, or
 *   - an explicit URL ending in `/v1/traces`.
 */
const DEFAULT_OTLP_TRACES_PATH = "/v1/traces";

/**
 * Options accepted by {@link startTelemetry}.
 */
export interface TelemetryOptions {
  /** Logical service name emitted as the `service.name` resource attribute. */
  serviceName: string;
  /** Base URL of the OTLP HTTP collector (no path). */
  otlpEndpoint: string;
  /** Semantic version of the service. Falls back to `0.0.0`. */
  serviceVersion?: string;
  /** Sampling ratio (0.0 to 1.0) for traces. Defaults to 1.0 (always sample). */
  sampleRatio?: number;
  /** Timeout for OTLP trace exports in milliseconds. Defaults to 5000. */
  exporterTimeoutMillis?: number;
  /** Service instance ID. Defaults to process.env.HOSTNAME or host name. */
  serviceInstanceId?: string;
  /** Enable debug console logging for OpenTelemetry. */
  debug?: boolean;
}

/** Holds the singleton SDK instance so shutdown can reach it. */
let sdk: NodeSDK | null = null;

/** Set to true once `startTelemetry` has succeeded. */
let started = false;

/**
 * Build the canonical OTLP traces URL. We normalise trailing slashes and
 * append the standard `/v1/traces` path if the caller gave us a base URL.
 */
function resolveOtlpTracesUrl(endpoint: string): string {
  const trimmed = endpoint.replace(/\/+$/, "");
  if (trimmed.endsWith("/v1/traces")) return trimmed;
  return `${trimmed}${DEFAULT_OTLP_TRACES_PATH}`;
}

/**
 * Initialise the OpenTelemetry Node SDK with the project's standard set of
 * auto-instrumentations. Idempotent: a second call is a no-op so that
 * test suites that import multiple service entrypoints don't double-register
 * instrumentations.
 *
 * @param options - Service identity and OTLP endpoint.
 * @returns The started SDK, mainly useful for tests.
 */
export function startTelemetry(options: TelemetryOptions): NodeSDK {
  if (started) {
    return sdk as NodeSDK;
  }

  // Set up diagnostic logger if OTEL_DEBUG is "true" or debug option is passed
  if (options.debug || process.env.OTEL_DEBUG === "true") {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  const instanceId =
    options.serviceInstanceId ??
    process.env.HOSTNAME ??
    process.env.COMPUTERNAME ??
    os.hostname();

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: options.serviceName,
    [ATTR_SERVICE_VERSION]: options.serviceVersion ?? "0.0.0",
    "deployment.environment": DEPLOYMENT_ENVIRONMENT,
    "service.instance.id": instanceId,
  });

  const traceExporter = new OTLPTraceExporter({
    url: resolveOtlpTracesUrl(options.otlpEndpoint),
    timeoutMillis: options.exporterTimeoutMillis ?? 5000,
  });

  const sampleRatio = options.sampleRatio ?? 1.0;
  const sampler = new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(sampleRatio),
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    sampler,
    instrumentations: [
      getNodeAutoInstrumentations({
        // fs is too noisy for service-level traces; the cost outweighs the
        // value once a service is past the bootstrap phase.
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();
  started = true;

  return sdk;
}

/**
 * Flush pending spans and shut the SDK down. Services call this from their
 * graceful-shutdown sequence, AFTER the HTTP server has stopped accepting
 * new requests but BEFORE the process exits.
 *
 * Wrapped in `Promise.resolve` so callers can `await` it without checking
 * whether telemetry was ever started.
 */
export async function shutdownTelemetry(): Promise<void> {
  if (!started || !sdk) return;
  try {
    await sdk.shutdown();
  } finally {
    sdk = null;
    started = false;
  }
}

/**
 * Test-only escape hatch: reset the singleton guards so a fresh `startTelemetry`
 * call can be issued (e.g. when re-using a test harness across files). Never
 * call this from production code.
 */
export function __resetTelemetryForTests(): void {
  sdk = null;
  started = false;
}

// Re-export the OpenTelemetry Context type for consumers that need to
// attach a span manually (currently only `propagation.ts`).
export type { Context };
