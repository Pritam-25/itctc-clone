import { z } from "zod";

export const RegisterSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  email: z.email(),
  password: z.string().min(8),
});

export type RegisterRequestDto = z.infer<typeof RegisterSchema>;
