@echo off
REM MomoBot Agent - Connection Test Script
REM This verifies the agent is properly connected

setlocal enabledelayedexpansion
color 0B
cls

echo.
echo ========================================
echo   MomoBot Agent - Connection Test
echo ========================================
echo.

:menu
echo.
echo What would you like to test?
echo.
echo [1] Check if agent is running
echo [2] Check if server is running
echo [3] Check port availability
echo [4] View agent logs
echo [5] Restart agent
echo [6] Run diagnostics
echo [7] Exit
echo.
set /p choice="Enter your choice [1-7]: "

if "%choice%"=="1" goto check_agent
if "%choice%"=="2" goto check_server
if "%choice%"=="3" goto check_ports
if "%choice%"=="4" goto view_logs
if "%choice%"=="5" goto restart_agent
if "%choice%"=="6" goto diagnostics
if "%choice%"=="7" exit /b 0

echo Invalid choice. Please try again.
goto menu

:check_agent
echo.
echo Checking if agent is running...
echo.
tasklist | findstr /i "node" >nul
if %errorlevel% equ 0 (
    echo ✅ Node.js process is running
    echo.
    tasklist | findstr "node"
) else (
    echo ❌ No Node.js processes found
    echo.
    echo Start agent with: npm start
)
echo.
pause
goto menu

:check_server
echo.
echo Checking backend server...
echo.
netstat -ano | findstr ":4000" >nul
if %errorlevel% equ 0 (
    echo ✅ Server is listening on port 4000
    netstat -ano | findstr ":4000"
) else (
    echo ❌ Server not running on port 4000
    echo.
    echo Start server with: npm start (in server directory)
)
echo.
pause
goto menu

:check_ports
echo.
echo Checking port availability...
echo.

netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Port 3000 is in use (Frontend)
) else (
    echo ✅ Port 3000 available
)

netstat -ano | findstr ":4000" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Port 4000 in use (Backend)
) else (
    echo ✅ Port 4000 available
)

echo.
echo Note: If server process is running, these ports should be in use.
echo.
pause
goto menu

:view_logs
echo.
cd /d "%~dp0momobot-agent"
if exist "logs\" (
    echo Recent log files:
    echo.
    dir logs /b
    echo.
    set /p logfile="Enter log filename to view: "
    if exist "logs\!logfile!" (
        echo.
        echo ========================================
        echo Last 50 lines of !logfile!:
        echo ========================================
        echo.
        powershell -Command "Get-Content logs\!logfile! -Tail 50"
    ) else (
        echo Log file not found
    )
) else (
    echo No logs directory found
)
echo.
pause
goto menu

:restart_agent
echo.
echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo ✅ Node.js processes stopped
    echo.
    echo Waiting 3 seconds...
    timeout /t 3 /nobreak
    echo.
    echo Starting agent...
    cd /d "%~dp0momobot-agent"
    npm start
) else (
    echo No Node.js processes to stop
    echo.
    echo Starting agent...
    cd /d "%~dp0momobot-agent"
    npm start
)
pause
goto menu

:diagnostics
echo.
echo This will run PowerShell diagnostics...
echo Do you have PowerShell? (Y/N)
set /p hasPowershell="Enter Y or N: "

if /i "%hasPowershell%"=="Y" (
    powershell -ExecutionPolicy Bypass -File "%~dp0DIAGNOSE_AGENT.ps1"
) else (
    echo Manual checks:
    echo.
    node --version
    npm --version
    echo.
    echo Check agent directory:
    cd /d "%~dp0momobot-agent"
    dir
)
echo.
pause
goto menu
