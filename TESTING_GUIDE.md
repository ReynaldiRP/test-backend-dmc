# 🧪 Endpoint Testing Guide

This guide will help you test all API endpoints in the correct order.

## 📋 Prerequisites

Before testing, ensure these services are running:

```bash
# 1. PostgreSQL should be running
# Check with:
pg_isready

# 2. Run database migrations
npm run migration:run

# 3. MQTT broker should be running (or use test.mosquitto.org)
# If using Mosquitto locally:
mosquitto -v

# 4. Start the development server
npm run dev
```

---

## 🎯 Testing Order

Test endpoints in this order:

1. **Health Check** - Verify services are running
2. **Sensor Data** - Test sensor data submission
3. **Device Control** - Test device commands
4. **MQTT Operations** - Test MQTT publish/subscribe

---

## ✅ Step 1: Health Check

**Endpoint:** `GET /api/health/status`

**Purpose:** Verify database and MQTT connections

### Using curl:

```bash
curl http://localhost:3000/api/health/status
```

### Using PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/health/status" | ConvertTo-Json
```

### Expected Response (Success):

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

### What to Check:

- ✅ HTTP Status: 200 OK
- ✅ `service` is "ok"
- ✅ `db.status` is "connected"
- ✅ `mqtt.status` is "connected"
- ✅ `db.latency_ms` is a number (typically < 100ms)

### If Failed:

- **Database down**: Start PostgreSQL
- **MQTT down**: Start MQTT broker or check `.env` configuration

---

## ✅ Step 2: Sensor Data Submission (Idempotent)

**Endpoint:** `POST /api/sensors/sensor-data`

**Purpose:** Submit sensor readings from IoT devices

### Test 2.1: Submit New Sensor Data

```bash
curl -X POST http://localhost:3000/api/sensors/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "timestamp": "2024-12-27T09:00:00Z",
    "temperature": 24.5,
    "humidity": 68.0,
    "battery": 92.5
  }'
```

**PowerShell:**

```powershell
$body = @{
    device_id = "greenhouse-01"
    timestamp = "2024-12-27T09:00:00Z"
    temperature = 24.5
    humidity = 68.0
    battery = 92.5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/sensors/sensor-data" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body | ConvertTo-Json
```

**Expected Response (First Time - 201 Created):**

```json
{
  "success": true,
  "message": "New record created",
  "id": "uuid-here",
  "data": {
    "id": "uuid-here",
    "deviceId": "greenhouse-01",
    "timestamp": "2024-12-27T09:00:00.000Z",
    "temperature": 24.5,
    "humidity": 68.0,
    "battery": 92.5,
    "raw": null,
    "createdAt": "2024-12-27T09:15:00.000Z"
  }
}
```

**What to Check:**

- ✅ HTTP Status: 201 Created
- ✅ `success` is true
- ✅ `message` is "New record created"
- ✅ `id` is a UUID
- ✅ Data matches input

---

### Test 2.2: Test Idempotency (Submit Same Data Again)

**Run the EXACT same curl/PowerShell command again**

**Expected Response (200 OK):**

```json
{
  "success": true,
  "message": "Record already exists",
  "id": "same-uuid-as-before",
  "data": {
    "id": "same-uuid-as-before",
    ...
  }
}
```

**What to Check:**

- ✅ HTTP Status: 200 OK (not 201!)
- ✅ `message` is "Record already exists"
- ✅ Same `id` as first response
- ✅ No duplicate created in database

---

### Test 2.3: Validation Error Test

```bash
curl -X POST http://localhost:3000/api/sensors/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "timestamp": "invalid-date",
    "temperature": 24.5,
    "humidity": 68.0
  }'
```

**Expected Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "timestamp",
      "message": "timestamp must be a valid ISO8601 format"
    }
  ]
}
```

**What to Check:**

- ✅ HTTP Status: 400 Bad Request
- ✅ `error` is "Validation failed"
- ✅ `details` array shows which field failed

---

### Test 2.4: Multiple Devices

