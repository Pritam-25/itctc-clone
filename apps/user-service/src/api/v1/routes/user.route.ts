import { Router } from "express";
import type { Request, Response } from "express";
import { statusCode, successResponse } from "@irctc/http";
import { requireUser } from "@middleware/auth.middleware.js";
import { sessionMiddleware } from "@middleware/session.middleware.js";
import { asyncHandler } from "@irctc/middleware";
import { getAuthController } from "@container/index.js";

const router: Router = Router();

let authControllerPromise = getAuthController();

router.get(
  "/me",
  requireUser,
  sessionMiddleware,
  asyncHandler(async (req, res, next) => {
    const ctrl = await authControllerPromise;
    return ctrl.me(req, res);
  }),
);

export default router;
