# 🏗️ Architecture & Development Guidelines

## Project Architecture Pattern

This project follows **Clean Architecture** with clear separation of concerns across layers.

### 📁 Folder Structure

```
src/
├── controllers/        # HTTP request/response handling
├── services/          # Business logic & orchestration
├── middlewares/       # Reusable middleware (validation, auth, etc)
├── schemas/           # Zod validation schemas & DTOs
├── routes/            # Pure route definitions
├── entities/          # TypeORM database models
└── config/            # Configuration files
```

---

## 🎯 Layer Responsibilities

### 1. **Route Layer** (`routes/*.routes.ts`)

- **Purpose:** Define API endpoints (pure configuration)
- **Responsibilities:**
  - Map HTTP methods to controller actions
  - Apply middleware in correct order
  - NO business logic
  - NO validation logic
- **Size:** Keep thin (~20-40 lines per file)

### 2. **Middleware Layer** (`middlewares/*.middleware.ts`)

- **Purpose:** Reusable functions that run before controllers
- **Responsibilities:**
  - Request validation
  - Authentication/Authorization
  - Request transformation
  - Logging
- **Reusability:** Should work across multiple routes

### 3. **Schema Layer** (`schemas/*.schema.ts`)

- **Purpose:** Data validation rules and type definitions
- **Responsibilities:**
  - Zod schema definitions
  - DTO type exports
  - Validation rules
- **No logic:** Pure data definitions

### 4. **Controller Layer** (`controllers/*.controller.ts`)

- **Purpose:** HTTP-specific logic
- **Responsibilities:**
  - Parse request data
  - Call service layer
  - Format HTTP responses
  - Handle HTTP errors (status codes)
- **No business logic:** Just orchestration

### 5. **Service Layer** (`services/*.service.ts`)

- **Purpose:** Business logic and data orchestration
- **Responsibilities:**
  - Business rules
  - Data validation (business rules, not input validation)
  - Database operations via TypeORM
  - Transaction management
- **No HTTP knowledge:** Works without Express

### 6. **Entity Layer** (`entities/*.entity.ts`)

- **Purpose:** Database models
- **Responsibilities:**
  - TypeORM entity definitions
  - Database column mappings
  - Relationships
  - Constraints

---

## 📝 Step-by-Step Guide: Adding a New Feature

Follow these steps to add a new feature following the established pattern.

### Example: Adding "Device Management" Feature

#### Step 1: Create Entity (if new database table needed)

**File:** `src/entities/Device.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  deviceId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  location!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

**Checklist:**

- [ ] Use decorators (@Entity, @Column, etc.)
- [ ] Add JSDoc comments
- [ ] Use proper TypeScript types with `!` for non-nullable
- [ ] Add indexes for frequently queried fields
- [ ] Add unique constraints where needed

---

#### Step 2: Create Migration

```bash
npm run migration:generate src/migrations/AddDeviceEntity
npm run migration:run
```

---

#### Step 3: Create Zod Schema & DTO

**File:** `src/schemas/device.schema.ts`

```typescript
import { z } from 'zod';

/**
 * Schema for creating a new device
 */
