import { Request, Response } from 'express';
import { healthService } from '../services/health.service';

/**
 * HealthController
 * Handles HTTP request/response for health check endpoints
 */
export class HealthController {
  /**
   * Health check endpoint (GET /status)
   *
   * Performs concurrent checks on database and MQTT
   * Returns 200 if healthy, 503 if any service is down
   *
   * @param req - Express request
   * @param res - Express response
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      // Perform health checks concurrently
      const healthStatus = await healthService.performHealthCheck();

      // Determine HTTP status code
      const httpStatus = healthStatus.isHealthy ? 200 : 503;

      // Return health status
      res.status(httpStatus).json({
        service: healthStatus.service,
        db: {
          status: healthStatus.db.status,
          latency_ms: healthStatus.db.latency_ms,
          ...(healthStatus.db.error && { error: healthStatus.db.error }),
        },
        mqtt: {
          status: healthStatus.mqtt.status,
          ...(healthStatus.mqtt.error && { error: healthStatus.mqtt.error }),
        },
      });
    } catch (error) {
      // Handle unexpected errors
      console.error('Error in GET /status:', error);
      res.status(503).json({
        service: 'degraded',
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export singleton instance
export const healthController = new HealthController();
