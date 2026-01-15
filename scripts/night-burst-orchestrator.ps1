# Night-Burst V3.1 Orchestrator
# One command to start all 15 agents with full autonomy
# Now with automatic account rotation and plan mode support
#
# Usage: .\scripts\night-burst-orchestrator.ps1
#        .\scripts\night-burst-orchestrator.ps1 -PlanMode  # Start in plan mode (wait for approval)
# Stop:  .\scripts\night-burst-orchestrator.ps1 -Stop
# Status: .\scripts\night-burst-orchestrator.ps1 -Status

param(
    [switch]$Stop,
    [switch]$Status,
    [switch]$PlanMode,
    [int]$MaxAgents = 15
)

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
        $args = @()
        if ($chrome) {
            $args += "--chrome"
        }
        if ($planMode) {
            $args += "--permission-mode=plan"
        }
        $args += "/night-burst-$agentNum"

        # Run claude with the night-burst command
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
