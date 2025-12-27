import { AppDataSource } from '../config/database';
import { mqttService } from '../config/mqtt';

/**
 * HealthService
 * Handles health check operations for database and MQTT
 */
export class HealthService {
  /**
   * Check database connectivity and measure latency
   *
   * @returns Database status and latency in milliseconds
   */
  async checkDatabase(): Promise<{
    status: 'connected' | 'disconnected';
    latency_ms: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      // Lightweight query to check database connection
      await AppDataSource.query('SELECT 1');

      const latency = Date.now() - startTime;

      return {
        status: 'connected',
        latency_ms: latency,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        latency_ms: 0,
        error:
          error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  /**
   * Check MQTT client connectivity
   *
   * @returns MQTT connection status
   */
  checkMQTT(): {
    status: 'connected' | 'disconnected';
    error?: string;
  } {
    try {
      const client = mqttService.getClient();

      if (!client) {
        return {
          status: 'disconnected',
          error: 'MQTT client not initialized',
        };
      }

      const isConnected = client.connected;

      return {
        status: isConnected ? 'connected' : 'disconnected',
        error: isConnected ? undefined : 'MQTT client disconnected',
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown MQTT error',
      };
    }
  }

  /**
   * Perform complete health check (database + MQTT)
   * Checks are performed concurrently using Promise.allSettled
   *
   * @returns Complete health status of all services
   */
  async performHealthCheck(): Promise<{
    isHealthy: boolean;
    service: 'ok' | 'degraded';
    db: {
      status: 'connected' | 'disconnected';
      latency_ms: number;
      error?: string;
    };
    mqtt: {
      status: 'connected' | 'disconnected';
      error?: string;
    };
  }> {
    // Perform concurrent health checks
    const [dbResult, mqttResult] = await Promise.allSettled([
      this.checkDatabase(),
      Promise.resolve(this.checkMQTT()),
    ]);

    // Extract results
    const dbHealth =
      dbResult.status === 'fulfilled'
        ? dbResult.value
        : {
            status: 'disconnected' as const,
            latency_ms: 0,
            error: 'Health check failed',
          };

    const mqttHealth =
      mqttResult.status === 'fulfilled'
        ? mqttResult.value
        : { status: 'disconnected' as const, error: 'Health check failed' };

    // Determine overall health
    const isHealthy =
      dbHealth.status === 'connected' && mqttHealth.status === 'connected';

    return {
      isHealthy,
      service: isHealthy ? 'ok' : 'degraded',
      db: dbHealth,
      mqtt: mqttHealth,
    };
  }
}

// Export singleton instance
export const healthService = new HealthService();
