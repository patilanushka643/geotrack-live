$ErrorActionPreference = "Stop"

Write-Host "`n" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   GEOTRACK MULTI-USER LOCATION TRACKING TEST SUITE                 " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "`n"

# Get the workspace directory
$workspaceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Workspace: $workspaceDir" -ForegroundColor Green

# Step 1: Check Node.js
Write-Host "`n[1/5] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "      OK: Node.js $nodeVersion" -ForegroundColor Green

# Step 2: Install dependencies if needed
Write-Host "`n[2/5] Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "$workspaceDir\node_modules")) {
    Write-Host "      Installing dependencies..." -ForegroundColor Cyan
    npm install --quiet
    Write-Host "      OK: Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "      OK: Dependencies already installed" -ForegroundColor Green
}

# Step 3: Start the server in a separate process
Write-Host "`n[3/5] Starting GeoTrack server..." -ForegroundColor Yellow
$serverProcess = Start-Process -FilePath "node" -ArgumentList "$workspaceDir\app.js" -NoNewWindow -PassThru

# Give the server time to start
Write-Host "      Waiting for server startup (5 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Check if server is running
if ($serverProcess.HasExited) {
    Write-Host "      ERROR: Server failed to start" -ForegroundColor Red
    $serverProcess | Stop-Process -ErrorAction SilentlyContinue
    exit 1
} else {
    Write-Host "      OK: Server started (PID: $($serverProcess.Id))" -ForegroundColor Green
}

# Step 4: Run the test
Write-Host "`n[4/5] Running multi-user location tracking test..." -ForegroundColor Yellow
Write-Host "      This test will:" -ForegroundColor Cyan
Write-Host "      - Simulate 3 users connecting via Socket.IO" -ForegroundColor Cyan
Write-Host "      - Generate location updates every 3 seconds" -ForegroundColor Cyan
Write-Host "      - Verify real-time broadcasting" -ForegroundColor Cyan
Write-Host "      - Validate data integrity" -ForegroundColor Cyan
Write-Host "      - Check map marker updates`n" -ForegroundColor Cyan

$testProcess = Start-Process -FilePath "node" -ArgumentList "$workspaceDir\test-debug.js" -NoNewWindow -PassThru -Wait

$testExitCode = $testProcess.ExitCode
Write-Host "`n"

# Step 5: Cleanup
Write-Host "[5/5] Cleaning up..." -ForegroundColor Yellow

# Kill the server process
try {
    Stop-Process -Id $serverProcess.Id -ErrorAction SilentlyContinue
    Write-Host "      OK: Server stopped" -ForegroundColor Green
} catch {
    Write-Host "      WARNING: Could not stop server process" -ForegroundColor Yellow
}

# Show results
Write-Host "`n=====================================================================" -ForegroundColor Cyan
if ($testExitCode -eq 0) {
    Write-Host "   TEST SUITE COMPLETED SUCCESSFULLY                               " -ForegroundColor Green
} else {
    Write-Host "   TEST SUITE ENCOUNTERED ERRORS                                   " -ForegroundColor Red
}
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "`n"

exit $testExitCode
