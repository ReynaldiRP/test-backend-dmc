import { AppDataSource } from '../config/database';
import {
  DeviceCommand,
  CommandType,
  CommandStatus,
} from '../entities/DeviceCommand';
import { mqttService } from '../config/mqtt';

/**
 * DeviceService
 * Handles business logic for device control operations
 */
export class DeviceService {
  /**
   * Send control command to device
   *
   * Creates a database record, publishes to MQTT, and updates status
   *
   * @param data - Device control data (device_id, command)
   * @returns Created DeviceCommand record with final status
   */
  async sendControlCommand(data: {
    device_id: string;
    command: 'ON' | 'OFF';
  }): Promise<DeviceCommand> {
    const repository = AppDataSource.getRepository(DeviceCommand);

    // Step 1: Create database record with status "queued"
    const commandRecord = repository.create({
      deviceId: data.device_id,
      command: data.command as CommandType,
      status: CommandStatus.QUEUED,
    });

    // Save to database
    const savedCommand = await repository.save(commandRecord);

    // Step 2: Prepare MQTT payload
    const mqttPayload = {
      command: data.command,
      timestamp: new Date().toISOString(),
    };

    const topic = `greenhouse/control/${data.device_id}`;

    try {
      // Step 3: Publish to MQTT
      mqttService.publish(topic, JSON.stringify(mqttPayload));

      // Step 4: Update status to "published" on success
      savedCommand.status = CommandStatus.PUBLISHED;
      await repository.save(savedCommand);
    } catch (error) {
      // Step 5: Update status to "error" on failure
      savedCommand.status = CommandStatus.ERROR;
      savedCommand.errorMessage =
        error instanceof Error ? error.message : 'Unknown MQTT error';
      await repository.save(savedCommand);

      // Re-throw to let controller handle HTTP response
      throw error;
    }

    return savedCommand;
  }
}

// Export singleton instance
export const deviceService = new DeviceService();
