import { z } from "zod";

export const UserCreatedV1 = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  timestamp: z.string().datetime(),
});

export type UserCreatedV1Type = z.infer<typeof UserCreatedV1>;

export const UserUpdatedV1 = z.object({
  userId: z.string().uuid(),
  updates: z.object({
    email: z.string().email().optional(),
    username: z.string().optional(),
  }),
  timestamp: z.string().datetime(),
});

export type UserUpdatedV1Type = z.infer<typeof UserUpdatedV1>;

export const UserDeletedV1 = z.object({
  userId: z.string().uuid(),
  timestamp: z.string().datetime(),
});

export type UserDeletedV1Type = z.infer<typeof UserDeletedV1>;
