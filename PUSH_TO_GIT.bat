@echo off
REM MomoBot - Push Code to GitHub
REM Run this script to push all code to your GitHub repository

setlocal enabledelayedexpansion
color 0A
cls

echo.
echo ========================================
echo   MomoBot - Git Push
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed
    echo.
    echo Install from: https://git-scm.com/download/win
    echo Then run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Git found
echo.

REM Check if repository exists
if not exist ".git" (
    echo ⚠️  Git repository not initialized
    echo.
    echo Do you want to initialize it? (Y/N)
    set /p init_choice=Enter Y or N: 
    
    if /i "!init_choice!"=="Y" (
        echo.
        echo [1/2] Initializing repository...
        git init
        echo ✅ Initialized
        echo.
        
        echo [2/2] Adding remote repository...
        set /p repo_url=Enter GitHub repository URL (https://...): 
        git remote add origin !repo_url!
        echo ✅ Remote added
    ) else (
        echo Skipped initialization
        echo.
        echo To initialize manually:
        echo   git init
        echo   git remote add origin YOUR_GITHUB_URL
        echo.
        pause
        exit /b 0
    )
)

echo.
echo [1/4] Checking Git user...
git config --global user.name >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Git user not configured
    echo.
    set /p user_name=Enter your name: 
    set /p user_email=Enter your email: 
    
    git config --global user.name "!user_name!"
    git config --global user.email "!user_email!"
    echo ✅ User configured
) else (
    git config --global user.name
    echo ✅ Configured
)

echo.
echo [2/4] Staging files...
git add .
for /f "tokens=*" %%i in ('git status --short ^| find /c /v ""') do set FILE_COUNT=%%i
echo ✅ Staged %FILE_COUNT% files

echo.
echo [3/4] Creating commit...
git log --oneline >nul 2>&1
if %errorlevel% equ 0 (
    echo Commits exist. Enter message (or press Enter for auto-generated):
    set /p commit_msg=Commit message: 
    if "!commit_msg!"=="" (
        for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
        for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)
        set commit_msg=Update: Code push at !mydate! !mytime!
    )
) else (
    set commit_msg=Initial commit: MomoBot platform with setup scripts
)

git commit -m "!commit_msg!"
if %errorlevel% neq 0 (
    echo ⚠️  No changes to commit
) else (
    echo ✅ Committed
)

echo.
echo [4/4] Pushing to GitHub...
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Push to 'main' failed, trying 'master'...
    git push -u origin master
)

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ Successfully pushed to GitHub!
    echo ========================================
    echo.
    echo View your code:
    git remote get-url origin
    echo.
) else (
    echo.
    echo ❌ Push failed
    echo.
    echo Check your:
    echo   1. GitHub repository URL
    echo   2. GitHub credentials
    echo   3. Network connection
    echo.
)

echo.
pause
