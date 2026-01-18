# Erstelle Desktop Shortcut fuer Demo Video Recording
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "Demo Video Recording.lnk"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = '-ExecutionPolicy Bypass -File "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder\scripts\record-demo.ps1"'
$Shortcut.WorkingDirectory = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
$Shortcut.IconLocation = "shell32.dll,176"
$Shortcut.Save()

Write-Host "Desktop Shortcut erstellt: $ShortcutPath" -ForegroundColor Green
