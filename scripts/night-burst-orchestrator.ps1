# Night-Burst V3 Orchestrator
# One command to start all 15 agents with full autonomy
#
# Usage: .\scripts\night-burst-orchestrator.ps1
# Stop:  .\scripts\night-burst-orchestrator.ps1 -Stop

param(
    [switch]$Stop,
    [switch]$Status,
    [int]$MaxAgents = 15
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$ProgressDir = Join-Path $ProjectRoot "content\claude-progress"

# Agent Configuration
$AgentConfig = @{
    1 = @{ Name = "lead-finder"; Chrome = $true; Loop = "4h" }
    2 = @{ Name = "cold-emailer"; Chrome = $false; Loop = "6h" }
    3 = @{ Name = "social-dm"; Chrome = $true; Loop = "8h" }
    4 = @{ Name = "demo-generator"; Chrome = $false; Loop = "4h" }
    5 = @{ Name = "hot-lead-chaser"; Chrome = $false; Loop = "2h" }
    6 = @{ Name = "user-activator"; Chrome = $false; Loop = "4h" }
    7 = @{ Name = "payment-converter"; Chrome = $false; Loop = "3h" }
    8 = @{ Name = "upgrader"; Chrome = $false; Loop = "6h" }
    9 = @{ Name = "doctor"; Chrome = $false; Loop = "1h" }
    10 = @{ Name = "morning-briefer"; Chrome = $false; Loop = "24h" }
    11 = @{ Name = "bottleneck-analyzer"; Chrome = $false; Loop = "2h" }
    12 = @{ Name = "creative-strategist"; Chrome = $false; Loop = "4h" }
    13 = @{ Name = "churn-prevention"; Chrome = $false; Loop = "6h" }
    14 = @{ Name = "lead-scorer"; Chrome = $false; Loop = "30m" }
    15 = @{ Name = "approval-gate"; Chrome = $false; Loop = "5m" }
}

function Get-Timestamp {
    return (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

function Initialize-StatusFile {
    param([int]$AgentNum)

    $config = $AgentConfig[$AgentNum]
    $statusFile = Join-Path $ProgressDir "burst-$AgentNum-status.json"

    $status = @{
        agent = "burst-$AgentNum-$($config.Name)"
        version = "3.0"
        status = "initializing"
        started_at = Get-Timestamp
        last_heartbeat = $null
        current_loop = 0
        loop_interval = $config.Loop
        checkpoints = @{
            last_successful_action = $null
            last_processed_id = $null
            resume_from = $null
        }
        metrics = @{
            actions_taken = 0
            errors_count = 0
            success_rate = 0
        }
        health = @{
            memory_ok = $true
            api_budget_ok = $true
            stuck_detected = $false
            last_error = $null
        }
        learnings_applied = @()
        escalations_pending = @()
    }

    $status | ConvertTo-Json -Depth 10 | Set-Content -Path $statusFile -Encoding UTF8
    Write-Host "[INIT] Created status file for Burst-$AgentNum ($($config.Name))" -ForegroundColor Green
}

function Initialize-AgentRegistry {
    $registryFile = Join-Path $ProgressDir "agent-registry.json"

    $registry = @{
        orchestrator_version = "3.0"
        started_at = Get-Timestamp
        agents = @{}
        total_agents = $MaxAgents
        running_agents = 0
        stopped_agents = 0
    }

    for ($i = 1; $i -le $MaxAgents; $i++) {
        $config = $AgentConfig[$i]
        $registry.agents["burst-$i"] = @{
            name = $config.Name
            status = "pending"
            pid = $null
            chrome = $config.Chrome
            started_at = $null
            last_seen = $null
        }
    }

    $registry | ConvertTo-Json -Depth 10 | Set-Content -Path $registryFile -Encoding UTF8
    Write-Host "[INIT] Created agent registry" -ForegroundColor Green
}

function Initialize-ResourceBudget {
    $budgetFile = Join-Path $ProgressDir "resource-budget.json"
    $tomorrow = (Get-Date).AddDays(1).Date.ToUniversalTime().ToString("yyyy-MM-ddT00:00:00Z")

    $budget = @{
        daily_limits = @{
            serpapi_calls = @{ limit = 100; used = 0; reset_at = $tomorrow }
            outscraper_calls = @{ limit = 500; used = 0; reset_at = $tomorrow }
            resend_emails = @{ limit = 100; used = 0; reset_at = $tomorrow }
            openai_tokens = @{ limit = 1000000; used = 0; reset_at = $tomorrow }
            anthropic_tokens = @{ limit = 5000000; used = 0; reset_at = $tomorrow }
        }
        reservations = @{
            "burst-1" = @{ serpapi = 30; outscraper = 100 }
            "burst-2" = @{ resend = 50 }
            "burst-4" = @{ openai = 200000 }
            "burst-5" = @{ resend = 20 }
            "burst-13" = @{ resend = 20 }
        }
        last_updated = Get-Timestamp
    }

    $budget | ConvertTo-Json -Depth 10 | Set-Content -Path $budgetFile -Encoding UTF8
    Write-Host "[INIT] Created resource budget" -ForegroundColor Green
}

function Initialize-CheckpointStore {
    $checkpointFile = Join-Path $ProgressDir "checkpoint-store.json"

    $store = @{
        version = "1.0"
        created_at = Get-Timestamp
        checkpoints = @()
        recovery_log = @()
    }

    $store | ConvertTo-Json -Depth 10 | Set-Content -Path $checkpointFile -Encoding UTF8
    Write-Host "[INIT] Created checkpoint store" -ForegroundColor Green
}

function Start-Agent {
    param([int]$AgentNum)

    $config = $AgentConfig[$AgentNum]
    $sessionName = "BURST$AgentNum"
    $chromeFlag = if ($config.Chrome) { "--chrome" } else { "" }

    # Update registry
    $registryFile = Join-Path $ProgressDir "agent-registry.json"
    $registry = Get-Content $registryFile | ConvertFrom-Json

    # Start Claude in background job
    $job = Start-Job -Name $sessionName -ScriptBlock {
        param($session, $chrome, $agentNum, $projectRoot)

        $env:CLAUDE_SESSION = $session
        Set-Location $projectRoot

        # Run claude with the night-burst command
        if ($chrome) {
            claude --chrome "/night-burst-$agentNum"
        } else {
            claude "/night-burst-$agentNum"
        }
    } -ArgumentList $sessionName, $config.Chrome, $AgentNum, $ProjectRoot

    # Update registry with PID
    $registry.agents."burst-$AgentNum".status = "running"
    $registry.agents."burst-$AgentNum".pid = $job.Id
    $registry.agents."burst-$AgentNum".started_at = Get-Timestamp
    $registry.running_agents++

    $registry | ConvertTo-Json -Depth 10 | Set-Content -Path $registryFile -Encoding UTF8

    Write-Host "[START] Burst-$AgentNum ($($config.Name)) started as job $($job.Id)" -ForegroundColor Cyan

    return $job
}

function Stop-AllAgents {
    Write-Host "`n[STOP] Stopping all Night-Burst agents..." -ForegroundColor Yellow

    $registryFile = Join-Path $ProgressDir "agent-registry.json"
    if (Test-Path $registryFile) {
        $registry = Get-Content $registryFile | ConvertFrom-Json

        foreach ($agent in $registry.agents.PSObject.Properties) {
            if ($agent.Value.pid) {
                $job = Get-Job -Id $agent.Value.pid -ErrorAction SilentlyContinue
                if ($job) {
                    Stop-Job -Job $job -ErrorAction SilentlyContinue
                    Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
                    Write-Host "[STOP] Stopped $($agent.Name) (job $($agent.Value.pid))" -ForegroundColor Yellow
                }
            }
        }

        # Update registry
        foreach ($agent in $registry.agents.PSObject.Properties) {
            $agent.Value.status = "stopped"
            $agent.Value.pid = $null
        }
        $registry.running_agents = 0
        $registry.stopped_agents = $MaxAgents
        $registry | ConvertTo-Json -Depth 10 | Set-Content -Path $registryFile -Encoding UTF8
    }

    # Also stop any BURST* named jobs
    Get-Job | Where-Object { $_.Name -like "BURST*" } | ForEach-Object {
        Stop-Job -Job $_ -ErrorAction SilentlyContinue
        Remove-Job -Job $_ -Force -ErrorAction SilentlyContinue
    }

    Write-Host "[STOP] All agents stopped" -ForegroundColor Green
}

function Show-Status {
    $registryFile = Join-Path $ProgressDir "agent-registry.json"

    if (-not (Test-Path $registryFile)) {
        Write-Host "No agent registry found. Run orchestrator first." -ForegroundColor Red
        return
    }

    $registry = Get-Content $registryFile | ConvertFrom-Json

    Write-Host "`n======================================" -ForegroundColor Cyan
    Write-Host " NIGHT-BURST V3 STATUS" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Started: $($registry.started_at)"
    Write-Host "Running: $($registry.running_agents) / $($registry.total_agents)"
    Write-Host ""

    foreach ($agent in $registry.agents.PSObject.Properties) {
        $statusFile = Join-Path $ProgressDir "$($agent.Name)-status.json"
        $statusColor = switch ($agent.Value.status) {
            "running" { "Green" }
            "stopped" { "Red" }
            default { "Yellow" }
        }

        $heartbeat = "N/A"
        if (Test-Path $statusFile) {
            $status = Get-Content $statusFile | ConvertFrom-Json
            if ($status.last_heartbeat) {
                $lastBeat = [DateTime]::Parse($status.last_heartbeat)
                $minutesAgo = [math]::Round(((Get-Date).ToUniversalTime() - $lastBeat).TotalMinutes, 1)
                $heartbeat = "${minutesAgo}m ago"
            }
            Write-Host "$($agent.Name): " -NoNewline
            Write-Host "$($agent.Value.status)" -ForegroundColor $statusColor -NoNewline
            Write-Host " | Loop: $($status.current_loop) | Heartbeat: $heartbeat | Actions: $($status.metrics.actions_taken)"
        } else {
            Write-Host "$($agent.Name): " -NoNewline
            Write-Host "$($agent.Value.status)" -ForegroundColor $statusColor
        }
    }

    Write-Host "`n======================================" -ForegroundColor Cyan
}

# Main execution
if ($Stop) {
    Stop-AllAgents
    exit 0
}

if ($Status) {
    Show-Status
    exit 0
}

Write-Host @"

    _   ___       __    __     ____             __     _   _______
   / | / (_)___ _/ /_  / /_   / __ )__  _______/ /_   | | / /__  /
  /  |/ / / __ '/ __ \/ __/  / __  / / / / ___/ __/   | |/ /  /_ <
 / /|  / / /_/ / / / / /_   / /_/ / /_/ / /  (__  )   | | / ___/ /
/_/ |_/_/\__, /_/ /_/\__/  /_____/\__,_/_/  /____/    |_| //____/
        /____/

              Autonomous Marketing Agent Orchestrator
                        by ReviewResponder

"@ -ForegroundColor Magenta

Write-Host "[ORCHESTRATOR] Starting Night-Burst V3..." -ForegroundColor Cyan
Write-Host "[ORCHESTRATOR] Project: $ProjectRoot" -ForegroundColor Gray
Write-Host "[ORCHESTRATOR] Progress Dir: $ProgressDir" -ForegroundColor Gray
Write-Host ""

# Ensure progress directory exists
if (-not (Test-Path $ProgressDir)) {
    New-Item -ItemType Directory -Path $ProgressDir -Force | Out-Null
}

# Phase 1: Initialize all status files
Write-Host "[PHASE 1] Initializing status files..." -ForegroundColor Yellow
for ($i = 1; $i -le $MaxAgents; $i++) {
    Initialize-StatusFile -AgentNum $i
}

# Phase 2: Initialize registry and budgets
Write-Host "`n[PHASE 2] Initializing registry and budgets..." -ForegroundColor Yellow
Initialize-AgentRegistry
Initialize-ResourceBudget
Initialize-CheckpointStore

# Phase 3: Start all agents
Write-Host "`n[PHASE 3] Starting agents..." -ForegroundColor Yellow
$jobs = @()
for ($i = 1; $i -le $MaxAgents; $i++) {
    $job = Start-Agent -AgentNum $i
    $jobs += $job
    Start-Sleep -Milliseconds 500  # Stagger starts
}

Write-Host "`n[ORCHESTRATOR] All $MaxAgents agents started!" -ForegroundColor Green
Write-Host "[ORCHESTRATOR] Health check will run in background..." -ForegroundColor Gray
Write-Host ""
Write-Host "Commands:" -ForegroundColor Cyan
Write-Host "  .\scripts\night-burst-orchestrator.ps1 -Status  # Check agent status"
Write-Host "  .\scripts\night-burst-orchestrator.ps1 -Stop    # Stop all agents"
Write-Host ""

# Phase 4: Health monitoring loop (runs indefinitely)
Write-Host "[MONITOR] Starting health check loop (Ctrl+C to exit monitor)..." -ForegroundColor Yellow

$healthCheckScript = Join-Path (Split-Path $PSCommandPath) "night-burst-health-check.ps1"
if (Test-Path $healthCheckScript) {
    # Run health check in background
    Start-Job -Name "HEALTH_MONITOR" -FilePath $healthCheckScript -ArgumentList $ProjectRoot
    Write-Host "[MONITOR] Health check started as background job" -ForegroundColor Green
}

# Keep orchestrator running and show status periodically
try {
    while ($true) {
        Start-Sleep -Seconds 300  # Every 5 minutes
        Show-Status
    }
} catch {
    Write-Host "`n[ORCHESTRATOR] Interrupted. Use -Stop to stop all agents." -ForegroundColor Yellow
}
