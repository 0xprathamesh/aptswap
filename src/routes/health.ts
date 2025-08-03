import { Router, Request, Response } from "express";
import { asyncHandler } from "../utils/errorHandler";
import { logger } from "../utils/logger";
import { HealthCheck } from "../types";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     timestamp:
 *                       type: string
 *                     services:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: boolean
 *                         rpc:
 *                           type: boolean
 *                         contracts:
 *                           type: boolean
 *                     version:
 *                       type: string
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const healthCheck: HealthCheck = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: true, // TODO: Add actual database health check
        rpc: true, // TODO: Add actual RPC health check
        contracts: true, // TODO: Add actual contract health check
      },
      version: "1.0.0",
    };

    // Check if any service is unhealthy
    const isHealthy = Object.values(healthCheck.services).every(
      (service) => service
    );
    healthCheck.status = isHealthy ? "healthy" : "unhealthy";

    const statusCode = isHealthy ? 200 : 503;

    logger.info("Health check performed", { status: healthCheck.status });

    res.status(statusCode).json({
      success: isHealthy,
      data: healthCheck,
    });
  })
);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready to accept requests
 *       503:
 *         description: Service is not ready
 */
router.get(
  "/ready",
  asyncHandler(async (req: Request, res: Response) => {
    // Add readiness checks here (database connections, external services, etc.)
    const isReady = true; // TODO: Add actual readiness checks

    if (isReady) {
      res.status(200).json({
        success: true,
        message: "Service is ready",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        success: false,
        message: "Service is not ready",
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get(
  "/live",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Service is alive",
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
