import { env } from "@config/env.js";
import { logger } from "@irctc/logger";
import { prisma } from "@config/prisma.js";
import { disconnectRedis, initRedis } from "@config/redis.js";
import { initKafka, disconnectKafka } from "@config/kafka.js";
import app from "./app.js";
import type { Server } from "node:http";
import { registerErrorMessages } from "@irctc/errors";
import { ERROR_MESSAGES } from "@utils/errors";
import { shutdownTelemetry } from "@irctc/telemetry";

const PORT = env.PORT;

let isShuttingDown = false;
let server: Server | undefined;

/**
 * Graceful shutdown sequence as per industry standards:
 * 1. Stop HTTP server (draining requests)
 * 2. Disconnect Kafka clients
 * 3. Disconnect Redis
 * 4. Disconnect Prisma
 */
const shutdown = async (signal: NodeJS.Signals) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(
    { module: "server" },
    `Received ${signal}, shutting down gracefully...`,
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

  // Run all disconnects independently — a failure in one must not skip the
  // others, otherwise K8s may see the pod exit with live connections still
  // open. Promise.allSettled waits for every promise before aggregating.
  const teardownResults = await Promise.allSettled([
    disconnectKafka(),
    disconnectRedis(),
    prisma.$disconnect(),
    shutdownTelemetry(),
  ]);

  const failures = teardownResults.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (failures.length === 0) {
    logger.info(
      { module: "server" },
      "All infrastructure connections closed successfully.",
    );
  } else {
    logger.error(
      { module: "server", errors: failures.map((f) => f.reason) },
      "One or more infrastructure disconnect operations failed.",
    );
  }

  process.exit(0);
};

const startServer = async () => {
  registerErrorMessages(ERROR_MESSAGES);

  logger.info({ module: "server" }, "Bootstrapping dependencies...");

  // Parallel initialization of dependencies to reduce startup time
  await Promise.all([prisma.$connect(), initRedis(), initKafka()]);

  logger.info({ module: "server" }, "All dependencies connected successfully.");

  // Telemetry SDK is bootstrapped via --import @irctc/telemetry/instrumentation
  // before this module loads, ensuring auto-instrumentation patches http/express first.

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

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  logger.error(
    { module: "server", err: reason },
    "Unhandled Promise Rejection detected. Shutting down...",
  );
  shutdown("SIGTERM");
});

// Handle uncaught exceptions
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
