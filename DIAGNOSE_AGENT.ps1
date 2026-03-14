# MomoBot Agent - Windows Diagnostic Tool
# Run: powershell -ExecutionPolicy Bypass -File "DIAGNOSE_AGENT.ps1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MomoBot Agent - Diagnostics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$agentPath = Join-Path $scriptPath "momobot-agent"

# Test 1: Node.js
Write-Host "[1/8] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not installed" -ForegroundColor Red
    Write-Host "   → Download from https://nodejs.org/" -ForegroundColor Gray
}

# Test 2: npm
Write-Host ""
Write-Host "[2/8] Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "✅ npm $npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found" -ForegroundColor Red
    Write-Host "   → Reinstall Node.js" -ForegroundColor Gray
}

# Test 3: Agent directory
Write-Host ""
Write-Host "[3/8] Checking agent directory..." -ForegroundColor Yellow
if (Test-Path $agentPath) {
    Write-Host "✅ Found: $agentPath" -ForegroundColor Green
} else {
    Write-Host "❌ Agent directory not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Test 4: Dependencies
Write-Host ""
Write-Host "[4/8] Checking npm dependencies..." -ForegroundColor Yellow
$nodeModules = Join-Path $agentPath "node_modules"
if (Test-Path $nodeModules) {
    $depCount = (Get-ChildItem $nodeModules -Directory).Count
    Write-Host "✅ $depCount packages installed" -ForegroundColor Green
} else {
    Write-Host "❌ Dependencies not installed" -ForegroundColor Red
    Write-Host "   → Run: npm install" -ForegroundColor Gray
}

# Test 5: .env file
Write-Host ""
Write-Host "[5/8] Checking .env configuration..." -ForegroundColor Yellow
$envFile = Join-Path $agentPath ".env"
if (Test-Path $envFile) {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Check key variables
    $env_content = Get-Content $envFile
    if ($env_content -match "AGENT_API_KEY") {
        Write-Host "   ✓ AGENT_API_KEY configured" -ForegroundColor Gray
    }
    if ($env_content -match "AGENT_SECRET_KEY") {
        Write-Host "   ✓ AGENT_SECRET_KEY configured" -ForegroundColor Gray
    }
    if ($env_content -match "SERVER_URL") {
        Write-Host "   ✓ SERVER_URL configured" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   → Configuration files missing" -ForegroundColor Gray
}

# Test 6: Package.json
Write-Host ""
Write-Host "[6/8] Checking package.json..." -ForegroundColor Yellow
$packageJson = Join-Path $agentPath "package.json"
if (Test-Path $packageJson) {
    Write-Host "✅ package.json found" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
}

# Test 7: Source files
Write-Host ""
Write-Host "[7/8] Checking source files..." -ForegroundColor Yellow
$indexJs = Join-Path $agentPath "src\index.js"
if (Test-Path $indexJs) {
    Write-Host "✅ Source files present" -ForegroundColor Green
} else {
    Write-Host "❌ Source files missing" -ForegroundColor Red
}

# Test 8: Port availability
Write-Host ""
Write-Host "[8/8] Checking port availability..." -ForegroundColor Yellow

$port4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port4000) {
    Write-Host "⚠️  Port 4000 is in use (Backend server)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Port 4000 available" -ForegroundColor Green
}

if ($port3000) {
    Write-Host "⚠️  Port 3000 is in use (Frontend)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Port 3000 available" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Diagnostic Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
if (-not $nodeVersion) { $issues += "Node.js not installed" }
if (-not $npmVersion) { $issues += "npm not found" }
if (-not (Test-Path $nodeModules)) { $issues += "Dependencies not installed - run: npm install" }
if (-not (Test-Path $envFile)) { $issues += ".env file missing" }

if ($issues.Count -eq 0) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run:" -ForegroundColor Yellow
    Write-Host "   npm start" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "⚠️  Issues found:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "   • $issue" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "For help, see: AGENT_SETUP_WINDOWS.md" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
