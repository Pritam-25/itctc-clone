import { Router } from "express";
import { asyncHandler, validateSchema } from "@irctc/middleware";
import { createAuthController } from "@container/index.js";
import { RegisterSchema, VerifyOtpRequestSchema, LoginSchema } from "@dto/auth";
import { authMiddleware } from "@middleware/auth.middleware.js";
import { sessionMiddleware } from "@middleware/session.middleware.js";

const router: Router = Router();

const authController = createAuthController();

router.post(
  "/send-otp",
  validateSchema(RegisterSchema),
  asyncHandler(authController.sendOtp.bind(authController)),
);

router.post(
  "/verify-otp",
  validateSchema(VerifyOtpRequestSchema),
  asyncHandler(authController.verifyOtp.bind(authController)),
);

router.post(
  "/login",
  validateSchema(LoginSchema),
  asyncHandler(authController.login.bind(authController)),
);

router.post(
  "/refresh",
  asyncHandler(authController.refresh.bind(authController)),
);

router.get(
  "/me",
  authMiddleware,
  sessionMiddleware,
  asyncHandler(authController.me.bind(authController)),
);

router.post(
  "/logout",
  authMiddleware,
  sessionMiddleware,
  asyncHandler(authController.logout.bind(authController)),
);

router.post(
  "/logout-all",
  authMiddleware,
  sessionMiddleware,
  asyncHandler(authController.logoutAll.bind(authController)),
);

router.get(
  "/sessions",
  authMiddleware,
  sessionMiddleware,
  asyncHandler(authController.getSessions.bind(authController)),
);

router.delete(
  "/sessions/:sessionId",
  authMiddleware,
  sessionMiddleware,
  asyncHandler(authController.revokeSession.bind(authController)),
);

export default router;
