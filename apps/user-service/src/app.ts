import express from "express";
import type { Request, Response, Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import router from "@api/v1/routes/user.route.js";

import {
  requestIdMiddleware,
  requestLoggerMiddleware,
  errorHandler,
} from "@irctc/middleware";

import { env } from "@config/env.js";

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
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

app.use("/api/v1", router);

app.use(errorHandler);

export default app;
