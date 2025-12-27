# API Documentation

Base URL: `http://localhost:3000`

## 📡 Endpoints Overview

### Health Check

- **GET** `/api/health/status` - Service health check (database + MQTT)

### Sensor Data (Idempotent with Zod Validation)

- **POST** `/api/sensors/sensor-data` - Idempotent sensor data submission

### Device Control

- **POST** `/api/devices/device-control` - Send control command to IoT device via MQTT

### MQTT

- **POST** `/api/mqtt/publish` - Publish message to topic
- **POST** `/api/mqtt/subscribe` - Subscribe to topic

---

## 📝 Detailed API Reference

### GET /status - Health Check

```http
GET /api/health/status
```

**Description:**  
Health check endpoint for monitoring service status. Performs concurrent checks on database connectivity (with latency measurement) and MQTT connection status. Returns HTTP 200 if all services are healthy, or HTTP 503 if any service is degraded.

**No Request Body Required**

**Response - All Services Healthy (200 OK):**

```json
{
  "service": "ok",
  "db": {
    "status": "connected",
    "latency_ms": 15
  },
  "mqtt": {
    "status": "connected"
  }
}
```

**Response - Database Disconnected (503 Service Unavailable):**

```json
{
  "service": "degraded",
  "db": {
    "status": "disconnected",
    "latency_ms": 0,
    "error": "Connection refused"
  },
  "mqtt": {
    "status": "connected"
  }
}
```

**Response - MQTT Disconnected (503 Service Unavailable):**

```json
{
  "service": "degraded",
  "db": {
    "status": "connected",
    "latency_ms": 12
  },
  "mqtt": {
    "status": "disconnected",
    "error": "MQTT client disconnected"
  }
}
```

**Response - All Services Down (503 Service Unavailable):**

```json
{
  "service": "degraded",
  "db": {
    "status": "disconnected",
    "latency_ms": 0,
    "error": "Database connection error"
  },
  "mqtt": {
    "status": "disconnected",
    "error": "MQTT client not initialized"
  }
}
```

**Testing Example:**

```bash
# Check service health
curl http://localhost:3000/api/health/status

# With response formatting
curl http://localhost:3000/api/health/status | jq
```

**Technical Details:**

- Uses `Promise.allSettled` for concurrent health checks
- Database check: Executes `SELECT 1` and measures latency
- MQTT check: Verifies `mqttClient.connected` status
- Lightweight operation suitable for frequent monitoring

**Use Cases:**

- Container orchestration health probes (Kubernetes, Docker)
- Load balancer health checks
- Monitoring and alerting systems
- Service dependency tracking

**Status Codes:**

- `200 OK` - All services healthy
- `503 Service Unavailable` - One or more services degraded

---

### POST /device-control - Device Control Command

```http
POST /api/devices/device-control
Content-Type: application/json
```

**Description:**  
Send control command to an IoT device. Creates a database record with status "queued", publishes command to MQTT topic `greenhouse/control/{device_id}`, and updates status to "published" or "error" based on MQTT publish result.

**Request Body (Zod Validated):**

```json
{
  "device_id": "greenhouse-01",
  "command": "ON"
}
```

**Field Requirements:**

- `device_id`: string (required, min length 1)
- `command`: enum (required, must be either "ON" or "OFF")

**Response - Success (201 Created):**

```json
{
  "success": true,
  "message": "Command sent successfully",
  "status": "published",
  "data": {
    "id": "uuid-here",
    "deviceId": "greenhouse-01",
    "command": "ON",
    "status": "published",
    "createdAt": "2024-12-27T07:30:00.000Z"
  }
}
```

**Response - MQTT Publish Failed (500 Internal Server Error):**

```json
{
  "success": false,
  "error": "MQTT publish failed",
  "message": "MQTT client not connected",
  "status": "error"
}
```

**Error Response - Validation Error (400 Bad Request):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "command",
      "message": "command must be either 'ON' or 'OFF'"
    }
  ]
}
```

**Testing Examples:**

```bash
# Send ON command
curl -X POST http://localhost:3000/api/devices/device-control \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "command": "ON"
  }'

# Send OFF command
curl -X POST http://localhost:3000/api/devices/device-control \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "command": "OFF"
  }'

# Test validation error (invalid command)
curl -X POST http://localhost:3000/api/devices/device-control \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "command": "INVALID"
  }'
