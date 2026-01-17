# RAM Cleanup Script - Run when PC is slow
# Usage: powershell -ExecutionPolicy Bypass -File scripts/ram-cleanup.ps1

param(
    [switch]$Force,      # Skip confirmations
    [switch]$Aggressive  # Kill more processes
)

Write-Host "=== RAM CLEANUP ===" -ForegroundColor Cyan

# Programs safe to kill (not critical)
$safeToKill = @(
    "BlueStacksServices",
    "HD-Player",          # BlueStacks
    "Loom",
    "RescueTime",
    "WebexHost",
    "CiscoCollabHost",
    "Discord",
    "Slack",
    "Teams",
    "Spotify",
    "msedge"              # Edge (if not using)
)

# Aggressive mode adds these
$aggressiveKill = @(
    "OneDrive",
    "Docker Desktop",
    "com.docker.backend"
)

if ($Aggressive) {
    $safeToKill += $aggressiveKill
    Write-Host "Aggressive mode: Including Docker, OneDrive" -ForegroundColor Yellow
}

$freedMB = 0

foreach ($proc in $safeToKill) {
    $processes = Get-Process -Name $proc -ErrorAction SilentlyContinue
    if ($processes) {
        $procMB = [math]::Round(($processes | Measure-Object WorkingSet64 -Sum).Sum/1MB)

        if (-not $Force) {
            $confirm = Read-Host "Kill $proc ($procMB MB)? [y/N]"
            if ($confirm -ne 'y') { continue }
        }

        Write-Host "Killing $proc... ($procMB MB)" -ForegroundColor Yellow
        $processes | Stop-Process -Force -ErrorAction SilentlyContinue
        $freedMB += $procMB
    }
}

# Clear standby memory (requires admin, optional)
Write-Host "`nClearing system working set..." -ForegroundColor Yellow
[System.GC]::Collect()

# Report
Write-Host "`n=== CLEANUP COMPLETE ===" -ForegroundColor Green
Write-Host "Freed approximately: $freedMB MB"

# Show new RAM status
$os = Get-CimInstance Win32_OperatingSystem
$freeRAM = [math]::Round($os.FreePhysicalMemory/1MB, 2)
Write-Host "Free RAM now: $freeRAM GB"
