import { upstreams } from "./upstreams.js";

export const ROUTES = {
  "/api/v1/auth": {
    upstream: upstreams.user,
    rewrite: false,
    auth: "optional",
    rateLimit: "auth",
  },
  "/api/v1/users": {
    upstream: upstreams.user,
    rewrite: false,
    auth: "required",
    rateLimit: "default",
  },
  "/api/v1/notifications": {
    upstream: upstreams.notification,
    rewrite: true,
    auth: "required",
    rateLimit: "default",
  },
} as const;
