# Disable Startup Bloat - Run as Administrator
# Usage: powershell -ExecutionPolicy Bypass -File scripts/disable-startup-bloat.ps1

Write-Host "=== DISABLE STARTUP BLOAT ===" -ForegroundColor Cyan
Write-Host "This disables RAM-hungry programs from auto-starting" -ForegroundColor Yellow
Write-Host ""

# These programs use lots of RAM and aren't needed at startup
$bloatPrograms = @{
    "BlueStacks Services" = "electron.app.BlueStacks Services"
    "Docker Desktop" = "Docker Desktop"
    "Discord" = "Discord"
    "Loom" = "electron.app.Loom"
    "RescueTime" = "RescueTime"
    "Webex" = "CiscoSpark"
    "Webex Daemon" = "CiscoMeetingDaemon"
    "AnyDesk Watchdog" = "AnyDesk-Watchdog"
    "Edge Auto-Launch" = "MicrosoftEdgeAutoLaunch*"
    "Teams" = "com.squirrel.Teams.Teams"
    "Nearby Share" = "Nearby Share"
}

# Disable via Registry (User startup)
$startupPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"

Write-Host "Checking registry startup items..." -ForegroundColor Yellow

foreach ($name in $bloatPrograms.Keys) {
    $regName = $bloatPrograms[$name]
    $existing = Get-ItemProperty -Path $startupPath -Name $regName -ErrorAction SilentlyContinue

    if ($existing) {
        Write-Host "  Disabling: $name" -ForegroundColor Red
        Remove-ItemProperty -Path $startupPath -Name $regName -ErrorAction SilentlyContinue
    }
}

# Disable via Task Manager startup (more comprehensive)
Write-Host "`nDisabling via Startup folder..." -ForegroundColor Yellow

$startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$disabledFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup-Disabled"

if (-not (Test-Path $disabledFolder)) {
    New-Item -ItemType Directory -Path $disabledFolder -Force | Out-Null
}

$shortcuts = Get-ChildItem $startupFolder -Filter "*.lnk" -ErrorAction SilentlyContinue
foreach ($shortcut in $shortcuts) {
    foreach ($name in $bloatPrograms.Keys) {
        if ($shortcut.Name -match $name) {
            Write-Host "  Moving to disabled: $($shortcut.Name)" -ForegroundColor Red
            Move-Item $shortcut.FullName $disabledFolder -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "`n=== RECOMMENDATIONS ===" -ForegroundColor Cyan
Write-Host "1. Open Task Manager (Ctrl+Shift+Esc) > Startup tab"
Write-Host "2. Disable these manually if still enabled:"
Write-Host "   - Docker Desktop"
Write-Host "   - BlueStacks"
Write-Host "   - Discord"
Write-Host "   - Teams"
Write-Host "   - Webex"
Write-Host "   - Loom"
Write-Host "   - RescueTime"
Write-Host ""
Write-Host "3. Restart PC to see RAM savings" -ForegroundColor Green
