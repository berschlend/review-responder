# Generate ALL Hook Variants
# ===========================
# Creates 5 different video versions from ONE recording!
# Each with different opening hook for A/B testing.

param(
    [Parameter(Mandatory=$true)]
    [string]$InputVideo,
    [string]$OutputName = "demo"
)

$ProjectRoot = "C:\Users\Berend Mainz\Documents\Start-up\ReviewResponder"
$PostProcess = "$ProjectRoot\scripts\video-automation\post-process.ps1"

$HookStyles = @("problem", "question", "stats", "pov", "challenge")

Clear-Host
Write-Host @"

  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║   GENERATE ALL HOOK VARIANTS                                  ║
  ║                                                               ║
  ║   Creates 5 different videos from ONE recording!              ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "  Input: $($InputVideo | Split-Path -Leaf)" -ForegroundColor DarkGray
Write-Host ""

$HookDescriptions = @{
    "problem" = "This review just dropped..."
    "question" = "How do you respond to THIS?"
    "stats" = "94% read reviews before buying"
    "pov" = "POV: You just got a 1-star"
    "challenge" = "Bet you cant respond right"
}

$count = 0
foreach ($hook in $HookStyles) {
    $count++
    Write-Host "  [$count/5] Generating $hook hook..." -ForegroundColor Yellow
    Write-Host "        Hook: `"$($HookDescriptions[$hook])`"" -ForegroundColor DarkGray

    # Run post-process for this hook (only YouTube version to save time)
    & $PostProcess -InputVideo $InputVideo -OutputName $OutputName -HookStyle $hook -NoVertical 2>$null | Out-Null

    Write-Host "        [OK]" -ForegroundColor Green
}

Write-Host @"

  ════════════════════════════════════════════════════════════════
  DONE! 5 Hook Variants Created:
  ════════════════════════════════════════════════════════════════

  1. PROBLEM:   "This review just dropped..."
  2. QUESTION:  "How do you respond to THIS?"
  3. STATS:     "94% read reviews before buying"
  4. POV:       "POV: You just got a 1-star"
  5. CHALLENGE: "Bet you cant respond right"

  ════════════════════════════════════════════════════════════════

  Upload different hooks to test which performs best!
  Track: Views, Watch Time, Comments, Clicks

"@ -ForegroundColor Cyan

# Open output folder
Start-Process explorer.exe -ArgumentList "$ProjectRoot\content\video-recordings"
