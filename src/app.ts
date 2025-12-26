import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { mqttService } from './config/mqtt';
import userRoutes from './routes/user.routes';
import mqttRoutes from './routes/mqtt.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🚀 Express + TypeORM + MQTT Server',
    endpoints: {
      users: '/api/users',
      mqtt: '/api/mqtt',
    },
  });
});

app.use('/api/users', userRoutes);
app.use('/api/mqtt', mqttRoutes);

// Initialize connections and start server
const startServer = async () => {
  try {
    // Initialize Database
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    // Initialize MQTT
    await mqttService.connect();
    console.log('✅ MQTT connected successfully');

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
