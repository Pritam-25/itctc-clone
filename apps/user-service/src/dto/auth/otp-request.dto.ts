import { z } from "zod";

export const VerifyOtpRequestSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
});

export type VerifyOtpRequestDto = z.infer<typeof VerifyOtpRequestSchema>;
