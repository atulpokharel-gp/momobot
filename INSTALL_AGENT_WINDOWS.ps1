# MomoBot Agent Windows PowerShell Setup Script
# Run: powershell -ExecutionPolicy Bypass -File "INSTALL_AGENT_WINDOWS.ps1"

param(
    [switch]$AsService = $false,
    [switch]$SkipNodeCheck = $false
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MomoBot Local Agent - Windows Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin (for service installation)
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')

# Step 1: Check Node.js
Write-Host "[1/5] Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null

if (-not $nodeVersion) {
    Write-Host "❌ Node.js is NOT installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Choose LTS version (v18 or v20)" -ForegroundColor White
    Write-Host "3. Run installer with default settings" -ForegroundColor White
    Write-Host "4. Restart your computer" -ForegroundColor White
    Write-Host "5. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use this command to install with Chocolatey/Scoop:" -ForegroundColor Green
    Write-Host "choco install nodejs" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 1
} else {
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
}

# Step 2: Check npm
Write-Host ""
Write-Host "[2/5] Checking npm installation..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null

if (-not $npmVersion) {
    Write-Host "❌ npm not found" -ForegroundColor Red
    Write-Host "Please reinstall Node.js" -ForegroundColor Yellow
    pause
    exit 1
} else {
    Write-Host "✅ npm $npmVersion found" -ForegroundColor Green
}

# Step 3: Navigate and install dependencies
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$agentPath = Join-Path $scriptPath "momobot-agent"

if (-not (Test-Path $agentPath)) {
    Write-Host ""
    Write-Host "❌ momobot-agent directory not found at: $agentPath" -ForegroundColor Red
    pause
    exit 1
}

Set-Location $agentPath

Write-Host ""
Write-Host "[3/5] Installing npm dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

npm install --no-audit --no-fund 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Try running: npm install" -ForegroundColor Yellow
    pause
    exit 1
} else {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

# Step 4: Check .env file
Write-Host ""
Write-Host "[4/5] Checking configuration..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Required configuration:" -ForegroundColor Yellow
    Write-Host "- AGENT_API_KEY=<your-key>" -ForegroundColor Gray
    Write-Host "- AGENT_SECRET_KEY=<your-secret>" -ForegroundColor Gray
    Write-Host "- SERVER_URL=http://localhost:4000" -ForegroundColor Gray
    pause
    exit 1
} else {
    Write-Host "✅ .env configuration found" -ForegroundColor Green
}

# Step 5: Options
Write-Host ""
Write-Host "[5/5] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Start Agent Now" -ForegroundColor Yellow
Write-Host "  Command: npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Run via Double-Click" -ForegroundColor Yellow
Write-Host "  Use: START_AGENT.bat" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3: Run as Windows Service" -ForegroundColor Yellow
if ($isAdmin) {
    Write-Host "  Command: node src/install-service.js" -ForegroundColor Gray
} else {
    Write-Host "  Run PowerShell as Administrator" -ForegroundColor Red
    Write-Host "  Then: node src/install-service.js" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Test Connection:" -ForegroundColor Yellow
Write-Host "  npm start" -ForegroundColor Gray
Write-Host "  Watch for: ✅ Connected to MomoBot server" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
