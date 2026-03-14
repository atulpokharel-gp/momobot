@echo off
REM MomoBot Agent Setup - Main Menu
REM Choose what you want to do

setlocal enabledelayedexpansion
color 0B
cls

:menu
echo.
echo ========================================
echo   MomoBot Agent - Setup & Management
echo ========================================
echo.
echo What would you like to do?
echo.
echo ⭐ SETUP & INSTALLATION:
echo [1] Quick Start Agent (Easiest - Just run it!)
echo [2] Complete Setup Wizard
echo [3] Auto-Download Node.js & Setup
echo.
echo 🔧 TOOLS:
echo [4] Create Desktop Shortcuts
echo [5] Run Diagnostics (Check if everything works)
echo [6] Test Connection (Verify agent is connected)
echo.
echo 📚 DOCUMENTATION:
echo [7] View Setup Guide
echo [8] View Agent Configuration
echo [9] View Status Information
echo.
echo 🚀 DIRECT COMMANDS:
echo [10] Start Agent Now
echo [11] Stop All Node Processes
echo [12] Open Agent Logs
echo.
echo [0] Exit
echo.
set /p choice="Enter your choice [0-12]: "

if "%choice%"=="0" exit /b 0
if "%choice%"=="1" goto start_agent
if "%choice%"=="2" goto setup_wizard
if "%choice%"=="3" goto auto_setup
if "%choice%"=="4" goto create_shortcuts
if "%choice%"=="5" goto diagnostics
if "%choice%"=="6" goto test_connection
if "%choice%"=="7" goto view_guide
if "%choice%"=="8" goto view_config
if "%choice%"=="9" goto view_status
if "%choice%"=="10" goto run_agent
if "%choice%"=="11" goto stop_agent
if "%choice%"=="12" goto view_logs

echo.
echo Invalid choice. Please try again.
echo.
pause
goto menu

:start_agent
echo.
echo Starting Agent...
echo.
cd /d "%~dp0momobot-agent"
npm start
pause
goto menu

:setup_wizard
echo.
echo Running Complete Setup...
echo.
call "%~dp0INSTALL_AGENT_WINDOWS.bat"
goto menu

:auto_setup
echo.
echo Running Auto-Setup (will download Node.js if needed)...
echo.
call "%~dp0COMPLETE_SETUP.bat"
goto menu

:create_shortcuts
echo.
echo Creating desktop shortcuts...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0CREATE_SHORTCUTS.ps1"
goto menu

:diagnostics
echo.
echo Running diagnostics...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0DIAGNOSE_AGENT.ps1"
goto menu

:test_connection
echo.
echo Testing agent connection...
echo.
call "%~dp0TEST_AGENT_CONNECTION.bat"
goto menu

:view_guide
echo.
echo Opening setup guide...
echo.
if exist "%~dp0AGENT_SETUP_WINDOWS.md" (
    start "" "%~dp0AGENT_SETUP_WINDOWS.md"
) else (
    echo Guide file not found
    pause
)
goto menu

:view_config
echo.
echo Opening configuration file...
echo.
if exist "%~dp0momobot-agent\.env" (
    start "" "%~dp0momobot-agent\.env"
) else (
    echo .env file not found
    pause
)
goto menu

:view_status
echo.
echo ========================================
echo   System Status
echo ========================================
echo.
echo Node.js:
node --version 2>nul || echo  ❌ Not installed
echo.
echo npm:
npm --version 2>nul || echo  ❌ Not installed
echo.
echo Running Node Processes:
tasklist | findstr "node" 2>nul || echo  None running
echo.
echo Port Status:
netstat -ano | findstr ":4000" >nul && echo  ✅ Port 4000 (Server): In use || echo  ❌ Port 4000: Not in use
netstat -ano | findstr ":3000" >nul && echo  ✅ Port 3000 (Frontend): In use || echo  ❌ Port 3000: Not in use
echo.
pause
goto menu

:run_agent
echo.
echo Stopping existing processes...
taskkill /F /IM node.exe 2>nul
echo.
cd /d "%~dp0momobot-agent"
echo Starting agent...
echo.
npm start
pause
goto menu

:stop_agent
echo.
echo Stopping all Node processes...
taskkill /F /IM node.exe
echo.
echo Done.
echo.
pause
goto menu

:view_logs
echo.
cd /d "%~dp0momobot-agent"
if exist "logs\" (
    echo Available log files:
    echo.
    dir logs /b
    echo.
) else (
    echo No logs directory yet
    echo (Logs will appear after agent runs)
    echo.
)
if exist "logs\agent.log" (
    echo Showing last 30 lines of agent.log:
    echo.
    powershell -Command "Get-Content logs\agent.log -Tail 30"
)
echo.
pause
goto menu
