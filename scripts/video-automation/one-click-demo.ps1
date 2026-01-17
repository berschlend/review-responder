# ONE-CLICK DEMO VIDEO
# =====================
# Das einzige was Berend tun muss:
# 1. Dieses Script starten
# 2. In OBS F9 druecken (Start)
# 3. Demo machen (15 Sek)
# 4. F10 druecken (Stop)
# 5. ENTER druecken
#
# Claude macht den Rest!

$ProjectRoot = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
$DemoUrl = "https://tryreviewresponder.com/demo-video-page.html?hideControls=true"

Clear-Host
Write-Host @"

  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║   REVIEWRESPONDER DEMO VIDEO                 ║
  ║   One-Click Recording                        ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Step 1: Warm up API
Write-Host "[1/3] API aufwaermen..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "https://review-responder.onrender.com/api/public/stats" -TimeoutSec 5 -UseBasicParsing | Out-Null
    Write-Host "      API ready!" -ForegroundColor Green
} catch {
    Write-Host "      API warming up... (OK)" -ForegroundColor DarkYellow
}

# Step 2: Open Demo Page
Write-Host "`n[2/3] Demo-Page oeffnen..." -ForegroundColor Yellow
Start-Process "chrome.exe" -ArgumentList $DemoUrl
Start-Sleep -Seconds 2
Write-Host "      Chrome geoeffnet!" -ForegroundColor Green

# Step 3: Instructions
Write-Host @"

  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║   JETZT AUFNEHMEN!                           ║
  ║                                              ║
  ║   1. OBS: F9 = Start Recording               ║
  ║                                              ║
  ║   2. Demo machen:                            ║
  ║      [0:00] Review zeigen                    ║
  ║      [0:04] Extension klicken                ║
  ║      [0:06] Generate klicken                 ║
  ║      [0:10] Response zeigen                  ║
  ║      [0:14] Copy-Paste-Submit                ║
  ║                                              ║
  ║   3. OBS: F10 = Stop Recording               ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝

"@ -ForegroundColor White

Write-Host "Druecke ENTER wenn Recording fertig..." -ForegroundColor Magenta -NoNewline
Read-Host

# Step 4: Ask for video file
Write-Host "`n[3/3] Post-Production" -ForegroundColor Yellow
Write-Host @"

  Das Video liegt jetzt in deinem OBS Output Folder.

  OPTION A: Claude macht Post-Production
  --------------------------------------
  Kopiere den Video-Pfad und sag Claude:
  "Hier ist das Video: [PFAD] - mach es fertig"

  OPTION B: Automatisch (ffmpeg)
  ------------------------------
  .\scripts\video-automation\post-process.ps1 -InputVideo "PFAD"

"@ -ForegroundColor Cyan

# Auto-find newest video
$VideoDirs = @(
    "$ProjectRoot\content\video-recordings",
    "$env:USERPROFILE\Videos",
    "$env:USERPROFILE\Videos\OBS"
)

$NewestVideo = $null
$NewestTime = [DateTime]::MinValue

foreach ($dir in $VideoDirs) {
    if (Test-Path $dir) {
        $videos = Get-ChildItem -Path $dir -Filter "*.mp4" -ErrorAction SilentlyContinue |
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
    Write-Host "`nNeuestes Video gefunden (letzte 30 Min):" -ForegroundColor Green
    Write-Host "  $NewestVideo" -ForegroundColor Cyan
    Write-Host "`nPost-Production starten? (Y/N): " -ForegroundColor Yellow -NoNewline
    $confirm = Read-Host
    if ($confirm -eq "Y" -or $confirm -eq "y") {
        & "$ProjectRoot\scripts\video-automation\post-process.ps1" -InputVideo $NewestVideo
    }
} else {
    Write-Host "`nKein neues Video gefunden. Pfad manuell eingeben: " -ForegroundColor Yellow -NoNewline
    $VideoPath = Read-Host
    if ($VideoPath -and (Test-Path $VideoPath)) {
        & "$ProjectRoot\scripts\video-automation\post-process.ps1" -InputVideo $VideoPath
    } else {
        Write-Host "`n[DONE] Sag Claude den Video-Pfad fuer Post-Production!`n" -ForegroundColor Cyan
    }
}
