# MomoBot Agent - Windows Desktop Shortcut Creator
# Run: powershell -ExecutionPolicy Bypass -File "CREATE_SHORTCUTS.ps1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MomoBot Agent - Shortcut Creator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$desktopPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'))

# Check if already running
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Script directory not found" -ForegroundColor Red
    pause
    exit 1
}

$batchFile = Join-Path $scriptPath "START_AGENT.bat"
if (-not (Test-Path $batchFile)) {
    Write-Host "❌ START_AGENT.bat not found" -ForegroundColor Red
    pause
    exit 1
}

# Create shortcut object
Write-Host "[1/3] Creating desktop shortcut..." -ForegroundColor Yellow

$shell = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $desktopPath "Start MomoBot Agent.lnk"

$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batchFile
$shortcut.WorkingDirectory = $scriptPath
$shortcut.Description = "Start MomoBot Local Agent"
$shortcut.IconLocation = "cmd.exe,0"
$shortcut.Save()

Write-Host "✅ Desktop shortcut created" -ForegroundColor Green
Write-Host "   📌 'Start MomoBot Agent.lnk'" -ForegroundColor Gray

# Create Run shortcut in startup
Write-Host ""
Write-Host "[2/3] Creating startup shortcut..." -ForegroundColor Yellow

$startupPath = [System.Environment]::GetFolderPath('Startup')
$startupShortcut = Join-Path $startupPath "MomoBot Agent.lnk"

$startupLink = $shell.CreateShortcut($startupShortcut)
$startupLink.TargetPath = $batchFile
$startupLink.WorkingDirectory = $scriptPath
$startupLink.Description = "MomoBot Agent Auto-Start"
$startupLink.Save()

Write-Host "✅ Startup shortcut created" -ForegroundColor Green
Write-Host "   📌 Agent will auto-start when you boot" -ForegroundColor Gray

# Create Quick Help shortcut
Write-Host ""
Write-Host "[3/3] Creating help shortcut..." -ForegroundColor Yellow

$helpFile = Join-Path $scriptPath "AGENT_SETUP_WINDOWS.md"
if (Test-Path $helpFile) {
    $helpShortcut = Join-Path $desktopPath "MomoBot Agent - Help.lnk"
    $helpLink = $shell.CreateShortcut($helpShortcut)
    $helpLink.TargetPath = $helpFile
    $helpLink.Save()
    
    Write-Host "✅ Help shortcut created" -ForegroundColor Green
    Write-Host "   📌 'MomoBot Agent - Help.lnk'" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Shortcuts Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Location: Desktop & Startup folder" -ForegroundColor Yellow
Write-Host ""
Write-Host "✨ Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Double-click 'Start MomoBot Agent'" -ForegroundColor Gray
Write-Host "   2. Agent will start automatically" -ForegroundColor Gray
Write-Host "   3. Look for: ✅ Connected to server" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
