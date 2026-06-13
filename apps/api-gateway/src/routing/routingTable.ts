import { type Upstream } from "../config/upstreams.js";
import { ROUTES } from "../config/routes.js";

export interface RouteEntry {
  prefix: string;
  upstream: Upstream;
  rewrite: boolean;
  auth: "required" | "optional" | "none";
  rateLimit: "default" | "auth";
}

export const routingTable: RouteEntry[] = Object.entries(ROUTES).map(
  ([prefix, config]) => ({
    prefix,
    upstream: config.upstream,
    rewrite: config.rewrite,
    auth: config.auth as "required" | "optional" | "none",
    rateLimit: config.rateLimit as "default" | "auth",
  }),
);
