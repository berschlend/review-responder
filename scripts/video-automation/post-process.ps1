# ReviewResponder Demo Video - Post-Production Automation
# Usage: .\scripts\video-automation\post-process.ps1 -InputVideo "path\to\raw.mp4"

param(
    [Parameter(Mandatory=$true)]
    [string]$InputVideo,

    [string]$OutputName = "demo-final",
    [switch]$NoMusic,
    [switch]$NoOverlays,
    [switch]$Preview
)

$ProjectRoot = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
$OutputDir = Join-Path $ProjectRoot "content\video-recordings"
$AssetsDir = Join-Path $ProjectRoot "content\video-assets"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# FFmpeg path
$ffmpeg = "C:\Users\Berend Mainz\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin\ffmpeg.exe"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Post-Production Automation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verify input file exists
if (-not (Test-Path $InputVideo)) {
    Write-Host "[ERROR] Input video not found: $InputVideo" -ForegroundColor Red
    exit 1
}

Write-Host "[1/5] Input: $InputVideo" -ForegroundColor Yellow

# Text overlays configuration (timestamp in seconds -> text)
$Overlays = @(
    @{ Start = 0;  End = 3;  Text = "Right now..." },
    @{ Start = 3;  End = 6;  Text = "This review is DESTROYING your business" },
    @{ Start = 10; End = 13; Text = "One click. Done." },
    @{ Start = 14; End = 16; Text = "tryreviewresponder.com" }
)

# Step 1: Get video info
Write-Host "`n[2/5] Analyzing video..." -ForegroundColor Yellow
$VideoInfo = & $ffmpeg -i $InputVideo 2>&1 | Select-String "Duration"
Write-Host "  $VideoInfo" -ForegroundColor Cyan

# Step 2: Create filter for text overlays
$FilterComplex = ""
if (-not $NoOverlays) {
    Write-Host "`n[3/5] Building text overlays..." -ForegroundColor Yellow

    $DrawTextFilters = @()
    foreach ($overlay in $Overlays) {
        $text = $overlay.Text -replace "'", "\\'"
        $start = $overlay.Start
        $end = $overlay.End

        # White text with shadow, centered at bottom
        $filter = "drawtext=text='$text':fontfile='C\\:/Windows/Fonts/arial.ttf':fontsize=48:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-100:enable='between(t,$start,$end)'"
        $DrawTextFilters += $filter
        Write-Host "  [$start-$end s] $text" -ForegroundColor DarkGray
    }

    $FilterComplex = $DrawTextFilters -join ","
}

# Step 3: Build ffmpeg command
Write-Host "`n[4/5] Processing video..." -ForegroundColor Yellow

$TempOutput = Join-Path $OutputDir "temp-processed.mp4"
$FinalOutput = Join-Path $OutputDir "$OutputName-$Timestamp.mp4"

$ffmpegArgs = @(
    "-i", "`"$InputVideo`"",
    "-y"  # Overwrite
)

if ($FilterComplex) {
    $ffmpegArgs += @("-vf", "`"$FilterComplex`"")
}

# Video encoding settings (high quality, web-optimized)
$ffmpegArgs += @(
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",  # Web optimization
    "`"$TempOutput`""
)

$ffmpegCommand = "$ffmpeg " + ($ffmpegArgs -join " ")

if ($Preview) {
    Write-Host "`n[PREVIEW] Would run:" -ForegroundColor Magenta
    Write-Host $ffmpegCommand -ForegroundColor DarkGray
} else {
    # Run ffmpeg
    Write-Host "  Running ffmpeg..." -ForegroundColor Cyan
    Invoke-Expression $ffmpegCommand

    if (Test-Path $TempOutput) {
        Move-Item -Path $TempOutput -Destination $FinalOutput -Force
        Write-Host "  [OK] Video processed" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] FFmpeg failed" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Summary
Write-Host "`n[5/5] Complete!" -ForegroundColor Green
Write-Host @"

  ========================================
  OUTPUT
  ========================================

  Final Video: $FinalOutput

  Text Overlays Added:
  - "Right now..." (0-3s)
  - "This review is DESTROYING..." (3-6s)
  - "One click. Done." (10-13s)
  - "tryreviewresponder.com" (14-16s)

  ========================================

"@ -ForegroundColor Cyan

if (-not $Preview) {
    # Auto-open the video
    Start-Process $FinalOutput
}

Write-Host "`n  FERTIG! Video oeffnet sich...`n" -ForegroundColor Green
Write-Host "  Upload zu: TikTok, Instagram Reels, YouTube Shorts`n" -ForegroundColor Cyan
