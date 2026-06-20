# Run this to start the Next.js frontend
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $ROOT "frontend"
Set-Location $frontendPath
Write-Host "Starting CardioScan frontend on http://localhost:3000" -ForegroundColor Red
npm run dev
