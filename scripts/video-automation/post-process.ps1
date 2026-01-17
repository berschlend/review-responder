# ReviewResponder Demo Video - Post-Production
# =============================================
# Creates: YouTube (16:9) + TikTok (9:16) + Thumbnail

param(
    [Parameter(Mandatory=$true)]
    [string]$InputVideo,
    [string]$OutputName = "demo",
    [switch]$NoVertical,
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
# 1. YOUTUBE (16:9) - Simple version first
# ===========================================
Write-Host "`n  [1/4] YouTube Version..." -ForegroundColor Yellow

if (-not $Preview) {
    # Simple drawtext without complex escaping
    $cmd = @"
"$ffmpeg" -i "$InputVideo" -vf "drawtext=text='tryreviewresponder.com':fontsize=48:fontcolor=yellow:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-80" -c:v libx264 -preset fast -crf 23 -c:a aac -y "$OutYT"
"@
    cmd /c $cmd 2>$null

    if (Test-Path $OutYT) {
        Write-Host "    [OK] $($OutYT | Split-Path -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "    [FAIL]" -ForegroundColor Red
    }
}

# ===========================================
# 2. TIKTOK (9:16 vertical)
# ===========================================
if (-not $NoVertical) {
    Write-Host "  [2/4] TikTok Version..." -ForegroundColor Yellow

    if (-not $Preview) {
        $cmd = @"
"$ffmpeg" -i "$InputVideo" -vf "crop=ih*9/16:ih,scale=1080:1920,drawtext=text='tryreviewresponder.com':fontsize=64:fontcolor=yellow:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h-300" -c:v libx264 -preset fast -crf 23 -c:a aac -y "$OutTT"
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
# 3. THUMBNAIL
# ===========================================
Write-Host "  [3/4] Thumbnail..." -ForegroundColor Yellow

if (-not $Preview) {
    $cmd = @"
"$ffmpeg" -i "$InputVideo" -ss 10 -vframes 1 -vf "drawtext=text='AI Review Response':fontsize=72:fontcolor=yellow:borderw=4:bordercolor=black:x=(w-text_w)/2:y=50" -y "$OutThumb"
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

Write-Host @"

  ----------------------------------------------------------------
  OUTPUTS:

  YouTube:   $($OutYT | Split-Path -Leaf)
  TikTok:    $($OutTT | Split-Path -Leaf)
  Thumbnail: $($OutThumb | Split-Path -Leaf)
  ----------------------------------------------------------------

"@ -ForegroundColor Cyan

# Open folder
if (-not $Preview) {
    Start-Process explorer.exe -ArgumentList $OutputDir
}

Write-Host "  Ready to upload!`n" -ForegroundColor Green