```bash
# Device 2
curl -X POST http://localhost:3000/api/sensors/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-02",
    "timestamp": "2024-12-27T09:05:00Z",
    "temperature": 26.0,
    "humidity": 70.0,
    "battery": 88.0
  }'

# Device 3 (without battery - optional field)
curl -X POST http://localhost:3000/api/sensors/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-03",
    "timestamp": "2024-12-27T09:10:00Z",
    "temperature": 23.0,
    "humidity": 65.0
  }'
```

---

## ✅ Step 3: Device Control Commands

**Endpoint:** `POST /api/devices/device-control`

**Purpose:** Send ON/OFF commands to IoT devices via MQTT

### Test 3.1: Send ON Command

```bash
curl -X POST http://localhost:3000/api/devices/device-control \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "command": "ON"
  }'
```

**PowerShell:**

```powershell
$body = @{
    device_id = "greenhouse-01"
    command = "ON"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/devices/device-control" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body | ConvertTo-Json
```

**Expected Response (201 Created):**

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
    "createdAt": "2024-12-27T09:20:00.000Z"
  }
}
```

**What to Check:**

- ✅ HTTP Status: 201 Created
- ✅ `status` is "published" (MQTT worked)
- ✅ Command saved to database
- ✅ Check server console for MQTT publish log

---

### Test 3.2: Send OFF Command

```bash
curl -X POST http://localhost:3000/api/devices/device-control \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "command": "OFF"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Command sent successfully",
  "status": "published",
  "data": {
    ...
    "command": "OFF",
    "status": "published"
  }
}
```

---

### Test 3.3: Validation Error (Invalid Command)

```bash
curl -X POST http://localhost:3000/api/devices/device-control \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "greenhouse-01",
    "command": "INVALID"
  }'
```

**Expected Response (400 Bad Request):**

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

---

### Test 3.4: Multiple Devices

```bash
# Turn on greenhouse-02
curl -X POST http://localhost:3000/api/devices/device-control \
  -H "Content-Type: application/json" \
  -d '{"device_id": "greenhouse-02", "command": "ON"}'

# Turn on greenhouse-03
curl -X POST http://localhost:3000/api/devices/device-control \
  -H "Content-Type: application/json" \
  -d '{"device_id": "greenhouse-03", "command": "ON"}'
```

---

## ✅ Step 4: MQTT Direct Operations

**Endpoints:**

- `POST /api/mqtt/publish`
- `POST /api/mqtt/subscribe`

### Test 4.1: Publish MQTT Message

```bash
curl -X POST http://localhost:3000/api/mqtt/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "test/greenhouse",
    "message": "Hello from API"
  }'
```

**PowerShell:**

```powershell
$body = @{
    topic = "test/greenhouse"
    message = "Hello from API"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/mqtt/publish" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body | ConvertTo-Json
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Message published successfully"
}
```

**What to Check:**

- ✅ Check server console for: `📤 Published to test/greenhouse: Hello from API`

---

### Test 4.2: Subscribe to MQTT Topic

```bash
curl -X POST http://localhost:3000/api/mqtt/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "test/greenhouse"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Subscribed to topic successfully"
}
```

**What to Check:**

- ✅ Check server console for: `📬 Subscribed to topic: test/greenhouse`

---

## 📊 Complete Test Script (PowerShell)

Save this as `test-all-endpoints.ps1`:

```powershell
Write-Host "🧪 Testing All Endpoints" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣ Testing Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:3000/api/health/status"
Write-Host "   Status: $($health.service)" -ForegroundColor Green
Write-Host ""

# Test 2: Sensor Data
Write-Host "2️⃣ Testing Sensor Data (New)..." -ForegroundColor Yellow
$sensorBody = @{
    device_id = "greenhouse-test"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    temperature = 25.0
    humidity = 70.0
    battery = 90.0
} | ConvertTo-Json

