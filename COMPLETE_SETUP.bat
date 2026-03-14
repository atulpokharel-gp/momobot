@echo off
REM MomoBot Agent Complete Setup
REM Downloads Node.js if not installed, then sets up agent

setlocal enabledelayedexpansion
color 0B
cls

echo.
echo ========================================
echo   MomoBot Agent - Complete Setup
echo   Windows Installer
echo ========================================
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  This script needs Administrator privileges
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo ✅ Running as Administrator
echo.

REM Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Node.js not found
    echo.
    echo [2/6] Downloading Node.js LTS...
    
    REM Create temp directory
    if not exist "%temp%\momobot-setup" mkdir "%temp%\momobot-setup"
    cd /d "%temp%\momobot-setup"
    
    REM Download Node.js using PowerShell (more reliable)
    powershell -Command "(New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi', 'node-installer.msi')"
    
    if exist "node-installer.msi" (
        echo ✅ Downloaded Node.js
        echo.
        echo [3/6] Installing Node.js...
        msiexec.exe /i "node-installer.msi" /qn
        
        REM Wait for installation
        timeout /t 30 /nobreak
        
        echo ✅ Node.js installed
        echo.
        echo ⚠️  Please close and re-run this script
        echo.
        pause
        exit /b 0
    ) else (
        echo.
        echo ❌ Failed to download Node.js
        echo.
        echo Please install manually from: https://nodejs.org/
        echo Then run this script again
        echo.
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo ✅ Node.js !NODE_VER! found
    echo.
    echo [2/6] Skipped (Node.js already installed)
    echo.
)

REM Check npm
echo [3/6] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
    echo ✅ npm !NPM_VER! found
    echo.
)

REM Navigate to agent directory
echo [4/6] Locating agent directory...
cd /d "%~dp0"
if not exist "momobot-agent" (
    echo ❌ momobot-agent not found
    pause
    exit /b 1
)
cd momobot-agent
echo ✅ Found agent directory
echo.

REM Install dependencies
echo [5/6] Installing dependencies...
echo Please wait, this may take a few minutes...
npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to install dependencies
    echo Try running: npm install
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Check .env
echo [6/6] Checking configuration...
if not exist ".env" (
    echo ❌ .env file not found
    pause
    exit /b 1
)
echo ✅ Configuration found
echo.

echo ========================================
echo.
echo ✅ Setup Complete!
echo.
echo You can now:
echo   1. Run: npm start
echo   2. Or double-click START_AGENT.bat
echo.
echo Expected output:
echo   ✅ Connected to MomoBot server
echo.
echo ========================================
echo.

pause
