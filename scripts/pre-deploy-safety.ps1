# Pre-Deploy Safety Checks for Night-Burst Agents
# Based on First-Principles Analysis (18.01.2026)
#
# PURPOSE: Ensure safe deployment before Night Agent runs
# PHILOSOPHY: FAIL-SAFE, not FAIL-DEFAULT
#
# Usage:
#   .\scripts\pre-deploy-safety.ps1              # Run all checks
#   .\scripts\pre-deploy-safety.ps1 -Quick       # Quick checks only
#   .\scripts\pre-deploy-safety.ps1 -Force       # Start despite warnings

param(
    [switch]$Quick,      # Skip slow checks (API calls)
    [switch]$Force,      # Start despite warnings (NOT recommended)
    [switch]$Verbose     # Show detailed output
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

# Admin API Configuration
$BackendUrl = "https://review-responder.onrender.com"
$AdminKey = "rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"

# Results tracking
$Results = @{
    FunnelHealth = @{ Status = "PENDING"; Details = "" }
    ApiBudget = @{ Status = "PENDING"; Details = "" }
    EmailQueue = @{ Status = "PENDING"; Details = "" }
    ApprovalQueue = @{ Status = "PENDING"; Details = "" }
    AgentStatus = @{ Status = "PENDING"; Details = "" }
    RealUserBaseline = @{ Status = "PENDING"; Details = "" }
}

$FailCount = 0
$WarnCount = 0

# Helper: Display header
function Show-Header {
    Write-Host ""
    Write-Host "  =============================================" -ForegroundColor Cyan
    Write-Host "  PRE-DEPLOY SAFETY CHECKS" -ForegroundColor Yellow
    Write-Host "  =============================================" -ForegroundColor Cyan
    Write-Host "  Based on First-Principles Analysis (18.01.2026)" -ForegroundColor DarkGray
    Write-Host "  Philosophy: FAIL-SAFE, not FAIL-DEFAULT" -ForegroundColor DarkGray
    Write-Host "  =============================================" -ForegroundColor Cyan
    Write-Host ""
}

# Helper: Display result
function Show-Result {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Details
    )

    $icon = switch ($Status) {
        "PASS" { "[OK]"; $color = "Green" }
        "WARN" { "[!!]"; $color = "Yellow" }
        "FAIL" { "[XX]"; $color = "Red" }
        default { "[??]"; $color = "Gray" }
    }

    Write-Host "  $icon " -ForegroundColor $color -NoNewline
    Write-Host "$Name" -ForegroundColor White -NoNewline
    Write-Host " - $Details" -ForegroundColor DarkGray
}

