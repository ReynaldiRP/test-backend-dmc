$body = @{
    device_id = "test-device-01"
    timestamp = "2024-12-26T10:30:00Z"
    temperature = 24.5
    humidity = 68.0
    battery = 92.5
} | ConvertTo-Json

Write-Host "Testing POST /sensor-data endpoint..."
Write-Host "Request Body:" $body

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/sensors/sensor-data" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

Write-Host "`nResponse:"
$response | ConvertTo-Json -Depth 10

Write-Host "`n`nTesting idempotency (sending same data again)..."
$response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/sensors/sensor-data" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

Write-Host "Second Response:"
$response2 | ConvertTo-Json -Depth 10
