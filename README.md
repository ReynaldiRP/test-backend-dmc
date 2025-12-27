# IoT Greenhouse Monitoring System

A production-ready Node.js backend application for IoT greenhouse monitoring with sensor data collection and device command management.

## 🚀 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: TypeORM with PostgreSQL
- **Validation**: Zod for schema validation
- **Messaging**: MQTT.js for IoT communication
- **Database**: PostgreSQL with proper migrations
- **Development**: Nodemon + ts-node for hot-reload

## ✨ Key Features

### 🌡️ Sensor Data Management

- **Idempotent sensor data submission** with Zod validation
- Real-time sensor readings (temperature, humidity, battery)
- Device-based data organization
- Time-series data with timezone support
- Flexible raw data storage (JSONB)
- Statistical aggregations (avg, min, max)
- Unique constraint prevents duplicate readings
- ISO8601 timestamp format validation

### 🎮 Device Command Control

- Queue-based command system
- MQTT integration for device communication
- Command status tracking (queued → published → error)
- Retry mechanism for failed commands
- Device-specific command history

### 📡 MQTT Integration

- Pub/Sub messaging pattern
- Auto-reconnection handling
- Topic-based message routing
- Connected to IoT devices via MQTT broker

### 🗄️ Database Best Practices

- **Migration-based schema management** (no auto-sync)
- Proper indexing for query performance
- UUID primary keys for distributed systems
- Timestamptz for timezone awareness
- Enum types for data constraints
- Compound unique constraints

## 📁 Project Structure (Clean Architecture)

```
test-kerja/
├── src/
│   ├── controllers/              # HTTP request/response handling
│   │   ├── sensor.controller.ts
│   │   ├── device.controller.ts
│   │   └── health.controller.ts
│   ├── services/                 # Business logic layer
│   │   ├── sensor.service.ts
│   │   ├── device.service.ts
│   │   └── health.service.ts
│   ├── middlewares/              # Reusable middleware
│   │   └── validate.middleware.ts
│   ├── schemas/                  # Zod validation & DTOs
│   │   ├── sensor.schema.ts
│   │   └── device.schema.ts
│   ├── routes/                   # Pure route definitions
│   │   ├── mqtt.routes.ts
│   │   ├── sensor.routes.ts
│   │   ├── device.routes.ts
│   │   └── health.routes.ts
│   ├── entities/                 # TypeORM database models
│   │   ├── User.ts
│   │   ├── SensorReading.ts
│   │   └── DeviceCommand.ts
│   ├── migrations/               # Database migrations
│   │   ├── 1703600000000-InitialSchema.ts
│   │   └── 1703600000001-AddIoTGreenhouseEntities.ts
│   ├── config/                   # Configuration files
│   │   ├── database.ts
│   │   └── mqtt.ts
│   └── app.ts                    # Application entry point
│
├── Documentation/
│   ├── README.md                      # Project overview (this file)
│   ├── API_DOCUMENTATION.md           # API reference
│   ├── ARCHITECTURE_GUIDELINES.md     # 🆕 Architecture & dev guidelines
│   ├── QUICK_REFERENCE.md             # 🆕 Quick reference for adding features
│   ├── BEST_PRACTICES.md              # Best practices guide
│   └── MIGRATIONS.md                  # Migration documentation
│
├── Configuration/
│   ├── data-source.ts            # TypeORM CLI configuration
│   ├── .env                      # Environment variables
│   ├── .env.example              # Environment template
│   ├── tsconfig.json             # TypeScript configuration
│   ├── nodemon.json              # Nodemon configuration
│   └── package.json              # Dependencies and scripts
```

### 🏗️ Architecture Pattern

This project follows **Clean Architecture** with clear layer separation:

```
HTTP Request
    ↓
Route (Pure Configuration)
    ↓
Middleware (Validation)
    ↓
Controller (HTTP Handling)
    ↓
Service (Business Logic)
    ↓
Repository (TypeORM)
    ↓
Database
```

**📖 For detailed architecture guidelines, see [`ARCHITECTURE_GUIDELINES.md`](ARCHITECTURE_GUIDELINES.md)**

## 🔧 Installation

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- MQTT Broker (Mosquitto recommended)

### 1. Clone and Install Dependencies

```bash
cd test-kerja
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=greenhouse_db

# MQTT Broker
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=greenhouse-server
```

### 3. Set Up PostgreSQL Database

```bash
# Create database
createdb greenhouse_db

# Or using psql
psql -U postgres
CREATE DATABASE greenhouse_db;
\q
```

### 4. Run Database Migrations

```bash
# Run all migrations to set up schema
npm run migration:run

# Check migration status
npm run migration:show
```

Expected output:

```
[X] InitialSchema1703600000000
[X] AddIoTGreenhouseEntities1703600000001
```

### 5. Set Up MQTT Broker (Optional - for local testing)

**Windows:**

```bash
# Download from https://mosquitto.org/download/
# Run Mosquitto
mosquitto -v
```

**Or use a public test broker:**

```env
# In .env file
MQTT_BROKER_URL=mqtt://test.mosquitto.org
```

## 🏃 Running the Application

### Development Mode (with auto-reload):

```bash
npm run dev
```

### Production Build:

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

Server will be running at: `http://localhost:3000`

## 📡 API Endpoints

### Base URL

```
http://localhost:3000
```

### Quick Reference

#### Health Check

- `GET /api/health/status` - Service health check (database + MQTT)

#### Sensor Data (Idempotent Endpoint)

- `POST /api/sensors/sensor-data` - Idempotent sensor submission with Zod validation

#### Device Control