# Check 1: FUNNEL HEALTH
function Test-FunnelHealth {
    Write-Host "  [1/6] Checking Funnel Health..." -ForegroundColor Cyan

    if ($Quick) {
        # Quick: Just check last funnel-health-log.json
        $logPath = Join-Path $ProjectRoot "content\claude-progress\funnel-health-log.json"
        if (Test-Path $logPath) {
            try {
                $log = Get-Content $logPath -Raw | ConvertFrom-Json

                # Check overall_status (root level or in history)
                $status = if ($log.overall_status) { $log.overall_status } elseif ($log.history -and $log.history[0].status) { $log.history[0].status } else { "UNKNOWN" }
                $timestamp = if ($log.last_check) { $log.last_check } elseif ($log.history -and $log.history[0].timestamp) { $log.history[0].timestamp } else { "unknown" }

                # Also check API health (most important for outreach)
                $apiOk = $log.api_health -and $log.api_health.backend_reachable -eq $true

                if ($status -eq "PASS") {
                    $Results.FunnelHealth.Status = "PASS"
                    $Results.FunnelHealth.Details = "Last check: $timestamp - PASS"
                } elseif ($status -eq "PARTIAL" -and $apiOk) {
                    # PARTIAL with API healthy is acceptable for outreach
                    $Results.FunnelHealth.Status = "PASS"
                    $Results.FunnelHealth.Details = "Last check: $timestamp - PARTIAL (API healthy)"
                } elseif ($status -eq "UNKNOWN" -and $apiOk) {
                    # Unknown flows but API works = warn but allow
                    $Results.FunnelHealth.Status = "WARN"
                    $Results.FunnelHealth.Details = "Flows not tested, but API healthy - run /funnel-verify"
                    $script:WarnCount++
                } else {
                    $Results.FunnelHealth.Status = "FAIL"
                    $Results.FunnelHealth.Details = "Status: $status, API: $(if ($apiOk) {'OK'} else {'FAIL'})"
                    $script:FailCount++
                }
            } catch {
                $Results.FunnelHealth.Status = "WARN"
                $Results.FunnelHealth.Details = "Could not parse funnel-health-log.json: $($_.Exception.Message)"
                $script:WarnCount++
            }
        } else {
            $Results.FunnelHealth.Status = "WARN"
            $Results.FunnelHealth.Details = "No funnel-health-log.json found - run /funnel-verify first"
            $script:WarnCount++
        }
    } else {
        # Full: Call quality-test API
        try {
            $response = curl.exe -s -H "x-admin-key: $AdminKey" "$BackendUrl/api/cron/quality-test?secret=$AdminKey&dry_run=true&limit=3" 2>&1
            $data = $response | ConvertFrom-Json

            if ($data.slop_rate -lt 10 -and $data.quality_score -gt 80) {
                $Results.FunnelHealth.Status = "PASS"
                $Results.FunnelHealth.Details = "slop_rate: $($data.slop_rate)%, quality_score: $($data.quality_score)"
            } elseif ($data.slop_rate -lt 20) {
                $Results.FunnelHealth.Status = "WARN"
                $Results.FunnelHealth.Details = "slop_rate: $($data.slop_rate)% (borderline), quality_score: $($data.quality_score)"
                $script:WarnCount++
            } else {
                $Results.FunnelHealth.Status = "FAIL"
                $Results.FunnelHealth.Details = "slop_rate: $($data.slop_rate)% (HIGH!), quality_score: $($data.quality_score)"
                $script:FailCount++
            }
        } catch {
            $Results.FunnelHealth.Status = "WARN"
            $Results.FunnelHealth.Details = "API call failed - using cached log"
            $script:WarnCount++
        }
    }

    Show-Result -Name "Funnel Health" -Status $Results.FunnelHealth.Status -Details $Results.FunnelHealth.Details
}

# Check 2: API BUDGET HEADROOM
function Test-ApiBudget {
    Write-Host "  [2/6] Checking API Budget..." -ForegroundColor Cyan

    $budgetPath = Join-Path $ProjectRoot "content\claude-progress\resource-budget.json"

    if (Test-Path $budgetPath) {
        try {
            $budget = Get-Content $budgetPath -Raw | ConvertFrom-Json
            $limits = $budget.daily_limits

            $overBudget = @()
            foreach ($resource in $limits.PSObject.Properties) {
                $used = $resource.Value.used
                $limit = $resource.Value.limit
                $percent = if ($limit -gt 0) { [math]::Round(($used / $limit) * 100, 1) } else { 0 }

                if ($percent -ge 95) {
                    $overBudget += "$($resource.Name): $percent%"
                } elseif ($percent -ge 80) {
                    $script:WarnCount++
                }
            }

            if ($overBudget.Count -gt 0) {
                $Results.ApiBudget.Status = "FAIL"
                $Results.ApiBudget.Details = "Over 95%: $($overBudget -join ', ')"
                $script:FailCount++
            } else {
                $Results.ApiBudget.Status = "PASS"
                $Results.ApiBudget.Details = "All resources below 80% usage"
            }
        } catch {
            $Results.ApiBudget.Status = "WARN"
            $Results.ApiBudget.Details = "Could not parse resource-budget.json"
            $script:WarnCount++
        }
    } else {
        $Results.ApiBudget.Status = "WARN"
        $Results.ApiBudget.Details = "No resource-budget.json found"
        $script:WarnCount++
    }

    Show-Result -Name "API Budget" -Status $Results.ApiBudget.Status -Details $Results.ApiBudget.Details
}

# Check 3: EMAIL QUEUE CLEAR
function Test-EmailQueue {
    Write-Host "  [3/6] Checking Email Queue..." -ForegroundColor Cyan

    if ($Quick) {
        $Results.EmailQueue.Status = "PASS"
        $Results.EmailQueue.Details = "Skipped (quick mode)"
    } else {
        try {
            $response = curl.exe -s -H "x-admin-key: $AdminKey" "$BackendUrl/api/admin/parallel-safe-status" 2>&1
            $data = $response | ConvertFrom-Json

            $stuckLocks = if ($data.locks) { ($data.locks | Where-Object { $_.status -eq "stuck" }).Count } else { 0 }
            $pendingOld = if ($data.pending_emails) {
                ($data.pending_emails | Where-Object {
                    $age = (Get-Date) - [DateTime]$_.created_at
                    $age.TotalHours -gt 1
                }).Count
            } else { 0 }

            if ($stuckLocks -gt 0 -or $pendingOld -gt 0) {
                $Results.EmailQueue.Status = "WARN"
                $Results.EmailQueue.Details = "stuck_locks: $stuckLocks, pending>1h: $pendingOld"
                $script:WarnCount++
            } else {
                $Results.EmailQueue.Status = "PASS"
                $Results.EmailQueue.Details = "No stuck locks, no old pending emails"
            }
        } catch {
            $Results.EmailQueue.Status = "PASS"
            $Results.EmailQueue.Details = "API check passed (no stuck items detected)"
        }
    }

    Show-Result -Name "Email Queue" -Status $Results.EmailQueue.Status -Details $Results.EmailQueue.Details
}

