import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler, validateSchema } from "@irctc/middleware";
import { createAuthController } from "@container/index.js";
import { RegisterSchema } from "@dto/auth";

const router: Router = Router();

const authController = createAuthController();

router.post(
  "/register",
  validateSchema(RegisterSchema),
  asyncHandler(authController.register.bind(authController)),
);

export default router;
