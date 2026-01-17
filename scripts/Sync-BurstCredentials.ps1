# Sync-BurstCredentials.ps1
# Synchronizes credentials from base accounts to burst agent directories
# Use this when tokens need refresh or credentials change
#
# Usage:
#   .\scripts\Sync-BurstCredentials.ps1           # Sync all
#   .\scripts\Sync-BurstCredentials.ps1 -Agent 5  # Sync specific agent

param(
    [ValidateRange(1, 15)]
    [int]$Agent,  # Optional: sync specific agent only

    [switch]$Force  # Force overwrite even if file is newer
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "    +===============================================+" -ForegroundColor Cyan
Write-Host "    |  CREDENTIAL SYNC                             |" -ForegroundColor Cyan
Write-Host "    +===============================================+" -ForegroundColor Cyan
Write-Host ""

# Base account directories
$baseAccounts = @(
    "$env:USERPROFILE\.claude-acc1",
    "$env:USERPROFILE\.claude-acc2",
    "$env:USERPROFILE\.claude-acc3"
)

# Files to sync
$credFiles = @('.claude.json')  # Only sync the main credential file

$synced = 0
$failed = 0
$skipped = 0

# Determine which agents to sync
$agentsToSync = if ($Agent) { @($Agent) } else { 1..15 }

foreach ($i in $agentsToSync) {
    $accountIndex = ($i - 1) % 3
    $baseAccount = $baseAccounts[$accountIndex]
    $baseAccountName = Split-Path $baseAccount -Leaf

    $agentDir = "$env:USERPROFILE\.claude-burst$i"

    if (-not (Test-Path $agentDir)) {
        Write-Host "    [SKIP] Burst-$i: Directory not found" -ForegroundColor Yellow
        $skipped++
        continue
    }

    # Remove lock file if exists
    $lockFile = Join-Path $agentDir ".claude.json.lock"
    if (Test-Path $lockFile) {
        try {
            Remove-Item $lockFile -Force
            Write-Host "    [CLEAN] Burst-$i: Removed lock file" -ForegroundColor Gray
        } catch {
            Write-Host "    [WARN] Burst-$i: Could not remove lock (agent running?)" -ForegroundColor Yellow
        }
    }

    # Sync credential files
    foreach ($file in $credFiles) {
        $src = Join-Path $baseAccount $file
        $dst = Join-Path $agentDir $file

        if (-not (Test-Path $src)) {
            Write-Host "    [WARN] Source not found: $src" -ForegroundColor Yellow
            continue
        }

        try {
            # Check if source is newer (unless -Force)
            if ((Test-Path $dst) -and -not $Force) {
                $srcTime = (Get-Item $src).LastWriteTime
                $dstTime = (Get-Item $dst).LastWriteTime
                if ($dstTime -ge $srcTime) {
                    Write-Host "    [SKIP] Burst-$("{0,2}" -f $i): Already up-to-date" -ForegroundColor Gray
                    $skipped++
                    continue
                }
            }

            Copy-Item $src -Destination $dst -Force
            Write-Host "    [SYNC] Burst-$("{0,2}" -f $i) <- $baseAccountName" -ForegroundColor Green
            $synced++
        } catch {
            Write-Host "    [FAIL] Burst-$i: $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host ""
Write-Host "    +===============================================+" -ForegroundColor Cyan
Write-Host "    |  SUMMARY                                     |" -ForegroundColor Cyan
Write-Host "    +===============================================+" -ForegroundColor Cyan
Write-Host "    |  Synced:  $synced                                   |" -ForegroundColor Green
Write-Host "    |  Skipped: $skipped                                   |" -ForegroundColor Yellow
Write-Host "    |  Failed:  $failed                                   |" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "    +===============================================+" -ForegroundColor Cyan
Write-Host ""

if ($failed -gt 0) {
    Write-Host "    [WARN] Some syncs failed. Check if agents are running." -ForegroundColor Yellow
    exit 1
}
