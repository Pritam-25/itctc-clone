import type { Request, Response } from "express";
import { statusCode, successResponse } from "@irctc/http";
import { HealthService } from "./health.service.js";

export const liveCheck = (_req: Request, res: Response) => {
  res.status(statusCode.success).json(
    successResponse("Service is alive", {
      status: "alive",
      uptime: process.uptime(),
    }),
  );
};

export const readyCheck = async (_req: Request, res: Response) => {
  try {
    const checks = await HealthService.runReadinessChecks();
    const allHealthy = Object.values(checks).every((v) => v === true);

    if (!allHealthy) {
      return res.status(statusCode.serviceUnavailable).json({
        status: "unhealthy",
        checks,
      });
    }

    res.status(statusCode.success).json(
      successResponse("Service is ready", {
        status: "ready",
        checks,
      }),
    );
  } catch {
    res.status(statusCode.serviceUnavailable).json({
      status: "error",
      message: "Health check failed",
    });
  }
};
