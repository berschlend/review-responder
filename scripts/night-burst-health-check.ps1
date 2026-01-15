# Night-Burst V3 Health Check
# Monitors all agents and restarts crashed ones
#
# Usage: Runs automatically via orchestrator, or manually:
#        .\scripts\night-burst-health-check.ps1

param(
    [string]$ProjectRoot = (Split-Path -Parent (Split-Path -Parent $PSCommandPath)),
    [int]$CheckInterval = 300,  # 5 minutes
    [int]$StuckThreshold = 30   # Minutes without heartbeat = stuck
)

$ErrorActionPreference = "Continue"
$ProgressDir = Join-Path $ProjectRoot "content\claude-progress"

function Get-Timestamp {
    return (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

function Test-AgentHealth {
    param([int]$AgentNum)

    $statusFile = Join-Path $ProgressDir "burst-$AgentNum-status.json"

    if (-not (Test-Path $statusFile)) {
        return @{
            Status = "missing"
            Message = "Status file not found"
            NeedsRestart = $true
        }
    }

    try {
        $status = Get-Content $statusFile -Raw | ConvertFrom-Json

        # Check if agent has heartbeat
        if ($null -eq $status.last_heartbeat) {
            # New agent, not yet started its loop
            return @{
                Status = "starting"
                Message = "Agent initializing"
                NeedsRestart = $false
            }
        }

        # Check heartbeat age
        $lastBeat = [DateTime]::Parse($status.last_heartbeat)
        $minutesSinceHeartbeat = ((Get-Date).ToUniversalTime() - $lastBeat).TotalMinutes

        if ($minutesSinceHeartbeat -gt $StuckThreshold) {
            return @{
                Status = "stuck"
                Message = "No heartbeat for $([math]::Round($minutesSinceHeartbeat)) minutes"
                NeedsRestart = $true
            }
        }

        # Check if explicitly marked as stuck
        if ($status.health.stuck_detected) {
            return @{
                Status = "stuck"
                Message = "Agent self-reported stuck: $($status.health.last_error)"
                NeedsRestart = $true
            }
        }

        # Check error rate
        if ($status.metrics.errors_count -gt 10 -and $status.metrics.success_rate -lt 0.5) {
            return @{
                Status = "unhealthy"
                Message = "High error rate: $($status.metrics.errors_count) errors"
                NeedsRestart = $false  # Let it try to recover
            }
        }

        return @{
            Status = "healthy"
            Message = "Running normally (loop $($status.current_loop))"
            NeedsRestart = $false
        }

    } catch {
        return @{
            Status = "error"
            Message = "Failed to parse status: $_"
            NeedsRestart = $true
        }
    }
}

function Restart-Agent {
    param([int]$AgentNum)

    Write-Host "[RECOVERY] Attempting to restart Burst-$AgentNum..." -ForegroundColor Yellow

    # Update status file to show restarting
    $statusFile = Join-Path $ProgressDir "burst-$AgentNum-status.json"
    if (Test-Path $statusFile) {
        $status = Get-Content $statusFile -Raw | ConvertFrom-Json
        $status.status = "restarting"
        $status.health.stuck_detected = $false
        $status | ConvertTo-Json -Depth 10 | Set-Content $statusFile -Encoding UTF8
    }

    # Kill existing job if any
    $jobName = "BURST$AgentNum"
    Get-Job | Where-Object { $_.Name -eq $jobName } | ForEach-Object {
        Stop-Job -Job $_ -ErrorAction SilentlyContinue
        Remove-Job -Job $_ -Force -ErrorAction SilentlyContinue
    }

    # Log to checkpoint store
    $checkpointFile = Join-Path $ProgressDir "checkpoint-store.json"
    if (Test-Path $checkpointFile) {
        $store = Get-Content $checkpointFile -Raw | ConvertFrom-Json
        $store.recovery_log += @{
            agent = "burst-$AgentNum"
            action = "restart"
            reason = "Health check triggered"
            timestamp = Get-Timestamp
        }
        $store | ConvertTo-Json -Depth 10 | Set-Content $checkpointFile -Encoding UTF8
    }

    # Determine chrome flag
    $chromeAgents = @(1, 3)  # Lead Finder and Social DM use Chrome
    $chromeFlag = if ($AgentNum -in $chromeAgents) { "--chrome" } else { "" }

    # Start new job
    $job = Start-Job -Name $jobName -ScriptBlock {
        param($session, $chrome, $agentNum, $projectRoot)

        $env:CLAUDE_SESSION = $session
        Set-Location $projectRoot

        if ($chrome) {
            claude --chrome "/night-burst-$agentNum"
        } else {
            claude "/night-burst-$agentNum"
        }
    } -ArgumentList $jobName, ($AgentNum -in $chromeAgents), $AgentNum, $ProjectRoot

    # Update registry
    $registryFile = Join-Path $ProgressDir "agent-registry.json"
    if (Test-Path $registryFile) {
        $registry = Get-Content $registryFile -Raw | ConvertFrom-Json
        $registry.agents."burst-$AgentNum".status = "running"
        $registry.agents."burst-$AgentNum".pid = $job.Id
        $registry.agents."burst-$AgentNum".started_at = Get-Timestamp
        $registry | ConvertTo-Json -Depth 10 | Set-Content $registryFile -Encoding UTF8
    }

    Write-Host "[RECOVERY] Burst-$AgentNum restarted as job $($job.Id)" -ForegroundColor Green
    return $job
}

function Write-HealthReport {
    param([hashtable]$AgentHealth)

    $reportFile = Join-Path $ProgressDir "health-report.json"

    $report = @{
        timestamp = Get-Timestamp
        check_interval_min = $CheckInterval / 60
        stuck_threshold_min = $StuckThreshold
        agents = @{}
        summary = @{
            healthy = 0
            stuck = 0
            unhealthy = 0
            restarted = 0
        }
    }

    foreach ($agent in $AgentHealth.Keys) {
        $health = $AgentHealth[$agent]
        $report.agents[$agent] = $health

        switch ($health.Status) {
            "healthy" { $report.summary.healthy++ }
            "stuck" { $report.summary.stuck++ }
            "unhealthy" { $report.summary.unhealthy++ }
        }
    }

    $report | ConvertTo-Json -Depth 10 | Set-Content $reportFile -Encoding UTF8
}

function Send-StuckAlert {
    param([int]$AgentNum, [string]$Message)

    $alertFile = Join-Path $ProgressDir "for-berend.md"

    $alert = @"

---

## AGENT STUCK ALERT - $(Get-Date -Format "yyyy-MM-dd HH:mm")

**Agent:** Burst-$AgentNum
**Problem:** $Message
**Action:** Auto-restart attempted

"@

    Add-Content -Path $alertFile -Value $alert -Encoding UTF8
    Write-Host "[ALERT] Written to for-berend.md" -ForegroundColor Red
}

# Main health check loop
Write-Host "[HEALTH] Night-Burst Health Monitor started" -ForegroundColor Cyan
Write-Host "[HEALTH] Check interval: $($CheckInterval)s | Stuck threshold: $($StuckThreshold) min" -ForegroundColor Gray

while ($true) {
    Write-Host "`n[HEALTH] Running health check at $(Get-Date -Format 'HH:mm:ss')..." -ForegroundColor Cyan

    $agentHealth = @{}
    $restartsNeeded = @()

    for ($i = 1; $i -le 15; $i++) {
        $health = Test-AgentHealth -AgentNum $i
        $agentHealth["burst-$i"] = $health

        $statusColor = switch ($health.Status) {
            "healthy" { "Green" }
            "starting" { "Yellow" }
            "stuck" { "Red" }
            "unhealthy" { "DarkYellow" }
            default { "Gray" }
        }

        Write-Host "  Burst-$i`: " -NoNewline
        Write-Host "$($health.Status)" -ForegroundColor $statusColor -NoNewline
        Write-Host " - $($health.Message)"

        if ($health.NeedsRestart) {
            $restartsNeeded += $i
        }
    }

    # Handle restarts
    if ($restartsNeeded.Count -gt 0) {
        Write-Host "`n[HEALTH] $($restartsNeeded.Count) agent(s) need restart..." -ForegroundColor Yellow

        foreach ($agentNum in $restartsNeeded) {
            Send-StuckAlert -AgentNum $agentNum -Message $agentHealth["burst-$agentNum"].Message
            Restart-Agent -AgentNum $agentNum
        }
    }

    # Write health report
    Write-HealthReport -AgentHealth $agentHealth

    $healthy = ($agentHealth.Values | Where-Object { $_.Status -eq "healthy" }).Count
    Write-Host "`n[HEALTH] Summary: $healthy/15 healthy" -ForegroundColor $(if ($healthy -eq 15) { "Green" } else { "Yellow" })

    # Wait for next check
    Write-Host "[HEALTH] Next check in $($CheckInterval)s..." -ForegroundColor Gray
    Start-Sleep -Seconds $CheckInterval
}
