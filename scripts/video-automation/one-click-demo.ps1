# ═══════════════════════════════════════════════════════════════════
#  REVIEWRESPONDER - COMPLETE VIDEO AUTOMATION
# ═══════════════════════════════════════════════════════════════════
#  Input:  Du machst 15 Sek Demo
#  Output: 3 Videos (YouTube, TikTok, Thumbnail) + Copy-Paste Captions
# ═══════════════════════════════════════════════════════════════════

$ProjectRoot = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
$DemoUrl = "https://tryreviewresponder.com/demo-video-page.html?hideControls=true"
$VideoDirs = @(
    "$ProjectRoot\content\video-recordings",
    "$env:USERPROFILE\Videos",
    "$env:USERPROFILE\Videos\OBS"
)

Clear-Host

# ═══════════════════════════════════════════════════════════════════
#  PHASE 1: PRE-FLIGHT CHECKLIST
# ═══════════════════════════════════════════════════════════════════

Write-Host @"

  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║   DEMO VIDEO - COMPLETE AUTOMATION                            ║
  ║                                                               ║
  ║   Output: YouTube + TikTok + Thumbnail + Captions             ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝

  ┌─────────────────────────────────────────────────────────────┐
  │  PRE-FLIGHT CHECKLIST                                       │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │  [ ] Einfarbiges Shirt (kein Weiss, keine Streifen)         │
  │  [ ] Licht auf Gesicht (nicht von hinten)                   │
  │  [ ] Hintergrund aufgeraeumt oder geblurred                 │
  │  [ ] OBS: Facecam sichtbar (unten links)                    │
  │  [ ] OBS: Chrome Window Capture aktiv                       │
  │  [ ] Handy auf stumm                                        │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘

"@ -ForegroundColor Yellow

Write-Host "  Ready? ENTER zum Starten..." -ForegroundColor Cyan -NoNewline
Read-Host

# ═══════════════════════════════════════════════════════════════════
#  PHASE 2: SETUP
# ═══════════════════════════════════════════════════════════════════

Clear-Host
Write-Host "`n  SETUP...`n" -ForegroundColor Cyan

# API Warmup
Write-Host "  [1/2] API aufwaermen..." -ForegroundColor DarkGray
try {
    $response = Invoke-WebRequest -Uri "https://review-responder.onrender.com/api/public/stats" -TimeoutSec 5 -UseBasicParsing
    Write-Host "        API ready!" -ForegroundColor Green
} catch {
    Write-Host "        API warming up (normal bei Render)..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 3
}

# Open Demo Page
Write-Host "  [2/2] Demo-Page oeffnen..." -ForegroundColor DarkGray
Start-Process "chrome.exe" -ArgumentList $DemoUrl
Start-Sleep -Seconds 2
Write-Host "        Browser ready!" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════
#  PHASE 3: RECORDING
# ═══════════════════════════════════════════════════════════════════

Write-Host @"

  ╔═══════════════════════════════════════════════════════════════╗
  ║  RECORDING - 15 Sekunden                                      ║
  ╠═══════════════════════════════════════════════════════════════╣
  ║                                                               ║
  ║  F9 = START                                                   ║
  ║                                                               ║
  ║  ┌─────────────────────────────────────────────────────────┐  ║
  ║  │  [0:00-0:03]  Review zeigen, sag:                       │  ║
  ║  │               "This review just dropped..."             │  ║
  ║  │                                                         │  ║
  ║  │  [0:03-0:06]  Pause, sag:                               │  ║
  ║  │               "It's destroying your rating."            │  ║
  ║  │                                                         │  ║
  ║  │  [0:06-0:08]  Extension Icon klicken                    │  ║
  ║  │               "But watch this..."                       │  ║
  ║  │                                                         │  ║
  ║  │  [0:08-0:10]  Generate klicken, warten                  │  ║
  ║  │                                                         │  ║
  ║  │  [0:10-0:13]  Response zeigen, sag:                     │  ║
  ║  │               "One click. Professional response."       │  ║
  ║  │                                                         │  ║
  ║  │  [0:13-0:15]  Copy + Paste + Submit                     │  ║
  ║  │               "tryreviewresponder.com"                  │  ║
  ║  └─────────────────────────────────────────────────────────┘  ║
  ║                                                               ║
  ║  F10 = STOP                                                   ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝

  (Oder stumm aufnehmen - Text-Overlays werden automatisch eingefuegt!)

