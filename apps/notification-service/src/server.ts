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
let consumer: Consumer | undefined;

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
    } catch (err) {
      logger.error(
        { module: "server", err },
        "Error occurred while closing HTTP server",
      );
    }
  }

  if (consumer) {
    try {
      await consumer.disconnect();
      logger.info({ module: "server" }, "Kafka consumer disconnected.");
    } catch (err) {
      logger.error(
        { module: "server", err },
        "Error occurred while disconnecting consumer",
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

  process.exit(0);
};

const startServer = async () => {
  logger.info({ module: "server" }, "Bootstrapping dependencies...");

  // Bootstrap the Kafka consumer. This awaits:
  //   1. Producer connect (for DLQ writes)
  //   2. Consumer connect + subscribe + run
  const { consumer: c } = await bootstrap();
  consumer = c;

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
  shutdown("SIGTERM");
});

process.on("uncaughtException", (err) => {
  logger.error(
    { module: "server", err },
    "Uncaught Exception detected. Shutting down...",
  );
  shutdown("SIGTERM");
});

try {
  await startServer();
} catch (err) {
  logger.error({ module: "server", err }, "Failed to start server.");
  process.exit(1);
}
