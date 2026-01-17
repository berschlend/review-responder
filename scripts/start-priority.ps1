# Priority Mode - Start only Priority-1 Agents (Burst-2, 4, 5)
# Usage: .\scripts\start-priority.ps1

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

# Pre-flight: Clean up any stale lock files
Get-ChildItem "$env:USERPROFILE\.claude-burst*\.claude.json.lock" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host @"

    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   ⚡  PRIORITY MODE  ⚡                                       ║
    ║                                                               ║
    ║   Starting 3 Priority-1 Agents:                               ║
    ║   - Burst-2: Cold Emailer                                     ║
    ║   - Burst-4: Demo Generator                                   ║
    ║   - Burst-5: Hot Lead Chaser                                  ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Wake up backend first
Write-Host "[WAKE-UP] Waking up Render backend..." -ForegroundColor Yellow
$BackendUrl = "https://review-responder.onrender.com"
$result = curl.exe -s -o NUL -w "%{http_code}" --connect-timeout 30 "$BackendUrl/api/admin/stats" 2>&1
if ($result -match '^\d{3}$') {
    Write-Host "[WAKE-UP] Backend is awake (HTTP $result)" -ForegroundColor Green
} else {
    Write-Host "[WAKE-UP] Backend may be sleeping, agents will retry..." -ForegroundColor Yellow
}

Write-Host ""

# Function to start an agent
function Start-PriorityAgent {
    param(
        [int]$AgentNum,
        [string]$AgentName
    )

    # Get agent-specific config directory (avoids lock conflicts)
    $getAgentConfigScript = Join-Path $ProjectRoot "scripts\Get-AgentConfig.ps1"
    $selectedConfigDir = & powershell -ExecutionPolicy Bypass -File $getAgentConfigScript -AgentNumber $AgentNum
    $selectedAccount = Split-Path $selectedConfigDir -Leaf

    $escapedProjectRoot = $ProjectRoot -replace "'", "''"
    $escapedConfigDir = $selectedConfigDir -replace "'", "''"

    $psCommand = @"
`$env:CLAUDE_CONFIG_DIR = '$escapedConfigDir'
`$env:CLAUDE_SESSION = 'BURST$AgentNum'
Set-Location '$escapedProjectRoot'
Write-Host '========================================' -ForegroundColor Magenta
Write-Host ' BURST-$AgentNum : $AgentName' -ForegroundColor Magenta
Write-Host ' Account: $selectedAccount' -ForegroundColor DarkGray
Write-Host '========================================' -ForegroundColor Magenta
Write-Host 'Started: ' -NoNewline; Write-Host (Get-Date) -ForegroundColor Cyan
Write-Host ''
claude --dangerously-skip-permissions /night-burst-$AgentNum
Write-Host ''
Write-Host '========================================' -ForegroundColor Yellow
Write-Host ' FINISHED - Press any key to close...' -ForegroundColor Yellow
Write-Host '========================================' -ForegroundColor Yellow
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@

    $bytes = [System.Text.Encoding]::Unicode.GetBytes($psCommand)
    $encoded = [Convert]::ToBase64String($bytes)

    Start-Process wt -ArgumentList "powershell -NoExit -EncodedCommand $encoded"
    Write-Host "[START] Burst-$AgentNum ($AgentName) → $selectedAccount" -ForegroundColor Green
}

# Start the 3 Priority-1 agents
Start-PriorityAgent -AgentNum 2 -AgentName "Cold Emailer"
Start-Sleep -Seconds 2

Start-PriorityAgent -AgentNum 4 -AgentName "Demo Generator"
Start-Sleep -Seconds 2

Start-PriorityAgent -AgentNum 5 -AgentName "Hot Lead Chaser"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " PRIORITY MODE LAUNCHED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3 Windows opened with Priority-1 agents" -ForegroundColor White
Write-Host "  Each window shows live Claude output" -ForegroundColor White
Write-Host ""
Write-Host "To stop: Close the terminal windows" -ForegroundColor Gray
