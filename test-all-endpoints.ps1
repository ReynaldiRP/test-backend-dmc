Write-Host "Testing All Endpoints" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health/status"
    Write-Host "   OK - Status: $($health.service)" -ForegroundColor Green
    Write-Host "   OK - Database: $($health.db.status) ($($health.db.latency_ms)ms)" -ForegroundColor Green
    Write-Host "   OK - MQTT: $($health.mqtt.status)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Sensor Data (New Record)
Write-Host "2. Testing Sensor Data (New Record)..." -ForegroundColor Yellow
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$sensorBody = @{
    device_id = "greenhouse-test"
    timestamp = $timestamp
    temperature = 25.0
    humidity = 70.0
    battery = 90.0
} | ConvertTo-Json

try {
    $sensor1 = Invoke-RestMethod -Uri "$baseUrl/api/sensors/sensor-data" -Method Post -ContentType "application/json" -Body $sensorBody
    Write-Host "   OK - Status: $($sensor1.message)" -ForegroundColor Green
    Write-Host "   OK - ID: $($sensor1.id)" -ForegroundColor Green
    $savedId = $sensor1.id
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Sensor Data (Idempotent)
Write-Host "3. Testing Sensor Data (Idempotent)..." -ForegroundColor Yellow
try {
    $sensor2 = Invoke-RestMethod -Uri "$baseUrl/api/sensors/sensor-data" -Method Post -ContentType "application/json" -Body $sensorBody
    Write-Host "   OK - Status: $($sensor2.message)" -ForegroundColor Green
    if ($sensor1.id -eq $sensor2.id) {
        Write-Host "   OK - Same ID confirmed (idempotent)" -ForegroundColor Green
    } else {
        Write-Host "   WARNING - Different ID (not idempotent)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Sensor Data Validation
Write-Host "4. Testing Sensor Data Validation..." -ForegroundColor Yellow
$invalidBody = @{
    device_id = "greenhouse-test"
    timestamp = "invalid-date"
    temperature = 25.0
    humidity = 70.0
} | ConvertTo-Json

try {
    $invalid = Invoke-RestMethod -Uri "$baseUrl/api/sensors/sensor-data" -Method Post -ContentType "application/json" -Body $invalidBody -ErrorAction Stop
    Write-Host "   WARNING - Should have failed validation" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   OK - Validation error caught (400)" -ForegroundColor Green
    } else {
        Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Device Control (ON)
Write-Host "5. Testing Device Control (ON)..." -ForegroundColor Yellow
$commandBodyOn = @{
    device_id = "greenhouse-test"
    command = "ON"
} | ConvertTo-Json

try {
    $control1 = Invoke-RestMethod -Uri "$baseUrl/api/devices/device-control" -Method Post -ContentType "application/json" -Body $commandBodyOn
    Write-Host "   OK - Command: $($control1.data.command)" -ForegroundColor Green
    Write-Host "   OK - Status: $($control1.status)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Device Control (OFF)
Write-Host "6. Testing Device Control (OFF)..." -ForegroundColor Yellow
$commandBodyOff = @{
    device_id = "greenhouse-test"
    command = "OFF"
} | ConvertTo-Json

try {
    $control2 = Invoke-RestMethod -Uri "$baseUrl/api/devices/device-control" -Method Post -ContentType "application/json" -Body $commandBodyOff
    Write-Host "   OK - Command: $($control2.data.command)" -ForegroundColor Green
    Write-Host "   OK - Status: $($control2.status)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Device Control Validation
Write-Host "7. Testing Device Control Validation..." -ForegroundColor Yellow
$invalidCommand = @{
    device_id = "greenhouse-test"
    command = "INVALID"
} | ConvertTo-Json

try {
    $invalid = Invoke-RestMethod -Uri "$baseUrl/api/devices/device-control" -Method Post -ContentType "application/json" -Body $invalidCommand -ErrorAction Stop
    Write-Host "   WARNING - Should have failed validation" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   OK - Validation error caught (400)" -ForegroundColor Green
    } else {
        Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 8: MQTT Publish
Write-Host "8. Testing MQTT Publish..." -ForegroundColor Yellow
$mqttBody = @{
    topic = "test/automation"
    message = "Automated test message"
} | ConvertTo-Json

try {
    $mqtt = Invoke-RestMethod -Uri "$baseUrl/api/mqtt/publish" -Method Post -ContentType "application/json" -Body $mqttBody
    Write-Host "   OK - Success: $($mqtt.success)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 9: MQTT Subscribe
Write-Host "9. Testing MQTT Subscribe..." -ForegroundColor Yellow
$mqttSubBody = @{
    topic = "test/automation"
} | ConvertTo-Json

try {
    $mqttSub = Invoke-RestMethod -Uri "$baseUrl/api/mqtt/subscribe" -Method Post -ContentType "application/json" -Body $mqttSubBody
    Write-Host "   OK - Success: $($mqttSub.success)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=========================" -ForegroundColor Cyan
Write-Host "All Tests Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- Health Check" -ForegroundColor Green
Write-Host "- Sensor Data (Create)" -ForegroundColor Green
Write-Host "- Sensor Data (Idempotent)" -ForegroundColor Green
Write-Host "- Sensor Validation" -ForegroundColor Green
Write-Host "- Device Control (ON)" -ForegroundColor Green
Write-Host "- Device Control (OFF)" -ForegroundColor Green
Write-Host "- Device Validation" -ForegroundColor Green
Write-Host "- MQTT Publish" -ForegroundColor Green
Write-Host "- MQTT Subscribe" -ForegroundColor Green
Write-Host ""
Write-Host "Check server console for MQTT publish logs!" -ForegroundColor Yellow