"@ -ForegroundColor White

Write-Host "  ENTER wenn Recording fertig..." -ForegroundColor Magenta -NoNewline
Read-Host

# ═══════════════════════════════════════════════════════════════════
#  PHASE 4: POST-PRODUCTION
# ═══════════════════════════════════════════════════════════════════

Write-Host "`n  POST-PRODUCTION...`n" -ForegroundColor Cyan

# Wait for OBS to finalize
Write-Host "  [1/3] Warte auf OBS Finalisierung..." -ForegroundColor DarkGray
Start-Sleep -Seconds 3

# Find newest video
Write-Host "  [2/3] Suche Video..." -ForegroundColor DarkGray

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
    Write-Host "        Gefunden: $($NewestVideo | Split-Path -Leaf)" -ForegroundColor Green
    Write-Host "  [3/3] Starte Post-Production..." -ForegroundColor Yellow

    # Run post-production (creates YouTube + TikTok + Thumbnail)
    & "$ProjectRoot\scripts\video-automation\post-process.ps1" -InputVideo $NewestVideo

    # ═══════════════════════════════════════════════════════════════════
    #  PHASE 5: READY-TO-POST CAPTIONS
    # ═══════════════════════════════════════════════════════════════════

    Write-Host @"

  ════════════════════════════════════════════════════════════════════

  COPY-PASTE CAPTIONS (ready to use):

  ────────────────────────────────────────────────────────────────────
  TIKTOK:
  ────────────────────────────────────────────────────────────────────
  Negative review? One click. Done.

  Comment "REVIEW" for the link!

  #restaurantowner #businesstips #ai #googlereviews #smallbusiness

  ────────────────────────────────────────────────────────────────────
  INSTAGRAM:
  ────────────────────────────────────────────────────────────────────
  Stop stressing over negative reviews.

  AI writes professional responses in seconds.

  Link in bio -> tryreviewresponder.com

  #restaurantowner #smallbusiness #ai #businesstips #googlereviews
  #restaurantmarketing #entrepreneurlife

  ────────────────────────────────────────────────────────────────────
  YOUTUBE SHORTS:
  ────────────────────────────────────────────────────────────────────
  How to respond to negative Google reviews in 10 seconds using AI.

  Try it free: tryreviewresponder.com

  ────────────────────────────────────────────────────────────────────
  LINKEDIN:
  ────────────────────────────────────────────────────────────────────
  Restaurant owners: You don't have time to craft the perfect response
  to every review.

  I built a tool that does it in one click.

  Try it: tryreviewresponder.com?utm_source=linkedin

  #SmallBusiness #AI #CustomerService #RestaurantIndustry

  ════════════════════════════════════════════════════════════════════

  UTM LINKS (fuer Tracking):

  TikTok:    tryreviewresponder.com?utm_source=tiktok
  Instagram: tryreviewresponder.com?utm_source=instagram
  YouTube:   tryreviewresponder.com?utm_source=youtube
  LinkedIn:  tryreviewresponder.com?utm_source=linkedin

  ════════════════════════════════════════════════════════════════════

"@ -ForegroundColor Cyan

    Write-Host "  ALLES FERTIG! Ordner ist geoeffnet.`n" -ForegroundColor Green
    Write-Host "  Videos uploaden, Caption copy-pasten, done!`n" -ForegroundColor White

} else {
    Write-Host @"

  [!] Kein Video gefunden (letzte 30 Min)

  Moegliche Ursachen:
  - OBS speichert woanders (Settings > Output > Recording Path)
  - OBS Format nicht MP4/MKV/WEBM
  - Recording nicht gestoppt

  Manuelle Eingabe: " -ForegroundColor Red -NoNewline
    $VideoPath = Read-Host
    if ($VideoPath -and (Test-Path $VideoPath)) {
        & "$ProjectRoot\scripts\video-automation\post-process.ps1" -InputVideo $VideoPath
    } else {
        Write-Host "`n  Abgebrochen.`n" -ForegroundColor DarkGray
    }
}
