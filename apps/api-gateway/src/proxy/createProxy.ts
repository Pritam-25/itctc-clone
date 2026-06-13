import {
  createProxyMiddleware,
  fixRequestBody,
  type Options,
} from "http-proxy-middleware";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ClientRequest, IncomingMessage } from "node:http";
import { getBreaker } from "../resilience/breakerRegistry.js";
import { ApiError } from "@irctc/errors";
import { statusCode } from "@irctc/http";
import { ERROR_CODES } from "@irctc/errors";
import { logger } from "@irctc/logger";
import { errorResponse } from "@irctc/http";
import { type Upstream } from "../config/upstreams.js";
import { type AuthUser } from "@irctc/auth-headers";

export const createProxy = (
  routePrefix: string,
  upstream: Upstream,
  rewrite: boolean,
): RequestHandler => {
  const breaker = getBreaker(upstream.circuitName);

  const proxyOptions: Options = {
    target: upstream.baseUrl,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq: ClientRequest, req: IncomingMessage) => {
        // Restream the parsed body if it has been parsed by Express body parser middleware
        fixRequestBody(proxyReq, req);
      },
    },
  };

  proxyOptions.pathRewrite = (path: string) => {
    if (rewrite) {
      // If rewrite is true, we want to strip the route prefix.
      // Since Express router.use(prefix) already strips it from req.url,
      // path is already stripped.
      return path;
    } else {
      // If rewrite is false, we want to preserve the route prefix.
      // Since Express stripped it, we prepend it back to the upstream request.
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      return `${routePrefix}${cleanPath}`.replace(/\/+/g, "/");
    }
  };

  const proxy = createProxyMiddleware(proxyOptions);

  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const traceId = res.getHeader("X-Trace-Id") || "";
    const reqId = req.headers["x-request-id"] || "";
    const userId =
      (req as Request & { user?: AuthUser }).user?.userId || "anonymous";

    try {
      await breaker.execute(() => {
        return new Promise<void>((resolve, reject) => {
          let finished = false;

          const done = (err?: unknown) => {
            if (finished) return;
            finished = true;
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          };

          res.on("finish", () => done());
          res.on("close", () => done());

          proxy(req, res, (err) => {
            if (err) {
              done(err);
            } else {
              done();
            }
          });
        });
      });

      const durationMs = Date.now() - startTime;
      logger.info(
        {
          module: "proxy",
          upstream: upstream.name,
          statusCode: res.statusCode,
          durationMs,
          requestId: reqId,
          traceId,
          userId,
          circuitState: breaker.getState(),
        },
        `Proxy request to ${upstream.name} succeeded`,
      );
    } catch (err: unknown) {
      const error = err as Error;
      const durationMs = Date.now() - startTime;
      const circuitState = breaker.getState();

      logger.error(
        {
          module: "proxy",
          upstream: upstream.name,
          err: error,
          durationMs,
          requestId: reqId,
          traceId,
          userId,
          circuitState,
        },
        `Proxy request to ${upstream.name} failed`,
      );

      if (res.headersSent) {
        return;
      }

      let apiError: ApiError;

      if (error.name === "CircuitOpenError") {
        apiError = new ApiError(
          statusCode.serviceUnavailable,
          ERROR_CODES.SERVICE_UNAVAILABLE,
          `Service is temporarily unavailable (circuit breaker "${upstream.circuitName}" is OPEN)`,
        );
      } else if (error.name === "TimeoutError") {
        apiError = new ApiError(
          statusCode.badGateway,
          ERROR_CODES.SERVICE_UNAVAILABLE,
          "Upstream request timed out",
        );
      } else {
        apiError = new ApiError(
          statusCode.internalError,
          ERROR_CODES.INTERNAL_ERROR,
          error.message || "An error occurred during proxy transmission",
        );
      }

      res.status(apiError.statusCode).json(errorResponse(apiError));
    }
  };
};
