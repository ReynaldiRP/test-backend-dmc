import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Command types that can be sent to IoT devices
 */
export enum CommandType {
  ON = 'ON',
  OFF = 'OFF',
}

/**
 * Status of the device command execution
 */
export enum CommandStatus {
  QUEUED = 'queued',
  PUBLISHED = 'published',
  ERROR = 'error',
}

/**
 * DeviceCommand Entity
 * Stores commands sent to IoT greenhouse devices and tracks their execution status.
 */
@Entity('device_commands')
export class DeviceCommand {
  /**
   * Unique identifier for the device command
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Identifier of the target device for this command
   */
  @Index()
  @Column({ type: 'varchar', length: 255 })
  deviceId!: string;

  /**
   * The command to be executed on the device
   */
  @Column({
    type: 'enum',
    enum: CommandType,
  })
  command!: CommandType;

  /**
   * Current status of the command execution
   */
  @Column({
    type: 'enum',
    enum: CommandStatus,
    default: CommandStatus.QUEUED,
  })
  status!: CommandStatus;

  /**
   * Error message if the command execution failed
   */
  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  /**
   * Timestamp when this command was created
   */
  @CreateDateColumn()
  createdAt!: Date;
}
