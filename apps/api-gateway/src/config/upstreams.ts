import { z } from "zod";
import { env } from "./env.js";

export type Upstream = { name: string; baseUrl: string; circuitName: string };

const UpstreamUrl = z.string().url();

export const upstreams = {
  user: {
    name: "user",
    baseUrl: UpstreamUrl.parse(env.USER_UPSTREAM),
    circuitName: "user-service",
  },
  notification: {
    name: "notification",
    baseUrl: UpstreamUrl.parse(env.NOTIFICATION_UPSTREAM),
    circuitName: "notification-service",
  },
} satisfies Record<string, Upstream>;
