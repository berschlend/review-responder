# Get-BestAccount.ps1
# Wählt den Claude Account mit dem niedrigsten heutigen Usage
# Verwendet für Night-Burst automatische Account-Rotation

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# Account-Konfiguration
$Accounts = @(
    @{ Dir = ".claude-acc1"; Email = "Berend.mainz@web.de" },
    @{ Dir = ".claude-acc2"; Email = "berend.jakob.mainz@gmail.com" },
    @{ Dir = ".claude-acc3"; Email = "breihosen@gmail.com" }
)

$Today = (Get-Date).ToString("yyyy-MM-dd")
$UsageData = @()

foreach ($Acc in $Accounts) {
    $AccDir = Join-Path $env:USERPROFILE $Acc.Dir
    $StatsFile = Join-Path $AccDir "stats-cache.json"

    $TokensToday = 0
    $LastComputed = $null

    if (Test-Path $StatsFile) {
        try {
            $Stats = Get-Content $StatsFile -Raw | ConvertFrom-Json
            $LastComputed = $Stats.lastComputedDate

            # Find today's token usage
            $TodayStats = $Stats.dailyModelTokens | Where-Object { $_.date -eq $Today }

            if ($TodayStats) {
                # Sum all model tokens for today
                foreach ($Model in $TodayStats.tokensByModel.PSObject.Properties) {
                    $TokensToday += $Model.Value
                }
            }
        } catch {
            if ($Verbose) {
                Write-Host "[WARN] Could not read stats for $($Acc.Dir): $_" -ForegroundColor Yellow
            }
        }
    }

    $UsageData += @{
        Account = $Acc.Dir
        ConfigDir = Join-Path $env:USERPROFILE $Acc.Dir
        Email = $Acc.Email
        TodayTokens = $TokensToday
        LastComputed = $LastComputed
    }

    if ($Verbose) {
        Write-Host "$($Acc.Dir): $TokensToday tokens today (last: $LastComputed)" -ForegroundColor Gray
    }
}

# Sort by tokens (ascending) and select the one with lowest usage
$Best = $UsageData | Sort-Object TodayTokens | Select-Object -First 1

if ($Verbose) {
    Write-Host ""
    Write-Host "Selected: $($Best.Account) ($($Best.Email)) with $($Best.TodayTokens) tokens" -ForegroundColor Green
}

# Output the full config directory path
Write-Output $Best.ConfigDir
