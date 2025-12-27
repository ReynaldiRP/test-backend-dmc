import { z } from 'zod';

/**
 * Validation schema for device control command
 *
 * Validates:
 * - device_id: Non-empty string
 * - command: Enum with values 'ON' or 'OFF'
 */
export const deviceControlSchema = z.object({
  device_id: z.string().min(1, 'device_id is required'),
  command: z.enum(['ON', 'OFF'], {
    message: "command must be either 'ON' or 'OFF'",
  }),
});

/**
 * Type inference from Zod schema
 */
export type DeviceControlDTO = z.infer<typeof deviceControlSchema>;