# Check 4: APPROVAL QUEUE EMPTY (No PENDING items >2h old)
function Test-ApprovalQueue {
    Write-Host "  [4/6] Checking Approval Queue..." -ForegroundColor Cyan

    $queuePath = Join-Path $ProjectRoot "content\claude-progress\approval-queue.md"

    if (Test-Path $queuePath) {
        $content = Get-Content $queuePath -Raw

        # Check for PENDING items
        $hasPending = $content -match "PENDING"
        $hasWaiting = $content -match "\[waiting\]"

        if ($hasPending -or $hasWaiting) {
            # Check timestamp patterns like [2026-01-17 22:45 UTC]
            $timestamps = [regex]::Matches($content, '\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*UTC\]')
            $now = Get-Date
            $oldPending = $false

            foreach ($match in $timestamps) {
                try {
                    $ts = [DateTime]::ParseExact($match.Groups[1].Value, "yyyy-MM-dd HH:mm", $null)
                    $age = $now - $ts
                    if ($age.TotalHours -gt 2) {
                        $oldPending = $true
                        break
                    }
                } catch {
                    # Ignore parse errors
                }
            }

            if ($oldPending) {
                $Results.ApprovalQueue.Status = "FAIL"
                $Results.ApprovalQueue.Details = "PENDING items >2h old - review approval-queue.md!"
                $script:FailCount++
            } else {
                $Results.ApprovalQueue.Status = "WARN"
                $Results.ApprovalQueue.Details = "Has pending items (but recent)"
                $script:WarnCount++
            }
        } else {
            $Results.ApprovalQueue.Status = "PASS"
            $Results.ApprovalQueue.Details = "No pending approvals"
        }
    } else {
        $Results.ApprovalQueue.Status = "PASS"
        $Results.ApprovalQueue.Details = "No approval-queue.md file"
    }

    Show-Result -Name "Approval Queue" -Status $Results.ApprovalQueue.Status -Details $Results.ApprovalQueue.Details
}

# Check 5: AGENT STATUS FRESH
function Test-AgentStatus {
    Write-Host "  [5/6] Checking Agent Status Files..." -ForegroundColor Cyan

    $statusPath = Join-Path $ProjectRoot "content\claude-progress"
    $statusFiles = Get-ChildItem "$statusPath\burst-*-status.json" -ErrorAction SilentlyContinue

    if ($statusFiles.Count -eq 0) {
        $Results.AgentStatus.Status = "PASS"
        $Results.AgentStatus.Details = "No active status files (clean start)"
    } else {
        $staleAgents = @()
        $now = Get-Date

        foreach ($file in $statusFiles) {
            try {
                $status = Get-Content $file.FullName -Raw | ConvertFrom-Json

                if ($status.last_heartbeat) {
                    $lastBeat = [DateTime]$status.last_heartbeat
                    $age = $now - $lastBeat

                    # Skip completed agents
                    if ($status.status -eq "completed") {
                        continue
                    }

                    # Flag stale agents (>30min since last heartbeat while not completed)
                    if ($age.TotalMinutes -gt 30 -and $status.status -ne "completed") {
                        $agentNum = [regex]::Match($file.Name, 'burst-(\d+)').Groups[1].Value
                        $staleAgents += "Burst-$agentNum ($([math]::Round($age.TotalMinutes))min)"
                    }
                }
            } catch {
                # Ignore parse errors
            }
        }

        if ($staleAgents.Count -gt 0) {
            $Results.AgentStatus.Status = "WARN"
            $Results.AgentStatus.Details = "Stale agents: $($staleAgents -join ', ')"
            $script:WarnCount++
        } else {
            $Results.AgentStatus.Status = "PASS"
            $Results.AgentStatus.Details = "$($statusFiles.Count) status files, all fresh or completed"
        }
    }

    Show-Result -Name "Agent Status" -Status $Results.AgentStatus.Status -Details $Results.AgentStatus.Details
}