- `POST /api/devices/device-control` - Send control command to IoT device via MQTT

#### MQTT

- `POST /api/mqtt/publish` - Publish to topic
- `POST /api/mqtt/subscribe` - Subscribe to topic

**📚 Full API Documentation**: See `API_DOCUMENTATION.md`

## 🧪 Testing the API

### Idempotent Sensor Data Submission

```bash
# Uses Zod validation and prevents duplicates
curl -X POST http://localhost:3000/api/sensors/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "timestamp": "2024-12-26T10:30:00Z",
    "temperature": 24.5,
    "humidity": 68.0,
    "battery": 92.5
  }'

# Sending same data again returns existing record (idempotent)
curl -X POST http://localhost:3000/api/sensors/sensor-data \
  -H "Content-Type": application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "timestamp": "2024-12-26T10:30:00Z",
    "temperature": 24.5,
    "humidity": 68.0,
    "battery": 92.5
  }'
```

## 🗄️ Database Schema

### Entities

#### SensorReading

- Stores IoT sensor data from greenhouse devices
- Unique constraint on (deviceId, timestamp)
- Indexes on deviceId and timestamp for fast queries

#### DeviceCommand

- Manages commands sent to IoT devices
- Queue-based system with status tracking
- MQTT integration for command delivery

#### User

- User management and authentication support

**📊 Full Schema Details**: Run `npm run migration:show` or see `MIGRATIONS.md`

## 🔄 Database Migrations

This project uses **TypeORM migrations** for all schema changes.

### Common Commands

```bash
# Show migration status
npm run migration:show

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration after entity changes
npm run migration:generate src/migrations/MigrationName

# Create empty migration
npm run migration:create src/migrations/CustomMigration
```

**📖 Full Migration Guide**: See `MIGRATIONS.md`

## 🏆 Best Practices Implemented

✅ **Production-Ready Code**

- No auto-sync (migrations only)
- Proper error handling
- Graceful shutdown
- Environment-based configuration

✅ **TypeScript Strict Mode**

- Full type safety
- Proper null handling
- No implicit any

✅ **Database Optimization**

- Strategic indexing
- Unique constraints
- Proper data types
- Query optimization

✅ **IoT Patterns**

- Pub/Sub messaging
- Command queue system
- Time-series data handling
- Device state management

✅ **Code Quality**

- JSDoc comments
- Consistent naming
- Modular structure
- Clean architecture

**📚 Full Best Practices Guide**: See `BEST_PRACTICES.md`

## 🔐 Security Considerations

Current implementation includes:

- Environment-based secrets
- Parameterized queries (SQL injection protection)
- UUID primary keys

**Recommended additions for production:**

```bash
npm install helmet cors express-rate-limit bcrypt class-validator
```

See `BEST_PRACTICES.md` for security recommendations.

## 📊 MQTT Topics

### Device Commands

```
devices/{deviceId}/commands
```

Published when commands are created via API.

**Message Format:**

```json
{
  "commandId": "uuid",
  "command": "ON",
  "timestamp": "2024-12-26T10:00:00Z"
}
```

### Custom Topics

Use the MQTT API endpoints to publish/subscribe to any topic:

- `POST /api/mqtt/publish`
- `POST /api/mqtt/subscribe`

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d greenhouse_db
```

### MQTT Connection Issues

```bash
# Test MQTT broker
mosquitto_sub -h localhost -t test/topic

# Check broker is running
netstat -an | grep 1883
```

### Migration Issues

```bash
# Check migration status
npm run migration:show

# Revert and try again
npm run migration:revert
npm run migration:run
```

## 📚 Documentation

### Core Documentation

- **[README.md](README.md)** - Project overview and setup guide (this file)
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference with examples

### Architecture & Development

- **[ARCHITECTURE_GUIDELINES.md](ARCHITECTURE_GUIDELINES.md)** - 🆕 Complete architecture guide
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - 🆕 Quick reference for adding features
- **[BEST_PRACTICES.md](BEST_PRACTICES.md)** - Production best practices

### Database

- **[MIGRATIONS.md](MIGRATIONS.md)** - Database migration guide

---

## 🏗️ Adding New Features

Want to add new endpoints? Follow the **Clean Architecture pattern**:

1. Read [`ARCHITECTURE_GUIDELINES.md`](ARCHITECTURE_GUIDELINES.md) for full guidelines
2. Use [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md) as a template for AI prompts
3. Follow the layer pattern: Route → Middleware → Controller → Service

**Each new feature requires:**

- Entity (database model)
- Schema (Zod validation)
- Service (business logic)
- Controller (HTTP handling)
- Routes (configuration)

See the complete guide in `ARCHITECTURE_GUIDELINES.md`!

## 🚀 Deployment

### Docker Support (Future)

Consider adding `Dockerfile` and `docker-compose.yml` for containerization.

### Environment Setup

1. Set `NODE_ENV=production`
2. Run migrations: `npm run migration:run`
3. Build: `npm run build`
4. Start: `npm start`

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] MQTT broker accessible
- [ ] Logging configured
- [ ] Monitoring setup
- [ ] Backups configured
- [ ] Security headers added
- [ ] Rate limiting enabled
- [ ] CORS configured

## 📄 License

ISC

## 👤 Author

A production-ready IoT backend system demonstrating best practices in Node.js, TypeScript, TypeORM, and MQTT integration.

---

**Quick Links:**

- [API Documentation](API_DOCUMENTATION.md)
- [Migration Guide](MIGRATIONS.md)
- [Best Practices](BEST_PRACTICES.md)

**Server Status**: Check `http://localhost:3000/` for available endpoints.
