# Flexible Night-Burst Agent Starter
# Usage:
#   .\scripts\start-agents.ps1                    # Interactive menu
#   .\scripts\start-agents.ps1 -Preset priority   # Use preset
#   .\scripts\start-agents.ps1 -Agents 2,4,5      # Custom agents

param(
    [string]$Preset,           # "priority", "monitoring", "outreach", "full"
    [int[]]$Agents,            # Custom agent list, e.g. @(2,4,5)
    [switch]$NoWakeUp,         # Skip backend wake-up
    [switch]$NoChrome,         # Disable Chrome MCP (Chrome is ON by default!)
    [switch]$NoSafetyCheck,    # Skip pre-deploy safety checks (NOT recommended!)
    [switch]$QuickSafety       # Run quick safety checks only
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

# Pre-flight: Clean up ALL stale lock files (burst dirs + acc dirs + tabs etc.)
Get-ChildItem "$env:USERPROFILE\.claude*" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    Get-ChildItem "$($_.FullName)\*.lock" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
}
Write-Host "    [CLEANUP] Lock files cleaned" -ForegroundColor DarkGray

# Agent Configuration
$AgentConfig = @{
    1  = @{ Name = "Lead Finder";      Priority = 2; Chrome = $true;  Status = "ACTIVE" }
    2  = @{ Name = "Cold Emailer";     Priority = 1; Chrome = $true;  Status = "ACTIVE" }
    3  = @{ Name = "Social DM";        Priority = 3; Chrome = $true;  Status = "PAUSED" }
    4  = @{ Name = "Demo Generator";   Priority = 1; Chrome = $false; Status = "ACTIVE" }
    5  = @{ Name = "Hot Lead Chaser";  Priority = 1; Chrome = $false; Status = "ACTIVE" }
    6  = @{ Name = "User Activator";   Priority = 3; Chrome = $false; Status = "PAUSED" }
    7  = @{ Name = "Payment Convert";  Priority = 3; Chrome = $false; Status = "PAUSED" }
    8  = @{ Name = "Upgrader";         Priority = 3; Chrome = $false; Status = "PAUSED" }
    9  = @{ Name = "Doctor";           Priority = 2; Chrome = $false; Status = "ACTIVE" }
    10 = @{ Name = "Morning Brief";    Priority = 3; Chrome = $false; Status = "ACTIVE" }
    11 = @{ Name = "Bottleneck";       Priority = 2; Chrome = $false; Status = "ACTIVE" }
    12 = @{ Name = "Creative";         Priority = 3; Chrome = $false; Status = "ACTIVE" }
    13 = @{ Name = "Churn Prev";       Priority = 2; Chrome = $false; Status = "ACTIVE" }
    14 = @{ Name = "Lead Scorer";      Priority = 2; Chrome = $false; Status = "ACTIVE" }
    15 = @{ Name = "Approval Gate";    Priority = 1; Chrome = $false; Status = "ACTIVE" }
}

# Presets
$Presets = @{
    "priority"   = @(2, 4, 5)              # Priority-1 agents
    "monitoring" = @(9, 11, 14)            # Health check agents
    "outreach"   = @(1, 2, 4, 5, 14)       # Full lead-to-conversion pipeline
    "full"       = @(1..15)                # All 15 agents
}

