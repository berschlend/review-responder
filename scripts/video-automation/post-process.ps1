# ReviewResponder Demo Video - COMPLETE Post-Production
# =====================================================
# Creates: 16:9 (YouTube) + 9:16 (TikTok/Reels) + Captions
#
# Usage: .\post-process.ps1 -InputVideo "path\to\raw.mp4"

param(
    [Parameter(Mandatory=$true)]
    [string]$InputVideo,

    [string]$OutputName = "demo",
    [switch]$NoOverlays,
    [switch]$NoVertical,
    [switch]$Preview
)

$ProjectRoot = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
$OutputDir = Join-Path $ProjectRoot "content\video-recordings"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"

# FFmpeg path
$ffmpeg = "C:\Users\Berend Mainz\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin\ffmpeg.exe"

Clear-Host
Write-Host "`n  POST-PRODUCTION`n" -ForegroundColor Cyan

# Verify input
if (-not (Test-Path $InputVideo)) {
    Write-Host "  [ERROR] Video nicht gefunden: $InputVideo" -ForegroundColor Red
    exit 1
}

Write-Host "  Input: $($InputVideo | Split-Path -Leaf)" -ForegroundColor DarkGray

# ===========================================
# TEXT OVERLAYS (Captions for silent viewing)
# ===========================================
# These appear BURNED INTO the video so they work even on mute

$Overlays = @(
    # Hook - erste 3 Sekunden entscheiden
    @{ Start = 0;  End = 3;  Text = "This review just dropped..."; Position = "top" },

    # Problem - emotionaler Impact
    @{ Start = 3;  End = 6;  Text = "It's DESTROYING your rating"; Position = "top" },

    # Transition
    @{ Start = 6;  End = 8;  Text = "But watch this..."; Position = "top" },

    # Solution
    @{ Start = 10; End = 13; Text = "One click. Professional response."; Position = "top" },

    # CTA
    @{ Start = 14; End = 17; Text = "tryreviewresponder.com"; Position = "bottom" }
)

# ===========================================
# BUILD FILTER: 16:9 (YouTube/Landscape)
# ===========================================
Write-Host "`n  [1/4] 16:9 Version (YouTube)..." -ForegroundColor Yellow

$DrawTextFilters = @()
foreach ($overlay in $Overlays) {
    $text = $overlay.Text -replace "'", "\\'" -replace ":", "\\:"
    $start = $overlay.Start
    $end = $overlay.End

    # Position: top or bottom
    $yPos = if ($overlay.Position -eq "top") { "50" } else { "h-80" }

    # White text, black outline, readable on any background
    $filter = "drawtext=text='$text':fontfile='C\\:/Windows/Fonts/arial.ttf':fontsize=42:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=$yPos`:enable='between(t,$start,$end)'"
    $DrawTextFilters += $filter
}

$FilterLandscape = $DrawTextFilters -join ","
$OutputLandscape = Join-Path $OutputDir "$OutputName-youtube-$Timestamp.mp4"

$cmdLandscape = @(
    "-i", "`"$InputVideo`"",
    "-vf", "`"$FilterLandscape`"",
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    "-y", "`"$OutputLandscape`""
) -join " "

if (-not $Preview) {
    Invoke-Expression "$ffmpeg $cmdLandscape" 2>&1 | Out-Null
    if (Test-Path $OutputLandscape) {
        Write-Host "    [OK] $($OutputLandscape | Split-Path -Leaf)" -ForegroundColor Green
    }
}

# ===========================================
# BUILD FILTER: 9:16 (TikTok/Reels/Shorts)
# ===========================================
if (-not $NoVertical) {
    Write-Host "  [2/4] 9:16 Version (TikTok/Reels)..." -ForegroundColor Yellow

    # For vertical: crop center, scale to 1080x1920, larger text
    $DrawTextFiltersVertical = @()
    foreach ($overlay in $Overlays) {
        $text = $overlay.Text -replace "'", "\\'" -replace ":", "\\:"
        $start = $overlay.Start
        $end = $overlay.End

        # Larger text for mobile, centered
        $yPos = if ($overlay.Position -eq "top") { "200" } else { "h-250" }

        $filter = "drawtext=text='$text':fontfile='C\\:/Windows/Fonts/arial.ttf':fontsize=56:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=$yPos`:enable='between(t,$start,$end)'"
        $DrawTextFiltersVertical += $filter
    }

    $FilterVertical = $DrawTextFiltersVertical -join ","
    $OutputVertical = Join-Path $OutputDir "$OutputName-tiktok-$Timestamp.mp4"

    # Crop to 9:16 from center, then add text
    # crop=ih*9/16:ih crops to vertical aspect ratio
    $cmdVertical = @(
        "-i", "`"$InputVideo`"",
        "-vf", "`"crop=ih*9/16:ih,scale=1080:1920,$FilterVertical`"",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        "-y", "`"$OutputVertical`""
    ) -join " "

    if (-not $Preview) {
        Invoke-Expression "$ffmpeg $cmdVertical" 2>&1 | Out-Null
        if (Test-Path $OutputVertical) {
            Write-Host "    [OK] $($OutputVertical | Split-Path -Leaf)" -ForegroundColor Green
        }
    }
}

# ===========================================
# THUMBNAIL (for YouTube)
# ===========================================
Write-Host "  [3/4] Thumbnail..." -ForegroundColor Yellow

$OutputThumb = Join-Path $OutputDir "$OutputName-thumbnail-$Timestamp.jpg"

# Extract frame at 10 seconds (when response is shown), add text overlay
$thumbCmd = @(
    "-i", "`"$InputVideo`"",
    "-ss", "10",
    "-vframes", "1",
    "-vf", "`"drawtext=text='AI Review Response':fontfile='C\\:/Windows/Fonts/arial.ttf':fontsize=72:fontcolor=yellow:borderw=4:bordercolor=black:x=(w-text_w)/2:y=50`"",
    "-y", "`"$OutputThumb`""
) -join " "

if (-not $Preview) {
    Invoke-Expression "$ffmpeg $thumbCmd" 2>&1 | Out-Null
    if (Test-Path $OutputThumb) {
        Write-Host "    [OK] $($OutputThumb | Split-Path -Leaf)" -ForegroundColor Green
    }
}

# ===========================================
# SUMMARY
# ===========================================
Write-Host "`n  [4/4] Complete!" -ForegroundColor Green

Write-Host @"

  ════════════════════════════════════════════════════

  OUTPUTS:

  YouTube (16:9):  $($OutputLandscape | Split-Path -Leaf)
  TikTok (9:16):   $($OutputVertical | Split-Path -Leaf)
  Thumbnail:       $($OutputThumb | Split-Path -Leaf)

  ════════════════════════════════════════════════════

  NEXT STEPS:

  1. TikTok:    Upload $OutputName-tiktok-*.mp4
                Hashtags: #restaurantowner #businesstips #ai

  2. Instagram: Upload same file as Reel
                Same hashtags + #smallbusiness

  3. YouTube:   Upload $OutputName-youtube-*.mp4
                Use thumbnail, add description

  ════════════════════════════════════════════════════

"@ -ForegroundColor Cyan

# Open output folder
if (-not $Preview) {
    Start-Process "explorer.exe" -ArgumentList $OutputDir
}

Write-Host "  Ordner geoeffnet. Ready to upload!`n" -ForegroundColor Green
