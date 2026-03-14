@echo off
REM MomoBot Agent Windows Installer
REM This script installs Node.js and sets up the agent

setlocal enabledelayedexpansion
color 0A
cls

echo.
echo ========================================
echo   MomoBot Local Agent - Windows Setup
echo ========================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Node.js is NOT installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Download the LTS version (v18 or v20)
    echo.
    echo Steps:
    echo   1. Download from nodejs.org
    echo   2. Run the installer, accept defaults
    echo   3. Restart this script after installation
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
    echo ✅ Node.js !NODE_VER! found
)

echo.
echo [2/5] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found. Please reinstall Node.js
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
    echo ✅ npm !NPM_VER! found
)

REM Navigate to agent directory
cd /d "%~dp0momobot-agent"
if %errorlevel% neq 0 (
    echo ❌ Could not find momobot-agent directory
    pause
    exit /b 1
)

echo.
echo [3/5] Installing dependencies...
echo This may take a few minutes on first run...
npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo [4/5] Checking .env file...
if not exist ".env" (
    echo ❌ .env file not found
    echo Please ensure .env file exists with:
    echo   - AGENT_API_KEY
    echo   - AGENT_SECRET_KEY
    echo   - SERVER_URL
    pause
    exit /b 1
) else (
    echo ✅ .env file found
)

echo.
echo [5/5] Running MomoBot Agent...
echo.
echo ========================================
echo   Starting Agent...
echo ========================================
echo.

node src/index.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Agent failed to start
    echo Check the error messages above
    pause
    exit /b 1
)

pause