# Function to display the menu
function Show-MainMenu {
    Clear-Host
    Write-Host ""
    Write-Host "    +===============================================================+" -ForegroundColor Cyan
    Write-Host "    |                                                               |" -ForegroundColor Cyan
    Write-Host "    |   " -ForegroundColor Cyan -NoNewline
    Write-Host "NIGHT-BURST AGENT SELECTOR" -ForegroundColor Yellow -NoNewline
    Write-Host "                              |" -ForegroundColor Cyan
    Write-Host "    |                                                               |" -ForegroundColor Cyan
    Write-Host "    +===============================================================+" -ForegroundColor Cyan
    Write-Host "    |                                                               |" -ForegroundColor Cyan
    Write-Host "    |   " -ForegroundColor Cyan -NoNewline
    Write-Host "PRESETS:" -ForegroundColor White -NoNewline
    Write-Host "                                                    |" -ForegroundColor Cyan
    Write-Host "    |                                                               |" -ForegroundColor Cyan
    Write-Host "    |   " -ForegroundColor Cyan -NoNewline
    Write-Host "[1]" -ForegroundColor Green -NoNewline
    Write-Host " Priority      " -ForegroundColor White -NoNewline
    Write-Host "(Burst 2,4,5)" -ForegroundColor DarkGray -NoNewline
    Write-Host "      - Outreach Focus         |" -ForegroundColor White -NoNewline
    Write-Host "" -ForegroundColor Cyan
    Write-Host "    |   " -ForegroundColor Cyan -NoNewline
    Write-Host "[2]" -ForegroundColor Green -NoNewline
    Write-Host " Monitoring    " -ForegroundColor White -NoNewline
    Write-Host "(Burst 9,11,14)" -ForegroundColor DarkGray -NoNewline
    Write-Host "    - Health Check           |" -ForegroundColor White -NoNewline
    Write-Host "" -ForegroundColor Cyan
    Write-Host "    |   " -ForegroundColor Cyan -NoNewline
    Write-Host "[3]" -ForegroundColor Green -NoNewline
    Write-Host " Full Outreach " -ForegroundColor White -NoNewline
    Write-Host "(Burst 1,2,4,5,14)" -ForegroundColor DarkGray -NoNewline
    Write-Host " - Lead to Convert        |" -ForegroundColor White -NoNewline
    Write-Host "" -ForegroundColor Cyan
    Write-Host "    |   " -ForegroundColor Cyan -NoNewline
    Write-Host "[4]" -ForegroundColor Green -NoNewline
    Write-Host " All 15 Agents                  - Full Night Mode       |" -ForegroundColor White -NoNewline
    Write-Host "" -ForegroundColor Cyan
    Write-Host "    |   " -ForegroundColor Cyan -NoNewline
    Write-Host "[5]" -ForegroundColor Green -NoNewline
    Write-Host " Custom                         - Choose yourself       |" -ForegroundColor White -NoNewline
    Write-Host "" -ForegroundColor Cyan
    Write-Host "    |                                                               |" -ForegroundColor Cyan
    Write-Host "    |   " -ForegroundColor Cyan -NoNewline
    Write-Host "[Q]" -ForegroundColor Red -NoNewline
    Write-Host " Quit                                                   |" -ForegroundColor White -NoNewline
    Write-Host "" -ForegroundColor Cyan
    Write-Host "    |                                                               |" -ForegroundColor Cyan
    Write-Host "    +===============================================================+" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "    Select option: " -NoNewline -ForegroundColor White
}

