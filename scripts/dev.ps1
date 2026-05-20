#!/usr/bin/env pwsh
# SocialPilot Pro — Development startup script
# Run: pwsh scripts/dev.ps1

Write-Host "🚀 Starting SocialPilot Pro..." -ForegroundColor Cyan

# 1. Start PostgreSQL if not running
$pgBin = "C:\Program Files\PostgreSQL\16\bin"
$pgData = "C:\Program Files\PostgreSQL\16\data"
$port = netstat -an 2>$null | Select-String "5432"
if (-not $port) {
    Write-Host "🗄  Starting PostgreSQL..." -ForegroundColor Yellow
    & "$pgBin\pg_ctl.exe" start -D "$pgData" -l "$env:TEMP\pg16.log" -w 2>$null
    Start-Sleep -Seconds 3
    Write-Host "✅ PostgreSQL started" -ForegroundColor Green
} else {
    Write-Host "✅ PostgreSQL already running" -ForegroundColor Green
}

# 2. Check .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found. Running setup..." -ForegroundColor Yellow
    node scripts/setup.js
}

# 3. Start backend
Write-Host "🔧 Starting backend (port 3000)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm --filter @socialpilot/backend run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# 4. Start frontend
Write-Host "🎨 Starting frontend (port 4200)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm --filter @socialpilot/frontend run dev" -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SocialPilot Pro is starting up!      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend:  http://localhost:4200" -ForegroundColor White
Write-Host "  Backend:   http://localhost:3000" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:3000/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "  Login:     admin@socialpilotpro.com" -ForegroundColor Gray
Write-Host "  Password:  Admin@123456" -ForegroundColor Gray
Write-Host ""
