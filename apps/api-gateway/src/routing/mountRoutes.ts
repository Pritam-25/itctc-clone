import type { Router } from "express";
import { routingTable } from "./routingTable.js";
import { createProxy } from "../proxy/createProxy.js";
import { getRateLimitMiddleware } from "../ratelimit/rateLimitMiddleware.js";
import {
  gatewayAuthMiddleware,
  optionalGatewayAuthMiddleware,
} from "../auth/gatewayAuthMiddleware.js";
import { proxyHeadersMiddleware } from "../proxy/proxyHeadersMiddleware.js";

export const mountRoutes = (router: Router): void => {
  for (const entry of routingTable) {
    const middlewareChain = [];

    // 1. Authentication Middleware
    if (entry.auth === "required") {
      middlewareChain.push(gatewayAuthMiddleware);
    } else if (entry.auth === "optional") {
      middlewareChain.push(optionalGatewayAuthMiddleware);
    }

    // 2. Second-line double scrub of X-User-* headers
    middlewareChain.push(proxyHeadersMiddleware);

    // 3. Rate Limiting Middleware
    middlewareChain.push(getRateLimitMiddleware(entry.rateLimit));

    // 4. Proxy Middleware
    const proxy = createProxy(entry.prefix, entry.upstream, entry.rewrite);
    middlewareChain.push(proxy);

    // Mount the chain on the route prefix
    router.use(entry.prefix, ...middlewareChain);
  }
};
