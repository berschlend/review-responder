# Night-Burst V3 Recovery Script
# Recovers agents from checkpoints after crash
#
# Usage: .\scripts\night-burst-recovery.ps1 [-AgentNum 5] [-All]

param(
    [int]$AgentNum,
    [switch]$All,
    [switch]$ShowCheckpoints,
    [switch]$ClearCheckpoints
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$ProgressDir = Join-Path $ProjectRoot "content\claude-progress"

function Get-Timestamp {
    return (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

function Get-PendingCheckpoints {
    param([int]$ForAgent = 0)

    $checkpointFile = Join-Path $ProgressDir "checkpoint-store.json"

    if (-not (Test-Path $checkpointFile)) {
        return @()
    }

    $store = Get-Content $checkpointFile -Raw | ConvertFrom-Json

    $pending = $store.checkpoints | Where-Object { $_.status -eq "pending" }

    if ($ForAgent -gt 0) {
        $pending = $pending | Where-Object { $_.agent -eq "burst-$ForAgent" }
    }

    return $pending
}

function Show-Checkpoints {
    Write-Host "`n=== PENDING CHECKPOINTS ===" -ForegroundColor Cyan

    $pending = Get-PendingCheckpoints

    if ($pending.Count -eq 0) {
        Write-Host "No pending checkpoints found." -ForegroundColor Green
        return
    }

    foreach ($cp in $pending) {
        Write-Host "`nAgent: " -NoNewline -ForegroundColor Gray
        Write-Host $cp.agent -ForegroundColor Yellow
        Write-Host "Action: $($cp.action)" -ForegroundColor Gray
        Write-Host "Created: $($cp.created_at)" -ForegroundColor Gray
        Write-Host "Data: $($cp.data | ConvertTo-Json -Compress)" -ForegroundColor Gray
    }
}

function Clear-Checkpoints {
    param([int]$ForAgent = 0)

    $checkpointFile = Join-Path $ProgressDir "checkpoint-store.json"

    if (-not (Test-Path $checkpointFile)) {
        Write-Host "No checkpoint file found." -ForegroundColor Yellow
        return
    }

    $store = Get-Content $checkpointFile -Raw | ConvertFrom-Json

    $beforeCount = $store.checkpoints.Count

    if ($ForAgent -gt 0) {
        $store.checkpoints = $store.checkpoints | Where-Object { $_.agent -ne "burst-$ForAgent" }
        Write-Host "Cleared checkpoints for Burst-$ForAgent" -ForegroundColor Green
    } else {
        $store.checkpoints = @()
        Write-Host "Cleared all checkpoints" -ForegroundColor Green
    }

    $afterCount = $store.checkpoints.Count
    Write-Host "Removed $($beforeCount - $afterCount) checkpoint(s)" -ForegroundColor Gray

    $store | ConvertTo-Json -Depth 10 | Set-Content $checkpointFile -Encoding UTF8
}

function Recover-Agent {
    param([int]$Num)

    Write-Host "`n[RECOVERY] Recovering Burst-$Num..." -ForegroundColor Yellow

    $statusFile = Join-Path $ProgressDir "burst-$Num-status.json"
    $checkpointFile = Join-Path $ProgressDir "checkpoint-store.json"

    # Get pending checkpoints for this agent
    $pending = Get-PendingCheckpoints -ForAgent $Num

    if ($pending.Count -eq 0) {
        Write-Host "[RECOVERY] No pending checkpoints for Burst-$Num" -ForegroundColor Gray
    } else {
        Write-Host "[RECOVERY] Found $($pending.Count) pending checkpoint(s)" -ForegroundColor Cyan

        # Update status file with resume info
        if (Test-Path $statusFile) {
            $status = Get-Content $statusFile -Raw | ConvertFrom-Json

            $latestCheckpoint = $pending | Sort-Object created_at -Descending | Select-Object -First 1

            $status.checkpoints.resume_from = @{
                action = $latestCheckpoint.action
                data = $latestCheckpoint.data
                checkpoint_time = $latestCheckpoint.created_at
            }
            $status.status = "recovering"

            $status | ConvertTo-Json -Depth 10 | Set-Content $statusFile -Encoding UTF8
            Write-Host "[RECOVERY] Set resume point in status file" -ForegroundColor Green
        }
    }

    # Log recovery attempt
    if (Test-Path $checkpointFile) {
        $store = Get-Content $checkpointFile -Raw | ConvertFrom-Json
        $store.recovery_log += @{
            agent = "burst-$Num"
            action = "manual_recovery"
            pending_checkpoints = $pending.Count
            timestamp = Get-Timestamp
        }
        $store | ConvertTo-Json -Depth 10 | Set-Content $checkpointFile -Encoding UTF8
    }

    # Determine chrome flag
    $chromeAgents = @(1, 3)
    $chromeFlag = if ($Num -in $chromeAgents) { "--chrome" } else { "" }

    # Kill existing job
    $jobName = "BURST$Num"
    Get-Job | Where-Object { $_.Name -eq $jobName } | ForEach-Object {
        Stop-Job -Job $_ -ErrorAction SilentlyContinue
        Remove-Job -Job $_ -Force -ErrorAction SilentlyContinue
    }

    # Start agent
    $job = Start-Job -Name $jobName -ScriptBlock {
        param($session, $chrome, $agentNum, $projectRoot)

        $env:CLAUDE_SESSION = $session
        Set-Location $projectRoot

        if ($chrome) {
            claude --chrome "/night-burst-$agentNum"
        } else {
            claude "/night-burst-$agentNum"
        }
    } -ArgumentList $jobName, ($Num -in $chromeAgents), $Num, $ProjectRoot

    Write-Host "[RECOVERY] Burst-$Num started as job $($job.Id)" -ForegroundColor Green

    # Update registry
    $registryFile = Join-Path $ProgressDir "agent-registry.json"
    if (Test-Path $registryFile) {
        $registry = Get-Content $registryFile -Raw | ConvertFrom-Json
        $registry.agents."burst-$Num".status = "running"
        $registry.agents."burst-$Num".pid = $job.Id
        $registry.agents."burst-$Num".started_at = Get-Timestamp
        $registry | ConvertTo-Json -Depth 10 | Set-Content $registryFile -Encoding UTF8
    }

    return $job
}

# Main execution
Write-Host @"

    _   ___       __    __     ____             __
   / | / (_)___ _/ /_  / /_   / __ )__  _______/ /_
  /  |/ / / __ '/ __ \/ __/  / __  / / / / ___/ __/
 / /|  / / /_/ / / / / /_   / /_/ / /_/ / /  (__  )
/_/ |_/_/\__, /_/ /_/\__/  /_____/\__,_/_/  /____/
        /____/
                    RECOVERY TOOL

"@ -ForegroundColor Magenta

if ($ShowCheckpoints) {
    Show-Checkpoints
    exit 0
}

if ($ClearCheckpoints) {
    if ($AgentNum -gt 0) {
        Clear-Checkpoints -ForAgent $AgentNum
    } else {
        Clear-Checkpoints
    }
    exit 0
}

if ($All) {
    Write-Host "[RECOVERY] Recovering all agents..." -ForegroundColor Cyan

    for ($i = 1; $i -le 15; $i++) {
        Recover-Agent -Num $i
        Start-Sleep -Milliseconds 500
    }

    Write-Host "`n[RECOVERY] All agents recovered!" -ForegroundColor Green
}
elseif ($AgentNum -gt 0 -and $AgentNum -le 15) {
    Recover-Agent -Num $AgentNum
}
else {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\night-burst-recovery.ps1 -AgentNum 5     # Recover specific agent"
    Write-Host "  .\night-burst-recovery.ps1 -All            # Recover all agents"
    Write-Host "  .\night-burst-recovery.ps1 -ShowCheckpoints  # View pending checkpoints"
    Write-Host "  .\night-burst-recovery.ps1 -ClearCheckpoints # Clear all checkpoints"
}
