# ONE-CLICK DEMO VIDEO - MAXIMALLY AUTOMATED
# ============================================
# Berend tut NUR: F9 → Demo → F10
# ALLES andere ist automatisch!

$ProjectRoot = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
$DemoUrl = "https://tryreviewresponder.com/demo-video-page.html?hideControls=true"
$VideoDirs = @(
    "$ProjectRoot\content\video-recordings",
    "$env:USERPROFILE\Videos",
    "$env:USERPROFILE\Videos\OBS"
)

Clear-Host
Write-Host "`n  DEMO VIDEO - Auto-Mode`n" -ForegroundColor Cyan

# 1. API Warmup (silent)
try { Invoke-WebRequest -Uri "https://review-responder.onrender.com/api/public/stats" -TimeoutSec 3 -UseBasicParsing | Out-Null }
catch { }

# 2. Open Demo Page
Write-Host "  [1] Browser oeffnet..." -ForegroundColor DarkGray
Start-Process "chrome.exe" -ArgumentList $DemoUrl
Start-Sleep -Seconds 2

# 3. Simple Instructions
Write-Host @"

  ┌─────────────────────────────────────┐
  │  F9  = Start Recording              │
  │  Demo machen (15 Sek)               │
  │  F10 = Stop Recording               │
  │                                     │
  │  Dann ENTER druecken                │
  └─────────────────────────────────────┘

"@ -ForegroundColor White

Read-Host

# 4. Auto-find newest video
Write-Host "  [2] Suche Video..." -ForegroundColor DarkGray
Start-Sleep -Seconds 2  # Give OBS time to finalize file

$NewestVideo = $null
$NewestTime = [DateTime]::MinValue

foreach ($dir in $VideoDirs) {
    if (Test-Path $dir) {
        $videos = Get-ChildItem -Path $dir -Include "*.mp4","*.mkv","*.webm" -Recurse -ErrorAction SilentlyContinue |
                  Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-30) }
        foreach ($v in $videos) {
            if ($v.LastWriteTime -gt $NewestTime) {
                $NewestTime = $v.LastWriteTime
                $NewestVideo = $v.FullName
            }
        }
    }
}

if ($NewestVideo) {
    Write-Host "  [3] Video gefunden: $($NewestVideo | Split-Path -Leaf)" -ForegroundColor Green
    Write-Host "  [4] Post-Production laeuft..." -ForegroundColor Yellow

    # Auto-start post-production - NO CONFIRMATION
    & "$ProjectRoot\scripts\video-automation\post-process.ps1" -InputVideo $NewestVideo

} else {
    Write-Host "`n  Kein Video gefunden. OBS Output Folder checken!" -ForegroundColor Red
    Write-Host "  Erwartet: MP4/MKV/WEBM in letzten 30 Min`n" -ForegroundColor DarkGray

    Write-Host "  Pfad manuell: " -ForegroundColor Yellow -NoNewline
    $VideoPath = Read-Host
    if ($VideoPath -and (Test-Path $VideoPath)) {
        & "$ProjectRoot\scripts\video-automation\post-process.ps1" -InputVideo $VideoPath
    }
}
