@echo off
REM MomoBot Agent Launcher
REM Double-click this to start the agent

setlocal enabledelayedexpansion
color 0A

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   ERROR: Node.js Not Installed
    echo ========================================
    echo.
    echo Please install Node.js first:
    echo https://nodejs.org/ (LTS version recommended)
    echo.
    echo After installation, double-click this file again.
    echo.
    pause
    exit /b 1
)

REM Navigate to agent directory
cd /d "%~dp0momobot-agent"

echo.
echo ========================================
echo   MomoBot Local Agent
echo ========================================
echo.
echo Starting agent...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo.
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the agent
call npm start

if %errorlevel% neq 0 (
    echo.
    echo Agent stopped with error code: %errorlevel%
    pause
)
