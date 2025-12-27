import { Request, Response } from 'express';
import { deviceService } from '../services/device.service';

/**
 * DeviceController
 * Handles HTTP request/response for device control endpoints
 */
export class DeviceController {
  /**
   * Send control command to device (POST /device-control)
   *
   * Validates input, creates command record, publishes to MQTT,
   * and updates status based on MQTT publish result
   *
   * @param req - Express request (body validated by middleware)
   * @param res - Express response
   */
  async sendControlCommand(req: Request, res: Response): Promise<void> {
    try {
      // Call service to handle business logic
      const commandRecord = await deviceService.sendControlCommand(req.body);

      // Return success response with record details
      res.status(201).json({
        success: true,
        message: 'Command sent successfully',
        status: commandRecord.status,
        data: {
          id: commandRecord.id,
          deviceId: commandRecord.deviceId,
          command: commandRecord.command,
          status: commandRecord.status,
          createdAt: commandRecord.createdAt,
        },
      });
    } catch (error) {
      // Handle MQTT publish errors
      if (error instanceof Error) {
        // MQTT error - command was saved but publish failed
        res.status(500).json({
          success: false,
          error: 'MQTT publish failed',
          message: error.message,
          status: 'error',
        });
        return;
      }

      // Handle unexpected errors
      console.error('Error in POST /device-control:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process device control command',
      });
    }
  }
}

// Export singleton instance
export const deviceController = new DeviceController();
