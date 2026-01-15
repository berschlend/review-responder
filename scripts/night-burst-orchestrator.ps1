# Night-Burst V4.0 Orchestrator (V7 Agent-Level Restart)
# One command to start all 15 agents with full autonomy
# Now with automatic account rotation, plan mode, AND agent-level restart loop
#
# V7 NEW: Agents that stop are automatically restarted within 60 seconds!
#
# Usage: .\scripts\night-burst-orchestrator.ps1
#        .\scripts\night-burst-orchestrator.ps1 -PlanMode  # Start in plan mode (wait for approval)
# Stop:  .\scripts\night-burst-orchestrator.ps1 -Stop
# Status: .\scripts\night-burst-orchestrator.ps1 -Status

param(
    [switch]$Stop,
    [switch]$Status,
    [switch]$PlanMode,
    [int]$MaxAgents = 15,
    [int]$MonitorIntervalSeconds = 60,
    [int]$MaxRestartsPerHour = 3
)

# V7: Global restart tracking for cooldown
$Script:RestartHistory = @{}

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$ProgressDir = Join-Path $ProjectRoot "content\claude-progress"
$BackendUrl = "https://review-responder.onrender.com"

# === BACKEND WAKE-UP FUNCTION ===
# Render free tier sleeps after inactivity. Wake it up before starting agents.
function Wake-Backend {
    param(
        [int]$MaxAttempts = 10,
        [int]$InitialDelaySeconds = 5
    )

    Write-Host "[WAKE-UP] Waking up Render backend..." -ForegroundColor Yellow
    Write-Host "[WAKE-UP] (Render free tier sleeps after inactivity, this may take 30-60 seconds)" -ForegroundColor Gray

    $attempt = 0
    $delay = $InitialDelaySeconds

    while ($attempt -lt $MaxAttempts) {
        $attempt++
        Write-Host "[WAKE-UP] Attempt $attempt/$MaxAttempts..." -NoNewline -ForegroundColor Cyan

        # Use curl.exe to check - any HTTP response (even 401) means backend is awake
        # Note: curl.exe is the actual curl binary, not PowerShell's Invoke-WebRequest alias
        $result = curl.exe -s -o NUL -w "%{http_code}" --connect-timeout 30 "$BackendUrl/api/admin/stats" 2>&1

        if ($result -match '^\d{3}$') {
            $statusCode = [int]$result
            if ($statusCode -ge 200 -and $statusCode -lt 600) {
                Write-Host " OK! (HTTP $statusCode)" -ForegroundColor Green
                Write-Host "[WAKE-UP] Backend is awake and ready!" -ForegroundColor Green
                return $true
            }
        }

        Write-Host " still waking up, waiting ${delay}s..." -ForegroundColor Yellow
        Start-Sleep -Seconds $delay
        $delay = [Math]::Min($delay * 1.5, 30)  # Exponential backoff, max 30s
    }

    Write-Host "[WAKE-UP] WARNING: Backend may still be sleeping after $MaxAttempts attempts!" -ForegroundColor Red
    Write-Host "[WAKE-UP] Agents may experience connection errors. Consider checking Render dashboard." -ForegroundColor Red
    return $false
}

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
        orchestrator_version = "3.1"
        started_at = Get-Timestamp
        plan_mode = $PlanMode.IsPresent
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
            account = $null
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
    param(
        [int]$AgentNum,
        [switch]$PlanMode = $false
    )

    $config = $AgentConfig[$AgentNum]
    $sessionName = "BURST$AgentNum"

    # NEU: Account mit niedrigstem Usage wählen
    $getBestAccountScript = Join-Path $PSScriptRoot "Get-BestAccount.ps1"
    $selectedConfigDir = & $getBestAccountScript
    $selectedAccount = Split-Path $selectedConfigDir -Leaf
    Write-Host "[ACCOUNT] Agent $AgentNum using account: $selectedAccount" -ForegroundColor Magenta

    # Update registry
    $registryFile = Join-Path $ProgressDir "agent-registry.json"
    $registry = Get-Content $registryFile | ConvertFrom-Json

    # Start Claude in background job
    $job = Start-Job -Name $sessionName -ScriptBlock {
        param($session, $chrome, $agentNum, $projectRoot, $configDir, $planMode)

        # NEU: Account-Auswahl via CLAUDE_CONFIG_DIR
        $env:CLAUDE_CONFIG_DIR = $configDir
        $env:CLAUDE_SESSION = $session
        Set-Location $projectRoot

        # Build command arguments
        # V7 FIX: Use --print so Claude EXITS when done (enables restart detection)
        $args = @("--print")
        if ($chrome) {
            $args += "--chrome"
        }
        if ($planMode) {
            # Plan mode: Agents create plans, wait for approval
            $args += "--permission-mode=plan"
        } else {
            # Execution mode: Full autonomy without permission prompts
            $args += "--dangerously-skip-permissions"
        }
        $args += "/night-burst-$agentNum"

        # Run claude with --print so it exits when done
        claude @args
    } -ArgumentList $sessionName, $config.Chrome, $AgentNum, $ProjectRoot, $selectedConfigDir, $PlanMode

    # Update registry with PID and account info
    $registry.agents."burst-$AgentNum".status = "running"
    $registry.agents."burst-$AgentNum".pid = $job.Id
    $registry.agents."burst-$AgentNum".started_at = Get-Timestamp
    $registry.agents."burst-$AgentNum".account = $selectedAccount
    $registry.running_agents++

    $registry | ConvertTo-Json -Depth 10 | Set-Content -Path $registryFile -Encoding UTF8

    Write-Host "[START] Burst-$AgentNum ($($config.Name)) started as job $($job.Id) on $selectedAccount" -ForegroundColor Cyan

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

