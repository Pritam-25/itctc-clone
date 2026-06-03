import { env } from "@config/env.js";
import { logger } from "@irctc/logger";
import { prisma } from "@config/prisma.js";
import app from "./app.js";

const PORT = env.PORT;

let isShuttingDown = false;

const shutdown = async (signal: NodeJS.Signals) => {
  if (isShuttingDown) return;

  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await prisma.$disconnect();
    logger.info("Prisma disconnected successfully.");
  } catch (error) {
    logger.error({ err: error }, "Error occurred while disconnecting Prisma.");
  }

  process.exit(0);
};

const startServer = async () => {
  await prisma.$connect();
  logger.info("Prisma connected successfully.");

  const server = app.listen(PORT, () => {
    logger.info(
      `server running at http://localhost:${PORT}/api/v1 (${env.NODE_ENV})`,
    );
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  return server;
};

await startServer();
