# Night-Burst Army Starter Script
# Startet alle 10 Agents in separaten Terminals

Write-Host "🚀 Starting Night-Burst Army..." -ForegroundColor Cyan
Write-Host ""

# Check if Windows Terminal is available
$wtPath = Get-Command wt -ErrorAction SilentlyContinue

if (-not $wtPath) {
    Write-Host "❌ Windows Terminal nicht gefunden. Bitte installieren oder manuell starten." -ForegroundColor Red
    exit 1
}

# Base path
$projectPath = "C:\Users\Berend Mainz\Documents\Start-up\reviewresponder-3"

# Function to start an agent in a new tab
function Start-Agent {
    param (
        [string]$AgentNum,
        [string]$AgentName,
        [string]$ChromeFlag = ""
    )

    $sessionName = "BURST$AgentNum"
    $command = "/night-burst-$AgentNum"

    Write-Host "  Starting Burst-$AgentNum ($AgentName)..." -ForegroundColor Yellow

    # PowerShell command to run in new tab
    $psCommand = @"
`$env:CLAUDE_SESSION = '$sessionName'
cd '$projectPath'
Write-Host '🔥 Night-Burst-$AgentNum: $AgentName' -ForegroundColor Magenta
Write-Host 'Session: $sessionName' -ForegroundColor Gray
Write-Host ''
claude $ChromeFlag
"@

    # Encode for Windows Terminal
    $bytes = [System.Text.Encoding]::Unicode.GetBytes($psCommand)
    $encoded = [Convert]::ToBase64String($bytes)

    return "new-tab --title `"Burst-$AgentNum`" powershell -EncodedCommand $encoded"
}

# Build Windows Terminal command with all tabs
$wtCommand = "wt"

# Agent configurations: Number, Name, Chrome needed?
$agents = @(
    @("1", "Lead Finder", "--chrome"),
    @("2", "Cold Emailer", ""),
    @("3", "Social DM", "--chrome"),
    @("4", "Demo Generator", ""),
    @("5", "Hot Lead Chaser", ""),
    @("6", "User Activator", ""),
    @("7", "Payment Converter", ""),
    @("8", "Upgrader", ""),
    @("9", "Doctor", ""),
    @("10", "Morning Briefer", "")
)

Write-Host "📋 Agent Overview:" -ForegroundColor Cyan
Write-Host ""

foreach ($agent in $agents) {
    $num = $agent[0]
    $name = $agent[1]
    $chrome = if ($agent[2]) { "🌐" } else { "  " }
    Write-Host "  $chrome Burst-$num : $name"
}

Write-Host ""
Write-Host "⚠️  WICHTIG:" -ForegroundColor Yellow
Write-Host "  - Agents mit 🌐 brauchen Chrome MCP (claude --chrome)"
Write-Host "  - Nach Start: In jedem Tab '/night-burst-X' eingeben"
Write-Host "  - Monitoring: content/claude-progress/for-berend.md"
Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Starte alle 10 Agents? (y/n)"

if ($confirm -ne "y") {
    Write-Host "Abgebrochen." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Starte Windows Terminal mit 10 Tabs..." -ForegroundColor Green

# Build the full command
$firstAgent = $agents[0]
$firstTab = Start-Agent $firstAgent[0] $firstAgent[1] $firstAgent[2]

# Start with first tab
$fullCommand = "wt $firstTab"

# Add remaining tabs
for ($i = 1; $i -lt $agents.Count; $i++) {
    $agent = $agents[$i]
    $tab = Start-Agent $agent[0] $agent[1] $agent[2]
    $fullCommand += " ; $tab"
}

# Execute
Invoke-Expression $fullCommand

Write-Host ""
Write-Host "✅ Alle Terminals gestartet!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Nächste Schritte:" -ForegroundColor Cyan
Write-Host "  1. In jedem Tab: /night-burst-X eingeben (X = 1-10)"
Write-Host "  2. Agents arbeiten autonom die ganze Nacht"
Write-Host "  3. Morgens: content/claude-progress/for-berend.md lesen"
Write-Host ""
Write-Host "💡 Tipp: Nutze 'tmux' in WSL für stabilere Sessions" -ForegroundColor Gray
