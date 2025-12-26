import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * SensorReading Entity
 * Stores IoT sensor readings from greenhouse devices including temperature,
 * humidity, battery level, and raw sensor data.
 */
@Entity('sensor_readings')
@Unique(['deviceId', 'timestamp'])
export class SensorReading {
  /**
   * Unique identifier for the sensor reading
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Identifier of the device that generated this reading
   */
  @Index()
  @Column({ type: 'varchar', length: 255 })
  deviceId!: string;

  /**
   * Timestamp when the sensor reading was recorded
   */
  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  /**
   * Temperature reading in degrees Celsius
   */
  @Column({ type: 'float' })
  temperature!: number;

  /**
   * Humidity reading as a percentage (0-100)
   */
  @Column({ type: 'float' })
  humidity!: number;

  /**
   * Battery level as a percentage (0-100), optional
   */
  @Column({ type: 'float', nullable: true })
  battery!: number | null;

  /**
   * Raw sensor data in JSON format for additional sensor information
   */
  @Column({ type: 'jsonb', nullable: true })
  raw!: Record<string, any> | null;

  /**
   * Timestamp when this record was created in the database
   */
  @CreateDateColumn()
  createdAt!: Date;
}
