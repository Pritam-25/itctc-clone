import { Router } from "express";
import type { Request, Response } from "express";
import { statusCode, successResponse } from "@irctc/http";

const router: Router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(statusCode.success).json(
    successResponse("Service is healthy", {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }),
  );
});

router.get("/", (_req: Request, res: Response) => {
  res.status(statusCode.success).json(
    successResponse("Welcome to User Service API v1", {
      version: "1.0.0",
      endpoints: {
        health: "/api/v1/health",
      },
    }),
  );
});

export default router;
