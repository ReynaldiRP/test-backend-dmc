import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

/**
 * Health Check Routes
 * Pure route definitions - no logic
 */

/**
 * GET /status
 * Health check endpoint for monitoring service status
 *
 * @controller healthController.getStatus - Handles HTTP logic
 */
router.get('/status', healthController.getStatus.bind(healthController));

export default router;
