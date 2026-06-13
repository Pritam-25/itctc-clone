import express from "express";
import type { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { requestIdMiddleware, errorHandler } from "@irctc/middleware";
import { traceContextMiddleware } from "./telemetry/traceContextMiddleware.js";
import { serviceIdentityMiddleware } from "./serviceIdentity/verifier.js";
import { mountRoutes } from "./routing/mountRoutes.js";
import healthRoutes from "./routes/health.routes.js";

const app: Application = express();

// 1. Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// 2. CORS
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "traceparent",
      "baggage",
    ],
    exposedHeaders: ["X-Request-Id", "X-Trace-Id"],
  }),
);

// 3. Cookie Parser
app.use(cookieParser());

// 4. Express JSON parser
app.use(express.json({ limit: "1mb" }));

// 5. Request ID Context
app.use(requestIdMiddleware);

// 6. Telemetry (Root active span)
app.use(traceContextMiddleware);

// 7. Mount self-health checks (does not proxy downstream)
app.use("/health", healthRoutes);

// 8. Service Identity Verifier (V1 allow-all)
app.use(serviceIdentityMiddleware);

// 9. Mount dynamic upstream router table
mountRoutes(app);

// 10. Global Error Handler
app.use(errorHandler);

export default app;
