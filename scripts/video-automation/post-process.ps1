# ReviewResponder Demo Video - Post-Production
# =============================================
# Creates: YouTube (16:9) + TikTok (9:16) + Thumbnail
# WITH BURNED-IN CAPTIONS for silent viewing!

param(
    [Parameter(Mandatory=$true)]
    [string]$InputVideo,
    [string]$OutputName = "demo",
    [ValidateSet("problem", "question", "stats", "pov", "challenge")]
    [string]$HookStyle = "problem",
    [switch]$NoVertical,
    [switch]$NoCaptions,
    [switch]$Preview,
    [switch]$AllHooks  # Generate ALL hook variants at once!
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

# Output paths (include hook style in filename)
$OutYT = "$OutputDir\$OutputName-$HookStyle-youtube-$Timestamp.mp4"
$OutTT = "$OutputDir\$OutputName-$HookStyle-tiktok-$Timestamp.mp4"
$OutThumb = "$OutputDir\$OutputName-$HookStyle-thumbnail-$Timestamp.jpg"

# ===========================================
# HOOK VARIANTS (Different opening styles)
# ===========================================
# Each hook style has different first 2 captions (0-6 sec)
# The rest stays the same (6-15 sec)

$HookVariants = @{
    "problem" = @(
        "This review just dropped...|0|3",
        "Its DESTROYING your rating.|3|6"
    )
    "question" = @(
        "How do you respond to THIS?|0|3",
        "Most owners have no idea...|3|6"
    )
    "stats" = @(
        "94% read reviews before buying|0|3",
        "One bad review costs you $30K|3|6"
    )
    "pov" = @(
        "POV: You just got a 1-star|0|3",
        "Your stomach drops...|3|6"
    )
    "challenge" = @(
        "Bet you cant respond right|0|3",
        "Without sounding defensive|3|6"
    )
}

# Build full caption array based on hook style
$HookCaptions = $HookVariants[$HookStyle]
$CommonCaptions = @(
    "But watch this...|6|8",
    "One click.|10|12",
    "Professional response.|12|14"
)
$Captions = $HookCaptions + $CommonCaptions

Write-Host "  Hook Style: $HookStyle" -ForegroundColor DarkGray

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
# 4. CAPTION TEXT FILES (for easy copy-paste)
# ===========================================
Write-Host "  [4/5] Caption Files..." -ForegroundColor Yellow

if (-not $Preview) {
    # TikTok Caption
    $TikTokCaption = @"
Negative review? One click. Done.

Comment "REVIEW" for the link!

#restaurantowner #businesstips #ai #googlereviews #smallbusiness
"@

    # Instagram Caption
    $InstagramCaption = @"
Stop stressing over negative reviews.

AI writes professional responses in seconds.

Link in bio - tryreviewresponder.com

#restaurantowner #smallbusiness #ai #businesstips #googlereviews #restaurantmarketing #entrepreneurlife
"@

    # YouTube Shorts Caption
    $YouTubeCaption = @"
How to respond to negative Google reviews in 10 seconds using AI.

Try it free: tryreviewresponder.com

#shorts #googlereviews #ai #smallbusiness #restaurantowner
"@

    # LinkedIn Caption
    $LinkedInCaption = @"
Restaurant owners: You don't have time to craft the perfect response to every review.

I built a tool that does it in one click.

AI analyzes the review, matches your brand tone, and writes a professional response.

Try it: tryreviewresponder.com?utm_source=linkedin

#SmallBusiness #AI #CustomerService #RestaurantIndustry
"@

    # Write caption files
    $CaptionDir = "$OutputDir\captions-$Timestamp"
    New-Item -ItemType Directory -Path $CaptionDir -Force | Out-Null

    $TikTokCaption | Out-File -FilePath "$CaptionDir\tiktok.txt" -Encoding UTF8
    $InstagramCaption | Out-File -FilePath "$CaptionDir\instagram.txt" -Encoding UTF8
    $YouTubeCaption | Out-File -FilePath "$CaptionDir\youtube.txt" -Encoding UTF8
    $LinkedInCaption | Out-File -FilePath "$CaptionDir\linkedin.txt" -Encoding UTF8

    # Also create a combined file for quick reference
    $AllCaptions = @"
═══════════════════════════════════════════════════════════════
REVIEWRESPONDER - COPY-PASTE CAPTIONS
Generated: $Timestamp
═══════════════════════════════════════════════════════════════

▶ TIKTOK
─────────────────────────────────────────────────────────────────
$TikTokCaption

▶ INSTAGRAM
─────────────────────────────────────────────────────────────────
$InstagramCaption

▶ YOUTUBE SHORTS
─────────────────────────────────────────────────────────────────
$YouTubeCaption

▶ LINKEDIN
─────────────────────────────────────────────────────────────────
$LinkedInCaption

═══════════════════════════════════════════════════════════════
UTM TRACKING LINKS
═══════════════════════════════════════════════════════════════
TikTok:    tryreviewresponder.com?utm_source=tiktok
Instagram: tryreviewresponder.com?utm_source=instagram
YouTube:   tryreviewresponder.com?utm_source=youtube
LinkedIn:  tryreviewresponder.com?utm_source=linkedin
═══════════════════════════════════════════════════════════════
"@

    $AllCaptions | Out-File -FilePath "$CaptionDir\ALL-CAPTIONS.txt" -Encoding UTF8
    Write-Host "    [OK] captions-$Timestamp\" -ForegroundColor Green
}

# ===========================================
# 5. SUMMARY
# ===========================================
Write-Host "`n  [5/5] Complete!" -ForegroundColor Green

$captionStatus = if ($NoCaptions) { "OFF" } else { "ON (5 timed captions)" }

Write-Host @"

  ────────────────────────────────────────────────────────────
  OUTPUTS:

  YouTube:   $($OutYT | Split-Path -Leaf)
  TikTok:    $($OutTT | Split-Path -Leaf)
  Thumbnail: $($OutThumb | Split-Path -Leaf)
  Captions:  captions-$Timestamp\

  Video Captions: $captionStatus
  ────────────────────────────────────────────────────────────

  TIP: Open captions-$Timestamp\ALL-CAPTIONS.txt for copy-paste!

"@ -ForegroundColor Cyan

# Open folder
if (-not $Preview) {
    Start-Process explorer.exe -ArgumentList $OutputDir
}

Write-Host "  Ready to upload!`n" -ForegroundColor Green
