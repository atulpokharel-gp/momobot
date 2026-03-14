@echo off
TITLE MomoBot Platform Setup and Start

echo.
echo ========================================
echo    MomoBot Platform - Windows Setup
echo ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERROR] Node.js not found! Install from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Install server dependencies
echo.
echo [1/3] Installing server dependencies...
cd /d "%~dp0server"
npm install
IF ERRORLEVEL 1 (echo [ERROR] Server install failed & pause & exit /b 1)

REM Install client dependencies
echo.
echo [2/3] Installing client dependencies...
cd /d "%~dp0client"
npm install
IF ERRORLEVEL 1 (echo [ERROR] Client install failed & pause & exit /b 1)

REM Install agent dependencies
echo.
echo [3/3] Installing agent dependencies...
cd /d "%~dp0momobot-agent"
npm install
IF ERRORLEVEL 1 (echo [ERROR] Agent install failed & pause & exit /b 1)

echo.
echo ========================================
echo    Starting MomoBot Platform
echo ========================================
echo.

REM Start server in new window
start "MomoBot Server" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3 /nobreak >nul

REM Start client in new window
start "MomoBot Dashboard" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo [OK] MomoBot Platform starting!
echo.
echo   Server:    http://localhost:4000
echo   Dashboard: http://localhost:3000
echo   Health:    http://localhost:4000/health
echo.
echo   Default admin login:
echo   Email:    admin@momobot.local
echo   Password: Admin@123456
echo.
echo   To connect an agent, copy momobot-agent\ to your local machine,
echo   configure .env with your agent credentials, then run: npm start
echo.
pause
