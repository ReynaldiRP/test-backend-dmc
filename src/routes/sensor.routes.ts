import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { SensorReading } from '../entities/SensorReading';
import { z } from 'zod';

const router = Router();

// ===== Zod Schema Definition =====
/**
 * Validation schema for sensor data
 * Validates device_id, timestamp (ISO8601), temperature, humidity, and optional battery
 */
const sensorDataSchema = z.object({
  device_id: z.string().min(1, 'device_id is required'),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'timestamp must be a valid ISO8601 format',
  }),
  temperature: z.number(),
  humidity: z.number(),
  battery: z.number().optional(),
});

// Type inference from Zod schema
type SensorDataInput = z.infer<typeof sensorDataSchema>;

// ===== Idempotent POST /sensor-data Endpoint =====
/**
 * POST /sensor-data - Idempotent endpoint for creating sensor readings
 *
 * Validates input with Zod and checks for existing records before insertion.
 * If a record with the same device_id and timestamp exists, returns existing record (200).
 * If not, creates new record and returns it (201).
 *
 * Request body:
 * - device_id: string (required)
 * - timestamp: string in ISO8601 format (required)
 * - temperature: number (required)
 * - humidity: number (required)
 * - battery: number (optional)
 */
router.post('/sensor-data', async (req: Request, res: Response) => {
  try {
    // Step 1: Validate request body with Zod
    const validatedData = sensorDataSchema.parse(req.body);

    // Step 2: Get repository
    const repository = AppDataSource.getRepository(SensorReading);

    // Step 3: Check if record already exists (idempotent check)
    const existingReading = await repository.findOne({
      where: {
        deviceId: validatedData.device_id,
        timestamp: new Date(validatedData.timestamp),
      },
    });

    // Step 4: If exists, return existing record with 200 OK
    if (existingReading) {
      return res.status(200).json({
        success: true,
        message: 'Record already exists',
        id: existingReading.id,
        data: existingReading,
      });
    }

    // Step 5: If not exists, create new record
    const newReading = repository.create({
      deviceId: validatedData.device_id,
      timestamp: new Date(validatedData.timestamp),
      temperature: validatedData.temperature,
      humidity: validatedData.humidity,
      battery: validatedData.battery ?? null,
    });

    // Step 6: Save to database
    const savedReading = await repository.save(newReading);

    // Step 7: Return new record with 201 Created
    return res.status(201).json({
      success: true,
      message: 'New record created',
      id: savedReading.id,
      data: savedReading,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error in POST /sensor-data:', error.issues);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // Handle database connection errors
    if (error instanceof Error) {
      if (
        error.message.includes('connect') ||
        error.message.includes('Connection')
      ) {
        return res.status(503).json({
          success: false,
          error: 'Database connection error',
          message: 'Unable to connect to database. Please try again later.',
        });
      }
    }

    // Handle generic errors
    console.error('Error in POST /sensor-data:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing sensor data',
    });
  }
});

export default router;
