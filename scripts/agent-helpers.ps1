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
                 "memory-read", "status-update", "learning-add",
                 "track-outcome", "check-outcomes", "derive-learning")]
    [string]$Action,

    [int]$Agent,

    [string]$Data,

    [string]$ActionType,

    [string]$TargetId,

    [string]$Context
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

    # ============ V4 OUTCOME TRACKING ACTIONS ============

    "track-outcome" {
        # Track an action with context for later outcome analysis
        $outcomeFile = Join-Path $ProgressDir "outcome-tracker.json"

        if (-not $ActionType) {
            Write-Host "ERROR: -ActionType required for track-outcome" -ForegroundColor Red
            exit 1
        }

        if (Test-Path $outcomeFile) {
            $tracker = Get-Content $outcomeFile -Raw | ConvertFrom-Json
        } else {
            $tracker = @{
                version = "1.0"
                actions = @()
                learnings_derived = @()
                stats = @{
                    total_actions = 0
                    actions_with_outcomes = 0
                    conversion_rate = 0
                }
                last_updated = $null
            }
        }

        # Generate unique action ID
        $actionId = "action-" + (Get-Date -Format "yyyyMMddHHmmss") + "-" + $Agent

        # Parse context if provided
        $contextObj = @{}
        if ($Context) {
            try {
                $contextObj = $Context | ConvertFrom-Json
            } catch {
                $contextObj = @{ raw = $Context }
            }
        }

        $newAction = @{
            id = $actionId
            agent = "burst-$Agent"
            type = $ActionType
            target_id = $TargetId
            timestamp = Get-Timestamp
            context = $contextObj
            outcomes = @{
                email_opened = $null
                clicked = $null
                registered = $null
                paid = $null
            }
            final_result = "pending"
        }

        # Convert to array if needed and add
        if ($tracker.actions -is [array]) {
            $tracker.actions += $newAction
        } else {
            $tracker.actions = @($newAction)
        }

        $tracker.stats.total_actions++
        $tracker.last_updated = Get-Timestamp

        $tracker | ConvertTo-Json -Depth 10 | Set-Content $outcomeFile
        Write-AgentLog "Outcome tracked: $ActionType -> $TargetId (ID: $actionId)"
        Write-Host $actionId
    }

    "check-outcomes" {
        # Check outcomes for previous actions by this agent
        $outcomeFile = Join-Path $ProgressDir "outcome-tracker.json"

        if (-not (Test-Path $outcomeFile)) {
            Write-Host "No outcome tracker found" -ForegroundColor Yellow
            exit 0
        }

        $tracker = Get-Content $outcomeFile -Raw | ConvertFrom-Json
        $myActions = $tracker.actions | Where-Object { $_.agent -eq "burst-$Agent" }

        Write-Host ""
        Write-Host "=== OUTCOME CHECK for Burst-$Agent ===" -ForegroundColor Cyan
        Write-Host "Total actions tracked: $($myActions.Count)"

        $pending = $myActions | Where-Object { $_.final_result -eq "pending" }
        $withOutcomes = $myActions | Where-Object { $_.final_result -ne "pending" }

        Write-Host "Pending outcomes: $($pending.Count)" -ForegroundColor Yellow
        Write-Host "Completed outcomes: $($withOutcomes.Count)" -ForegroundColor Green

        # Show recent conversions
        $conversions = $myActions | Where-Object {
            $_.outcomes.registered -eq $true -or $_.outcomes.paid -eq $true
        }

        if ($conversions.Count -gt 0) {
            Write-Host ""
            Write-Host "CONVERSIONS:" -ForegroundColor Green
            foreach ($c in ($conversions | Select-Object -Last 5)) {
                $result = if ($c.outcomes.paid) { "PAID" } elseif ($c.outcomes.registered) { "REGISTERED" } else { "CLICKED" }
                Write-Host "  - $($c.type): $($c.target_id) -> $result" -ForegroundColor Green
            }
        }

        Write-Host ""
    }

    "derive-learning" {
        # Analyze outcomes and generate learnings if patterns detected
        $outcomeFile = Join-Path $ProgressDir "outcome-tracker.json"
        $learningsFile = Join-Path $ProgressDir "learnings.md"

        if (-not (Test-Path $outcomeFile)) {
            Write-Host "No outcome tracker found" -ForegroundColor Yellow
            exit 0
        }

        $tracker = Get-Content $outcomeFile -Raw | ConvertFrom-Json
        $myActions = $tracker.actions | Where-Object { $_.agent -eq "burst-$Agent" }

        # Only analyze if we have enough data
        if ($myActions.Count -lt 10) {
            Write-Host "Not enough data for pattern detection (need 10+, have $($myActions.Count))" -ForegroundColor Yellow
            exit 0
        }

        Write-Host ""
        Write-Host "=== LEARNING DERIVATION for Burst-$Agent ===" -ForegroundColor Magenta

        # Group by action type
        $byType = $myActions | Group-Object -Property type

        foreach ($group in $byType) {
            $total = $group.Count
            $withClicks = ($group.Group | Where-Object { $_.outcomes.clicked -eq $true }).Count
            $withRegistrations = ($group.Group | Where-Object { $_.outcomes.registered -eq $true }).Count
            $withPayments = ($group.Group | Where-Object { $_.outcomes.paid -eq $true }).Count

            $clickRate = if ($total -gt 0) { [math]::Round(($withClicks / $total) * 100, 1) } else { 0 }
            $regRate = if ($total -gt 0) { [math]::Round(($withRegistrations / $total) * 100, 1) } else { 0 }
            $payRate = if ($total -gt 0) { [math]::Round(($withPayments / $total) * 100, 1) } else { 0 }

            Write-Host ""
            Write-Host "$($group.Name): $total actions" -ForegroundColor Cyan
            Write-Host "  Click Rate: $clickRate%" -ForegroundColor $(if ($clickRate -gt 5) { "Green" } else { "Yellow" })
            Write-Host "  Registration Rate: $regRate%" -ForegroundColor $(if ($regRate -gt 2) { "Green" } else { "Yellow" })
            Write-Host "  Payment Rate: $payRate%" -ForegroundColor $(if ($payRate -gt 1) { "Green" } else { "Yellow" })

            # Generate learning if significant pattern found
            if ($clickRate -gt 10 -or $regRate -gt 5 -or $payRate -gt 2) {
                $learningId = "L-" + (Get-Date -Format "yyyyMMddHHmm")
                $ts = Get-Date -Format "yyyy-MM-dd"

                $learning = @"

## Learning #$learningId (Auto-Generated)

**Source:** outcome-tracker.json
**Date:** $ts
**Agent:** burst-$Agent
**Action Type:** $($group.Name)

**Stats:**
- Total Actions: $total
- Click Rate: $clickRate%
- Registration Rate: $regRate%
- Payment Rate: $payRate%

**Status:** ACTIVE

---
"@

                Add-Content -Path $learningsFile -Value $learning
                Write-Host "  -> Learning $learningId generated!" -ForegroundColor Green

                # Track that we derived this learning
                $tracker.learnings_derived += @{
                    id = $learningId
                    agent = "burst-$Agent"
                    action_type = $group.Name
                    created_at = Get-Timestamp
                }
            }
        }

        # Update stats
        $tracker.stats.actions_with_outcomes = ($tracker.actions | Where-Object { $_.final_result -ne "pending" }).Count
        if ($tracker.stats.total_actions -gt 0) {
            $tracker.stats.conversion_rate = [math]::Round(
                (($tracker.actions | Where-Object { $_.outcomes.registered -eq $true }).Count / $tracker.stats.total_actions) * 100, 2
            )
        }
        $tracker.last_updated = Get-Timestamp

        $tracker | ConvertTo-Json -Depth 10 | Set-Content $outcomeFile
        Write-Host ""
    }
}