# Function to display custom agent selection
function Show-CustomMenu {
    Clear-Host
    Write-Host ""
    Write-Host "    +===============================================================+" -ForegroundColor Cyan
    Write-Host "    |                                                               |" -ForegroundColor Cyan
    Write-Host "    |   " -ForegroundColor Cyan -NoNewline
    Write-Host "CUSTOM AGENT SELECTION" -ForegroundColor Yellow -NoNewline
    Write-Host "                                  |" -ForegroundColor Cyan
    Write-Host "    |                                                               |" -ForegroundColor Cyan
    Write-Host "    +===============================================================+" -ForegroundColor Cyan

    # Display agents
    Write-Host "    |                                                               |" -ForegroundColor Cyan

    # Left column (1-8)
    foreach ($i in 1..8) {
        $cfg = $AgentConfig[$i]
        $star = if ($cfg.Priority -eq 1) { "*" } else { " " }
        $prio = "(P$($cfg.Priority))"
        $statusColor = if ($cfg.Status -eq "PAUSED") { "Red" } else { "White" }

        # Right column agent (9-15)
        $rightNum = $i + 8
        if ($rightNum -le 15) {
            $rightCfg = $AgentConfig[$rightNum]
            $rightStar = if ($rightCfg.Priority -eq 1) { "*" } else { " " }
            $rightPrio = "(P$($rightCfg.Priority))"
            $rightStatusColor = if ($rightCfg.Status -eq "PAUSED") { "Red" } else { "White" }
        }

        Write-Host "    |   " -ForegroundColor Cyan -NoNewline
        Write-Host "[" -ForegroundColor Green -NoNewline
        Write-Host ("{0,2}" -f $i) -ForegroundColor Green -NoNewline
        Write-Host "] " -ForegroundColor Green -NoNewline
        Write-Host $cfg.Name.PadRight(14) -ForegroundColor $statusColor -NoNewline
        Write-Host $prio.PadRight(5) -ForegroundColor DarkGray -NoNewline
        Write-Host $star -ForegroundColor Yellow -NoNewline

        if ($rightNum -le 15) {
            Write-Host "   " -NoNewline
            Write-Host "[" -ForegroundColor Green -NoNewline
            Write-Host ("{0,2}" -f $rightNum) -ForegroundColor Green -NoNewline
            Write-Host "] " -ForegroundColor Green -NoNewline
            Write-Host $rightCfg.Name.PadRight(14) -ForegroundColor $rightStatusColor -NoNewline
            Write-Host $rightPrio.PadRight(5) -ForegroundColor DarkGray -NoNewline
            Write-Host $rightStar -ForegroundColor Yellow -NoNewline
            Write-Host "  |" -ForegroundColor Cyan
        } else {
            Write-Host "                               |" -ForegroundColor Cyan
        }
    }

    Write-Host "    |                                                               |" -ForegroundColor Cyan
    Write-Host "    |   " -ForegroundColor Cyan -NoNewline
    Write-Host "*" -ForegroundColor Yellow -NoNewline
    Write-Host " = Priority 1 (recommended)   " -ForegroundColor White -NoNewline
    Write-Host "Red" -ForegroundColor Red -NoNewline
    Write-Host " = PAUSED               |" -ForegroundColor White -NoNewline
    Write-Host "" -ForegroundColor Cyan
    Write-Host "    |                                                               |" -ForegroundColor Cyan
    Write-Host "    +===============================================================+" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "    Enter agent numbers (comma-separated, e.g. 2,4,5): " -NoNewline -ForegroundColor White
}

# Function to run pre-deploy safety checks (V3.9)
function Run-SafetyChecks {
    if ($NoSafetyCheck) {
        Write-Host ""
        Write-Host "    [SAFETY] Skipping safety checks (-NoSafetyCheck flag)" -ForegroundColor Yellow
        Write-Host "    [WARNING] This is NOT recommended for Night-Burst!" -ForegroundColor Red
        return $true
    }

    Write-Host ""
    Write-Host "    +===============================================+" -ForegroundColor Magenta
    Write-Host "    |  PRE-DEPLOY SAFETY CHECKS (V3.9)             |" -ForegroundColor Magenta
    Write-Host "    |  Philosophy: FAIL-SAFE > FAIL-DEFAULT        |" -ForegroundColor Magenta
    Write-Host "    +===============================================+" -ForegroundColor Magenta
    Write-Host ""

    $safetyScript = Join-Path $ProjectRoot "scripts\pre-deploy-safety.ps1"

    if (Test-Path $safetyScript) {
        $quickFlag = if ($QuickSafety) { "-Quick" } else { "" }

        # Run safety checks
        $result = & powershell -ExecutionPolicy Bypass -File $safetyScript $quickFlag
        $exitCode = $LASTEXITCODE

        if ($exitCode -ne 0) {
            Write-Host ""
            Write-Host "    [BLOCKED] Safety checks FAILED!" -ForegroundColor Red
            Write-Host "    Fix issues before starting agents." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "    To skip (NOT recommended): -NoSafetyCheck" -ForegroundColor DarkGray
            Write-Host ""
            return $false
        }

        return $true
    } else {
        Write-Host "    [WARN] pre-deploy-safety.ps1 not found" -ForegroundColor Yellow
        Write-Host "    Proceeding without safety checks..." -ForegroundColor Yellow
        return $true
    }
}

