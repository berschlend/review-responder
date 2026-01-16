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
# Chrome = true means agent has access to browser automation via Chrome MCP
$AgentConfig = @{
    1 = @{ Name = "lead-finder"; Chrome = $true; Loop = "4h" }      # Scraping leads
    2 = @{ Name = "cold-emailer"; Chrome = $true; Loop = "6h" }     # Email research
    3 = @{ Name = "social-dm"; Chrome = $true; Loop = "8h" }        # LinkedIn/Twitter
    4 = @{ Name = "demo-generator"; Chrome = $true; Loop = "4h" }   # Demo creation
    5 = @{ Name = "hot-lead-chaser"; Chrome = $true; Loop = "2h" }  # Follow-up research
    6 = @{ Name = "user-activator"; Chrome = $true; Loop = "4h" }   # User research
    7 = @{ Name = "payment-converter"; Chrome = $true; Loop = "3h" } # Stripe/payments
    8 = @{ Name = "upgrader"; Chrome = $true; Loop = "6h" }         # User research
    9 = @{ Name = "doctor"; Chrome = $false; Loop = "1h" }          # Internal metrics only
    10 = @{ Name = "morning-briefer"; Chrome = $false; Loop = "24h" } # Report generation
    11 = @{ Name = "bottleneck-analyzer"; Chrome = $false; Loop = "2h" } # Internal analysis
    12 = @{ Name = "creative-strategist"; Chrome = $true; Loop = "4h" } # Research & ideas
    13 = @{ Name = "churn-prevention"; Chrome = $true; Loop = "6h" }  # User research
    14 = @{ Name = "lead-scorer"; Chrome = $false; Loop = "30m" }    # Internal scoring
    15 = @{ Name = "approval-gate"; Chrome = $false; Loop = "5m" }   # Internal queue
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

    # Account mit niedrigstem Usage wählen
    $getBestAccountScript = Join-Path $PSScriptRoot "Get-BestAccount.ps1"
    $selectedConfigDir = & $getBestAccountScript
    $selectedAccount = Split-Path $selectedConfigDir -Leaf
    Write-Host "[ACCOUNT] Agent $AgentNum will use account: $selectedAccount" -ForegroundColor Magenta

    # Update registry
    $registryFile = Join-Path $ProgressDir "agent-registry.json"
    $registry = Get-Content $registryFile | ConvertFrom-Json
    $registry.agents."burst-$AgentNum".status = "pending-start"
    $registry.agents."burst-$AgentNum".account = $selectedAccount
    $registry | ConvertTo-Json -Depth 10 | Set-Content -Path $registryFile -Encoding UTF8

    # Build PowerShell command for the Windows Terminal tab
    $chromeFlag = if ($config.Chrome) { "--chrome " } else { "" }
    $permFlag = if ($PlanMode) { "--permission-mode=plan " } else { "--dangerously-skip-permissions " }

    # Escape paths for embedding in command
    $escapedConfigDir = $selectedConfigDir -replace "'", "''"
    $escapedProjectRoot = $ProjectRoot -replace "'", "''"

    $psCommand = @"
`$env:CLAUDE_CONFIG_DIR = '$escapedConfigDir'
`$env:CLAUDE_SESSION = '$sessionName'
Set-Location '$escapedProjectRoot'
Write-Host '========================================' -ForegroundColor Magenta
Write-Host ' NIGHT-BURST-$AgentNum : $($config.Name)' -ForegroundColor Magenta
Write-Host '========================================' -ForegroundColor Magenta
Write-Host 'Account: $selectedAccount' -ForegroundColor Gray
Write-Host 'Started: ' -NoNewline; Write-Host (Get-Date) -ForegroundColor Cyan
Write-Host ''
claude $chromeFlag$permFlag/night-burst-$AgentNum
Write-Host ''
Write-Host '========================================' -ForegroundColor Yellow
Write-Host ' FINISHED - Press any key to close...' -ForegroundColor Yellow
Write-Host '========================================' -ForegroundColor Yellow
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@

    $bytes = [System.Text.Encoding]::Unicode.GetBytes($psCommand)
    $encoded = [Convert]::ToBase64String($bytes)

    # Return wt tab command (will be assembled later)
    # Title format: "B1: lead-finder" (short but descriptive)
    $shortName = $config.Name
    return "new-tab --title `"B$AgentNum $shortName`" powershell -NoExit -EncodedCommand $encoded"
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

# Phase 4: Start all agents in Windows Terminal with visible tabs
Write-Host "`n[PHASE 4] Preparing agents for Windows Terminal..." -ForegroundColor Yellow
if ($PlanMode) {
    Write-Host "[PLAN MODE] Agents will start in plan mode and wait for approval" -ForegroundColor Magenta
}

# Collect all Windows Terminal tab commands
$wtTabs = @()
for ($i = 1; $i -le $MaxAgents; $i++) {
    if ($PlanMode) {
        $tabCmd = Start-Agent -AgentNum $i -PlanMode
    } else {
        $tabCmd = Start-Agent -AgentNum $i
    }
    $wtTabs += $tabCmd
    Write-Host "[PREP] Burst-$i command prepared" -ForegroundColor Gray
}

# Build Windows Terminal command
# First tab doesn't need "new-tab" prefix
$firstTab = $wtTabs[0] -replace "^new-tab ", ""
$allTabs = $firstTab

# Add remaining tabs
if ($wtTabs.Count -gt 1) {
    for ($i = 1; $i -lt $wtTabs.Count; $i++) {
        $allTabs += " ; $($wtTabs[$i])"
    }
}

Write-Host "`n[START] Opening Windows Terminal with $MaxAgents tabs..." -ForegroundColor Cyan
Write-Host "[START] Each tab shows live output of one agent" -ForegroundColor Gray

# Update registry to mark all as running
$registryFile = Join-Path $ProgressDir "agent-registry.json"
$registry = Get-Content $registryFile | ConvertFrom-Json
for ($i = 1; $i -le $MaxAgents; $i++) {
    $registry.agents."burst-$i".status = "running"
    $registry.agents."burst-$i".started_at = Get-Timestamp
}
$registry.running_agents = $MaxAgents
$registry | ConvertTo-Json -Depth 10 | Set-Content -Path $registryFile -Encoding UTF8

# Execute Windows Terminal with all tabs
# Strategy: Write command to temp batch file to avoid command line length limits
$batchFile = Join-Path $env:TEMP "night-burst-start.cmd"

try {
    # Write the full wt command to a batch file (avoids 8191 char limit)
    $wtCommand = "wt.exe $allTabs"
    Write-Host "[DEBUG] Command length: $($wtCommand.Length) chars" -ForegroundColor Gray

    if ($wtCommand.Length -gt 8000) {
        Write-Host "[INFO] Command too long, using batch file method..." -ForegroundColor Yellow

        # Split into multiple wt calls - first opens window, rest add tabs
        # First tab command (opens new window)
        $firstCmd = "wt.exe $firstTab"
        Set-Content -Path $batchFile -Value "@echo off"
        Add-Content -Path $batchFile -Value "start `"Night-Burst`" $firstCmd"
        Add-Content -Path $batchFile -Value "timeout /t 2 /nobreak >nul"

        # Remaining tabs (add to existing window with -w 0)
        for ($i = 1; $i -lt $wtTabs.Count; $i++) {
            $tabCmd = $wtTabs[$i]
            Add-Content -Path $batchFile -Value "wt.exe -w 0 $tabCmd"
            Add-Content -Path $batchFile -Value "timeout /t 1 /nobreak >nul"
        }

        # Execute batch file
        cmd /c $batchFile
        Write-Host "`n[ORCHESTRATOR] All $MaxAgents agents started in visible terminals!" -ForegroundColor Green
    } else {
        # Short enough for direct execution
        cmd /c $wtCommand
        Write-Host "`n[ORCHESTRATOR] All $MaxAgents agents started in visible terminals!" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] Failed to start Windows Terminal: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "[FALLBACK] Starting agents in separate windows..." -ForegroundColor Yellow

    # Fallback: each agent in its own window
    foreach ($tabCmd in $wtTabs) {
        $singleCmd = "wt.exe $tabCmd"
        Start-Process "wt.exe" -ArgumentList $tabCmd
        Start-Sleep -Milliseconds 1000
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " NIGHT-BURST V3.1 LAUNCHED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  - Windows Terminal opened with $MaxAgents tabs" -ForegroundColor White
Write-Host "  - Each tab shows live Claude output" -ForegroundColor White
Write-Host "  - Tabs stay open after completion" -ForegroundColor White
Write-Host "  - Press any key in tab to close it" -ForegroundColor White
Write-Host ""
Write-Host "Commands:" -ForegroundColor Yellow
Write-Host "  .\scripts\night-burst-orchestrator.ps1 -Status  # Check agent registry"
Write-Host "  .\scripts\night-burst-orchestrator.ps1 -Stop    # Stop all (kills terminals)"
Write-Host ""
Write-Host "[ORCHESTRATOR] Orchestrator exiting. Agents run independently in terminals." -ForegroundColor Gray
