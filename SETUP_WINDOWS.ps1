# =======================================================
# CardioScan - Complete Windows Setup Script
# Run this from E:\pycharm\CardioScan\
# Right-click PowerShell → Run as Administrator, then:
# Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then run: .\SETUP_WINDOWS.ps1
# =======================================================

Write-Host "
╔══════════════════════════════════════╗
║   CardioScan Setup - Windows         ║
╚══════════════════════════════════════╝" -ForegroundColor Red

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Project root: $ROOT" -ForegroundColor Yellow

# ── Verify structure ──────────────────────────────────
Write-Host "`n[1/6] Checking project structure..." -ForegroundColor Cyan

$backendPath  = Join-Path $ROOT "backend"
$frontendPath = Join-Path $ROOT "frontend"
$trainPath    = Join-Path $ROOT "train"

if (-not (Test-Path $backendPath))  { Write-Host "ERROR: backend folder not found at $backendPath" -ForegroundColor Red; exit 1 }
if (-not (Test-Path $frontendPath)) { Write-Host "ERROR: frontend folder not found at $frontendPath" -ForegroundColor Red; exit 1 }
if (-not (Test-Path $trainPath))    { Write-Host "ERROR: train folder not found at $trainPath" -ForegroundColor Red; exit 1 }

Write-Host "  backend  : $backendPath  OK" -ForegroundColor Green
Write-Host "  frontend : $frontendPath  OK" -ForegroundColor Green
Write-Host "  train    : $trainPath  OK" -ForegroundColor Green

# ── Create backend .env ───────────────────────────────
Write-Host "`n[2/6] Creating backend .env file..." -ForegroundColor Cyan
$envPath = Join-Path $backendPath ".env"
if (-not (Test-Path $envPath)) {
    @"
DATABASE_URL=postgresql://user:password@your-neon-host.neon.tech/neondb?sslmode=require
PORT=8000
"@ | Set-Content $envPath -Encoding UTF8
    Write-Host "  Created $envPath" -ForegroundColor Green
    Write-Host "  ACTION REQUIRED: Edit backend\.env and add your Neon DATABASE_URL!" -ForegroundColor Yellow
} else {
    Write-Host "  .env already exists - skipping" -ForegroundColor Green
}

# ── Create frontend .env.local ────────────────────────
Write-Host "`n[3/6] Creating frontend .env.local..." -ForegroundColor Cyan
$envLocalPath = Join-Path $frontendPath ".env.local"
if (-not (Test-Path $envLocalPath)) {
    @"
NEXT_PUBLIC_API_URL=http://localhost:8000
"@ | Set-Content $envLocalPath -Encoding UTF8
    Write-Host "  Created $envLocalPath" -ForegroundColor Green
} else {
    Write-Host "  .env.local already exists - skipping" -ForegroundColor Green
}

# ── Backend venv + install ────────────────────────────
Write-Host "`n[4/6] Setting up Python backend..." -ForegroundColor Cyan
Set-Location $backendPath

$venvPath = Join-Path $backendPath "venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "  Creating virtual environment..." -ForegroundColor White
    python -m venv venv
} else {
    Write-Host "  venv already exists" -ForegroundColor Green
}

$pip = Join-Path $venvPath "Scripts\pip.exe"
$python = Join-Path $venvPath "Scripts\python.exe"

Write-Host "  Installing Python packages (this takes ~2 min)..." -ForegroundColor White
& $pip install -r requirements.txt -q
Write-Host "  Python packages installed!" -ForegroundColor Green

# ── Train models ──────────────────────────────────────
Write-Host "`n[5/6] Training ML models..." -ForegroundColor Cyan
Set-Location $trainPath
& $python train_model.py
Write-Host "  Models trained and saved to backend\models\" -ForegroundColor Green

# ── Frontend install ──────────────────────────────────
Write-Host "`n[6/6] Installing frontend packages..." -ForegroundColor Cyan
Set-Location $frontendPath
npm install
Write-Host "  Frontend packages installed!" -ForegroundColor Green

# ── Done ─────────────────────────────────────────────
Write-Host "
╔══════════════════════════════════════════════════╗
║  SETUP COMPLETE!  Next steps:                    ║
║                                                  ║
║  TERMINAL 1 - Start Backend:                     ║
║    cd backend                                    ║
║    .\venv\Scripts\Activate.ps1                   ║
║    python app.py                                 ║
║                                                  ║
║  TERMINAL 2 - Start Frontend:                    ║
║    cd frontend                                   ║
║    npm run dev                                   ║
║                                                  ║
║  Then open: http://localhost:3000                ║
╚══════════════════════════════════════════════════╝" -ForegroundColor Green

Set-Location $ROOT