# V7: Check if agent can be restarted (cooldown logic)
function Test-CanRestart {
    param([int]$AgentNum)

    $key = "burst-$AgentNum"
    $now = Get-Date
    $oneHourAgo = $now.AddHours(-1)

    # Initialize if not exists
    if (-not $Script:RestartHistory.ContainsKey($key)) {
        $Script:RestartHistory[$key] = @()
    }

    # Clean old entries (older than 1 hour)
    $Script:RestartHistory[$key] = $Script:RestartHistory[$key] | Where-Object { $_ -gt $oneHourAgo }

    # Check if under limit
    $restartCount = $Script:RestartHistory[$key].Count
    if ($restartCount -ge $MaxRestartsPerHour) {
        Write-Host "[COOLDOWN] Burst-$AgentNum has been restarted $restartCount times in the last hour. Skipping." -ForegroundColor Red
        return $false
    }

    return $true
}

# V7: Record a restart
function Add-RestartRecord {
    param([int]$AgentNum)

    $key = "burst-$AgentNum"
    if (-not $Script:RestartHistory.ContainsKey($key)) {
        $Script:RestartHistory[$key] = @()
    }
    $Script:RestartHistory[$key] += Get-Date
}

# V7: Restart a single agent
function Restart-Agent {
    param(
        [int]$AgentNum,
        [switch]$PlanMode = $false
    )

    # Check cooldown
    if (-not (Test-CanRestart -AgentNum $AgentNum)) {
        return $null
    }

    $config = $AgentConfig[$AgentNum]
    Write-Host "[RESTART] Restarting Burst-$AgentNum ($($config.Name))..." -ForegroundColor Yellow

    # Stop existing job if any
    $existingJob = Get-Job -Name "BURST$AgentNum" -ErrorAction SilentlyContinue
    if ($existingJob) {
        Stop-Job -Job $existingJob -ErrorAction SilentlyContinue
        Remove-Job -Job $existingJob -Force -ErrorAction SilentlyContinue
    }

    # Start new agent
    $job = Start-Agent -AgentNum $AgentNum -PlanMode:$PlanMode

    # Record restart
    Add-RestartRecord -AgentNum $AgentNum

    $restartCount = $Script:RestartHistory["burst-$AgentNum"].Count
    Write-Host "[RESTART] Burst-$AgentNum restarted (restart $restartCount/$MaxRestartsPerHour this hour)" -ForegroundColor Green

    return $job
}