```

**MQTT Topic Pattern:**

- Topic: `greenhouse/control/{device_id}`
- Payload: `{"command": "ON", "timestamp": "2024-12-27T07:30:00.000Z"}`

**Status Flow:**

1. Initial: `queued` (when record is created)
2. Success: `published` (MQTT publish successful)
3. Error: `error` (MQTT publish failed, errorMessage stored)

**Status Codes:**

- `201 Created` - Command sent successfully
- `400 Bad Request` - Validation error
- `500 Internal Server Error` - MQTT publish failed

---

### POST /sensor-data - Idempotent Sensor Data Submission

```http
POST /api/sensors/sensor-data
Content-Type: application/json
```

**Description:**  
This endpoint provides idempotent sensor data submission with Zod validation. If a record with the same `device_id` and `timestamp` already exists, it returns the existing record (200 OK). Otherwise, it creates a new record (201 Created).

**Request Body (Zod Validated):**

```json
{
  "device_id": "greenhouse-01",
  "timestamp": "2024-12-26T10:30:00Z",
  "temperature": 24.5,
  "humidity": 68.0,
  "battery": 92.5
}
```

**Field Requirements:**

- `device_id`: string (required, min length 1)
- `timestamp`: string (required, ISO8601/RFC3339 format)
- `temperature`: number (required)
- `humidity`: number (required)
- `battery`: number (optional)

**Response - New Record (201 Created):**

```json
{
  "success": true,
  "message": "New record created",
  "id": "uuid-here",
  "data": {
    "id": "uuid-here",
    "deviceId": "greenhouse-01",
    "timestamp": "2024-12-26T10:30:00.000Z",
    "temperature": 24.5,
    "humidity": 68.0,
    "battery": 92.5,
    "raw": null,
    "createdAt": "2024-12-26T10:30:01.234Z"
  }
}
```

**Response - Existing Record (200 OK):**

```json
{
  "success": true,
  "message": "Record already exists",
  "id": "existing-uuid",
  "data": {
    "id": "existing-uuid",
    "deviceId": "greenhouse-01",
    "timestamp": "2024-12-26T10:30:00.000Z",
    "temperature": 24.5,
    "humidity": 68.0,
    "battery": 92.5,
    "raw": null,
    "createdAt": "2024-12-26T10:29:58.123Z"
  }
}
```

**Error Response - Validation Error (400 Bad Request):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "timestamp",
      "message": "timestamp must be a valid ISO8601 format"
    },
    {
      "field": "temperature",
      "message": "Expected number, received string"
    }
  ]
}
```

**Error Response - Database Connection (503 Service Unavailable):**

```json
{
  "success": false,
  "error": "Database connection error",
  "message": "Unable to connect to database. Please try again later."
}
```

**Testing Examples:**

```bash
# 1. Create a new sensor reading (first time - returns 201)
curl -X POST http://localhost:3000/api/sensors/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "timestamp": "2024-12-26T10:30:00Z",
    "temperature": 24.5,
    "humidity": 68.0,
    "battery": 92.5
  }'

# 2. Submit the same data again (idempotent - returns 200 with existing record)
curl -X POST http://localhost:3000/api/sensors/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "timestamp": "2024-12-26T10:30:00Z",
    "temperature": 24.5,
    "humidity": 68.0,
    "battery": 92.5
  }'

# 3. Test validation error (invalid timestamp format)
curl -X POST http://localhost:3000/api/sensors/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "timestamp": "invalid-date",
    "temperature": 24.5,
    "humidity": 68.0
  }'

# 4. Test missing required field
curl -X POST http://localhost:3000/api/sensors/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "timestamp": "2024-12-26T10:30:00Z",
    "humidity": 68.0
  }'

# 5. Submit without optional battery field (valid)
curl -X POST http://localhost:3000/api/sensors/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "timestamp": "2024-12-26T11:00:00Z",
    "temperature": 25.0,
    "humidity": 70.0
  }'
```

**Status Codes:**

- `200 OK` - Record already exists (idempotent behavior)
- `201 Created` - New record created successfully
- `400 Bad Request` - Validation error (Zod validation failed)
- `503 Service Unavailable` - Database connection error
- `500 Internal Server Error` - Unexpected server error

---

## 🔐 Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 📊 HTTP Status Codes

- `200` - OK (Idempotent - existing record returned)
- `201` - Created (New record created)
- `400` - Bad Request (Invalid input/validation error)
- `404` - Not Found (Resource doesn't exist)
- `503` - Service Unavailable (Database connection error)
- `500` - Internal Server Error

---

**API Version**: 1.0.0  
**Last Updated**: 2024-12-26
