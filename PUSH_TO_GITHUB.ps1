# MomoBot - Git Push Helper
# Run: powershell -ExecutionPolicy Bypass -File "PUSH_TO_GITHUB.ps1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MomoBot - Push to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Git
Write-Host "[1/5] Checking Git installation..." -ForegroundColor Yellow
$gitVersion = git --version 2>$null

if (-not $gitVersion) {
    Write-Host "❌ Git is NOT installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Steps to fix:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://git-scm.com/download/win" -ForegroundColor Gray
    Write-Host "2. Run installer, accept defaults" -ForegroundColor Gray
    Write-Host "3. Restart PowerShell" -ForegroundColor Gray
    Write-Host "4. Run this script again" -ForegroundColor Gray
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Host "✅ $gitVersion" -ForegroundColor Green
}

# Step 2: Check Git Config
Write-Host ""
Write-Host "[2/5] Checking Git configuration..." -ForegroundColor Yellow
$gitUser = git config --global user.name 2>$null
$gitEmail = git config --global user.email 2>$null

if (-not $gitUser -or -not $gitEmail) {
    Write-Host "⚠️  Git user not configured" -ForegroundColor Yellow
    Write-Host ""
    $name = Read-Host "Enter your name (for commits)"
    $email = Read-Host "Enter your email (for commits)"
    
    git config --global user.name $name
    git config --global user.email $email
    
    Write-Host "✅ Git configured" -ForegroundColor Green
} else {
    Write-Host "✅ Configured as: $gitUser <$gitEmail>" -ForegroundColor Green
}

# Step 3: Check Repository
Write-Host ""
Write-Host "[3/5] Checking repository status..." -ForegroundColor Yellow

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptPath

if (-not (Test-Path ".git")) {
    Write-Host "⚠️  Git repository not initialized" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Initializing repository..." -ForegroundColor Yellow
    git init
    
    $repoUrl = Read-Host "Enter GitHub repository URL (e.g., https://github.com/username/repo.git)"
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✅ Remote added: $repoUrl" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Repository initialized" -ForegroundColor Green
}

# Step 4: Stage Files
Write-Host ""
Write-Host "[4/5] Staging files..." -ForegroundColor Yellow
git add .
$fileCount = (git status --short | Measure-Object).Count
Write-Host "✅ Staged files" -ForegroundColor Green

# Step 5: Commit and Push
Write-Host ""
Write-Host "[5/5] Committing and pushing..." -ForegroundColor Yellow
Write-Host ""

$commits = git log --oneline 2>$null | Measure-Object
if ($commits.Count -eq 0) {
    Write-Host "First time committing..." -ForegroundColor Gray
    $message = "Initial commit: MomoBot platform with setup scripts"
} else {
    $message = Read-Host "Enter commit message (or press Enter for auto-generated): "
    if (-not $message) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        $message = "Update: Code push at $timestamp"
    }
}

Write-Host ""
Write-Host "Committing: '$message'" -ForegroundColor Cyan
git commit -m $message

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main 2>&1

$exitCode = $LASTEXITCODE
if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "View your code:" -ForegroundColor Yellow
    $remote = git remote get-url origin
    Write-Host $remote -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⚠️  Push completed with exit code: $exitCode" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If you get 'fatal: 'main' branch not found':" -ForegroundColor Yellow
    Write-Host "  1. Go to GitHub and set default branch to 'master' or 'main'" -ForegroundColor Gray
    Write-Host "  2. Or try: git push -u origin master" -ForegroundColor Gray
    Write-Host ""
    Write-Host "If you get 'Authentication failed':" -ForegroundColor Yellow
    Write-Host "  1. Use GitHub token instead of password" -ForegroundColor Gray
    Write-Host "  2. Create token: https://github.com/settings/tokens" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
