import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { deviceControlSchema } from '../schemas/device.schema';
import { deviceController } from '../controllers/device.controller';

const router = Router();

/**
 * Device Control Routes
 * Pure route definitions - no logic
 */

/**
 * POST /device-control
 * Send control command to IoT device
 *
 * @middleware validate(deviceControlSchema) - Validates request body
 * @controller deviceController.sendControlCommand - Handles HTTP logic
 */
router.post(
  '/device-control',
  validate(deviceControlSchema),
  deviceController.sendControlCommand.bind(deviceController)
);

export default router;
