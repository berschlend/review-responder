<#
.SYNOPSIS
    Night-Burst Agent Helper Commands
.DESCRIPTION
    PowerShell script providing helper functions for Night-Burst agents.
    Enables inter-agent coordination, heartbeat tracking, and shared state.
.PARAMETER Action
    The action to perform: heartbeat, focus-read, handoff-check, handoff-create,
    memory-read, status-update, learning-add
.PARAMETER Agent
    The agent number (1-15)
.PARAMETER Data
    JSON data for actions that require input
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("heartbeat", "focus-read", "handoff-check", "handoff-create",
                 "memory-read", "status-update", "learning-add")]
    [string]$Action,

    [int]$Agent,

    [string]$Data
)

# Paths
$ProgressDir = Join-Path $PSScriptRoot "..\content\claude-progress"

# Ensure progress directory exists
if (-not (Test-Path $ProgressDir)) {
    New-Item -ItemType Directory -Path $ProgressDir -Force | Out-Null
}

function Get-Timestamp {
    return (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
}

function Write-AgentLog {
    param([string]$Message, [string]$Level = "INFO")
    $ts = Get-Timestamp
    Write-Host "[$ts] [$Level] Burst-$Agent`: $Message"
}

switch ($Action) {
    "heartbeat" {
        # Update agent status file with heartbeat
        $statusFile = Join-Path $ProgressDir "burst-$Agent-status.json"

        if (Test-Path $statusFile) {
            $status = Get-Content $statusFile | ConvertFrom-Json
        } else {
            $status = @{
                agent = "burst-$Agent"
                status = "starting"
                started_at = Get-Timestamp
                current_loop = 0
                metrics = @{
                    actions_taken = 0
                    errors_count = 0
                }
                health = @{
                    stuck_detected = $false
                    last_error = $null
                }
                stuck = $false
                needs_berend = @()
            }
        }

        $status.last_heartbeat = Get-Timestamp
        $status.status = "running"
        if ($status.PSObject.Properties.Name -contains "current_loop") {
            $status.current_loop++
        } else {
            $status | Add-Member -NotePropertyName "current_loop" -NotePropertyValue 1 -Force
        }

        $status | ConvertTo-Json -Depth 10 | Set-Content $statusFile
        Write-AgentLog "Heartbeat registered (loop $($status.current_loop))"
    }

    "focus-read" {
        # Read current focus and priorities
        $focusFile = Join-Path $ProgressDir "current-focus.json"

        if (Test-Path $focusFile) {
            $focus = Get-Content $focusFile -Raw | ConvertFrom-Json

            Write-Host ""
            Write-Host "=== CURRENT FOCUS ===" -ForegroundColor Cyan

            # Check if agent is paused
            if ($focus.paused_agents -contains "burst-$Agent") {
                Write-Host "STATUS: PAUSED" -ForegroundColor Yellow
                Write-Host "Reason: Lead generation paused - focus on activation" -ForegroundColor Yellow
            } else {
                # Get agent priority
                $agentKey = "burst-$Agent"
                if ($focus.agent_priorities.PSObject.Properties.Name -contains $agentKey) {
                    $priority = $focus.agent_priorities.$agentKey
                    $priorityColor = switch ($priority.priority) {
                        1 { "Green" }
                        2 { "Yellow" }
                        3 { "Red" }
                        default { "White" }
                    }
                    Write-Host "PRIORITY: $($priority.priority)" -ForegroundColor $priorityColor
                    Write-Host "REASON: $($priority.reason)" -ForegroundColor White
                }
            }

            # Show first principles insight if available
            if ($focus.first_principles_insight) {
                Write-Host ""
                Write-Host "INSIGHT: $($focus.first_principles_insight.diagnosis)" -ForegroundColor Magenta
                Write-Host "BOTTLENECK: $($focus.first_principles_insight.bottleneck)" -ForegroundColor Magenta
            }

            Write-Host ""
        } else {
            Write-Host "No focus file found - operating with default priorities" -ForegroundColor Yellow
        }
    }

    "handoff-check" {
        # Check for handoffs addressed to this agent
        $handoffFile = Join-Path $ProgressDir "handoff-queue.json"

        if (Test-Path $handoffFile) {
            $handoffs = Get-Content $handoffFile -Raw | ConvertFrom-Json
            $myHandoffs = $handoffs.pending | Where-Object { $_.to -eq "burst-$Agent" }

            if ($myHandoffs.Count -gt 0) {
                Write-Host ""
                Write-Host "=== INCOMING HANDOFFS ===" -ForegroundColor Green
                foreach ($h in $myHandoffs) {
                    Write-Host "From: $($h.from)" -ForegroundColor Cyan
                    Write-Host "Type: $($h.type)"
                    Write-Host "Priority: $($h.priority)"
                    Write-Host "Data: $($h.data | ConvertTo-Json -Compress)"
                    Write-Host "---"
                }
            } else {
                Write-Host "No pending handoffs for Burst-$Agent" -ForegroundColor Gray
            }
        } else {
            # Initialize empty handoff queue
            @{
                pending = @()
                completed = @()
            } | ConvertTo-Json -Depth 10 | Set-Content $handoffFile
            Write-Host "Handoff queue initialized" -ForegroundColor Gray
        }
    }

    "handoff-create" {
        # Create a new handoff for another agent
        if (-not $Data) {
            Write-Host "ERROR: -Data required for handoff-create" -ForegroundColor Red
            exit 1
        }

        $handoffFile = Join-Path $ProgressDir "handoff-queue.json"
        $handoffData = $Data | ConvertFrom-Json

        if (Test-Path $handoffFile) {
            $handoffs = Get-Content $handoffFile -Raw | ConvertFrom-Json
        } else {
            $handoffs = @{
                pending = @()
                completed = @()
            }
        }

        $newHandoff = @{
            id = [guid]::NewGuid().ToString()
            from = $handoffData.from
            to = $handoffData.to
            type = $handoffData.type
            data = $handoffData.data
            priority = $handoffData.priority
            created_at = Get-Timestamp
        }

        $handoffs.pending += $newHandoff
        $handoffs | ConvertTo-Json -Depth 10 | Set-Content $handoffFile

        Write-AgentLog "Handoff created: $($handoffData.type) -> $($handoffData.to)"
    }

    "memory-read" {
        # Read learnings and memory relevant to this agent
        $learningsFile = Join-Path $ProgressDir "learnings.md"
        $memoryFile = Join-Path $ProgressDir "agent-memory.json"

        Write-Host ""
        Write-Host "=== AGENT MEMORY ===" -ForegroundColor Cyan

        # Read agent-specific memory
        if (Test-Path $memoryFile) {
            $memory = Get-Content $memoryFile -Raw | ConvertFrom-Json
            $agentKey = "burst-$Agent"

            if ($memory.PSObject.Properties.Name -contains $agentKey) {
                $agentMemory = $memory.$agentKey
                Write-Host "Last successful action: $($agentMemory.last_successful_action)" -ForegroundColor Green
                if ($agentMemory.learnings_applied) {
                    Write-Host "Applied learnings: $($agentMemory.learnings_applied -join ', ')" -ForegroundColor Yellow
                }
            }
        }

        # Show recent learnings from learnings.md
        if (Test-Path $learningsFile) {
            Write-Host ""
            Write-Host "Learnings file available - read for detailed patterns" -ForegroundColor Gray
        }

        Write-Host ""
    }

    "status-update" {
        # Update agent status with custom data
        if (-not $Data) {
            Write-Host "ERROR: -Data required for status-update" -ForegroundColor Red
            exit 1
        }

        $statusFile = Join-Path $ProgressDir "burst-$Agent-status.json"
        $updateData = $Data | ConvertFrom-Json

        if (Test-Path $statusFile) {
            $status = Get-Content $statusFile | ConvertFrom-Json
        } else {
            $status = @{}
        }

        # Merge update data into status
        foreach ($prop in $updateData.PSObject.Properties) {
            $status | Add-Member -NotePropertyName $prop.Name -NotePropertyValue $prop.Value -Force
        }

        $status.last_updated = Get-Timestamp
        $status | ConvertTo-Json -Depth 10 | Set-Content $statusFile

        Write-AgentLog "Status updated"
    }

    "learning-add" {
        # Add a new learning to learnings.md
        if (-not $Data) {
            Write-Host "ERROR: -Data required for learning-add" -ForegroundColor Red
            exit 1
        }

        $learningsFile = Join-Path $ProgressDir "learnings.md"
        $ts = Get-Date -Format "yyyy-MM-dd HH:mm"

        $learningEntry = "`n## [$ts] Learning from Burst-$Agent`n`n$Data`n`n---`n"

        Add-Content -Path $learningsFile -Value $learningEntry
        Write-AgentLog "Learning added to learnings.md"
    }
}
