# Agent-Communicate.ps1
# Inter-Agent Communication via Shared Directory
#
# Usage:
#   # Send message to all agents
#   .\scripts\Agent-Communicate.ps1 -From 4 -Message "Demo batch completed" -Type info
#
#   # Send message to specific agent
#   .\scripts\Agent-Communicate.ps1 -From 4 -To 5 -Message "Hot lead: xyz@test.com" -Type lead
#
#   # Read messages for an agent
#   .\scripts\Agent-Communicate.ps1 -Read -For 5
#
#   # Register agent as active
#   .\scripts\Agent-Communicate.ps1 -Register -Agent 4 -Task "Generating demos"
#
#   # Mark agent as stopped
#   .\scripts\Agent-Communicate.ps1 -Unregister -Agent 4
#
#   # List active agents
#   .\scripts\Agent-Communicate.ps1 -ListActive

param(
    # Send Message
    [int]$From,
    [int]$To,              # Optional, defaults to "all"
    [string]$Message,
    [ValidateSet("info", "alert", "task", "response", "lead", "error", "success")]
    [string]$Type = "info",

    # Read Messages
    [switch]$Read,
    [int]$For,
    [switch]$Unread,       # Only unread messages

    # Agent Registration
    [switch]$Register,
    [switch]$Unregister,
    [int]$Agent,
    [string]$Task,

    # Discovery
    [switch]$Discovery,
    [hashtable]$Data,

    # List
    [switch]$ListActive,
    [switch]$ListMessages
)

$ErrorActionPreference = "Stop"

$sharedDir = "$env:USERPROFILE\.claude-shared"

if (-not (Test-Path $sharedDir)) {
    Write-Error "Shared directory not found. Run Setup-AgentConfigs.ps1 first."
    exit 1
}

$messagesFile = Join-Path $sharedDir "agent-messages.json"
$activeFile = Join-Path $sharedDir "active-agents.json"
$discoveriesFile = Join-Path $sharedDir "agent-discoveries.json"

# ============================================================
# SEND MESSAGE
# ============================================================
if ($Message -and $From) {
    $messages = Get-Content $messagesFile -Raw | ConvertFrom-Json

    $newMessage = @{
        id = [guid]::NewGuid().ToString()
        from = "burst-$From"
        to = if ($To) { "burst-$To" } else { "all" }
        type = $Type
        message = $Message
        timestamp = (Get-Date).ToString("o")
        read_by = @()
    }

    $messages.messages += $newMessage
    $messages.last_updated = (Get-Date).ToString("o")

    $messages | ConvertTo-Json -Depth 10 | Out-File $messagesFile -Encoding utf8

    $target = if ($To) { "Burst-$To" } else { "ALL" }
    Write-Host "[SENT] Burst-$From -> $target`: $Message" -ForegroundColor Green
    exit 0
}

# ============================================================
# READ MESSAGES
# ============================================================
if ($Read -and $For) {
    $messages = Get-Content $messagesFile -Raw | ConvertFrom-Json

    $myMessages = $messages.messages | Where-Object {
        ($_.to -eq "all" -or $_.to -eq "burst-$For") -and
        (-not $Unread -or $_.read_by -notcontains "burst-$For")
    }

    if ($myMessages.Count -eq 0) {
        Write-Host "[NO MESSAGES] for Burst-$For" -ForegroundColor Gray
    } else {
        Write-Host "[MESSAGES] for Burst-$For ($($myMessages.Count)):" -ForegroundColor Cyan
        foreach ($msg in $myMessages) {
            $color = switch ($msg.type) {
                "alert" { "Yellow" }
                "error" { "Red" }
                "success" { "Green" }
                "lead" { "Magenta" }
                default { "White" }
            }
            Write-Host "  [$($msg.type.ToUpper())] $($msg.from): $($msg.message)" -ForegroundColor $color

            # Mark as read
            if ($msg.read_by -notcontains "burst-$For") {
                $msg.read_by += "burst-$For"
            }
        }

        # Save read status
        $messages | ConvertTo-Json -Depth 10 | Out-File $messagesFile -Encoding utf8
    }
    exit 0
}

# ============================================================
# REGISTER AGENT
# ============================================================
if ($Register -and $Agent) {
    $active = Get-Content $activeFile -Raw | ConvertFrom-Json

    $agentData = [PSCustomObject]@{
        status = "running"
        started_at = (Get-Date).ToString("o")
        last_heartbeat = (Get-Date).ToString("o")
        current_task = if ($Task) { $Task } else { "Started" }
    }

    # Add or update the agent property
    $agentKey = "burst-$Agent"
    if ($active.agents.PSObject.Properties[$agentKey]) {
        $active.agents.$agentKey = $agentData
    } else {
        $active.agents | Add-Member -NotePropertyName $agentKey -NotePropertyValue $agentData
    }
    $active.last_updated = (Get-Date).ToString("o")

    $active | ConvertTo-Json -Depth 10 | Out-File $activeFile -Encoding utf8

    Write-Host "[REGISTERED] Burst-$Agent is now ACTIVE" -ForegroundColor Green
    exit 0
}

