import { Request, Response } from 'express';
import { sensorService } from '../services/sensor.service';

/**
 * SensorController
 * Handles HTTP request/response logic for sensor endpoints
 * Orchestrates calls to service layer and formats responses
 */
export class SensorController {
  /**
   * Create sensor reading (POST /sensor-data)
   *
   * Handles HTTP-specific logic:
   * - Receives validated request (validated by middleware)
   * - Calls service layer for business logic
   * - Formats and sends HTTP response
   *
   * @param req - Express request (body already validated)
   * @param res - Express response
   */
  async createSensorData(req: Request, res: Response): Promise<void> {
    try {
      // Call service layer to handle business logic
      const result = await sensorService.createSensorReading(req.body);

      // Format response based on whether record is new or existing
      if (result.isNew) {
        // New record created - 201 Created
        res.status(201).json({
          success: true,
          message: 'New record created',
          id: result.id,
          data: result.data,
        });
      } else {
        // Existing record returned - 200 OK (idempotent)
        res.status(200).json({
          success: true,
          message: 'Record already exists',
          id: result.id,
          data: result.data,
        });
      }
    } catch (error) {
      // Handle database connection errors
      if (error instanceof Error) {
        if (
          error.message.includes('connect') ||
          error.message.includes('Connection')
        ) {
          res.status(503).json({
            success: false,
            error: 'Database connection error',
            message: 'Unable to connect to database. Please try again later.',
          });
          return;
        }
      }

      // Handle unexpected errors
      console.error('Error in POST /sensor-data:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing sensor data',
      });
    }
  }

  /**
   * Get all sensor readings with optional filters
   *
   * @param req - Express request with optional query params
   * @param res - Express response
   */
  async getAllSensorReadings(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId, startDate, endDate, limit } = req.query;

      const filters = {
        deviceId: deviceId as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        limit: limit ? parseInt(limit as string) : 100,
      };

      const readings = await sensorService.getAllSensorReadings(filters);

      res.status(200).json({
        success: true,
        count: readings.length,
        data: readings,
      });
    } catch (error) {
      console.error('Error fetching sensor readings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sensor readings',
      });
    }
  }
}

// Export singleton instance
export const sensorController = new SensorController();
