import { env } from "@config/env.js";
import { logger } from "@irctc/logger";
import { prisma } from "@config/prisma.js";
import { disconnectRedis } from "@config/redis.js";
import app from "./app.js";
import type { Server } from "node:http";

const PORT = env.PORT;

let isShuttingDown = false;
let server: Server | undefined;

const shutdown = async (signal: NodeJS.Signals) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}, shutting down gracefully...`);

  if (server) {
    try {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      logger.info("HTTP server closed.");
    } catch (error) {
      logger.error({ err: error }, "Error occurred while closing HTTP server.");
    }
  }

  try {
    await prisma.$disconnect();
    logger.info("Prisma disconnected successfully.");
    await disconnectRedis();
  } catch (error) {
    logger.error(
      { err: error },
      "Error occurred while disconnecting Prisma and Redis.",
    );
  }

  process.exit(0);
};

const startServer = async () => {
  await prisma.$connect();
  logger.info("Prisma connected successfully.");

  server = app.listen(PORT, () => {
    logger.info(
      `server running at http://localhost:${PORT}/api/v1 (${env.NODE_ENV})`,
    );
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  return server;
};

try {
  await startServer();
} catch (error) {
  logger.error({ err: error }, "Failed to start server.");
  process.exit(1);
}