# V7: Monitor loop - check all agents and restart dead ones
function Start-AgentMonitorLoop {
    param(
        [switch]$PlanMode = $false
    )

    Write-Host "`n[MONITOR V7] Starting agent-level monitor loop (check every ${MonitorIntervalSeconds}s)..." -ForegroundColor Cyan
    Write-Host "[MONITOR V7] Dead agents will be automatically restarted (max $MaxRestartsPerHour/hour per agent)" -ForegroundColor Gray

    $registryFile = Join-Path $ProgressDir "agent-registry.json"
    $loopCount = 0

    while ($true) {
        $loopCount++
        $deadAgents = @()
        $runningAgents = 0

        # Check each agent
        for ($i = 1; $i -le $MaxAgents; $i++) {
            $jobName = "BURST$i"
            $job = Get-Job -Name $jobName -ErrorAction SilentlyContinue

            if ($job) {
                if ($job.State -eq "Running") {
                    $runningAgents++
                } elseif ($job.State -eq "Completed" -or $job.State -eq "Failed" -or $job.State -eq "Stopped") {
                    $deadAgents += $i
                    # Clean up the dead job
                    Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
                }
            } else {
                # Job doesn't exist at all
                $deadAgents += $i
            }
        }

        # Restart dead agents
        foreach ($agentNum in $deadAgents) {
            Restart-Agent -AgentNum $agentNum -PlanMode:$PlanMode
            Start-Sleep -Milliseconds 500  # Stagger restarts
        }

        # Update registry
        if (Test-Path $registryFile) {
            $registry = Get-Content $registryFile | ConvertFrom-Json
            $registry.running_agents = $runningAgents
            $registry.stopped_agents = $MaxAgents - $runningAgents
            $registry | ConvertTo-Json -Depth 10 | Set-Content -Path $registryFile -Encoding UTF8
        }

        # Log status every 5 loops (5 minutes if 60s interval)
        if ($loopCount % 5 -eq 0) {
            $timestamp = Get-Date -Format "HH:mm:ss"
            Write-Host "[$timestamp] Running: $runningAgents/$MaxAgents | Dead: $($deadAgents.Count) | Restarted: $($deadAgents.Count)" -ForegroundColor $(if ($deadAgents.Count -gt 0) { "Yellow" } else { "Green" })
        }

        Start-Sleep -Seconds $MonitorIntervalSeconds
    }
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

    _   ___       __    __     ____             __     _  __ ____
   / | / (_)___ _/ /_  / /_   / __ )__  _______/ /_   | | / // __/
  /  |/ / / __ '/ __ \/ __/  / __  / / / / ___/ __/   | |/ //_  \
 / /|  / / /_/ / / / / /_   / /_/ / /_/ / /  (__  )   |   / __/ /
/_/ |_/_/\__, /_/ /_/\__/  /_____/\__,_/_/  /____/    |__/____/
        /____/

         V4.0 - Agent-Level Auto-Restart (V7 Feature)
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

# Phase 3: Wake up backend before starting agents
Write-Host "`n[PHASE 3] Waking up backend..." -ForegroundColor Yellow
$backendReady = Wake-Backend -MaxAttempts 10 -InitialDelaySeconds 5
if (-not $backendReady) {
    $continue = Read-Host "[WAKE-UP] Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "[ORCHESTRATOR] Aborted. Backend not ready." -ForegroundColor Red
        exit 1
    }
}

# Phase 4: Start all agents
Write-Host "`n[PHASE 4] Starting agents..." -ForegroundColor Yellow
if ($PlanMode) {
    Write-Host "[PLAN MODE] Agents will start in plan mode and wait for approval" -ForegroundColor Magenta
}
$jobs = @()
for ($i = 1; $i -le $MaxAgents; $i++) {
    if ($PlanMode) {
        $job = Start-Agent -AgentNum $i -PlanMode
    } else {
        $job = Start-Agent -AgentNum $i
    }
    $jobs += $job
    Start-Sleep -Milliseconds 500  # Stagger starts
}

Write-Host "`n[ORCHESTRATOR] All $MaxAgents agents started!" -ForegroundColor Green
Write-Host "[ORCHESTRATOR] V7 Agent-Level Monitor will restart dead agents automatically!" -ForegroundColor Magenta
Write-Host ""
Write-Host "Commands:" -ForegroundColor Cyan
Write-Host "  .\scripts\night-burst-orchestrator.ps1 -Status  # Check agent status"
Write-Host "  .\scripts\night-burst-orchestrator.ps1 -Stop    # Stop all agents"
Write-Host ""

# Phase 5: V7 Agent-Level Monitor Loop (replaces old health check)
Write-Host "[PHASE 5] Starting V7 Agent-Level Monitor..." -ForegroundColor Yellow

# Also start external health check if exists (for additional monitoring)
$healthCheckScript = Join-Path (Split-Path $PSCommandPath) "night-burst-health-check.ps1"
if (Test-Path $healthCheckScript) {
    Start-Job -Name "HEALTH_MONITOR" -FilePath $healthCheckScript -ArgumentList $ProjectRoot
    Write-Host "[MONITOR] External health check also started as background job" -ForegroundColor Gray
}

# V7: Main monitor loop - checks agents every 60s and restarts dead ones
try {
    if ($PlanMode) {
        Start-AgentMonitorLoop -PlanMode
    } else {
        Start-AgentMonitorLoop
    }
} catch {
    Write-Host "`n[ORCHESTRATOR] Monitor interrupted. Use -Stop to stop all agents." -ForegroundColor Yellow
    Write-Host "[ORCHESTRATOR] Error: $_" -ForegroundColor Red
}
