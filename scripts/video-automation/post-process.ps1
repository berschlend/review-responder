# ReviewResponder Demo Video - Post-Production
# =============================================
# Creates: YouTube (16:9) + TikTok (9:16) + Thumbnail
# WITH BURNED-IN CAPTIONS for silent viewing!

param(
    [Parameter(Mandatory=$true)]
    [string]$InputVideo,
    [string]$OutputName = "demo",
    [switch]$NoVertical,
    [switch]$NoCaptions,
    [switch]$Preview
)

$ErrorActionPreference = "SilentlyContinue"

$ProjectRoot = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
$OutputDir = "$ProjectRoot\content\video-recordings"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$ffmpeg = "C:\Users\Berend Mainz\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin\ffmpeg.exe"

Clear-Host
Write-Host "`n  POST-PRODUCTION`n" -ForegroundColor Cyan

if (-not (Test-Path $InputVideo)) {
    Write-Host "  [ERROR] Video nicht gefunden" -ForegroundColor Red
    exit 1
}

Write-Host "  Input: $($InputVideo | Split-Path -Leaf)" -ForegroundColor DarkGray

# Output paths
$OutYT = "$OutputDir\$OutputName-youtube-$Timestamp.mp4"
$OutTT = "$OutputDir\$OutputName-tiktok-$Timestamp.mp4"
$OutThumb = "$OutputDir\$OutputName-thumbnail-$Timestamp.jpg"

# ===========================================
# CAPTION DEFINITIONS (Timed for 15-sec video)
# ===========================================
# Format: "TEXT|START|END"
# Timestamps based on speaking script

$Captions = @(
    "This review just dropped...|0|3",
    "It's DESTROYING your rating.|3|6",
    "But watch this...|6|8",
    "One click.|10|12",
    "Professional response.|12|14"
)

# Build FFmpeg filter for captions (YouTube 16:9)
function Get-CaptionFilter {
    param([int]$FontSize = 56, [int]$YPos = 120)

    $filters = @()
    foreach ($cap in $Captions) {
        $parts = $cap -split '\|'
        $text = $parts[0] -replace "'", "" -replace '"', ''
        $start = $parts[1]
        $end = $parts[2]

        # White text with black border, centered, above URL
        $filter = "drawtext=text='$text':fontsize=$FontSize`:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-$YPos`:enable='between(t,$start,$end)'"
        $filters += $filter
    }

    # Add permanent URL branding at bottom
    $filters += "drawtext=text='tryreviewresponder.com':fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-50"

    return ($filters -join ',')
}

# Build FFmpeg filter for TikTok (9:16 vertical)
function Get-TikTokCaptionFilter {
    $filters = @()

    # First crop and scale
    $filters += "crop=ih*9/16:ih"
    $filters += "scale=1080:1920"

    foreach ($cap in $Captions) {
        $parts = $cap -split '\|'
        $text = $parts[0] -replace "'", "" -replace '"', ''
        $start = $parts[1]
        $end = $parts[2]

        # Larger text for vertical, positioned in lower third
        $filter = "drawtext=text='$text':fontsize=72:fontcolor=white:borderw=5:bordercolor=black:x=(w-text_w)/2:y=h-450:enable='between(t,$start,$end)'"
        $filters += $filter
    }

    # URL branding
    $filters += "drawtext=text='tryreviewresponder.com':fontsize=64:fontcolor=yellow:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-300"

    return ($filters -join ',')
}

# ===========================================
# 1. YOUTUBE (16:9) with Captions
# ===========================================
Write-Host "`n  [1/4] YouTube Version (with captions)..." -ForegroundColor Yellow

if (-not $Preview) {
    if ($NoCaptions) {
        $vf = "drawtext=text='tryreviewresponder.com':fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-80"
    } else {
        $vf = Get-CaptionFilter -FontSize 56 -YPos 120
    }

    $cmd = @"
"$ffmpeg" -i "$InputVideo" -vf "$vf" -c:v libx264 -preset fast -crf 23 -c:a aac -y "$OutYT"
"@
    cmd /c $cmd 2>$null

    if (Test-Path $OutYT) {
        Write-Host "    [OK] $($OutYT | Split-Path -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "    [FAIL]" -ForegroundColor Red
    }
}

# ===========================================
# 2. TIKTOK (9:16 vertical) with Captions
# ===========================================
if (-not $NoVertical) {
    Write-Host "  [2/4] TikTok Version (with captions)..." -ForegroundColor Yellow

    if (-not $Preview) {
        if ($NoCaptions) {
            $vf = "crop=ih*9/16:ih,scale=1080:1920,drawtext=text='tryreviewresponder.com':fontsize=64:fontcolor=yellow:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-300"
        } else {
            $vf = Get-TikTokCaptionFilter
        }

        $cmd = @"
"$ffmpeg" -i "$InputVideo" -vf "$vf" -c:v libx264 -preset fast -crf 23 -c:a aac -y "$OutTT"
"@
        cmd /c $cmd 2>$null

        if (Test-Path $OutTT) {
            Write-Host "    [OK] $($OutTT | Split-Path -Leaf)" -ForegroundColor Green
        } else {
            Write-Host "    [FAIL]" -ForegroundColor Red
        }
    }
}

# ===========================================
# 3. THUMBNAIL (with hook text)
# ===========================================
Write-Host "  [3/4] Thumbnail..." -ForegroundColor Yellow

if (-not $Preview) {
    # Thumbnail at 10 seconds (when AI response is visible)
    $thumbFilter = "drawtext=text='AI writes your response':fontsize=72:fontcolor=yellow:borderw=4:bordercolor=black:x=(w-text_w)/2:y=50,drawtext=text='in ONE CLICK':fontsize=64:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=130"

    $cmd = @"
"$ffmpeg" -i "$InputVideo" -ss 10 -vframes 1 -vf "$thumbFilter" -y "$OutThumb"
"@
    cmd /c $cmd 2>$null

    if (Test-Path $OutThumb) {
        Write-Host "    [OK] $($OutThumb | Split-Path -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "    [FAIL]" -ForegroundColor Red
    }
}

# ===========================================
# 4. SUMMARY
# ===========================================
Write-Host "`n  [4/4] Complete!" -ForegroundColor Green

$captionStatus = if ($NoCaptions) { "OFF" } else { "ON (5 timed captions)" }

Write-Host @"

  ----------------------------------------------------------------
  OUTPUTS:

  YouTube:   $($OutYT | Split-Path -Leaf)
  TikTok:    $($OutTT | Split-Path -Leaf)
  Thumbnail: $($OutThumb | Split-Path -Leaf)

  Captions:  $captionStatus
  ----------------------------------------------------------------

"@ -ForegroundColor Cyan

# Open folder
if (-not $Preview) {
    Start-Process explorer.exe -ArgumentList $OutputDir
}

Write-Host "  Ready to upload!`n" -ForegroundColor Green
