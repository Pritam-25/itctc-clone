import { z } from "zod";

export const VerifyOtpRequestSchema = z.object({
  otp: z.string().length(6),
});

export type VerifyOtpRequestDto = z.infer<typeof VerifyOtpRequestSchema>;
