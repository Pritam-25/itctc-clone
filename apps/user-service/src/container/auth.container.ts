import { AuthRepository } from "@repository/auth.repo.js";
import { AuthService } from "@services/auth.service.js";
import { AuthController } from "@controllers/auth.controller.js";
import { OtpEventPublisher } from "../kafka/producer/otp-requested.publisher.js";

import { prisma } from "@config/prisma.js";
import { getProducer } from "@config/kafka.js";
import { logger } from "@irctc/logger";

let controllerPromise: Promise<AuthController> | null = null;

/**
 * Returns a fully-wired AuthController. The first call performs the
 * (async) work of connecting the Kafka producer and constructing the
 * service stack; subsequent calls return the same promise. The route
 * module imports this at module-load time, but the underlying await
 * in server.ts's startServer() (which awaits initKafka) is what
 * actually gates readiness — so the first request cannot fire
 * before the controller is built.
 */
export function getAuthController(): Promise<AuthController> {
  if (!controllerPromise) {
    controllerPromise = build();
  }
  return controllerPromise;
}

async function build(): Promise<AuthController> {
  const repository = new AuthRepository(prisma);
  const producer = await getProducer();
  const publisher = new OtpEventPublisher(producer);
  const service = new AuthService(repository, publisher);

  logger.info({ module: "auth-container" }, "Auth dependencies wired");
  return new AuthController(service);
}
