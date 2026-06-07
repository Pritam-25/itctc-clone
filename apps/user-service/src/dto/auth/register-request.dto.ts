import { z } from "zod";

export const RegisterSchema = z
  .object({
    firstName: z.string().min(3),
    lastName: z.string().min(3),
    email: z.email("Invalid email format"),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterRequestDto = z.infer<typeof RegisterSchema>;
