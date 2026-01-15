# Night-Burst Morning Report Generator
# Creates a comprehensive report of overnight activity
#
# Run manually in the morning or schedule for 08:00

param(
    [switch]$Send,  # Future: Send via email/Slack
    [switch]$Open   # Open in browser
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$ProgressDir = Join-Path $ProjectRoot "content\claude-progress"
$LogDir = Join-Path $ProjectRoot "logs"

function Get-Timestamp {
    return (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

function Get-OvernightStats {
    # Collect stats from all agent status files
    $stats = @{
        agents_run = 0
        agents_stuck = 0
        total_actions = 0
        total_errors = 0
        sessions_completed = 0
    }

    for ($i = 1; $i -le 15; $i++) {
        $statusFile = Join-Path $ProgressDir "burst-$i-status.json"
        if (Test-Path $statusFile) {
            try {
                $status = Get-Content $statusFile -Raw | ConvertFrom-Json

                if ($status.current_loop -gt 0) {
                    $stats.agents_run++
                    $stats.sessions_completed += $status.current_loop
                }

                if ($status.metrics) {
                    $stats.total_actions += [int]$status.metrics.actions_taken
                    $stats.total_errors += [int]$status.metrics.errors_count
                }

                if ($status.health.stuck_detected) {
                    $stats.agents_stuck++
                }
            } catch {
                # Skip malformed status files
            }
        }
    }

    return $stats
}

function Get-APIStats {
    # Get API usage from resource budget
    $budgetFile = Join-Path $ProgressDir "resource-budget.json"

    if (Test-Path $budgetFile) {
        try {
            $budget = Get-Content $budgetFile -Raw | ConvertFrom-Json
            return $budget.daily_limits
        } catch {
            return $null
        }
    }
    return $null
}

function Get-Checkpoints {
    $checkpointFile = Join-Path $ProgressDir "checkpoint-store.json"

    if (Test-Path $checkpointFile) {
        try {
            $store = Get-Content $checkpointFile -Raw | ConvertFrom-Json
            return $store.checkpoints | Sort-Object created_at -Descending | Select-Object -First 10
        } catch {
            return @()
        }
    }
    return @()
}

function Get-LogHighlights {
    # Get notable log entries from overnight
    $highlights = @()
    $yesterday = (Get-Date).AddDays(-1)

    $logFiles = Get-ChildItem $LogDir -Filter "*.log" -ErrorAction SilentlyContinue

    foreach ($log in $logFiles) {
        if ($log.LastWriteTime -gt $yesterday) {
            $content = Get-Content $log.FullName -Tail 50 -ErrorAction SilentlyContinue

            # Look for errors, conversions, important events
            $content | ForEach-Object {
                if ($_ -match "ERROR|CRITICAL|CONVERSION|PAYMENT|STUCK|WARNING") {
                    $highlights += @{
                        file = $log.Name
                        line = $_
                    }
                }
            }
        }
    }

    return $highlights | Select-Object -First 20
}

function Get-BackendStats {
    # Fetch stats from backend API
    try {
        $response = Invoke-RestMethod -Uri "https://review-responder.onrender.com/api/admin/stats" `
            -Headers @{ "X-Admin-Key" = "rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U" } `
            -TimeoutSec 10 `
            -ErrorAction SilentlyContinue

        return $response
    } catch {
        return $null
    }
}

function Generate-Report {
    $overnightStats = Get-OvernightStats
    $apiStats = Get-APIStats
    $checkpoints = Get-Checkpoints
    $highlights = Get-LogHighlights
    $backendStats = Get-BackendStats

    $reportDate = Get-Date -Format "yyyy-MM-dd"
    $reportTime = Get-Date -Format "HH:mm"

    $report = @"
# 🌅 Night-Burst Morning Report
## $reportDate $reportTime

---

## 🤖 Agent Activity Summary

| Metric | Value |
|--------|-------|
| Agents Run | $($overnightStats.agents_run) / 15 |
| Sessions Completed | $($overnightStats.sessions_completed) |
| Total Actions | $($overnightStats.total_actions) |
| Errors | $($overnightStats.total_errors) |
| Stuck Agents | $($overnightStats.agents_stuck) |

---

## 📊 API Usage (Daily Budget)

"@

    if ($apiStats) {
        $report += "| Resource | Used | Limit | % Used |`n|----------|------|-------|--------|`n"

        $apiStats.PSObject.Properties | ForEach-Object {
            $name = $_.Name
            $used = $_.Value.used
            $limit = $_.Value.limit
            $pct = if ($limit -gt 0) { [math]::Round(($used / $limit) * 100, 1) } else { 0 }
            $status = if ($pct -gt 80) { "🔴" } elseif ($pct -gt 50) { "🟡" } else { "🟢" }

            $report += "| $name | $used | $limit | $status $pct% |`n"
        }
    } else {
        $report += "_API stats not available_`n"
    }

    $report += @"

---

## 📈 Business Metrics

"@

    if ($backendStats) {
        $report += @"
| Metric | Current |
|--------|---------|
| Total Users | $($backendStats.users.total) |
| Paying Users | $($backendStats.users.paying) |
| New This Week | $($backendStats.users.newThisWeek) |

**Revenue:** `$0 MRR (Goal: `$1000)

"@
    } else {
        $report += "_Backend stats not available (server might be sleeping)_`n"
    }

    $report += @"

---

## 📝 Recent Checkpoints

"@

    if ($checkpoints.Count -gt 0) {
        $report += "| Agent | Reason | Time |`n|-------|--------|------|`n"
        $checkpoints | ForEach-Object {
            $report += "| $($_.agent) | $($_.reason) | $($_.created_at) |`n"
        }
    } else {
        $report += "_No checkpoints recorded_`n"
    }

    $report += @"

---

## ⚠️ Notable Events

"@

    if ($highlights.Count -gt 0) {
        $highlights | ForEach-Object {
            $report += "- **$($_.file):** $($_.line)`n"
        }
    } else {
        $report += "_No notable events (errors, warnings) found_`n"
    }

    $report += @"

---

## 🎯 Priorities for Today

Based on overnight activity:

1. **Check stuck agents** ($($overnightStats.agents_stuck) detected)
2. **Review API usage** (prevent overages)
3. **Process any escalations** (check for-berend.md)

---

## 📂 Files to Check

- `content/claude-progress/for-berend.md` - Escalations
- `content/claude-progress/learnings.md` - New patterns
- `logs/` - Detailed agent logs

---

*Generated at $(Get-Timestamp)*
"@

    return $report
}

# Main execution
Write-Host "Generating Night-Burst Morning Report..." -ForegroundColor Cyan

$report = Generate-Report

# Save report
$reportFile = Join-Path $ProgressDir "morning-report-$(Get-Date -Format 'yyyy-MM-dd').md"
$report | Set-Content $reportFile -Encoding UTF8

# Also update the main for-berend.md
$forBerendFile = Join-Path $ProgressDir "for-berend.md"
$report | Set-Content $forBerendFile -Encoding UTF8

Write-Host "Report saved to:" -ForegroundColor Green
Write-Host "  - $reportFile"
Write-Host "  - $forBerendFile"

if ($Open) {
    Start-Process $reportFile
}

# Display summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " QUICK SUMMARY" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$stats = Get-OvernightStats
Write-Host "Agents Run:      $($stats.agents_run) / 15"
Write-Host "Sessions:        $($stats.sessions_completed)"
Write-Host "Total Actions:   $($stats.total_actions)"
Write-Host "Errors:          $($stats.total_errors)"

if ($stats.agents_stuck -gt 0) {
    Write-Host "STUCK AGENTS:    $($stats.agents_stuck)" -ForegroundColor Red
}

$backendStats = Get-BackendStats
if ($backendStats) {
    Write-Host ""
    Write-Host "Users:           $($backendStats.users.total)"
    Write-Host "Paying:          $($backendStats.users.paying)"
}

Write-Host ""
Write-Host "Full report: $reportFile" -ForegroundColor Gray
