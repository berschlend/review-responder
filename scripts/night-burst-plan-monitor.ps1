# night-burst-plan-monitor.ps1
# Monitors all 15 agents for plan completion
# Sends notification when all plans are ready for approval
#
# Usage: .\scripts\night-burst-plan-monitor.ps1
#        .\scripts\night-burst-plan-monitor.ps1 -MaxAgents 5

param(
    [int]$MaxAgents = 15,
    [int]$CheckIntervalSeconds = 60,
    [int]$TimeoutMinutes = 180  # 3 hours max wait
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$ProgressDir = Join-Path $ProjectRoot "content\claude-progress"
$NotifyScript = Join-Path $env:USERPROFILE "claude-notify.ps1"

Write-Host @"

    ____  __               __  ___            _ __
   / __ \/ /___ _____     /  |/  /___  ____  (_) /_____  _____
  / /_/ / / __ `/ __ \   / /|_/ / __ \/ __ \/ / __/ __ \/ ___/
 / ____/ / /_/ / / / /  / /  / / /_/ / / / / / /_/ /_/ / /
/_/   /_/\__,_/_/ /_/  /_/  /_/\____/_/ /_/_/\__/\____/_/

              Waiting for $MaxAgents agents to complete plans...

"@ -ForegroundColor Cyan

$startTime = Get-Date
$timeoutTime = $startTime.AddMinutes($TimeoutMinutes)

# Track agent states
$agentStates = @{}
for ($i = 1; $i -le $MaxAgents; $i++) {
    $agentStates["burst-$i"] = @{
        status = "unknown"
        plan_ready = $false
        last_checked = $null
    }
}

function Get-AgentPlanStatus {
    param([int]$AgentNum)

    $statusFile = Join-Path $ProgressDir "burst-$AgentNum-status.json"

    if (Test-Path $statusFile) {
        try {
            $status = Get-Content $statusFile -Raw | ConvertFrom-Json

            # Check for plan-related statuses
            $planReady = $status.status -in @("plan_ready", "awaiting_approval", "plan_complete", "waiting_for_approval")

            return @{
                status = $status.status
                plan_ready = $planReady
                current_action = $status.current_action
                last_heartbeat = $status.last_heartbeat
            }
        } catch {
            return @{
                status = "error_reading"
                plan_ready = $false
                error = $_.Exception.Message
            }
        }
    }

    return @{
        status = "no_status_file"
        plan_ready = $false
    }
}

$planReadyCount = 0
$checkCount = 0

while ($planReadyCount -lt $MaxAgents -and (Get-Date) -lt $timeoutTime) {
    $checkCount++
    $planReadyCount = 0
    $runningCount = 0
    $errorCount = 0

    Write-Host "`n[CHECK $checkCount] $(Get-Date -Format 'HH:mm:ss') - Checking agent statuses..." -ForegroundColor Yellow

    for ($i = 1; $i -le $MaxAgents; $i++) {
        $agentStatus = Get-AgentPlanStatus -AgentNum $i
        $agentStates["burst-$i"] = $agentStatus

        if ($agentStatus.plan_ready) {
            $planReadyCount++
            Write-Host "  Burst-$i: PLAN READY" -ForegroundColor Green
        } elseif ($agentStatus.status -eq "running") {
            $runningCount++
            Write-Host "  Burst-$i: Running - $($agentStatus.current_action)" -ForegroundColor Cyan
        } elseif ($agentStatus.status -in @("error", "error_reading", "no_status_file")) {
            $errorCount++
            Write-Host "  Burst-$i: ERROR - $($agentStatus.status)" -ForegroundColor Red
        } else {
            Write-Host "  Burst-$i: $($agentStatus.status)" -ForegroundColor Gray
        }
    }

    # Summary
    $elapsed = (Get-Date) - $startTime
    Write-Host "`n  Summary: $planReadyCount/$MaxAgents plans ready | $runningCount running | $errorCount errors" -ForegroundColor White
    Write-Host "  Elapsed: $([math]::Round($elapsed.TotalMinutes, 1)) minutes" -ForegroundColor Gray

    if ($planReadyCount -ge $MaxAgents) {
        break
    }

    # Wait before next check
    Write-Host "  Next check in $CheckIntervalSeconds seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds $CheckIntervalSeconds
}

# Final result
$elapsed = (Get-Date) - $startTime

if ($planReadyCount -ge $MaxAgents) {
    Write-Host "`n" -NoNewline
    Write-Host "============================================" -ForegroundColor Green
    Write-Host " ALL $MaxAgents PLANS ARE READY FOR APPROVAL!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "`nTotal time: $([math]::Round($elapsed.TotalMinutes, 1)) minutes" -ForegroundColor White

    # Send notification
    if (Test-Path $NotifyScript) {
        Write-Host "`n[NOTIFY] Sending notification..." -ForegroundColor Yellow
        & $NotifyScript -Type "plans_ready" -Session "ALL"
        Write-Host "[NOTIFY] Notification sent!" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Notification script not found at $NotifyScript" -ForegroundColor Yellow
        # Fallback: Windows Toast
        try {
            [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
            $template = [Windows.UI.Notifications.ToastTemplateType]::ToastText02
            $xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent($template)
            $xml.GetElementsByTagName("text")[0].AppendChild($xml.CreateTextNode("Night-Burst: Plans Ready!")) | Out-Null
            $xml.GetElementsByTagName("text")[1].AppendChild($xml.CreateTextNode("$MaxAgents agents have completed their plans. Time for review!")) | Out-Null
            $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
            [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Night-Burst").Show($toast)
        } catch {
            Write-Host "[WARN] Could not send toast notification: $_" -ForegroundColor Yellow
        }
    }

    # List plan files
    Write-Host "`nPlan files to review:" -ForegroundColor Cyan
    for ($i = 1; $i -le $MaxAgents; $i++) {
        $planDir = Join-Path $env:USERPROFILE ".claude-acc*" "plans"
        $planFiles = Get-ChildItem -Path $planDir -Filter "*.md" -ErrorAction SilentlyContinue |
                     Where-Object { $_.LastWriteTime -gt $startTime }
        foreach ($file in $planFiles) {
            Write-Host "  - $($file.FullName)" -ForegroundColor White
        }
    }

} else {
    Write-Host "`n" -NoNewline
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host " TIMEOUT: Not all plans ready after $TimeoutMinutes minutes" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host "`nReady: $planReadyCount / $MaxAgents" -ForegroundColor White

    # Notify about partial completion
    if (Test-Path $NotifyScript) {
        & $NotifyScript -Type "plans_partial" -Session "$planReadyCount/$MaxAgents"
    }
}

Write-Host "`n[MONITOR] Plan monitor complete." -ForegroundColor Gray
