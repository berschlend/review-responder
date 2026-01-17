# ReviewResponder Demo Video - One-Click Recording
# Usage: .\scripts\video-automation\record-demo.ps1

param(
    [switch]$SkipPreCheck,
    [int]$Duration = 20  # Seconds
)

$ProjectRoot = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
$OutputDir = Join-Path $ProjectRoot "content\video-recordings"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$OutputFile = Join-Path $OutputDir "demo-raw-$Timestamp.mp4"

# Ensure output dir exists
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ReviewResponder Demo Video Recorder" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Pre-flight checks
if (-not $SkipPreCheck) {
    Write-Host "[1/4] Pre-Flight Checks..." -ForegroundColor Yellow

    # Check API
    try {
        $response = Invoke-WebRequest -Uri "https://review-responder.onrender.com/api/public/stats" -TimeoutSec 10 -UseBasicParsing
        Write-Host "  [OK] API is responding" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] API might be cold - warming up..." -ForegroundColor Yellow
    }

    # Check Demo Page
    try {
        $response = Invoke-WebRequest -Uri "https://tryreviewresponder.com/demo-video-page.html" -TimeoutSec 10 -UseBasicParsing
        Write-Host "  [OK] Demo Page is live" -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] Demo Page not reachable!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n[2/4] Opening Demo Page in Chrome..." -ForegroundColor Yellow
$DemoUrl = "https://tryreviewresponder.com/demo-video-page.html?hideControls=true&showTimer=true"
Start-Process "chrome.exe" -ArgumentList $DemoUrl

Write-Host "  [INFO] Demo Page opened" -ForegroundColor Cyan
Write-Host "  [INFO] Extension should detect 'Demo' platform" -ForegroundColor Cyan

Write-Host "`n[3/4] Recording Instructions" -ForegroundColor Yellow
Write-Host @"

  ========================================
  BEREND'S RECORDING CHECKLIST
  ========================================

  1. OBS starten (falls nicht offen)
  2. Scene: "Chrome Window Capture"
  3. F9 druecken = Start Recording

  FLOW (15 Sekunden):
  ------------------------------------------
  [0:00-0:03] Review-Text zeigen
  [0:04]      Extension Icon klicken
  [0:06]      Generate klicken
  [0:07-0:09] Warten (Loading)
  [0:10]      Response erscheint - ZEIGEN!
  [0:14]      Copy -> Paste -> Submit
  [0:15]      "Posted!" - STOP Recording (F10)
  ------------------------------------------

  F10 druecken = Stop Recording

  ========================================

"@ -ForegroundColor White

Write-Host "[4/4] Nach Recording:" -ForegroundColor Yellow
Write-Host @"

  Video liegt in deinem OBS Output Folder.

  Dann ausfuehren:
  .\scripts\video-automation\post-process.ps1 -InputVideo "PFAD_ZUM_VIDEO"

  Das macht automatisch:
  - Text-Overlays hinzufuegen
  - Hintergrundmusik
  - Export als MP4

"@ -ForegroundColor Cyan

Write-Host "Druecke ENTER wenn du fertig bist mit Recording..." -ForegroundColor Magenta
Read-Host

Write-Host "`n[DONE] Recording session beendet." -ForegroundColor Green
Write-Host "Naechster Schritt: post-process.ps1 ausfuehren`n" -ForegroundColor Cyan
