import mqtt, { MqttClient } from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

export class MQTTService {
  private client: MqttClient | null = null;

  connect(): Promise<MqttClient> {
    return new Promise((resolve, reject) => {
      const options: mqtt.IClientOptions = {
        clientId: process.env.MQTT_CLIENT_ID || 'express-mqtt-client',
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
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

      this.client.on('connect', () => {
        console.log('✅ Connected to MQTT broker');
        resolve(this.client!);
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
        reject(error);
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
