@echo off
REM MomoBot - Install Git for Windows
REM This script installs Git so you can push code to GitHub

setlocal enabledelayedexpansion
color 0B
cls

echo.
echo ========================================
echo   Git Installation Helper
echo ========================================
echo.

echo [1/3] Checking if Git is installed...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is NOT installed
    echo.
    echo [2/3] To push code to GitHub, you need Git
    echo.
    echo Options:
    echo.
    echo Option A: Download from website (Recommended)
    echo   1. Visit: https://git-scm.com/download/win
    echo   2. Download the installer
    echo   3. Run installer, accept defaults
    echo   4. Restart this script
    echo.
    echo Option B: Use Chocolatey (if installed)
    echo   1. Open PowerShell as Administrator
    echo   2. Run: choco install git
    echo   3. Restart computer
    echo.
    echo Option C: Use Windows Package Manager
    echo   1. Open PowerShell as Administrator
    echo   2. Run: winget install --id Git.Git -e --source winget
    echo   3. Restart computer
    echo.
    echo After installation:
    echo   1. Rerun this script
    echo   2. It will guide you through git setup
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VER=%%i
    echo ✅ !GIT_VER!
)

echo.
echo [3/3] Checking git configuration...
git config --global user.name >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Git user not configured
    echo.
    echo Setting up Git...
    echo.
    set /p GIT_NAME="Enter your name (for git commits): "
    set /p GIT_EMAIL="Enter your email (for git commits): "
    
    git config --global user.name "!GIT_NAME!"
    git config --global user.email "!GIT_EMAIL!"
    
    echo.
    echo ✅ Git configured: !GIT_NAME! ^<!GIT_EMAIL!^>
) else (
    echo ✅ Git user already configured
)

echo.
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Set up GitHub repository:
echo    Go to: https://github.com/new
echo    Create a new repository
echo.
echo 2. In your project folder, initialize git:
echo    cd C:\Users\[YOU]\Desktop\momobot-platform
echo    git init
echo.
echo 3. Add remote (replace with your URL):
echo    git remote add origin https://github.com/YOUR_USERNAME/momobot.git
echo.
echo 4. Push code:
echo    git add .
echo    git commit -m "Initial commit: MomoBot platform"
echo    git push -u origin main
echo.
echo ========================================
echo.

pause
