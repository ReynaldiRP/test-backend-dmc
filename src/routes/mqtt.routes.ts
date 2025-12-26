import { Router, Request, Response } from 'express';
import { mqttService } from '../config/mqtt';

const router = Router();

// Publish message to MQTT topic
router.post('/publish', (req: Request, res: Response) => {
  try {
    const { topic, message } = req.body;

    if (!topic || !message) {
      return res.status(400).json({
        success: false,
        error: 'Topic and message are required',
      });
    }

    mqttService.publish(topic, message);

    res.json({
      success: true,
      message: `Message published to topic: ${topic}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to publish message',
    });
  }
});

// Subscribe to MQTT topic
router.post('/subscribe', (req: Request, res: Response) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required',
      });
    }

    mqttService.subscribe(topic);

    res.json({
      success: true,
      message: `Subscribed to topic: ${topic}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to subscribe',
    });
  }
});

export default router;
