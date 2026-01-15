# Night-Burst Session Manager
# Handles context limits by auto-restarting agents with preserved state
#
# Problem: Claude agents hit context limit after ~2-3 hours
# Solution: Short sessions (90 min) with checkpoint-based restart

param(
    [int]$AgentNum,
    [switch]$All,
    [int]$SessionDurationMinutes = 90,  # Restart before context limit
    [int]$MaxSessions = 6  # 6 × 90min = 9 hours coverage
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$ProgressDir = Join-Path $ProjectRoot "content\claude-progress"
$LogDir = Join-Path $ProjectRoot "logs"

# Agent Configuration (same as orchestrator)
$AgentConfig = @{
    1 = @{ Name = "lead-finder"; Chrome = $true; Priority = 1 }
    2 = @{ Name = "cold-emailer"; Chrome = $false; Priority = 1 }
    3 = @{ Name = "social-dm"; Chrome = $true; Priority = 3 }
    4 = @{ Name = "demo-generator"; Chrome = $false; Priority = 2 }
    5 = @{ Name = "hot-lead-chaser"; Chrome = $false; Priority = 1 }
    6 = @{ Name = "user-activator"; Chrome = $false; Priority = 2 }
    7 = @{ Name = "payment-converter"; Chrome = $false; Priority = 1 }
    8 = @{ Name = "upgrader"; Chrome = $false; Priority = 3 }
    9 = @{ Name = "doctor"; Chrome = $false; Priority = 2 }
    10 = @{ Name = "morning-briefer"; Chrome = $false; Priority = 3 }
    11 = @{ Name = "bottleneck-analyzer"; Chrome = $false; Priority = 3 }
    12 = @{ Name = "creative-strategist"; Chrome = $false; Priority = 3 }
    13 = @{ Name = "churn-prevention"; Chrome = $false; Priority = 2 }
    14 = @{ Name = "lead-scorer"; Chrome = $false; Priority = 2 }
    15 = @{ Name = "approval-gate"; Chrome = $false; Priority = 1 }
}

# Priority 1 = Critical (always run)
# Priority 2 = Important (run if resources allow)
# Priority 3 = Nice-to-have (run in later sessions)

function Get-Timestamp {
    return (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

function Write-SessionLog {
    param([int]$Agent, [string]$Message)

    $logFile = Join-Path $LogDir "burst-$Agent-sessions.log"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] $Message"

    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }

    Add-Content -Path $logFile -Value $entry
    Write-Host "Burst-$Agent : $Message"
}

function Save-AgentCheckpoint {
    param([int]$AgentNum, [string]$Reason)

    $checkpointFile = Join-Path $ProgressDir "checkpoint-store.json"
    $statusFile = Join-Path $ProgressDir "burst-$AgentNum-status.json"

    if (-not (Test-Path $checkpointFile)) {
        @{ checkpoints = @(); recovery_log = @() } | ConvertTo-Json | Set-Content $checkpointFile
    }

    $store = Get-Content $checkpointFile | ConvertFrom-Json
    $status = if (Test-Path $statusFile) { Get-Content $statusFile | ConvertFrom-Json } else { $null }

    $checkpoint = @{
        id = [guid]::NewGuid().ToString()
        agent = "burst-$AgentNum"
        reason = $Reason
        session_number = if ($status) { $status.current_loop } else { 0 }
        metrics = if ($status) { $status.metrics } else { @{} }
        created_at = Get-Timestamp
        status = "pending"
    }

    $store.checkpoints += $checkpoint
    $store | ConvertTo-Json -Depth 10 | Set-Content $checkpointFile

    Write-SessionLog -Agent $AgentNum -Message "Checkpoint saved: $Reason"
}

function Run-AgentSession {
    param(
        [int]$AgentNum,
        [int]$SessionNumber,
        [int]$DurationMinutes
    )

    $config = $AgentConfig[$AgentNum]
    $sessionName = "BURST${AgentNum}_S${SessionNumber}"

    Write-SessionLog -Agent $AgentNum -Message "Starting session $SessionNumber (max ${DurationMinutes}min)"

    # Update status file
    $statusFile = Join-Path $ProgressDir "burst-$AgentNum-status.json"
    if (Test-Path $statusFile) {
        $status = Get-Content $statusFile | ConvertFrom-Json
        $status.current_loop = $SessionNumber
        $status.last_heartbeat = Get-Timestamp
        $status.status = "running"
        $status | ConvertTo-Json -Depth 10 | Set-Content $statusFile
    }

    # Build claude command
    $chromeFlag = if ($config.Chrome) { "--chrome" } else { "" }
    $command = "/night-burst-$AgentNum"

    # Set session environment
    $env:CLAUDE_SESSION = $sessionName

    # Start claude with timeout
    $startTime = Get-Date
    $endTime = $startTime.AddMinutes($DurationMinutes)

    try {
        $process = Start-Process -FilePath "claude" `
            -ArgumentList $chromeFlag, $command `
            -PassThru `
            -NoNewWindow `
            -RedirectStandardOutput (Join-Path $LogDir "burst-$AgentNum-output.log") `
            -RedirectStandardError (Join-Path $LogDir "burst-$AgentNum-error.log")

        Write-SessionLog -Agent $AgentNum -Message "Claude started with PID: $($process.Id)"

        # Monitor with timeout
        while (-not $process.HasExited -and (Get-Date) -lt $endTime) {
            Start-Sleep -Seconds 30

            # Check for stuck (no heartbeat for 10 min)
            if (Test-Path $statusFile) {
                $status = Get-Content $statusFile | ConvertFrom-Json
                if ($status.last_heartbeat) {
                    $lastBeat = [DateTime]::Parse($status.last_heartbeat)
                    $minutesSinceBeat = ((Get-Date).ToUniversalTime() - $lastBeat).TotalMinutes

                    if ($minutesSinceBeat -gt 10) {
                        Write-SessionLog -Agent $AgentNum -Message "WARNING: No heartbeat for ${minutesSinceBeat}min"
                    }
                }
            }
        }

        if (-not $process.HasExited) {
            # Timeout reached - graceful stop
            Write-SessionLog -Agent $AgentNum -Message "Session timeout, stopping gracefully..."
            Save-AgentCheckpoint -AgentNum $AgentNum -Reason "session_timeout"

            # Send Ctrl+C equivalent
            $process.CloseMainWindow() | Out-Null
            Start-Sleep -Seconds 5

            if (-not $process.HasExited) {
                $process.Kill()
            }
        } else {
            # Process exited on its own
            $exitReason = if ($process.ExitCode -eq 0) { "completed" } else { "error_$($process.ExitCode)" }
            Write-SessionLog -Agent $AgentNum -Message "Session ended: $exitReason"
            Save-AgentCheckpoint -AgentNum $AgentNum -Reason $exitReason
        }

    } catch {
        Write-SessionLog -Agent $AgentNum -Message "ERROR: $($_.Exception.Message)"
        Save-AgentCheckpoint -AgentNum $AgentNum -Reason "exception"
    }

    # Update status
    if (Test-Path $statusFile) {
        $status = Get-Content $statusFile | ConvertFrom-Json
        $status.status = "session_ended"
        $status | ConvertTo-Json -Depth 10 | Set-Content $statusFile
    }

    return $true
}

function Run-MultiSessionAgent {
    param(
        [int]$AgentNum,
        [int]$MaxSessions,
        [int]$SessionMinutes
    )

    Write-SessionLog -Agent $AgentNum -Message "=== MULTI-SESSION START (max $MaxSessions sessions) ==="

    for ($session = 1; $session -le $MaxSessions; $session++) {
        Write-SessionLog -Agent $AgentNum -Message "--- Session $session of $MaxSessions ---"

        $success = Run-AgentSession -AgentNum $AgentNum -SessionNumber $session -DurationMinutes $SessionMinutes

        if (-not $success) {
            Write-SessionLog -Agent $AgentNum -Message "Session failed, stopping multi-session"
            break
        }

        # Brief pause between sessions
        if ($session -lt $MaxSessions) {
            Write-SessionLog -Agent $AgentNum -Message "Pausing 30 seconds before next session..."
            Start-Sleep -Seconds 30
        }
    }

    Write-SessionLog -Agent $AgentNum -Message "=== MULTI-SESSION COMPLETE ==="
}

# Main execution
if (-not (Test-Path $ProgressDir)) {
    New-Item -ItemType Directory -Path $ProgressDir -Force | Out-Null
}

if ($All) {
    Write-Host "Starting all priority 1 agents in multi-session mode..." -ForegroundColor Cyan

    # Start priority 1 agents first
    $priority1 = $AgentConfig.Keys | Where-Object { $AgentConfig[$_].Priority -eq 1 } | Sort-Object

    $jobs = @()
    foreach ($num in $priority1) {
        $jobs += Start-Job -Name "BURST${num}_MANAGER" -ScriptBlock {
            param($script, $agentNum, $maxSessions, $sessionMinutes)
            & $script -AgentNum $agentNum -MaxSessions $maxSessions -SessionDurationMinutes $sessionMinutes
        } -ArgumentList $PSCommandPath, $num, $MaxSessions, $SessionDurationMinutes

        Start-Sleep -Seconds 2  # Stagger starts
    }

    Write-Host "Started $($jobs.Count) agent managers" -ForegroundColor Green
    Write-Host "Jobs: $($jobs.Name -join ', ')"

} elseif ($AgentNum -gt 0) {
    Run-MultiSessionAgent -AgentNum $AgentNum -MaxSessions $MaxSessions -SessionMinutes $SessionDurationMinutes
} else {
    Write-Host @"

Night-Burst Session Manager
============================

Manages agent sessions with automatic restart to avoid context limits.

Usage:
  .\night-burst-session-manager.ps1 -AgentNum 2              # Run single agent
  .\night-burst-session-manager.ps1 -AgentNum 2 -MaxSessions 4  # Custom sessions
  .\night-burst-session-manager.ps1 -All                     # Run all priority 1 agents

Options:
  -AgentNum              Agent number (1-15)
  -MaxSessions           Max sessions per agent (default: 6)
  -SessionDurationMinutes Minutes per session (default: 90)
  -All                   Start all priority 1 agents

Session Duration:
  Default: 90 minutes (safe margin before context limit)
  6 sessions × 90 min = 9 hours coverage

"@ -ForegroundColor Cyan
}