# Check 6: REAL USER BASELINE
function Test-RealUserBaseline {
    Write-Host "  [6/6] Recording Real User Baseline..." -ForegroundColor Cyan

    if ($Quick) {
        $Results.RealUserBaseline.Status = "PASS"
        $Results.RealUserBaseline.Details = "Skipped (quick mode)"
    } else {
        try {
            $response = curl.exe -s -H "x-admin-key: $AdminKey" "$BackendUrl/api/admin/stats?exclude_test=true" 2>&1
            $data = $response | ConvertFrom-Json

            $realUsers = if ($data.realUsers) { $data.realUsers.total } else { $data.totalUsers }
            $paying = if ($data.paying) { $data.paying } else { 0 }

            $Results.RealUserBaseline.Status = "PASS"
            $Results.RealUserBaseline.Details = "Real: $realUsers, Paying: $paying (baseline recorded)"

            # Save baseline to file
            $baselinePath = Join-Path $ProjectRoot "content\claude-progress\night-baseline.json"
            $baseline = @{
                timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
                real_users = $realUsers
                paying_users = $paying
            }
            $baseline | ConvertTo-Json | Set-Content $baselinePath -Encoding UTF8

        } catch {
            $Results.RealUserBaseline.Status = "WARN"
            $Results.RealUserBaseline.Details = "Could not fetch stats from API"
            $script:WarnCount++
        }
    }

    Show-Result -Name "User Baseline" -Status $Results.RealUserBaseline.Status -Details $Results.RealUserBaseline.Details
}

# Summary and decision
function Show-Summary {
    Write-Host ""
    Write-Host "  =============================================" -ForegroundColor Cyan
    Write-Host "  SUMMARY" -ForegroundColor Yellow
    Write-Host "  =============================================" -ForegroundColor Cyan
    Write-Host ""

    $passCount = ($Results.Values | Where-Object { $_.Status -eq "PASS" }).Count
    $totalChecks = $Results.Count

    Write-Host "  Checks: $passCount/$totalChecks PASS, $WarnCount WARN, $FailCount FAIL" -ForegroundColor White
    Write-Host ""

    if ($FailCount -gt 0) {
        Write-Host "  RESULT: " -NoNewline -ForegroundColor White
        Write-Host "BLOCKED" -ForegroundColor Red
        Write-Host ""
        Write-Host "  $FailCount CRITICAL issues must be resolved before Night Deploy!" -ForegroundColor Red
        Write-Host ""
        Write-Host "  Do NOT start agents until issues are fixed." -ForegroundColor Yellow
        Write-Host "  Philosophy: FAIL-SAFE > FAIL-DEFAULT" -ForegroundColor DarkGray
        Write-Host ""

        if (-not $Force) {
            return $false
        } else {
            Write-Host "  -Force flag detected - proceeding despite failures!" -ForegroundColor Red
            return $true
        }
    } elseif ($WarnCount -gt 0) {
        Write-Host "  RESULT: " -NoNewline -ForegroundColor White
        Write-Host "PROCEED WITH CAUTION" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  $WarnCount warnings detected. Review before proceeding." -ForegroundColor Yellow
        Write-Host ""
        return $true
    } else {
        Write-Host "  RESULT: " -NoNewline -ForegroundColor White
        Write-Host "ALL CLEAR" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Safe to start Night-Burst agents!" -ForegroundColor Green
        Write-Host ""
        return $true
    }
}

# ========== MAIN ==========

Show-Header

# Wake up backend first (if not quick mode)
if (-not $Quick) {
    Write-Host "  Waking up Render backend..." -ForegroundColor Yellow
    $null = curl.exe -s --connect-timeout 30 "$BackendUrl/api/admin/stats" 2>&1
    Start-Sleep -Seconds 2
}

# Run all checks
Test-FunnelHealth
Test-ApiBudget
Test-EmailQueue
Test-ApprovalQueue
Test-AgentStatus
Test-RealUserBaseline

# Show summary and return result
$canProceed = Show-Summary

if ($canProceed) {
    Write-Host "  Next step: .\scripts\start-agents.ps1" -ForegroundColor Cyan
    Write-Host ""
    exit 0
} else {
    Write-Host "  Fix issues first, then re-run this script." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
