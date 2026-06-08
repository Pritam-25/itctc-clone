import { z } from "zod";

export const UserCreatedV1 = z.object({
  userId: z.uuid(),
  email: z.email(),
  username: z.string(),
  timestamp: z.date(),
});

export type UserCreatedV1Type = z.infer<typeof UserCreatedV1>;

export const UserUpdatedV1 = z.object({
  userId: z.uuid(),
  updates: z.object({
    email: z.email().optional(),
    username: z.string().optional(),
  }),
  timestamp: z.date(),
});

export type UserUpdatedV1Type = z.infer<typeof UserUpdatedV1>;

export const UserDeletedV1 = z.object({
  userId: z.uuid(),
  timestamp: z.date(),
});

export type UserDeletedV1Type = z.infer<typeof UserDeletedV1>;

/**
 * Published by user-service after it has stored an OTP in Redis.
 * Consumed by notification-service to send the OTP via email.
 *
 * Versioning: bump to V2 with a new schema (and new topic) when the
 * payload shape changes. Consumers must use safeParse() and route
 * parse failures straight to the DLQ — never silently drop.
 *
 * Wire format: JSON. `createdAt` is published as a Date object; the
 * publisher's `JSON.stringify` converts it to an ISO 8601 string on
 * the wire. `z.coerce.date()` round-trips it back to a Date on the
 * consumer side, so the in-memory type is `Date` everywhere.
 */
export const OTPRequestedV1 = z.object({
  eventId: z.uuid(),
  userId: z.uuid().optional(),
  email: z.email(),
  otp: z.string().length(6),
  createdAt: z.coerce.date(),
});

export type OTPRequestedV1Type = z.infer<typeof OTPRequestedV1>;
