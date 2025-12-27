import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { mqttService } from './config/mqtt';
import mqttRoutes from './routes/mqtt.routes';
import sensorRoutes from './routes/sensor.routes';
import deviceRoutes from './routes/device.routes';
import healthRoutes from './routes/health.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🚀 IoT Greenhouse Monitoring System',
    version: '1.0.0',
    description: 'Express + TypeORM + MQTT + PostgreSQL',
    endpoints: {
      health: '/api/health/status',
      mqtt: '/api/mqtt',
      sensorData: '/api/sensors/sensor-data',
      deviceControl: '/api/devices/device-control',
    },
    documentation: {
      apiDocs: 'See API_DOCUMENTATION.md',
      architecture: 'See ARCHITECTURE_GUIDELINES.md',
      readme: 'See README.md',
    },
  });
});

app.use('/api/mqtt', mqttRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/health', healthRoutes);

// Initialize connections and start server
const startServer = async () => {
  try {
    // Initialize Database
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // Initialize MQTT (with connection reuse protection)
    try {
      await mqttService.connect();
      console.log('✅ MQTT connected successfully');
    } catch (mqttError) {
      // Don't fail the entire server if MQTT connection fails or already exists
      console.error(
        '⚠️  MQTT connection issue (server will continue):',
        mqttError
      );
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mqttService.disconnect();
  await AppDataSource.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  mqttService.disconnect();
  await AppDataSource.destroy();
  process.exit(0);
});

startServer();

export default app;
