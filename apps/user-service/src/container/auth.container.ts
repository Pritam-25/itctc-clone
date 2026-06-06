import { AuthRepository } from "@repository/auth.repo.js";
import { AuthService } from "@services/auth.service.js";
import { AuthController } from "@controllers/auth.controller.js";

import { prisma } from "@config/prisma.js";

/**
 * Creates and wires all Auth feature dependencies.
 *
 * Composition Root for the Auth domain:
 * - AuthRepository
 * - AuthService
 * - AuthController
 *
 * Centralizing dependency construction keeps controllers,
 * services, and repositories decoupled from infrastructure
 * concerns and simplifies testing.
 *
 * @returns {AuthController} Fully configured AuthController instance.
 */
export function createAuthController(): AuthController {
  const repository = new AuthRepository(prisma);
  const service = new AuthService(repository);

  return new AuthController(service);
}
