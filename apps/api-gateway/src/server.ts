import { env } from "./config/env.js";
import { logger } from "@irctc/logger";
import { initRedis, disconnectRedis } from "./config/redis.js";
import app from "./app.js";
import type { Server } from "node:http";
import { registerErrorMessages } from "@irctc/errors";
import { ERROR_MESSAGES } from "./utils/errors/index.js";
import { startTelemetry, shutdownTelemetry } from "@irctc/telemetry";

const PORT = env.PORT;

let isShuttingDown = false;
let server: Server | undefined;

const shutdown = async (signal: NodeJS.Signals) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(
    { module: "server" },
    `Received ${signal}, shutting down api-gateway gracefully...`,
  );

  if (server) {
    try {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      logger.info({ module: "server" }, "HTTP server closed.");
    } catch (error) {
      logger.error(
        { module: "server", err: error },
        "Error occurred while closing HTTP server.",
      );
    }
  }

  const teardownResults = await Promise.allSettled([
    disconnectRedis(),
    shutdownTelemetry(),
  ]);

  const failures = teardownResults.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (failures.length === 0) {
    logger.info(
      { module: "server" },
      "All api-gateway infrastructure connections closed successfully.",
    );
  } else {
    logger.error(
      { module: "server", errors: failures.map((f) => f.reason) },
      "One or more api-gateway infrastructure disconnect operations failed.",
    );
  }

  process.exit(0);
};

const startServer = async () => {
  registerErrorMessages(ERROR_MESSAGES);

  logger.info(
    { module: "server" },
    "Bootstrapping api-gateway dependencies...",
  );

  // Initialize Redis client connection
  await initRedis();

  // Initialize Telemetry SDK
  const otlpEndpoint =
    env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";
  logger.info(
    { module: "server", endpoint: otlpEndpoint },
    "Starting OpenTelemetry SDK tracing",
  );
  startTelemetry({
    serviceName: "api-gateway",
    otlpEndpoint,
  });

  logger.info({ module: "server" }, "All dependencies connected successfully.");

  server = app.listen(PORT, () => {
    logger.info(
      { module: "server" },
      `server listening at http://localhost:${PORT} (${env.NODE_ENV})`,
    );
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  return server;
};

process.on("unhandledRejection", (reason) => {
  logger.error(
    { module: "server", err: reason },
    "Unhandled Promise Rejection detected. Shutting down...",
  );
  shutdown("SIGTERM");
});

process.on("uncaughtException", (error) => {
  logger.error(
    { module: "server", err: error },
    "Uncaught Exception detected. Shutting down...",
  );
  shutdown("SIGTERM");
});

try {
  await startServer();
} catch (error) {
  logger.error({ module: "server", err: error }, "Failed to start server.");
  process.exit(1);
}
export { server };
