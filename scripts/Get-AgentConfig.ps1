# Get-AgentConfig.ps1
# Returns the config directory for a specific agent number
# Each agent has its own config dir to avoid lock conflicts
#
# Usage:
#   $configDir = .\scripts\Get-AgentConfig.ps1 -AgentNumber 5
#   $env:CLAUDE_CONFIG_DIR = $configDir
#
# Shared Directory (Inter-Agent Communication):
#   $sharedDir = .\scripts\Get-AgentConfig.ps1 -Shared
#   # Returns: ~/.claude-shared

param(
    [Parameter(Mandatory=$false)]
    [ValidateRange(1, 15)]
    [int]$AgentNumber,

    [switch]$Shared,     # Return shared directory path instead

    [switch]$ShowInfo
)

$ErrorActionPreference = "Stop"

# ============================================================
# SHARED DIRECTORY MODE
# ============================================================
if ($Shared) {
    $sharedDir = "$env:USERPROFILE\.claude-shared"

    if (-not (Test-Path $sharedDir)) {
        Write-Error @"
Shared directory not found: $sharedDir

Run Setup-AgentConfigs.ps1 first to create it:
    .\scripts\Setup-AgentConfigs.ps1
"@
        exit 1
    }

    if ($ShowInfo) {
        Write-Host "Shared Directory: $sharedDir" -ForegroundColor Magenta
        Write-Host "  Files:" -ForegroundColor Gray
        Get-ChildItem $sharedDir -Name | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }
    }

    Write-Output $sharedDir
    exit 0
}

# ============================================================
# AGENT-SPECIFIC DIRECTORY MODE
# ============================================================

# Validate AgentNumber is provided when not using -Shared
if ($AgentNumber -eq 0) {
    Write-Error "AgentNumber is required when not using -Shared parameter"
    exit 1
}

$agentDir = "$env:USERPROFILE\.claude-burst$AgentNumber"

# Check if agent config exists
if (-not (Test-Path $agentDir)) {
    Write-Error @"
Agent config not found: $agentDir

Run Setup-AgentConfigs.ps1 first to create agent config directories:
    .\scripts\Setup-AgentConfigs.ps1
"@
    exit 1
}

# Check if credentials exist
$credFile = Join-Path $agentDir ".claude.json"
if (-not (Test-Path $credFile)) {
    Write-Error @"
No credentials in agent config: $agentDir

Run Setup-AgentConfigs.ps1 to copy credentials:
    .\scripts\Setup-AgentConfigs.ps1 -Force
"@
    exit 1
}

# Clean up any stale lock files
$lockFile = Join-Path $agentDir ".claude.json.lock"
if (Test-Path $lockFile) {
    try {
        Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
        if ($ShowInfo) {
            Write-Host "[CLEANUP] Removed stale lock: $lockFile" -ForegroundColor Yellow
        }
    } catch {
        # Ignore errors, lock may be in use
    }
}

if ($ShowInfo) {
    # Determine which base account this agent uses
    $accountIndex = ($AgentNumber - 1) % 3
    $accountNames = @("acc1", "acc2", "acc3")
    $baseAccount = $accountNames[$accountIndex]

    Write-Host "Agent $AgentNumber -> $agentDir (from $baseAccount)" -ForegroundColor Gray
}

# Output the config directory path
Write-Output $agentDir