export const createDeviceSchema = z.object({
  deviceId: z.string().min(1, 'deviceId is required'),
  name: z.string().min(1, 'name is required'),
  location: z.string().min(1, 'location is required'),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema for updating a device
 */
export const updateDeviceSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema for getting device by ID (path param)
 */
export const deviceIdParamSchema = z.object({
  id: z.string().uuid('Invalid device ID format'),
});

// Type exports
export type CreateDeviceDTO = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceDTO = z.infer<typeof updateDeviceSchema>;
export type DeviceIdParam = z.infer<typeof deviceIdParamSchema>;
```

**Best Practices:**

- [ ] Add descriptive comments
- [ ] Export type definitions
- [ ] Add validation messages
- [ ] Use `.min()`, `.max()`, `.email()` etc. for validation
- [ ] Make optional fields explicit with `.optional()`
- [ ] Provide defaults with `.default(value)`

---

#### Step 4: Create Service Layer

**File:** `src/services/device.service.ts`

```typescript
import { AppDataSource } from '../config/database';
import { Device } from '../entities/Device';
import { CreateDeviceDTO, UpdateDeviceDTO } from '../schemas/device.schema';

/**
 * DeviceService
 * Handles all business logic for device operations
 */
export class DeviceService {
  /**
   * Create a new device
   */
  async createDevice(data: CreateDeviceDTO): Promise<Device> {
    const repository = AppDataSource.getRepository(Device);

    // Business rule: Check if deviceId already exists
    const existing = await repository.findOne({
      where: { deviceId: data.deviceId },
    });

    if (existing) {
      throw new Error('Device with this deviceId already exists');
    }

    // Create and save
    const device = repository.create(data);
    return await repository.save(device);
  }

  /**
   * Get all devices with optional filters
   */
  async getAllDevices(filters?: {
    isActive?: boolean;
    location?: string;
  }): Promise<Device[]> {
    const repository = AppDataSource.getRepository(Device);
    const queryBuilder = repository.createQueryBuilder('device');

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('device.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.location) {
      queryBuilder.andWhere('device.location = :location', {
        location: filters.location,
      });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get device by ID
   */
  async getDeviceById(id: string): Promise<Device | null> {
    const repository = AppDataSource.getRepository(Device);
    return await repository.findOne({ where: { id } });
  }

  /**
   * Update device
   */
  async updateDevice(id: string, data: UpdateDeviceDTO): Promise<Device> {
    const repository = AppDataSource.getRepository(Device);

    const device = await repository.findOne({ where: { id } });
    if (!device) {
      throw new Error('Device not found');
    }

    // Merge updates
    repository.merge(device, data);
    return await repository.save(device);
  }

  /**
   * Delete device
   */
  async deleteDevice(id: string): Promise<void> {
    const repository = AppDataSource.getRepository(Device);
    const result = await repository.delete(id);

    if (result.affected === 0) {
      throw new Error('Device not found');
    }
  }
}

// Export singleton instance
export const deviceService = new DeviceService();
```

**Best Practices:**

- [ ] Use singleton pattern (`export const service = new Service()`)
- [ ] Add JSDoc comments for each method
- [ ] Throw errors for business rule violations
- [ ] Use TypeORM query builder for complex queries
- [ ] Return domain objects (entities), not raw data
- [ ] NO HTTP logic (no req/res)

---

#### Step 5: Create Controller Layer

**File:** `src/controllers/device.controller.ts`

```typescript
import { Request, Response } from 'express';
import { deviceService } from '../services/device.service';

/**
 * DeviceController
 * Handles HTTP request/response for device endpoints
 */
export class DeviceController {
  /**
   * Create device (POST /devices)
   */
  async createDevice(req: Request, res: Response): Promise<void> {
    try {
      const device = await deviceService.createDevice(req.body);

      res.status(201).json({
        success: true,
        message: 'Device created successfully',
        data: device,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({
            success: false,
            error: 'Conflict',
            message: error.message,
          });
          return;
        }
      }

      console.error('Error creating device:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create device',
      });
    }
  }

  /**
   * Get all devices (GET /devices)
   */
  async getAllDevices(req: Request, res: Response): Promise<void> {
    try {
      const { isActive, location } = req.query;

      const filters = {
        isActive:
          isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        location: location as string | undefined,
      };

      const devices = await deviceService.getAllDevices(filters);

      res.status(200).json({
        success: true,
        count: devices.length,
        data: devices,
      });
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch devices',
      });
    }
  }

  /**
   * Get device by ID (GET /devices/:id)
   */
  async getDeviceById(req: Request, res: Response): Promise<void> {
    try {
      const device = await deviceService.getDeviceById(req.params.id);

      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: device,
      });
    } catch (error) {
      console.error('Error fetching device:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch device',
      });
    }
  }

  /**
   * Update device (PUT /devices/:id)
   */
  async updateDevice(req: Request, res: Response): Promise<void> {
    try {
      const device = await deviceService.updateDevice(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Device updated successfully',
        data: device,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Device not found') {
        res.status(404).json({
          success: false,
          error: 'Device not found',
        });
        return;
      }

      console.error('Error updating device:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update device',
      });
    }
  }

  /**
   * Delete device (DELETE /devices/:id)
   */
  async deleteDevice(req: Request, res: Response): Promise<void> {
    try {
      await deviceService.deleteDevice(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Device deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Device not found') {
        res.status(404).json({
          success: false,
          error: 'Device not found',
        });
        return;
      }

      console.error('Error deleting device:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete device',
      });
    }
  }
}

// Export singleton instance
export const deviceController = new DeviceController();
```

**Best Practices:**

- [ ] Use `.bind(controller)` when passing methods to routes
- [ ] Handle all error types (404, 409, 500, 503)
- [ ] Use appropriate HTTP status codes
- [ ] Return consistent response format
- [ ] Log errors with `console.error`
- [ ] Parse query parameters in controller
- [ ] Return void (response sent, not returned)

---

#### Step 6: Create Routes

**File:** `src/routes/device.routes.ts`

```typescript
import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import {
  createDeviceSchema,
  updateDeviceSchema,
  deviceIdParamSchema,
} from '../schemas/device.schema';
import { deviceController } from '../controllers/device.controller';

const router = Router();

/**
 * Device Routes
 * Pure route definitions - no logic
 */

