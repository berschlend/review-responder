# Create Night-Burst Scheduled Task
$taskName = "Night-Burst"
$scriptPath = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder\scripts\night-burst-launcher.ps1"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At "01:30"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force

Write-Host "Task '$taskName' created successfully!" -ForegroundColor Green
Write-Host "Next run: $(Get-ScheduledTaskInfo -TaskName $taskName | Select-Object -ExpandProperty NextRunTime)"
