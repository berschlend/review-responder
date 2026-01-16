# Setup Task Scheduler for Night-Burst
# Run this script once as Administrator to create the scheduled task

$taskName = "Night-Burst-Visible"
$scriptPath = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder\scripts\night-burst-orchestrator.ps1"

Write-Host "Setting up Night-Burst Task Scheduler..." -ForegroundColor Cyan

# Remove existing task if exists
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create action
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Normal -File `"$scriptPath`""

# Create trigger - Daily at 01:30
$trigger = New-ScheduledTaskTrigger -Daily -At "01:30"

# Create settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun

# Create principal (run only when user is logged in, so windows are visible)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

# Register task
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Night-Burst V3.1 - Starts 15 Claude agents in visible Windows Terminal tabs at 01:30"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Task '$taskName' created!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Schedule: Daily at 01:30" -ForegroundColor White
Write-Host "Script: $scriptPath" -ForegroundColor White
Write-Host ""
Write-Host "To test manually:" -ForegroundColor Yellow
Write-Host "  schtasks /run /tn `"$taskName`"" -ForegroundColor Gray
Write-Host ""
Write-Host "To check status:" -ForegroundColor Yellow
Write-Host "  Get-ScheduledTask -TaskName `"$taskName`"" -ForegroundColor Gray
