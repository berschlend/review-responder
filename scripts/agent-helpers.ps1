# Night-Burst Agent Helper Functions
# These can be called from within Claude sessions to manage state
#
# Usage (from Claude via Bash tool):
#   powershell -File scripts/agent-helpers.ps1 -Action heartbeat -Agent 1
#   powershell -File scripts/agent-helpers.ps1 -Action memory-read -Agent 5
#   powershell -File scripts/agent-helpers.ps1 -Action learning-add -Agent 2 -Data "Subject with star rating works"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("heartbeat", "status-read", "status-update", "memory-read", "memory-update", "learning-add", "handoff-create", "handoff-check", "focus-read")]
    [string]$Action,

    [int]$Agent = 0,
    [string]$Data = "",
    [string]$Key = "",
    [string]$Value = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$ProgressDir = Join-Path $ProjectRoot "content\claude-progress"

function Get-Timestamp {
    return (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

function Get-StatusFile {
    param([int]$AgentNum)
    return Join-Path $ProgressDir "burst-$AgentNum-status.json"
}

function Initialize-StatusIfNeeded {
    param([int]$AgentNum)

    $file = Get-StatusFile -AgentNum $AgentNum
    if (-not (Test-Path $file)) {
        $status = @{
            agent = "burst-$AgentNum"
            version = "3.3"
            status = "running"
            started_at = Get-Timestamp
            last_heartbeat = Get-Timestamp
            current_loop = 0
            metrics = @{
                actions_taken = 0
                errors_count = 0
            }
            health = @{
                stuck_detected = $false
                last_error = $null
            }
        }
        $status | ConvertTo-Json -Depth 10 | Set-Content -Path $file -Encoding UTF8
    }
}

switch ($Action) {
    "heartbeat" {
        Initialize-StatusIfNeeded -AgentNum $Agent
        $file = Get-StatusFile -AgentNum $Agent
        $status = Get-Content $file | ConvertFrom-Json
        $status.last_heartbeat = Get-Timestamp
        $status.current_loop = $status.current_loop + 1
        $status.status = "running"
        $status | ConvertTo-Json -Depth 10 | Set-Content -Path $file -Encoding UTF8
        Write-Output "OK: Heartbeat updated for burst-$Agent (loop $($status.current_loop))"
    }

    "status-read" {
        $file = Get-StatusFile -AgentNum $Agent
        if (Test-Path $file) {
            Get-Content $file
        } else {
            Write-Output "{}"
        }
    }

    "status-update" {
        Initialize-StatusIfNeeded -AgentNum $Agent
        $file = Get-StatusFile -AgentNum $Agent
        $status = Get-Content $file | ConvertFrom-Json

        # Parse Data as JSON updates
        if ($Data) {
            $updates = $Data | ConvertFrom-Json
            foreach ($prop in $updates.PSObject.Properties) {
                if ($prop.Name -eq "metrics") {
                    foreach ($metric in $prop.Value.PSObject.Properties) {
                        $status.metrics.$($metric.Name) = $metric.Value
                    }
                } elseif ($prop.Name -eq "health") {
                    foreach ($h in $prop.Value.PSObject.Properties) {
                        $status.health.$($h.Name) = $h.Value
                    }
                } else {
                    $status.$($prop.Name) = $prop.Value
                }
            }
        }

        $status.last_heartbeat = Get-Timestamp
        $status | ConvertTo-Json -Depth 10 | Set-Content -Path $file -Encoding UTF8
        Write-Output "OK: Status updated for burst-$Agent"
    }

    "memory-read" {
        $memoryFile = Join-Path $ProgressDir "agent-memory.json"
        if (Test-Path $memoryFile) {
            $memory = Get-Content $memoryFile | ConvertFrom-Json
            if ($Agent -gt 0 -and $memory.agents."burst-$Agent") {
                $memory.agents."burst-$Agent" | ConvertTo-Json -Depth 10
            } else {
                $memory | ConvertTo-Json -Depth 10
            }
        } else {
            Write-Output "{}"
        }
    }

    "memory-update" {
        $memoryFile = Join-Path $ProgressDir "agent-memory.json"
        if (Test-Path $memoryFile) {
            $memory = Get-Content $memoryFile | ConvertFrom-Json

            if ($Agent -gt 0) {
                $agentKey = "burst-$Agent"
                if (-not $memory.agents.$agentKey) {
                    $memory.agents | Add-Member -NotePropertyName $agentKey -NotePropertyValue @{
                        session_count = 0
                        total_actions = 0
                        memory = @{ notes = @() }
                    }
                }

                # Increment session count
                $memory.agents.$agentKey.session_count++

                # Add data to notes if provided
                if ($Data) {
                    $note = @{
                        timestamp = Get-Timestamp
                        content = $Data
                    }
                    if (-not $memory.agents.$agentKey.memory.notes) {
                        $memory.agents.$agentKey.memory | Add-Member -NotePropertyName "notes" -NotePropertyValue @()
                    }
                    $memory.agents.$agentKey.memory.notes += $note
                }
            }

            $memory.last_updated = Get-Timestamp
            $memory | ConvertTo-Json -Depth 10 | Set-Content -Path $memoryFile -Encoding UTF8
            Write-Output "OK: Memory updated for burst-$Agent"
        }
    }

    "learning-add" {
        $learningsFile = Join-Path $ProgressDir "learnings.md"
        if ($Data -and (Test-Path $learningsFile)) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
            $entry = "`n### [$timestamp] Burst-$Agent`n- $Data`n"
            Add-Content -Path $learningsFile -Value $entry -Encoding UTF8
            Write-Output "OK: Learning added from burst-$Agent"
        }
    }

    "handoff-create" {
        $handoffFile = Join-Path $ProgressDir "handoff-queue.json"
        if (Test-Path $handoffFile) {
            $handoff = Get-Content $handoffFile | ConvertFrom-Json

            if ($Data) {
                $entry = $Data | ConvertFrom-Json
                $entry | Add-Member -NotePropertyName "id" -NotePropertyValue ([guid]::NewGuid().ToString().Substring(0,8))
                $entry | Add-Member -NotePropertyName "created_at" -NotePropertyValue (Get-Timestamp)
                $entry | Add-Member -NotePropertyName "status" -NotePropertyValue "pending"

                $handoff.queue += $entry
                $handoff | ConvertTo-Json -Depth 10 | Set-Content -Path $handoffFile -Encoding UTF8
                Write-Output "OK: Handoff created: $($entry.id)"
            }
        }
    }

    "handoff-check" {
        $handoffFile = Join-Path $ProgressDir "handoff-queue.json"
        if (Test-Path $handoffFile) {
            $handoff = Get-Content $handoffFile | ConvertFrom-Json
            $pending = $handoff.queue | Where-Object { $_.to -eq "burst-$Agent" -and $_.status -eq "pending" }
            if ($pending) {
                $pending | ConvertTo-Json -Depth 10
            } else {
                Write-Output "[]"
            }
        }
    }

    "focus-read" {
        $focusFile = Join-Path $ProgressDir "current-focus.json"
        if (Test-Path $focusFile) {
            Get-Content $focusFile
        } else {
            Write-Output "{}"
        }
    }
}
