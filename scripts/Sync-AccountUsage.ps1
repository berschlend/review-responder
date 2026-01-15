# Sync-AccountUsage.ps1
# Syncs Claude CLI account usage to the backend for Admin Panel display
# Run: .\scripts\Sync-AccountUsage.ps1

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# Configuration
$BackendUrl = "https://review-responder.onrender.com"
$AdminSecret = "rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"

# Account directories
$Accounts = @(
    @{ Dir = ".claude-acc1"; Email = "Berend.mainz@web.de" },
    @{ Dir = ".claude-acc2"; Email = "berend.jakob.mainz@gmail.com" },
    @{ Dir = ".claude-acc3"; Email = "breihosen@gmail.com" }
)

$Today = (Get-Date).ToString("yyyy-MM-dd")
$WeekStart = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Claude Account Usage Sync" -ForegroundColor Cyan
Write-Host "Date: $Today" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$AccountData = @()

foreach ($Acc in $Accounts) {
    $AccDir = Join-Path $env:USERPROFILE $Acc.Dir
    $StatsFile = Join-Path $AccDir "stats-cache.json"

    $TokensToday = 0
    $TokensWeek = 0
    $MessagesToday = 0
    $SessionsToday = 0

    if (Test-Path $StatsFile) {
        try {
            $Stats = Get-Content $StatsFile -Raw | ConvertFrom-Json

            # Get today's token usage
            $TodayTokens = $Stats.dailyModelTokens | Where-Object { $_.date -eq $Today }
            if ($TodayTokens) {
                foreach ($Model in $TodayTokens.tokensByModel.PSObject.Properties) {
                    $TokensToday += $Model.Value
                }
            }

            # Get week's token usage (last 7 days)
            foreach ($Day in $Stats.dailyModelTokens) {
                if ($Day.date -ge $WeekStart) {
                    foreach ($Model in $Day.tokensByModel.PSObject.Properties) {
                        $TokensWeek += $Model.Value
                    }
                }
            }

            # Get today's activity
            $TodayActivity = $Stats.dailyActivity | Where-Object { $_.date -eq $Today }
            if ($TodayActivity) {
                $MessagesToday = $TodayActivity.messageCount
                $SessionsToday = $TodayActivity.sessionCount
            }

            Write-Host "$($Acc.Dir):" -ForegroundColor Green
            Write-Host "  Today: $TokensToday tokens, $MessagesToday msgs, $SessionsToday sessions" -ForegroundColor Gray
            Write-Host "  Week:  $TokensWeek tokens" -ForegroundColor Gray

        } catch {
            Write-Host "$($Acc.Dir): Error reading stats - $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host "$($Acc.Dir): No stats file found" -ForegroundColor Yellow
    }

    $AccountData += @{
        account_name = $Acc.Dir
        email = $Acc.Email
        tokens_today = $TokensToday
        tokens_week = $TokensWeek
        messages_today = $MessagesToday
        sessions_today = $SessionsToday
    }
}

Write-Host ""
Write-Host "Syncing to backend..." -ForegroundColor Cyan

# Prepare JSON payload
$Payload = @{
    accounts = $AccountData
} | ConvertTo-Json -Depth 3

if ($Verbose) {
    Write-Host "Payload: $Payload" -ForegroundColor Gray
}

try {
    $Response = Invoke-RestMethod `
        -Uri "$BackendUrl/api/admin/sync-account-usage?key=$AdminSecret" `
        -Method POST `
        -ContentType "application/json" `
        -Body $Payload

    if ($Response.success) {
        Write-Host ""
        Write-Host "Sync successful!" -ForegroundColor Green
        Write-Host "Synced: $($Response.synced) accounts" -ForegroundColor Green
        Write-Host "Time: $($Response.synced_at)" -ForegroundColor Gray
    } else {
        Write-Host "Sync failed: $($Response | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "Sync error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $Reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $ErrorBody = $Reader.ReadToEnd()
        Write-Host "Response: $ErrorBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done. View stats at: $BackendUrl/admin → Claude Accounts tab" -ForegroundColor Cyan
