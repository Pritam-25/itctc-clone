import { Router } from "express";
import { asyncHandler, validateSchema } from "@irctc/middleware";
import { createAuthController } from "@container/index.js";
import { RegisterSchema, VerifyOtpRequestSchema } from "@dto/auth";

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

export default router;
