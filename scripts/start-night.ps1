# Night-Burst Quick Start
# The ONE command to run every night before sleep
#
# Usage: .\scripts\start-night.ps1

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

Write-Host @"

    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🌙  NIGHT-BURST QUICK START  🌙                            ║
    ║                                                               ║
    ║   This will start the autonomous marketing system.           ║
    ║   It will run until morning (auto-stop at 08:00).           ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# Pre-flight checks
Write-Host "Pre-flight checks..." -ForegroundColor Yellow

# Check 1: Claude CLI
$claudeVersion = & claude --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [X] Claude CLI not found!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  [✓] Claude CLI: OK" -ForegroundColor Green
}

# Check 2: Power settings
$scheme = powercfg /getactivescheme
Write-Host "  [!] Power: Make sure PC stays on (check settings)" -ForegroundColor Yellow

# Check 3: Files exist
$orchestrator = Join-Path $ProjectRoot "scripts\night-burst-orchestrator.ps1"
if (Test-Path $orchestrator) {
    Write-Host "  [✓] Scripts: OK" -ForegroundColor Green
} else {
    Write-Host "  [X] Scripts not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Options:" -ForegroundColor Cyan
Write-Host "  [1] Full Night (all 15 agents, 10 hours)"
Write-Host "  [2] Light Night (5 priority agents, 6 hours)"
Write-Host "  [3] Test Run (1 hour, 3 agents)"
Write-Host "  [Q] Quit"
Write-Host ""

$choice = Read-Host "Select option"

switch ($choice) {
    "1" {
        Write-Host "`nStarting FULL NIGHT mode..." -ForegroundColor Cyan
        Write-Host "- All 15 agents will run"
        Write-Host "- Duration: ~10 hours"
        Write-Host "- Auto-stop: 08:00"
        Write-Host ""
        Write-Host "You can close this window. Agents run in background." -ForegroundColor Green
        Write-Host ""

        & $orchestrator
    }
    "2" {
        Write-Host "`nStarting LIGHT NIGHT mode..." -ForegroundColor Cyan
        Write-Host "- Priority agents only (1,2,5,7,9)"
        Write-Host "- Duration: ~6 hours"
        Write-Host ""

        & $orchestrator -MaxAgents 5
    }
    "3" {
        Write-Host "`nStarting TEST mode..." -ForegroundColor Yellow
        Write-Host "- 3 agents (Lead Finder, Emailer, Doctor)"
        Write-Host "- Duration: 1 hour"
        Write-Host ""

        # Test with just 3 agents
        $testScript = Join-Path $ProjectRoot "scripts\night-burst-session-manager.ps1"
        Start-Job -Name "TEST_BURST1" -ScriptBlock {
            param($script)
            & $script -AgentNum 1 -MaxSessions 1 -SessionDurationMinutes 30
        } -ArgumentList $testScript

        Start-Job -Name "TEST_BURST2" -ScriptBlock {
            param($script)
            & $script -AgentNum 2 -MaxSessions 1 -SessionDurationMinutes 30
        } -ArgumentList $testScript

        Start-Job -Name "TEST_BURST9" -ScriptBlock {
            param($script)
            & $script -AgentNum 9 -MaxSessions 1 -SessionDurationMinutes 30
        } -ArgumentList $testScript

        Write-Host "Test jobs started. Check with: Get-Job" -ForegroundColor Green
    }
    "Q" {
        Write-Host "Cancelled." -ForegroundColor Gray
        exit 0
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}