$sensor1 = Invoke-RestMethod -Uri "http://localhost:3000/api/sensors/sensor-data" `
    -Method Post -ContentType "application/json" -Body $sensorBody
Write-Host "   Status: $($sensor1.message)" -ForegroundColor Green
Write-Host "   ID: $($sensor1.id)" -ForegroundColor Green
Write-Host ""

# Test 3: Sensor Data (Idempotent)
Write-Host "3️⃣ Testing Sensor Data (Idempotent)..." -ForegroundColor Yellow
$sensor2 = Invoke-RestMethod -Uri "http://localhost:3000/api/sensors/sensor-data" `
    -Method Post -ContentType "application/json" -Body $sensorBody
Write-Host "   Status: $($sensor2.message)" -ForegroundColor Green
Write-Host "   Same ID: $($sensor1.id -eq $sensor2.id)" -ForegroundColor Green
Write-Host ""

# Test 4: Device Control (ON)
Write-Host "4️⃣ Testing Device Control (ON)..." -ForegroundColor Yellow
$commandBody = @{
    device_id = "greenhouse-test"
    command = "ON"
} | ConvertTo-Json

$control1 = Invoke-RestMethod -Uri "http://localhost:3000/api/devices/device-control" `
    -Method Post -ContentType "application/json" -Body $commandBody
Write-Host "   Status: $($control1.status)" -ForegroundColor Green
Write-Host ""

# Test 5: Device Control (OFF)
Write-Host "5️⃣ Testing Device Control (OFF)..." -ForegroundColor Yellow
$commandBody2 = @{
    device_id = "greenhouse-test"
    command = "OFF"
} | ConvertTo-Json

$control2 = Invoke-RestMethod -Uri "http://localhost:3000/api/devices/device-control" `
    -Method Post -ContentType "application/json" -Body $commandBody2
Write-Host "   Status: $($control2.status)" -ForegroundColor Green
Write-Host ""

# Test 6: MQTT Publish
Write-Host "6️⃣ Testing MQTT Publish..." -ForegroundColor Yellow
$mqttBody = @{
    topic = "test/automation"
    message = "Automated test"
} | ConvertTo-Json

$mqtt = Invoke-RestMethod -Uri "http://localhost:3000/api/mqtt/publish" `
    -Method Post -ContentType "application/json" -Body $mqttBody
Write-Host "   Status: $($mqtt.success)" -ForegroundColor Green
Write-Host ""

Write-Host "✅ All Tests Complete!" -ForegroundColor Green
```

**Run with:**

```powershell
.\test-all-endpoints.ps1
```

---

## 🎯 Expected Test Results Summary

| Test | Endpoint          | Expected Status | Key Check                        |
| ---- | ----------------- | --------------- | -------------------------------- |
| 1    | Health Check      | 200 OK          | service: "ok"                    |
| 2    | Sensor Data (New) | 201 Created     | message: "New record created"    |
| 3    | Sensor Data (Dup) | 200 OK          | message: "Record already exists" |
| 4    | Device ON         | 201 Created     | status: "published"              |
| 5    | Device OFF        | 201 Created     | status: "published"              |
| 6    | MQTT Publish      | 200 OK          | success: true                    |

---

## 🐛 Troubleshooting

### Health Check Fails

```bash
# Check PostgreSQL
pg_isready

# Check MQTT is set in .env
cat .env | grep MQTT
```

### Sensor Data Fails

- Check migrations ran: `npm run migration:show`
- Check database connection in health check

### Device Control Fails

- Check MQTT broker is running
- Check `.env` has correct MQTT_BROKER_URL

### MQTT Operations Fail

- Verify MQTT broker URL
- Check firewall isn't blocking port 1883

---

## 📝 Manual Testing Checklist

- [ ] 1. Health check returns 200 OK
- [ ] 2. Sensor data creates new record (201)
- [ ] 3. Same sensor data returns existing (200)
- [ ] 4. Invalid timestamp rejected (400)
- [ ] 5. Device ON command works (201)
- [ ] 6. Device OFF command works (201)
- [ ] 7. Invalid command rejected (400)
- [ ] 8. MQTT publish succeeds
- [ ] 9. MQTT subscribe succeeds
- [ ] 10. All IDs are UUIDs
- [ ] 11. Timestamps are ISO8601
- [ ] 12. Database has records

---

**Testing Complete!** ✅

All endpoints tested in logical order from health check to IoT operations.
