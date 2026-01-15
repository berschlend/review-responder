# Omnichannel Parallel Outreach - 3 Claude Sessions
# Run this script to open 3 terminals for parallel social media outreach

Write-Host "🚀 Starting Omnichannel Parallel Outreach..." -ForegroundColor Green
Write-Host ""

# Check if Windows Terminal is available
$useWindowsTerminal = Get-Command wt -ErrorAction SilentlyContinue

if ($useWindowsTerminal) {
    Write-Host "Using Windows Terminal for better experience..." -ForegroundColor Cyan

    # Open 3 tabs in Windows Terminal
    wt -w 0 new-tab --title "Twitter DMs" -d $PWD powershell -NoExit -Command {
        $env:CLAUDE_SESSION = "Twitter"
        Write-Host "🐦 TWITTER SESSION" -ForegroundColor Blue
        Write-Host "Run: claude --chrome" -ForegroundColor Yellow
        Write-Host "Then: /omnichannel-blast --channel=twitter" -ForegroundColor Yellow
    }

    Start-Sleep -Milliseconds 500

    wt -w 0 new-tab --title "Facebook DMs" -d $PWD powershell -NoExit -Command {
        $env:CLAUDE_SESSION = "Facebook"
        Write-Host "📘 FACEBOOK SESSION" -ForegroundColor Blue
        Write-Host "Run: claude --chrome" -ForegroundColor Yellow
        Write-Host "Then: /omnichannel-blast --channel=facebook" -ForegroundColor Yellow
    }

    Start-Sleep -Milliseconds 500

    wt -w 0 new-tab --title "Instagram DMs" -d $PWD powershell -NoExit -Command {
        $env:CLAUDE_SESSION = "Instagram"
        Write-Host "📸 INSTAGRAM SESSION" -ForegroundColor Blue
        Write-Host "Run: claude --chrome" -ForegroundColor Yellow
        Write-Host "Then: /omnichannel-blast --channel=instagram" -ForegroundColor Yellow
    }
} else {
    Write-Host "Opening 3 PowerShell windows..." -ForegroundColor Cyan

    # Fallback: Open 3 separate PowerShell windows
    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        `$env:CLAUDE_SESSION = 'Twitter'
        Write-Host '🐦 TWITTER SESSION' -ForegroundColor Blue
        Write-Host 'Run: claude --chrome' -ForegroundColor Yellow
        Write-Host 'Then: /omnichannel-blast --channel=twitter' -ForegroundColor Yellow
        Set-Location '$PWD'
"@

    Start-Sleep -Milliseconds 500

    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        `$env:CLAUDE_SESSION = 'Facebook'
        Write-Host '📘 FACEBOOK SESSION' -ForegroundColor Blue
        Write-Host 'Run: claude --chrome' -ForegroundColor Yellow
        Write-Host 'Then: /omnichannel-blast --channel=facebook' -ForegroundColor Yellow
        Set-Location '$PWD'
"@

    Start-Sleep -Milliseconds 500

    Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
        `$env:CLAUDE_SESSION = 'Instagram'
        Write-Host '📸 INSTAGRAM SESSION' -ForegroundColor Blue
        Write-Host 'Run: claude --chrome' -ForegroundColor Yellow
        Write-Host 'Then: /omnichannel-blast --channel=instagram' -ForegroundColor Yellow
        Set-Location '$PWD'
"@
}

Write-Host ""
Write-Host "✅ 3 Sessions gestartet!" -ForegroundColor Green
Write-Host ""
Write-Host "In JEDEM Terminal:" -ForegroundColor Yellow
Write-Host "  1. claude --chrome" -ForegroundColor White
Write-Host "  2. /omnichannel-blast --channel=<channel>" -ForegroundColor White
Write-Host ""
Write-Host "Rate Limits beachten:" -ForegroundColor Red
Write-Host "  Twitter: Max 30/Tag" -ForegroundColor White
Write-Host "  Facebook: Max 20/Tag" -ForegroundColor White
Write-Host "  Instagram: Max 20/Tag" -ForegroundColor White
