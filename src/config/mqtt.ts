import mqtt, { MqttClient } from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

export class MQTTService {
  private client: MqttClient | null = null;
  private isConnecting: boolean = false;
  private hasInitiallyConnected: boolean = false;

  connect(): Promise<MqttClient> {
    // Prevent multiple connections
    if (this.client && this.client.connected) {
      console.log('⚠️  MQTT already connected, reusing existing connection');
      return Promise.resolve(this.client);
    }

    // If client exists but disconnected, return existing client (it will auto-reconnect)
    if (this.client && this.hasInitiallyConnected) {
      console.log('⚠️  MQTT client exists, waiting for reconnection...');
      return Promise.resolve(this.client);
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('⚠️  MQTT connection already in progress, waiting...');
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.client && this.client.connected) {
            clearInterval(checkInterval);
            resolve(this.client);
          } else if (!this.isConnecting) {
            clearInterval(checkInterval);
            reject(new Error('Connection failed'));
          }
        }, 100);
      });
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      // Generate unique client ID to prevent conflicts
      const baseClientId = process.env.MQTT_CLIENT_ID || 'express-mqtt-client';
      const uniqueClientId = `${baseClientId}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      const options: mqtt.IClientOptions = {
        clientId: uniqueClientId,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 5000, // Changed from 1000 to 5000 - less aggressive reconnection
      };

      // Add username and password if provided
      if (process.env.MQTT_USERNAME) {
        options.username = process.env.MQTT_USERNAME;
      }
      if (process.env.MQTT_PASSWORD) {
        options.password = process.env.MQTT_PASSWORD;
      }

      this.client = mqtt.connect(
        process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
        options
      );

      // Track if this is the first connection
      let isFirstConnection = true;

      this.client.on('connect', () => {
        if (isFirstConnection) {
          console.log('✅ Connected to MQTT broker');
          this.isConnecting = false;
          this.hasInitiallyConnected = true;
          isFirstConnection = false;
          resolve(this.client!);
        } else {
          // This is a reconnection, just log quietly
          console.log('🔄 MQTT reconnected');
        }
      });

      this.client.on('disconnect', () => {
        console.log('⚠️  MQTT disconnected, will auto-reconnect...');
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
        this.isConnecting = false;
        if (isFirstConnection) {
          reject(error);
        }
      });

      this.client.on('message', (topic, message) => {
        console.log(
          `📨 Received message on topic ${topic}:`,
          message.toString()
        );
      });
    });
  }

  publish(topic: string, message: string): void {
    if (!this.client) {
      throw new Error('MQTT client not connected');
    }
    this.client.publish(topic, message);
    console.log(`📤 Published to ${topic}:`, message);
  }

  subscribe(topic: string): void {
    if (!this.client) {
      throw new Error('MQTT client not connected');
    }
    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`📬 Subscribed to topic: ${topic}`);
      }
    });
  }

  getClient(): MqttClient | null {
    return this.client;
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      console.log('🔌 Disconnected from MQTT broker');
    }
  }
}

export const mqttService = new MQTTService();
