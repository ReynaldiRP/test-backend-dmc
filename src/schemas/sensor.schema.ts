import { z } from 'zod';

/**
 * Validation schema for sensor data submission
 *
 * Validates:
 * - device_id: Non-empty string
 * - timestamp: Valid ISO8601 date string
 * - temperature: Numeric value
 * - humidity: Numeric value
 * - battery: Optional numeric value
 */
export const createSensorDataSchema = z.object({
  device_id: z.string().min(1, 'device_id is required'),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'timestamp must be a valid ISO8601 format',
  }),
  temperature: z.number(),
  humidity: z.number().min(0, 'humidity must be a positive number'),
  battery: z.number().optional(),
});

/**
 * Type inference from Zod schema
 * Can be used for type-safe function parameters
 */
export type CreateSensorDataDTO = z.infer<typeof createSensorDataSchema>;
