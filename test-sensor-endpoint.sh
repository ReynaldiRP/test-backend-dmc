#!/bin/bash

# Test script for sensor data endpoint
# Tests both valid and invalid requests

echo "🧪 Testing Sensor Data Endpoint"
echo "================================"
echo ""

BASE_URL="http://localhost:3000/api/sensors"

# Test 1: Missing timestamp (should show validation error)
echo "Test 1: Invalid request (missing timestamp)"
echo "--------------------------------------------"
curl -X POST $BASE_URL/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "sensor-001",
    "temperature": 25.5,
    "humidity": 60
  }'
echo -e "\n\n"

# Test 2: Invalid timestamp format
echo "Test 2: Invalid timestamp format"
echo "---------------------------------"
curl -X POST $BASE_URL/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "sensor-001",
    "timestamp": "not-a-date",
    "temperature": 25.5,
    "humidity": 60
  }'
echo -e "\n\n"

# Test 3: Valid request
echo "Test 3: Valid request (should succeed)"
echo "---------------------------------------"
curl -X POST $BASE_URL/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "sensor-001",
    "timestamp": "2025-12-26T20:00:00Z",
    "temperature": 25.5,
    "humidity": 60,
    "battery": 85
  }'
echo -e "\n\n"

# Test 4: Duplicate request (idempotency check)
echo "Test 4: Duplicate request (should return existing record)"
echo "-----------------------------------------------------------"
curl -X POST $BASE_URL/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "sensor-001",
    "timestamp": "2025-12-26T20:00:00Z",
    "temperature": 25.5,
    "humidity": 60,
    "battery": 85
  }'
echo -e "\n\n"

echo "✅ Tests completed!"
echo "Check your terminal running 'npm run dev' for validation error logs"