// Create device
router.post(
  '/',
  validate(createDeviceSchema),
  deviceController.createDevice.bind(deviceController)
);

// Get all devices
router.get('/', deviceController.getAllDevices.bind(deviceController));

// Get device by ID
router.get('/:id', deviceController.getDeviceById.bind(deviceController));

// Update device
router.put(
  '/:id',
  validate(updateDeviceSchema),
  deviceController.updateDevice.bind(deviceController)
);

// Delete device
router.delete('/:id', deviceController.deleteDevice.bind(deviceController));

export default router;
```

**Best Practices:**

- [ ] Use `.bind(controller)` for all controller methods
- [ ] Apply validation middleware before controller
- [ ] Keep routes pure (no logic)
- [ ] Add comments for route groups
- [ ] Export default router

---

#### Step 7: Register Routes in App

**File:** `src/app.ts`

```typescript
import deviceRoutes from './routes/device.routes';

// ... other imports

// Register routes
app.use('/api/devices', deviceRoutes); // Add this line
```

---

## 🎨 Code Templates

### Quick Copy-Paste Templates

#### Entity Template

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  fieldName!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
```

#### Schema Template

```typescript
import { z } from 'zod';

export const createSchema = z.object({
  field: z.string().min(1, 'field is required'),
});

export type CreateDTO = z.infer<typeof createSchema>;
```

#### Service Template

```typescript
import { AppDataSource } from '../config/database';
import { Entity } from '../entities/Entity';

export class EntityService {
  async create(data: CreateDTO): Promise<Entity> {
    const repository = AppDataSource.getRepository(Entity);
    const entity = repository.create(data);
    return await repository.save(entity);
  }
}

export const entityService = new EntityService();
```

#### Controller Template

```typescript
import { Request, Response } from 'express';
import { entityService } from '../services/entity.service';

export class EntityController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await entityService.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

export const entityController = new EntityController();
```

#### Route Template

```typescript
import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { createSchema } from '../schemas/entity.schema';
import { entityController } from '../controllers/entity.controller';

const router = Router();

router.post(
  '/',
  validate(createSchema),
  entityController.create.bind(entityController)
);

export default router;
```

---

## ✅ Pre-Deployment Checklist

Before committing new features:

- [ ] Entity has proper indexes
- [ ] Migration created and tested
- [ ] Zod schema validates all fields
- [ ] Service has error handling
- [ ] Controller returns proper status codes
- [ ] Routes use `.bind(controller)`
- [ ] All files have JSDoc comments
- [ ] Tested locally with Postman/curl
- [ ] No business logic in controllers
- [ ] No HTTP logic in services
- [ ] Consistent response format
- [ ] Error logging added

---

## 🚀 HTTP Status Code Guidelines

Use these status codes consistently:

| Code | Meaning             | When to Use                        |
| ---- | ------------------- | ---------------------------------- |
| 200  | OK                  | Successful GET, PUT, DELETE        |
| 201  | Created             | Successful POST (resource created) |
| 400  | Bad Request         | Validation error                   |
| 401  | Unauthorized        | Missing/invalid auth               |
| 403  | Forbidden           | Not allowed                        |
| 404  | Not Found           | Resource doesn't exist             |
| 409  | Conflict            | Duplicate resource                 |
| 422  | Unprocessable       | Business rule violation            |
| 500  | Internal Error      | Unexpected server error            |
| 503  | Service Unavailable | Database/external service down     |

---

## 📊 Response Format Standard

All API responses follow this format:

### Success Response

```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... },
  "count": 10  // For lists
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "User-friendly error message",
  "details": [ ... ]  // For validation errors
}
```

---

## 🧪 Testing Guidelines

### Manual Testing

```bash
# Create
curl -X POST http://localhost:3000/api/resource \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'

# Get all
curl http://localhost:3000/api/resource

# Get by ID
curl http://localhost:3000/api/resource/:id

# Update
curl -X PUT http://localhost:3000/api/resource/:id \
  -H "Content-Type: application/json" \
  -d '{"field": "new value"}'

# Delete
curl -X DELETE http://localhost:3000/api/resource/:id
```

---

## 📚 Additional Resources

- TypeORM Documentation: https://typeorm.io/
- Zod Documentation: https://zod.dev/
- Express Best Practices: https://expressjs.com/en/advanced/best-practice-performance.html

---

## 🎯 Summary

Follow this pattern for **every new feature**:

1. Create Entity (database model)
2. Run Migration
3. Create Schema (validation + DTO)
4. Create Service (business logic)
5. Create Controller (HTTP handling)
6. Create Routes (configuration)
7. Register in app.ts

**Each layer has ONE responsibility. Never mix concerns!**

---

**Last Updated:** 2024-12-27  
**Architecture Version:** 1.0  
**Pattern:** Clean Architecture with Layer Separation
