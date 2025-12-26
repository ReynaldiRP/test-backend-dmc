import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * IoT Greenhouse Entities Migration
 * Creates sensor_readings and device_commands tables for IoT device management
 */
export class AddIoTGreenhouseEntities1703600000001
  implements MigrationInterface
{
  name = 'AddIoTGreenhouseEntities1703600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for device_commands
    await queryRunner.query(`
            CREATE TYPE "device_commands_command_enum" AS ENUM('ON', 'OFF')
        `);

    await queryRunner.query(`
            CREATE TYPE "device_commands_status_enum" AS ENUM('queued', 'published', 'error')
        `);

    // Create sensor_readings table
    await queryRunner.query(`
            CREATE TABLE "sensor_readings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "deviceId" character varying(255) NOT NULL,
                "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
                "temperature" double precision NOT NULL,
                "humidity" double precision NOT NULL,
                "battery" double precision,
                "raw" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_sensor_readings_deviceId_timestamp" UNIQUE ("deviceId", "timestamp"),
                CONSTRAINT "PK_sensor_readings_id" PRIMARY KEY ("id")
            )
        `);

    // Create index on deviceId for sensor_readings
    await queryRunner.query(`
            CREATE INDEX "IDX_sensor_readings_deviceId" ON "sensor_readings" ("deviceId")
        `);

    // Create index on timestamp for time-based queries
    await queryRunner.query(`
            CREATE INDEX "IDX_sensor_readings_timestamp" ON "sensor_readings" ("timestamp")
        `);

    // Create device_commands table
    await queryRunner.query(`
            CREATE TABLE "device_commands" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "deviceId" character varying(255) NOT NULL,
                "command" "device_commands_command_enum" NOT NULL,
                "status" "device_commands_status_enum" NOT NULL DEFAULT 'queued',
                "errorMessage" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_device_commands_id" PRIMARY KEY ("id")
            )
        `);

    // Create index on deviceId for device_commands
    await queryRunner.query(`
            CREATE INDEX "IDX_device_commands_deviceId" ON "device_commands" ("deviceId")
        `);

    // Create index on status for querying pending commands
    await queryRunner.query(`
            CREATE INDEX "IDX_device_commands_status" ON "device_commands" ("status")
        `);

    // Create composite index on deviceId and createdAt for efficient device command history queries
    await queryRunner.query(`
            CREATE INDEX "IDX_device_commands_deviceId_createdAt" ON "device_commands" ("deviceId", "createdAt" DESC)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop device_commands indexes
    await queryRunner.query(
      `DROP INDEX "IDX_device_commands_deviceId_createdAt"`
    );
    await queryRunner.query(`DROP INDEX "IDX_device_commands_status"`);
    await queryRunner.query(`DROP INDEX "IDX_device_commands_deviceId"`);

    // Drop device_commands table
    await queryRunner.query(`DROP TABLE "device_commands"`);

    // Drop sensor_readings indexes
    await queryRunner.query(`DROP INDEX "IDX_sensor_readings_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_sensor_readings_deviceId"`);

    // Drop sensor_readings table
    await queryRunner.query(`DROP TABLE "sensor_readings"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "device_commands_status_enum"`);
    await queryRunner.query(`DROP TYPE "device_commands_command_enum"`);
  }
}
