import { AppDataSource } from '../config/database';
import { SensorReading } from '../entities/SensorReading';

/**
 * SensorService
 * Handles all business logic for sensor data operations
 * Separated from HTTP layer for testability and reusability
 */
export class SensorService {
  /**
   * Create sensor reading with idempotent logic
   *
   * If a record with same deviceId and timestamp exists, returns existing record
   * Otherwise creates and returns new record
   *
   * @param data - Validated sensor data
   * @returns Object with isNew flag, id, and sensor reading data
   */
  async createSensorReading(data: {
    device_id: string;
    timestamp: string;
    temperature: number;
    humidity: number;
    battery?: number;
  }): Promise<{ isNew: boolean; id: string; data: SensorReading }> {
    const repository = AppDataSource.getRepository(SensorReading);

    // Convert timestamp string to Date object
    const timestampDate = new Date(data.timestamp);

    // Check if record already exists (idempotent check)
    const existingReading = await repository.findOne({
      where: {
        deviceId: data.device_id,
        timestamp: timestampDate,
      },
    });

    // If exists, return existing record
    if (existingReading) {
      return {
        isNew: false,
        id: existingReading.id,
        data: existingReading,
      };
    }

    // Create new sensor reading
    const newReading = repository.create({
      deviceId: data.device_id,
      timestamp: timestampDate,
      temperature: data.temperature,
      humidity: data.humidity,
      battery: data.battery ?? null,
    });

    // Save to database
    const savedReading = await repository.save(newReading);

    return {
      isNew: true,
      id: savedReading.id,
      data: savedReading,
    };
  }

  /**
   * Get all sensor readings with optional filtering
   *
   * @param filters - Optional filters for deviceId, date range, limit
   * @returns Array of sensor readings
   */
  async getAllSensorReadings(filters?: {
    deviceId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<SensorReading[]> {
    const repository = AppDataSource.getRepository(SensorReading);
    const queryBuilder = repository.createQueryBuilder('reading');

    // Apply filters if provided
    if (filters?.deviceId) {
      queryBuilder.andWhere('reading.deviceId = :deviceId', {
        deviceId: filters.deviceId,
      });
    }

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere(
        'reading.timestamp BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        }
      );
    } else if (filters?.startDate) {
      queryBuilder.andWhere('reading.timestamp >= :startDate', {
        startDate: filters.startDate,
      });
    }

    // Order by most recent first
    queryBuilder.orderBy('reading.timestamp', 'DESC');

    // Apply limit
    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    return await queryBuilder.getMany();
  }
}

// Export singleton instance
export const sensorService = new SensorService();
