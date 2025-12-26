# API Documentation

Base URL: `http://localhost:3000`

## 📡 Endpoints Overview

### Health Check

- **GET** `/` - API information and available endpoints

### Sensor Data (Idempotent with Zod Validation)

- **POST** `/api/sensors/sensor-data` - Idempotent sensor data submission

### Users (Base Example)

- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create new user
- **PUT** `/api/users/:id` - Update user
- **DELETE** `/api/users/:id` - Delete user

### MQTT

- **POST** `/api/mqtt/publish` - Publish message to topic
- **POST** `/api/mqtt/subscribe` - Subscribe to topic

---

## 📝 Detailed API Reference

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
