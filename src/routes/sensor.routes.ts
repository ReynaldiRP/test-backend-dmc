import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { createSensorDataSchema } from '../schemas/sensor.schema';
import { sensorController } from '../controllers/sensor.controller';

const router = Router();

/**
 * Sensor Routes
 * Pure route definitions - no business logic
 *
 * Pattern: Route → Middleware → Controller → Service
 */

/**
 * POST /sensor-data
 * Create sensor reading with idempotent behavior
 *
 * @middleware validate(createSensorDataSchema) - Validates request body
 * @controller sensorController.createSensorData - Handles HTTP logic
 */
router.post(
  '/sensor-data',
  validate(createSensorDataSchema),
  sensorController.createSensorData.bind(sensorController)
);

export default router;
