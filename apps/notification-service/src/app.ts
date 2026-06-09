import express from "express";
import type { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import {
  requestIdMiddleware,
  requestLoggerMiddleware,
  errorHandler,
} from "@irctc/middleware";
import { successResponse, statusCode } from "@irctc/http";
import { env } from "@config/env.js";
import healthRoutes from "@api/v1/routes/health.routes.js";

const app: Application = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-ID",
      "traceparent",
      "baggage",
    ],
    exposedHeaders: ["X-Request-ID", "X-Trace-ID"],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

app.use("/health", healthRoutes);

app.get("/", (_req, res) => {
  res.status(statusCode.success).json(
    successResponse("Welcome to Notification Service API", {
      version: "1.0.0",
    }),
  );
});

app.use(errorHandler);

export default app;
