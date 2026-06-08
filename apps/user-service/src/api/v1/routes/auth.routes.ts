import { Router } from "express";
import { asyncHandler, validateSchema } from "@irctc/middleware";
import { getAuthController } from "@container/index.js";
import { RegisterSchema, VerifyOtpRequestSchema, LoginSchema } from "@dto/auth";
import { authMiddleware } from "@middleware/auth.middleware.js";
import { sessionMiddleware } from "@middleware/session.middleware.js";

const router: Router = Router();

// Container is wired async; the bootstrap in server.ts awaits
// initKafka() before app.listen(), so this resolves before any request.
let authControllerPromise = getAuthController();

router.post(
  "/send-otp",
  validateSchema(RegisterSchema),
  asyncHandler(async (req, res, next) => {
    const ctrl = await authControllerPromise;
    return ctrl.sendOtp(req, res);
  }),
);

router.post(
  "/verify-otp",
  validateSchema(VerifyOtpRequestSchema),
  asyncHandler(async (req, res, next) => {
    const ctrl = await authControllerPromise;
    return ctrl.verifyOtp(req, res);
  }),
);

router.post(
  "/login",
  validateSchema(LoginSchema),
  asyncHandler(async (req, res, next) => {
    const ctrl = await authControllerPromise;
    return ctrl.login(req, res);
  }),
);

router.post("/refresh", (req, res, next) => {
  authControllerPromise.then((ctrl) => ctrl.refresh(req, res)).catch(next);
});

router.get(
  "/me",
  authMiddleware,
  sessionMiddleware,
  asyncHandler(async (req, res, next) => {
    const ctrl = await authControllerPromise;
    return ctrl.me(req, res);
  }),
);

router.post(
  "/logout",
  authMiddleware,
  sessionMiddleware,
  asyncHandler(async (req, res, next) => {
    const ctrl = await authControllerPromise;
    return ctrl.logout(req, res);
  }),
);

router.post(
  "/logout-all",
  authMiddleware,
  sessionMiddleware,
  asyncHandler(async (req, res, next) => {
    const ctrl = await authControllerPromise;
    return ctrl.logoutAll(req, res);
  }),
);

router.get(
  "/sessions",
  authMiddleware,
  sessionMiddleware,
  asyncHandler(async (req, res, next) => {
    const ctrl = await authControllerPromise;
    return ctrl.getSessions(req, res);
  }),
);

router.delete(
  "/sessions/:sessionId",
  authMiddleware,
  sessionMiddleware,
  asyncHandler(async (req, res, next) => {
    const ctrl = await authControllerPromise;
    return ctrl.revokeSession(req, res);
  }),
);

export default router;
