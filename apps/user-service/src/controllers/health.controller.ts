import type { Request, Response } from "express";
import { statusCode, successResponse } from "@irctc/http";
import { HealthService } from "@services/health.service.js";

export const liveCheck = (req: Request, res: Response) => {
  res.status(statusCode.success).json(
    successResponse("Service is alive", {
      status: "alive",
      uptime: process.uptime(),
    }),
  );
};

export const readyCheck = async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(statusCode.serviceUnavailable).json({
      status: "error",
      message: "Health check failed",
    });
  }
};