# Function to wake up backend
function Wake-Backend {
    if (-not $NoWakeUp) {
        Write-Host ""
        Write-Host "    [WAKE-UP] Waking up Render backend..." -ForegroundColor Yellow
        $BackendUrl = "https://review-responder.onrender.com"
        $result = curl.exe -s -o NUL -w "%{http_code}" --connect-timeout 30 "$BackendUrl/api/admin/stats" 2>&1
        if ($result -match '^\d{3}$') {
            Write-Host "    [WAKE-UP] Backend is awake (HTTP $result)" -ForegroundColor Green
        } else {
            Write-Host "    [WAKE-UP] Backend may be sleeping, agents will retry..." -ForegroundColor Yellow
        }
    }
}

# Function to start an agent
function Start-Agent {
    param(
        [int]$AgentNum
    )

    # Get agent-specific config directory (avoids lock conflicts)
    $getAgentConfigScript = Join-Path $ProjectRoot "scripts\Get-AgentConfig.ps1"
    $selectedConfigDir = & powershell -ExecutionPolicy Bypass -File $getAgentConfigScript -AgentNumber $AgentNum
    $selectedAccount = Split-Path $selectedConfigDir -Leaf

    $config = $AgentConfig[$AgentNum]
    $agentName = $config.Name
    # Chrome is ON by default for all agents (unless -NoChrome specified)
    $chromeFlag = if ($NoChrome) { "" } else { " --chrome" }

    $escapedProjectRoot = $ProjectRoot -replace "'", "''"
    $escapedConfigDir = $selectedConfigDir -replace "'", "''"

    # Build the command - if Chrome enabled, run chrome-init first then the agent task
    $chromeInit = if (-not $NoChrome) { " /chrome-init &&" } else { "" }

    $psCommand = @"
`$env:CLAUDE_CONFIG_DIR = '$escapedConfigDir'
`$env:CLAUDE_SESSION = 'BURST$AgentNum'
Set-Location '$escapedProjectRoot'
Write-Host '========================================' -ForegroundColor Magenta
Write-Host ' BURST-$AgentNum : $agentName' -ForegroundColor Magenta
Write-Host ' Account: $selectedAccount' -ForegroundColor DarkGray
if ('$chromeFlag' -ne '') { Write-Host ' [CHROME MCP ENABLED]' -ForegroundColor Cyan }
Write-Host '========================================' -ForegroundColor Magenta
Write-Host 'Started: ' -NoNewline; Write-Host (Get-Date) -ForegroundColor Cyan
Write-Host ''
claude --dangerously-skip-permissions$chromeFlag /night-burst-$AgentNum
Write-Host ''
Write-Host '========================================' -ForegroundColor Yellow
Write-Host ' FINISHED - Press any key to close...' -ForegroundColor Yellow
Write-Host '========================================' -ForegroundColor Yellow
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@

    $bytes = [System.Text.Encoding]::Unicode.GetBytes($psCommand)
    $encoded = [Convert]::ToBase64String($bytes)

    Start-Process wt -ArgumentList "powershell -NoExit -EncodedCommand $encoded"
    Write-Host "    [START] Burst-$AgentNum ($agentName) → $selectedAccount" -ForegroundColor Green
}