# ============================================================
# UNREGISTER AGENT
# ============================================================
if ($Unregister -and $Agent) {
    $active = Get-Content $activeFile -Raw | ConvertFrom-Json

    if ($active.agents."burst-$Agent") {
        $active.agents."burst-$Agent".status = "stopped"
        $active.agents."burst-$Agent".last_heartbeat = (Get-Date).ToString("o")
        $active.last_updated = (Get-Date).ToString("o")

        $active | ConvertTo-Json -Depth 10 | Out-File $activeFile -Encoding utf8
    }

    Write-Host "[UNREGISTERED] Burst-$Agent is now STOPPED" -ForegroundColor Yellow
    exit 0
}

# ============================================================
# LIST ACTIVE AGENTS
# ============================================================
if ($ListActive) {
    $active = Get-Content $activeFile -Raw | ConvertFrom-Json

    Write-Host ""
    Write-Host "[ACTIVE AGENTS]" -ForegroundColor Cyan
    Write-Host "---------------" -ForegroundColor Gray

    $props = $active.agents.PSObject.Properties | Where-Object { $_.Name -ne "Count" -and $_.Name -ne "Length" }

    if (-not $props) {
        Write-Host "  No agents registered" -ForegroundColor Gray
    } else {
        foreach ($prop in $props) {
            $agentInfo = $prop.Value
            $status = $agentInfo.status
            $task = $agentInfo.current_task
            $color = if ($status -eq "running") { "Green" } else { "Gray" }
            $statusIcon = if ($status -eq "running") { "[R]" } else { "[ ]" }
            Write-Host "  $statusIcon $($prop.Name): $task" -ForegroundColor $color
        }
    }
    Write-Host ""
    exit 0
}

# ============================================================
# LIST MESSAGES
# ============================================================
if ($ListMessages) {
    $messages = Get-Content $messagesFile -Raw | ConvertFrom-Json

    Write-Host ""
    Write-Host "[ALL MESSAGES] ($($messages.messages.Count) total)" -ForegroundColor Cyan
    Write-Host "---------------" -ForegroundColor Gray

    foreach ($msg in $messages.messages | Select-Object -Last 10) {
        $color = switch ($msg.type) {
            "alert" { "Yellow" }
            "error" { "Red" }
            "success" { "Green" }
            "lead" { "Magenta" }
            default { "White" }
        }
        $time = ([datetime]$msg.timestamp).ToString("HH:mm")
        Write-Host "  [$time] $($msg.from) -> $($msg.to): $($msg.message)" -ForegroundColor $color
    }
    Write-Host ""
    exit 0
}

# ============================================================
# ADD DISCOVERY
# ============================================================
if ($Discovery -and $From -and $Data) {
    $discoveries = Get-Content $discoveriesFile -Raw | ConvertFrom-Json

    $newDiscovery = @{
        id = [guid]::NewGuid().ToString()
        from = "burst-$From"
        type = $Type
        data = $Data
        timestamp = (Get-Date).ToString("o")
    }

    $discoveries.discoveries += $newDiscovery
    $discoveries.last_updated = (Get-Date).ToString("o")

    $discoveries | ConvertTo-Json -Depth 10 | Out-File $discoveriesFile -Encoding utf8

    Write-Host "[DISCOVERY] Added by Burst-$From" -ForegroundColor Magenta
    exit 0
}

# ============================================================
# HELP
# ============================================================
Write-Host @"

Agent-Communicate.ps1 - Inter-Agent Communication

USAGE:
  # Send message to all
  .\scripts\Agent-Communicate.ps1 -From 4 -Message "Demo done" -Type info

  # Send to specific agent
  .\scripts\Agent-Communicate.ps1 -From 4 -To 5 -Message "Hot lead" -Type lead

  # Read messages
  .\scripts\Agent-Communicate.ps1 -Read -For 5

  # Register as active
  .\scripts\Agent-Communicate.ps1 -Register -Agent 4 -Task "Generating demos"

  # Mark as stopped
  .\scripts\Agent-Communicate.ps1 -Unregister -Agent 4

  # List active agents
  .\scripts\Agent-Communicate.ps1 -ListActive

  # List recent messages
  .\scripts\Agent-Communicate.ps1 -ListMessages

"@ -ForegroundColor Cyan
