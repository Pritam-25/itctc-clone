import type { Request, Response } from "express";
import { prisma } from "@config/prisma.js";
import { redis } from "@config/redis.js";
import { isKafkaProducerReady } from "@config/kafka.js";
import { statusCode, successResponse } from "@irctc/http";

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
    const checks: Record<string, boolean> = {};

    // Database check
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (e) {
      checks.database = false;
    }

    // Redis check
    checks.redis = redis.status === "ready";

    // Kafka check
    try {
      // Lightweight check: just verify if the producer instance is initialized.
      // This avoids calling connect() on every probe request.
      checks.kafka = isKafkaProducerReady();
    } catch (e) {
      checks.kafka = false;
    }

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
