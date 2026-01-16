# Night-Burst Launcher V3.1 - For Windows Task Scheduler
# This script can run detached from any terminal
# Now with Plan Mode and automatic account rotation support
#
# Setup Task Scheduler:
# 1. Open Task Scheduler (taskschd.msc)
# 2. Create Basic Task: "Night-Burst"
# 3. Trigger: Daily at 01:30
# 4. Action: Start Program
#    - Program: powershell.exe
#    - Arguments: -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder\scripts\night-burst-launcher.ps1" -PlanMode
# 5. Conditions: Uncheck "Start only if on AC power"
# 6. Settings: Check "Run task as soon as possible after a scheduled start is missed"

param(
    [switch]$Test,
    [switch]$PlanMode,
    [int]$MaxDurationHours = 10  # Auto-stop after 10 hours (08:00 next day)
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$LogDir = Join-Path $ProjectRoot "logs"
$ProgressDir = Join-Path $ProjectRoot "content\claude-progress"

# Ensure log directory exists
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$LogFile = Join-Path $LogDir "night-burst-$(Get-Date -Format 'yyyy-MM-dd').log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $Message"
    Add-Content -Path $LogFile -Value $logEntry
    Write-Host $logEntry
}

function Test-ClaudeAvailable {
    try {
        $result = & claude --version 2>&1
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Prevent-Sleep {
    # Prevent PC from sleeping during night burst
    # Uses powercfg to set active power scheme to high performance temporarily

    Write-Log "Setting power plan to prevent sleep..."

    # Store current scheme
    $currentScheme = powercfg /getactivescheme

    # Set to High Performance (doesn't sleep)
    powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c

    return $currentScheme
}

function Restore-Sleep {
    param([string]$OriginalScheme)

    if ($OriginalScheme -match "([a-f0-9-]{36})") {
        $schemeGuid = $Matches[1]
        powercfg /setactive $schemeGuid
        Write-Log "Restored original power scheme"
    }
}

function Start-NightBurst {
    Write-Log "========================================"
    Write-Log " NIGHT-BURST LAUNCHER V3.1 STARTED"
    Write-Log "========================================"
    Write-Log "Project: $ProjectRoot"
    Write-Log "Max Duration: $MaxDurationHours hours"
    Write-Log "Plan Mode: $PlanMode"

    # Check prerequisites
    if (-not (Test-ClaudeAvailable)) {
        Write-Log "ERROR: Claude CLI not found or not working"
        return
    }
    Write-Log "Claude CLI: OK"

    # Prevent sleep
    $originalPower = Prevent-Sleep

    # Calculate end time
    $startTime = Get-Date
    $endTime = $startTime.AddHours($MaxDurationHours)
    Write-Log "Start: $startTime"
    Write-Log "Auto-Stop: $endTime"

    # Create a "running" indicator file
    $runningFile = Join-Path $ProgressDir "launcher-running.json"
    @{
        started_at = $startTime.ToUniversalTime().ToString("o")
        ends_at = $endTime.ToUniversalTime().ToString("o")
        pid = $PID
        log_file = $LogFile
    } | ConvertTo-Json | Set-Content $runningFile

    try {
        # Start the orchestrator in a new process (not job, for persistence)
        $orchestratorPath = Join-Path $ProjectRoot "scripts\night-burst-orchestrator.ps1"

        if (-not (Test-Path $orchestratorPath)) {
            Write-Log "ERROR: Orchestrator script not found at $orchestratorPath"
            return
        }

        Write-Log "Starting orchestrator..."

        # Build orchestrator arguments
        $orchArgs = "-ExecutionPolicy Bypass -File `"$orchestratorPath`""
        if ($PlanMode) {
            $orchArgs += " -PlanMode"
        }

        # Use Start-Process to run detached (Normal = visible for debugging)
        $process = Start-Process -FilePath "powershell.exe" `
            -ArgumentList $orchArgs `
            -WindowStyle Normal `
            -PassThru

        Write-Log "Orchestrator started with PID: $($process.Id)"

        # Start plan monitor if in plan mode
        if ($PlanMode) {
            $planMonitorPath = Join-Path $ProjectRoot "scripts\night-burst-plan-monitor.ps1"
            if (Test-Path $planMonitorPath) {
                Write-Log "Starting plan monitor..."
                $monitorProcess = Start-Process -FilePath "powershell.exe" `
                    -ArgumentList "-ExecutionPolicy Bypass -File `"$planMonitorPath`"" `
                    -WindowStyle Hidden `
                    -PassThru
                Write-Log "Plan monitor started with PID: $($monitorProcess.Id)"
            }
        }

        # Update running file with orchestrator PID
        $running = Get-Content $runningFile | ConvertFrom-Json
        $running | Add-Member -NotePropertyName "orchestrator_pid" -NotePropertyValue $process.Id -Force
        $running | ConvertTo-Json | Set-Content $runningFile

        # Monitor loop - check every 15 minutes
        while ((Get-Date) -lt $endTime) {
            Start-Sleep -Seconds 900  # 15 minutes

            # Check if orchestrator still running
            $orch = Get-Process -Id $process.Id -ErrorAction SilentlyContinue
            if (-not $orch) {
                Write-Log "WARNING: Orchestrator died, restarting..."
                $process = Start-Process -FilePath "powershell.exe" `
                    -ArgumentList "-ExecutionPolicy Bypass -File `"$orchestratorPath`"" `
                    -WindowStyle Normal `
                    -PassThru
                Write-Log "Orchestrator restarted with PID: $($process.Id)"
            }

            # Log heartbeat
            Write-Log "Heartbeat: Orchestrator running (PID: $($process.Id))"
        }

        Write-Log "Max duration reached, stopping..."

        # Stop orchestrator gracefully
        & powershell.exe -File "$orchestratorPath" -Stop

    } catch {
        Write-Log "ERROR: $($_.Exception.Message)"
    } finally {
        # Cleanup
        Restore-Sleep -OriginalScheme $originalPower

        if (Test-Path $runningFile) {
            Remove-Item $runningFile -Force
        }

        Write-Log "Night-Burst Launcher stopped"
        Write-Log "========================================"
    }
}

function Show-SetupInstructions {
    Write-Host @"

    ╔═══════════════════════════════════════════════════════════════╗
    ║           NIGHT-BURST V3.1 AUTO-START SETUP                  ║
    ╠═══════════════════════════════════════════════════════════════╣
    ║                                                               ║
    ║  To run Night-Burst with Plan Mode every night at 01:30:     ║
    ║                                                               ║
    ║  1. Open Task Scheduler:                                      ║
    ║     Win + R → taskschd.msc → Enter                           ║
    ║                                                               ║
    ║  2. Click "Create Basic Task..."                             ║
    ║     Name: Night-Burst                                        ║
    ║                                                               ║
    ║  3. Trigger: Daily, 01:30                                    ║
    ║                                                               ║
    ║  4. Action: Start a program                                  ║
    ║     Program: powershell.exe                                  ║
    ║     Arguments:                                               ║
    ║       -ExecutionPolicy Bypass -WindowStyle Hidden            ║
    ║       -File "$ProjectRoot\scripts\night-burst-launcher.ps1"  ║
    ║       -PlanMode                                              ║
    ║                                                               ║
    ║  5. In Properties → Conditions:                              ║
    ║     [ ] Uncheck "Start only if on AC power"                  ║
    ║     [ ] Uncheck "Stop if computer switches to battery"       ║
    ║                                                               ║
    ║  6. In Properties → Settings:                                ║
    ║     [x] "Run task as soon as possible after missed start"    ║
    ║     [x] "If task fails, restart every 5 minutes"             ║
    ║                                                               ║
    ║  Features:                                                    ║
    ║  - Automatic account rotation (3 accounts, usage-based)      ║
    ║  - Plan mode: Agents create plans, wait for your approval    ║
    ║  - Notification when all 15 plans are ready                  ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

    Write-Host "Quick Test Commands:" -ForegroundColor Yellow
    Write-Host "  .\scripts\night-burst-launcher.ps1 -Test           # Quick 1-min test" -ForegroundColor White
    Write-Host "  .\scripts\night-burst-launcher.ps1 -PlanMode       # Start with plan mode" -ForegroundColor White
    Write-Host "  .\scripts\night-burst-orchestrator.ps1 -PlanMode   # Orchestrator only" -ForegroundColor White
    Write-Host "  .\scripts\Get-BestAccount.ps1 -Verbose             # Check account selection" -ForegroundColor White
    Write-Host ""
}

# Main
if ($Test) {
    Write-Host "TEST MODE: Running launcher for 1 minute..." -ForegroundColor Yellow
    $MaxDurationHours = 0.017  # ~1 minute
    Start-NightBurst
} else {
    # Check if we're being run interactively or from scheduler
    if ([Environment]::UserInteractive) {
        Show-SetupInstructions

        $response = Read-Host "Start Night-Burst now? (y/n)"
        if ($response -eq 'y') {
            Start-NightBurst
        }
    } else {
        # Running from Task Scheduler
        Start-NightBurst
    }
}
