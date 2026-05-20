# Start PostgreSQL if not running
$pgBin = "C:\Program Files\PostgreSQL\16\bin"
$pgData = "C:\Program Files\PostgreSQL\16\data"

$port = netstat -an 2>$null | Select-String "5432"
if (-not $port) {
    Write-Host "Starting PostgreSQL..."
    & "$pgBin\pg_ctl.exe" start -D "$pgData" -l "$env:TEMP\pg16.log" -w
    Start-Sleep -Seconds 3
    Write-Host "PostgreSQL started"
} else {
    Write-Host "PostgreSQL already running on :5432"
}
