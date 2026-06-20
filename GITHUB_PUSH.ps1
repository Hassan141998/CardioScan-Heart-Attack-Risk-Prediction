# =======================================================
# CardioScan - GitHub Push Script
# Your repo: https://github.com/Hassan141998/CardioScan-Heart-Attack-Risk-Prediction.git
# Run from: E:\pycharm\CardioScan\
# =======================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ROOT

$REPO_URL = "https://github.com/Hassan141998/CardioScan-Heart-Attack-Risk-Prediction.git"

Write-Host "
╔══════════════════════════════════════════╗
║   CardioScan - GitHub Push               ║
╚══════════════════════════════════════════╝" -ForegroundColor Red

# Check if git is installed
try {
    $gitVersion = git --version 2>&1
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git not installed. Download from https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# Initialize git if not already
if (-not (Test-Path ".git")) {
    Write-Host "`nInitializing git repository..." -ForegroundColor Cyan
    git init
    git branch -M main
} else {
    Write-Host "`nGit already initialized" -ForegroundColor Green
}

# Set remote
$remotes = git remote 2>&1
if ($remotes -notcontains "origin") {
    Write-Host "Adding remote origin..." -ForegroundColor Cyan
    git remote add origin $REPO_URL
} else {
    Write-Host "Remote origin already set" -ForegroundColor Green
    git remote set-url origin $REPO_URL
}

# Stage all files
Write-Host "`nStaging all files..." -ForegroundColor Cyan
git add .
git status

# Commit
$commitMsg = "feat: CardioScan v2.0 - XGBoost + RF + KNN ensemble heart risk predictor"
Write-Host "`nCommitting: $commitMsg" -ForegroundColor Cyan
git commit -m $commitMsg

# Push
Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
Write-Host "Repo: $REPO_URL" -ForegroundColor Yellow
git push -u origin main

Write-Host "
╔══════════════════════════════════════════════════╗
║  SUCCESS! Code pushed to GitHub!                 ║
║  View at: https://github.com/Hassan141998/       ║
║           CardioScan-Heart-Attack-Risk-Prediction║
╚══════════════════════════════════════════════════╝" -ForegroundColor Green