# Function to start multiple agents
function Start-SelectedAgents {
    param([int[]]$AgentList)

    if ($AgentList.Count -eq 0) {
        Write-Host "    No agents selected!" -ForegroundColor Red
        return
    }

    # Run pre-deploy safety checks FIRST (V3.9)
    $safetyPassed = Run-SafetyChecks
    if (-not $safetyPassed) {
        Write-Host "    Aborting agent start due to failed safety checks." -ForegroundColor Red
        return
    }

    # Show what will be started
    Write-Host ""
    Write-Host "    +=======================================+" -ForegroundColor Cyan
    Write-Host "    |  Starting $($AgentList.Count) Agent(s):                    |" -ForegroundColor Cyan
    Write-Host "    +---------------------------------------+" -ForegroundColor Cyan
    foreach ($num in $AgentList) {
        $name = $AgentConfig[$num].Name
        Write-Host "    |  Burst-$num : $($name.PadRight(24))|" -ForegroundColor White
    }
    Write-Host "    +=======================================+" -ForegroundColor Cyan

    # Wake up backend
    Wake-Backend

    Write-Host ""

    # Start each agent with delay
    foreach ($num in $AgentList) {
        Start-Agent -AgentNum $num
        if ($num -ne $AgentList[-1]) {
            # 4s delay for stability with 15 parallel agents
            Start-Sleep -Seconds 4
        }
    }

    # Summary
    Write-Host ""
    Write-Host "    ========================================" -ForegroundColor Cyan
    Write-Host "    LAUNCHED $($AgentList.Count) AGENTS" -ForegroundColor Cyan
    if (-not $NoChrome) {
        Write-Host "    [CHROME MCP: ON]" -ForegroundColor Green
    } else {
        Write-Host "    [CHROME MCP: OFF]" -ForegroundColor Yellow
    }
    Write-Host "    ========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "    $($AgentList.Count) Windows opened with agents" -ForegroundColor White
    Write-Host "    Each window shows live Claude output" -ForegroundColor Gray
    Write-Host ""
    Write-Host "    To stop: Close the terminal windows" -ForegroundColor Gray
    Write-Host ""
    if (-not $NoChrome) {
        Write-Host "    Tab Status: " -NoNewline -ForegroundColor Gray
        Write-Host "powershell chrome-tab-manager.ps1 -Action status" -ForegroundColor DarkGray
    }
    Write-Host ""
}

# Parse comma-separated agent input
function Parse-AgentInput {
    param([string]$InputStr)

    $numbers = @()
    $parts = $InputStr -split ','
    foreach ($part in $parts) {
        $trimmed = $part.Trim()
        if ($trimmed -match '^\d+$') {
            $num = [int]$trimmed
            if ($num -ge 1 -and $num -le 15) {
                $numbers += $num
            }
        }
    }
    return $numbers | Sort-Object -Unique
}

# ========== MAIN LOGIC ==========

# If preset specified via parameter
if ($Preset) {
    $presetLower = $Preset.ToLower()
    if ($Presets.ContainsKey($presetLower)) {
        Write-Host ""
        Write-Host "    Using preset: $Preset" -ForegroundColor Cyan
        Start-SelectedAgents -AgentList $Presets[$presetLower]
        exit 0
    } else {
        Write-Host "    Unknown preset: $Preset" -ForegroundColor Red
        Write-Host "    Available: priority, monitoring, outreach, full" -ForegroundColor Yellow
        exit 1
    }
}

# If agents specified via parameter
if ($Agents -and $Agents.Count -gt 0) {
    Write-Host ""
    Write-Host "    Using custom agent list" -ForegroundColor Cyan
    Start-SelectedAgents -AgentList $Agents
    exit 0
}

# Interactive mode
do {
    Show-MainMenu
    $choice = Read-Host

    switch ($choice.ToUpper()) {
        "1" {
            Start-SelectedAgents -AgentList $Presets["priority"]
            exit 0
        }
        "2" {
            Start-SelectedAgents -AgentList $Presets["monitoring"]
            exit 0
        }
        "3" {
            Start-SelectedAgents -AgentList $Presets["outreach"]
            exit 0
        }
        "4" {
            Start-SelectedAgents -AgentList $Presets["full"]
            exit 0
        }
        "5" {
            Show-CustomMenu
            $customInput = Read-Host
            $selectedAgents = Parse-AgentInput -InputStr $customInput
            if ($selectedAgents.Count -gt 0) {
                Start-SelectedAgents -AgentList $selectedAgents
                exit 0
            } else {
                Write-Host ""
                Write-Host "    No valid agents selected. Press any key to continue..." -ForegroundColor Yellow
                $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
            }
        }
        "Q" {
            Write-Host ""
            Write-Host "    Bye!" -ForegroundColor Cyan
            exit 0
        }
        default {
            Write-Host ""
            Write-Host "    Invalid option. Press any key to continue..." -ForegroundColor Yellow
            $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
        }
    }
} while ($true)
