# Setup-AgentConfigs.ps1
# Creates 15 agent-specific config directories to avoid lock conflicts
# Each agent gets its own copy of credentials from a base account
# PLUS: Shared directory for inter-agent communication
#
# Usage: .\scripts\Setup-AgentConfigs.ps1
#
# Distribution (Round-Robin):
#   acc1 -> Burst 1, 4, 7, 10, 13
#   acc2 -> Burst 2, 5, 8, 11, 14
#   acc3 -> Burst 3, 6, 9, 12, 15
#
# Shared Directory: .claude-shared
#   - agent-messages.json (Inter-agent messaging)
#   - active-agents.json (Who's running)
#   - priority-tasks.json (Shared task queue)

param(
    [switch]$Force  # Force recreation of existing directories
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "    +===============================================+" -ForegroundColor Cyan
Write-Host "    |  AGENT CONFIG SETUP                          |" -ForegroundColor Cyan
Write-Host "    |  Creating 15 per-agent config directories    |" -ForegroundColor Cyan
Write-Host "    +===============================================+" -ForegroundColor Cyan
Write-Host ""

# Base account directories
$baseAccounts = @(
    "$env:USERPROFILE\.claude-acc1",
    "$env:USERPROFILE\.claude-acc2",
    "$env:USERPROFILE\.claude-acc3"
)

# Verify base accounts exist
foreach ($base in $baseAccounts) {
    if (-not (Test-Path $base)) {
        Write-Host "    [ERROR] Base account not found: $base" -ForegroundColor Red
        exit 1
    }
    $credFile = Join-Path $base ".claude.json"
    if (-not (Test-Path $credFile)) {
        Write-Host "    [ERROR] No credentials in: $base" -ForegroundColor Red
        exit 1
    }
}

Write-Host "    [OK] All 3 base accounts found" -ForegroundColor Green
Write-Host ""

# Files to copy (credentials only, not lock files!)
$credFiles = @('.claude.json', 'settings.json', 'credentials.json')

$created = 0
$updated = 0
$skipped = 0

# Create 15 agent config directories
for ($i = 1; $i -le 15; $i++) {
    # Round-robin: agent 1,4,7,10,13 -> acc1; 2,5,8,11,14 -> acc2; 3,6,9,12,15 -> acc3
    $accountIndex = ($i - 1) % 3
    $baseAccount = $baseAccounts[$accountIndex]
    $baseAccountName = Split-Path $baseAccount -Leaf

    $agentDir = "$env:USERPROFILE\.claude-burst$i"

    $isNew = -not (Test-Path $agentDir)

    if ($isNew) {
        New-Item -ItemType Directory -Path $agentDir -Force | Out-Null
        $created++
    } elseif (-not $Force) {
        Write-Host "    [SKIP] Burst-$i already exists (use -Force to overwrite)" -ForegroundColor Yellow
        $skipped++
        continue
    } else {
        $updated++
    }

    # Remove any stale lock files first
    $lockFile = Join-Path $agentDir ".claude.json.lock"
    if (Test-Path $lockFile) {
        Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    }

    # Copy credential files
    foreach ($file in $credFiles) {
        $src = Join-Path $baseAccount $file
        if (Test-Path $src) {
            Copy-Item $src -Destination $agentDir -Force
        }
    }

    $status = if ($isNew) { "CREATED" } else { "UPDATED" }
    Write-Host "    [$status] Burst-$("{0,2}" -f $i) -> $baseAccountName" -ForegroundColor $(if ($isNew) { "Green" } else { "Cyan" })
}

Write-Host ""
Write-Host "    +===============================================+" -ForegroundColor Cyan
Write-Host "    |  SUMMARY                                     |" -ForegroundColor Cyan
Write-Host "    +===============================================+" -ForegroundColor Cyan
Write-Host "    |  Created: $created                                   |" -ForegroundColor Green
Write-Host "    |  Updated: $updated                                   |" -ForegroundColor Cyan
Write-Host "    |  Skipped: $skipped                                   |" -ForegroundColor Yellow
Write-Host "    +===============================================+" -ForegroundColor Cyan
Write-Host ""

# Show account distribution
Write-Host "    Account Distribution:" -ForegroundColor White
Write-Host "    ----------------------" -ForegroundColor Gray
Write-Host "    acc1: Burst 1, 4, 7, 10, 13" -ForegroundColor Gray
Write-Host "    acc2: Burst 2, 5, 8, 11, 14" -ForegroundColor Gray
Write-Host "    acc3: Burst 3, 6, 9, 12, 15" -ForegroundColor Gray
Write-Host ""

if ($created -gt 0 -or $updated -gt 0) {
    Write-Host "    [READY] Agent configs ready for parallel execution!" -ForegroundColor Green
}
Write-Host ""

# ============================================================
# SHARED DIRECTORY for Inter-Agent Communication
# ============================================================

Write-Host "    Setting up Shared Directory..." -ForegroundColor Cyan
Write-Host ""

$sharedDir = "$env:USERPROFILE\.claude-shared"
$sharedCreated = $false

if (-not (Test-Path $sharedDir)) {
    New-Item -ItemType Directory -Path $sharedDir -Force | Out-Null
    $sharedCreated = $true
    Write-Host "    [CREATED] .claude-shared" -ForegroundColor Green
} else {
    Write-Host "    [EXISTS] .claude-shared" -ForegroundColor Gray
}

# Initialize shared files if they don't exist
$sharedFiles = @{
    "agent-messages.json" = @'
{
  "messages": [],
  "last_updated": null,
  "format": {
    "from": "burst-X",
    "to": "burst-Y or all",
    "type": "info|alert|task|response",
    "message": "content",
    "timestamp": "ISO8601"
  }
}
'@
    "active-agents.json" = @'
{
  "agents": {},
  "last_updated": null,
  "format": {
    "burst-X": {
      "status": "running|idle|stopped",
      "started_at": "ISO8601",
      "last_heartbeat": "ISO8601",
      "current_task": "description"
    }
  }
}
'@
    "priority-tasks.json" = @'
{
  "tasks": [],
  "last_updated": null,
  "format": {
    "id": "uuid",
    "priority": 1,
    "task": "description",
    "assigned_to": "burst-X or null",
    "created_by": "burst-X",
    "status": "pending|in_progress|completed"
  }
}
'@
    "agent-discoveries.json" = @'
{
  "discoveries": [],
  "last_updated": null,
  "format": {
    "from": "burst-X",
    "type": "lead|insight|error|success",
    "data": {},
    "timestamp": "ISO8601"
  }
}
'@
}

foreach ($fileName in $sharedFiles.Keys) {
    $filePath = Join-Path $sharedDir $fileName
    if (-not (Test-Path $filePath)) {
        $sharedFiles[$fileName] | Out-File -FilePath $filePath -Encoding utf8
        Write-Host "    [CREATED] $fileName" -ForegroundColor Green
    } else {
        Write-Host "    [EXISTS] $fileName" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "    +===============================================+" -ForegroundColor Magenta
Write-Host "    |  SHARED DIRECTORY                            |" -ForegroundColor Magenta
Write-Host "    +===============================================+" -ForegroundColor Magenta
Write-Host "    |  Path: ~/.claude-shared                      |" -ForegroundColor White
Write-Host "    |                                              |" -ForegroundColor Magenta
Write-Host "    |  Files:                                      |" -ForegroundColor White
Write-Host "    |  - agent-messages.json    (messaging)        |" -ForegroundColor Gray
Write-Host "    |  - active-agents.json     (who's running)    |" -ForegroundColor Gray
Write-Host "    |  - priority-tasks.json    (task queue)       |" -ForegroundColor Gray
Write-Host "    |  - agent-discoveries.json (shared findings)  |" -ForegroundColor Gray
Write-Host "    +===============================================+" -ForegroundColor Magenta
Write-Host ""
