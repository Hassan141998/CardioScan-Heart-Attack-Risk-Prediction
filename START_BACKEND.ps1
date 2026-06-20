# Run this to start the backend API
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $ROOT "backend"
Set-Location $backendPath
& ".\venv\Scripts\Activate.ps1"
Write-Host "Starting CardioScan backend on http://localhost:8000" -ForegroundColor Red
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
python app.py
