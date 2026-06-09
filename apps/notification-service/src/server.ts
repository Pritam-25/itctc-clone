import type { Consumer } from "kafkajs";
import type { Server } from "node:http";

import { env } from "@config/env.js";
import { logger } from "@irctc/logger";
import { disconnectKafka } from "@config/kafka.js";
import { disconnectRedis } from "@config/redis.js";
import { bootstrap } from "@container/index.js";
import app from "./app.js";

const PORT = env.PORT;

let isShuttingDown = false;
let server: Server | undefined;
let otpConsumer: Consumer | undefined;
let loginConsumer: Consumer | undefined;

const shutdown = async (signal: NodeJS.Signals, exitCode: number = 0) => {
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
    } catch (err) {
      logger.error(
        { module: "server", err },
        "Error occurred while closing HTTP server",
      );
    }
  }

  if (otpConsumer) {
    try {
      await otpConsumer.disconnect();
      logger.info({ module: "server" }, "Kafka OTP consumer disconnected.");
    } catch (err) {
      logger.error(
        { module: "server", err },
        "Error occurred while disconnecting OTP consumer",
      );
    }
  }

  if (loginConsumer) {
    try {
      await loginConsumer.disconnect();
      logger.info({ module: "server" }, "Kafka login consumer disconnected.");
    } catch (err) {
      logger.error(
        { module: "server", err },
        "Error occurred while disconnecting login consumer",
      );
    }
  }

  const teardownResults = await Promise.allSettled([
    disconnectKafka(),
    disconnectRedis(),
  ]);

  const failures = teardownResults.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected",
  );
  if (failures.length === 0) {
    logger.info(
      { module: "server" },
      "All infrastructure connections closed successfully.",
    );
  } else {
    logger.error(
      { module: "server", errors: failures.map((f) => f.reason) },
      "One or more infrastructure disconnects failed.",
    );
  }

  process.exit(exitCode);
};

const startServer = async () => {
  logger.info({ module: "server" }, "Bootstrapping dependencies...");

  // Bootstrap the Kafka consumers. This awaits:
  //   1. Producer connect (for DLQ writes)
  //   2. Consumer connect + subscribe + run for each topic
  const { otpConsumer: otp, loginConsumer: login } = await bootstrap();
  otpConsumer = otp;
  loginConsumer = login;

  // Health-probe HTTP server — the only ingress besides Kafka. K8s probes
  // hit this; it does NOT expose the consumer or email provider.
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
  void shutdown("SIGTERM", 1);
});

process.on("uncaughtException", (err) => {
  logger.error(
    { module: "server", err },
    "Uncaught Exception detected. Shutting down...",
  );
  void shutdown("SIGTERM", 1);
});

try {
  await startServer();
} catch (err) {
  logger.error({ module: "server", err }, "Failed to start server.");
  process.exit(1);
}
