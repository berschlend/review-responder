# Night-Burst Agent Helper Functions
# These can be called from within Claude sessions to manage state
#
# Usage (from Claude via Bash tool):
#   powershell -File scripts/agent-helpers.ps1 -Action heartbeat -Agent 1
#   powershell -File scripts/agent-helpers.ps1 -Action memory-read -Agent 5
#   powershell -File scripts/agent-helpers.ps1 -Action learning-add -Agent 2 -Data "Subject with star rating works"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("heartbeat", "status-read", "status-update", "memory-read", "memory-update", "learning-add", "handoff-create", "handoff-check", "focus-read", "wake-backend", "feedback-read", "feedback-alert", "budget-check", "budget-use", "approval-check", "approval-expire", "check-real-users")]
    [string]$Action,

    [int]$Agent = 0,
    [string]$Data = "",
    [string]$Key = "",          # For budget-check: resource name (resend, openai, serpapi, etc.)
    [string]$Resource = "",     # For check-blocked: resource to check (email_lock, resend, etc.)
    [string]$Value = "",
    [int]$Amount = 1            # For budget-use: amount to deduct
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

    "wake-backend" {
        # Wake up Render backend (sleeps after inactivity)
        # Uses curl directly since it handles HTTP errors more gracefully
        $BackendUrl = "https://review-responder.onrender.com/api/admin/stats"
        $MaxAttempts = 10
        $Delay = 5

        Write-Output "[WAKE-UP] Waking up Render backend..."

        for ($i = 1; $i -le $MaxAttempts; $i++) {
            Write-Output "[WAKE-UP] Attempt $i/$MaxAttempts..."

            # Use curl.exe to check - any HTTP response (even 401) means backend is awake
            # Note: curl.exe is the actual curl binary, not PowerShell's Invoke-WebRequest alias
            $result = curl.exe -s -o NUL -w "%{http_code}" --connect-timeout 30 $BackendUrl 2>&1

            if ($result -match '^\d{3}$') {
                $statusCode = [int]$result
                if ($statusCode -ge 200 -and $statusCode -lt 600) {
                    Write-Output "OK: Backend is awake and ready! (HTTP $statusCode)"
                    break
                }
            }

            if ($i -lt $MaxAttempts) {
                Write-Output "[WAKE-UP] Connection failed, waiting ${Delay}s..."
                Start-Sleep -Seconds $Delay
                $Delay = [Math]::Min($Delay * 1.5, 30)
            } else {
                Write-Output "WARNING: Backend may still be sleeping after $MaxAttempts attempts"
            }
        }
    }

    "feedback-read" {
        # Read user feedback insights from local file or API
        $feedbackFile = Join-Path $ProgressDir "feedback-insights.json"
        if (Test-Path $feedbackFile) {
            Get-Content $feedbackFile
        } else {
            # Try to fetch from API if local file doesn't exist
            Write-Output "[FEEDBACK] Local file not found, fetching from API..."
            $AdminKey = "rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"
            $FeedbackUrl = "https://review-responder.onrender.com/api/admin/feedback-summary?exclude_test=true"
            try {
                $result = curl.exe -s -H "x-admin-key: $AdminKey" $FeedbackUrl 2>&1
                Write-Output $result
            } catch {
                Write-Output "{`"error`": `"Failed to fetch feedback`", `"summary`": {`"total_real_feedback`": 0, `"average_rating`": 0, `"trend`": `"unknown`"}}"
            }
        }
    }

    "feedback-alert" {
        # Check for feedback alerts only
        $feedbackFile = Join-Path $ProgressDir "feedback-insights.json"
        if (Test-Path $feedbackFile) {
            $feedback = Get-Content $feedbackFile | ConvertFrom-Json
            if ($feedback.alerts -and $feedback.alerts.Count -gt 0) {
                Write-Output "ALERTS_FOUND: $($feedback.alerts.Count)"
                $feedback.alerts | ConvertTo-Json
            } else {
                Write-Output "NO_ALERTS"
            }
        } else {
            # Try to fetch from API
            $AdminKey = "rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"
            $FeedbackUrl = "https://review-responder.onrender.com/api/admin/feedback-summary?exclude_test=true"
            try {
                $result = curl.exe -s -H "x-admin-key: $AdminKey" $FeedbackUrl 2>&1 | ConvertFrom-Json
                if ($result.alerts -and $result.alerts.Count -gt 0) {
                    Write-Output "ALERTS_FOUND: $($result.alerts.Count)"
                    $result.alerts | ConvertTo-Json
                } else {
                    Write-Output "NO_ALERTS"
                }
            } catch {
                Write-Output "ERROR: Could not check alerts"
            }
        }
    }

    "budget-check" {
        # Check if agent has budget for a specific resource (V3.9 Safety)
        # Usage: powershell -File scripts/agent-helpers.ps1 -Action budget-check -Agent 2 -Key resend
        # Returns: OK (can proceed) or BLOCKED (budget exceeded)

        $budgetFile = Join-Path $ProgressDir "resource-budget.json"
        if (-not (Test-Path $budgetFile)) {
            Write-Output "WARN: No resource-budget.json found, allowing action"
            return
        }

        $budget = Get-Content $budgetFile -Raw | ConvertFrom-Json
        $resourceKey = $Key

        # Map common resource names
        $resourceMap = @{
            "resend" = "resend_emails"
            "email" = "resend_emails"
            "openai" = "openai_tokens"
            "serpapi" = "serpapi_calls"
            "outscraper" = "outscraper_calls"
            "anthropic" = "anthropic_tokens"
        }

        $fullResourceKey = if ($resourceMap.ContainsKey($resourceKey)) { $resourceMap[$resourceKey] } else { $resourceKey }

        # Check agent-specific reservation
        $agentKey = "burst-$Agent"
        $agentReservation = $null
        if ($budget.reservations -and $budget.reservations.$agentKey) {
            $agentReservation = $budget.reservations.$agentKey.$resourceKey
        }

        # Check global limit
        $globalLimit = $null
        $globalUsed = 0
        if ($budget.daily_limits -and $budget.daily_limits.$fullResourceKey) {
            $globalLimit = $budget.daily_limits.$fullResourceKey.limit
            $globalUsed = $budget.daily_limits.$fullResourceKey.used
        }

        # Determine if blocked
        $effectiveLimit = if ($agentReservation) { $agentReservation } elseif ($globalLimit) { $globalLimit } else { 999999 }
        $remaining = $effectiveLimit - $globalUsed

        if ($remaining -le 0) {
            Write-Output "BLOCKED: Budget exceeded for $resourceKey (used: $globalUsed, limit: $effectiveLimit)"

            # Update status file to mark budget exceeded
            $statusFile = Get-StatusFile -AgentNum $Agent
            if (Test-Path $statusFile) {
                $status = Get-Content $statusFile | ConvertFrom-Json
                $status | Add-Member -NotePropertyName "budget_exceeded" -NotePropertyValue $true -Force
                $status | Add-Member -NotePropertyName "budget_exceeded_resource" -NotePropertyValue $resourceKey -Force
                $status | ConvertTo-Json -Depth 10 | Set-Content -Path $statusFile -Encoding UTF8
            }
        } elseif ($remaining -le ($effectiveLimit * 0.1)) {
            Write-Output "WARN: Low budget for $resourceKey (remaining: $remaining of $effectiveLimit)"
        } else {
            Write-Output "OK: Budget available for $resourceKey (remaining: $remaining of $effectiveLimit)"
        }
    }

    "budget-use" {
        # Deduct budget after using a resource (V3.9 Safety)
        # Usage: powershell -File scripts/agent-helpers.ps1 -Action budget-use -Key resend -Amount 1

        $budgetFile = Join-Path $ProgressDir "resource-budget.json"
        if (-not (Test-Path $budgetFile)) {
            Write-Output "WARN: No resource-budget.json found"
            return
        }

        $budget = Get-Content $budgetFile -Raw | ConvertFrom-Json
        $resourceKey = $Key

        # Map common resource names
        $resourceMap = @{
            "resend" = "resend_emails"
            "email" = "resend_emails"
            "openai" = "openai_tokens"
            "serpapi" = "serpapi_calls"
            "outscraper" = "outscraper_calls"
            "anthropic" = "anthropic_tokens"
        }

        $fullResourceKey = if ($resourceMap.ContainsKey($resourceKey)) { $resourceMap[$resourceKey] } else { $resourceKey }

        # Update usage
        if ($budget.daily_limits -and $budget.daily_limits.$fullResourceKey) {
            $budget.daily_limits.$fullResourceKey.used = $budget.daily_limits.$fullResourceKey.used + $Amount
            $budget.last_updated = Get-Timestamp

            $budget | ConvertTo-Json -Depth 10 | Set-Content -Path $budgetFile -Encoding UTF8

            $newUsed = $budget.daily_limits.$fullResourceKey.used
            $limit = $budget.daily_limits.$fullResourceKey.limit
            Write-Output "OK: Deducted $Amount from $resourceKey (now: $newUsed/$limit)"
        } else {
            Write-Output "WARN: Resource $fullResourceKey not found in budget"
        }
    }

    "check-blocked" {
        # Smart Task Switching V4.0 - Check if a resource is blocked
        # Usage: powershell -File scripts/agent-helpers.ps1 -Action check-blocked -Agent 2 -Resource email_lock
        # Returns: JSON with blocked status, reason, retry_in_seconds, and suggested_backup_task

        $taskQueueFile = Join-Path $ProgressDir "agent-task-queue.json"
        $budgetFile = Join-Path $ProgressDir "resource-budget.json"
        $parallelStatusUrl = "https://review-responder.onrender.com/api/admin/parallel-safe-status"
        $AdminKey = "rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"

        $result = @{
            blocked = $false
            reason = $null
            retry_in_seconds = 0
            resource = $Resource
            suggested_backup_task = $null
        }

        # Check based on resource type
        switch ($Resource) {
            "email_lock" {
                # Check parallel-safe lock via API
                try {
                    $statusResponse = curl.exe -s -H "x-admin-key: $AdminKey" $parallelStatusUrl 2>&1
                    $status = $statusResponse | ConvertFrom-Json
                    if ($status.locks -and $status.locks.email_send) {
                        $result.blocked = $true
                        $result.reason = "Email lock active - another agent is sending"
                        $result.retry_in_seconds = 60
                    }
                } catch {
                    # If API fails, assume not blocked
                    $result.blocked = $false
                }
            }

            { $_ -in @("resend", "openai", "serpapi", "outscraper", "anthropic") } {
                # Check budget for this resource
                if (Test-Path $budgetFile) {
                    $budget = Get-Content $budgetFile -Raw | ConvertFrom-Json
                    $resourceMap = @{
                        "resend" = "resend_emails"
                        "openai" = "openai_tokens"
                        "serpapi" = "serpapi_calls"
                        "outscraper" = "outscraper_calls"
                        "anthropic" = "anthropic_tokens"
                    }
                    $fullKey = if ($resourceMap.ContainsKey($Resource)) { $resourceMap[$Resource] } else { $Resource }

                    if ($budget.daily_limits -and $budget.daily_limits.$fullKey) {
                        $used = $budget.daily_limits.$fullKey.used
                        $limit = $budget.daily_limits.$fullKey.limit
                        if ($used -ge $limit) {
                            $result.blocked = $true
                            $result.reason = "Budget exceeded for $Resource ($used/$limit)"
                            # Calculate seconds until midnight UTC for reset
                            $now = [DateTime]::UtcNow
                            $midnight = $now.Date.AddDays(1)
                            $result.retry_in_seconds = [int]($midnight - $now).TotalSeconds
                        }
                    }
                }
            }

            "linkedin_rate_limit" {
                # LinkedIn rate limit - check task queue for blocked_until
                if (Test-Path $taskQueueFile) {
                    $queue = Get-Content $taskQueueFile -Raw | ConvertFrom-Json
                    $agentKey = "burst-$Agent"
                    if ($queue.agents.$agentKey -and $queue.agents.$agentKey.blocked_until) {
                        $blockedUntil = [DateTime]::Parse($queue.agents.$agentKey.blocked_until)
                        if ($blockedUntil -gt [DateTime]::UtcNow) {
                            $result.blocked = $true
                            $result.reason = "LinkedIn rate limit active"
                            $result.retry_in_seconds = [int]($blockedUntil - [DateTime]::UtcNow).TotalSeconds
                        }
                    }
                }
            }

            "api_timeout" {
                # Check if backend is awake
                try {
                    $testUrl = "https://review-responder.onrender.com/api/admin/stats"
                    $httpCode = curl.exe -s -o NUL -w "%{http_code}" --connect-timeout 5 $testUrl 2>&1
                    if ($httpCode -notmatch '^\d{3}$' -or [int]$httpCode -ge 500) {
                        $result.blocked = $true
                        $result.reason = "Backend not responding"
                        $result.retry_in_seconds = 60
                    }
                } catch {
                    $result.blocked = $true
                    $result.reason = "Backend connection failed"
                    $result.retry_in_seconds = 60
                }
            }
        }

        # If blocked, suggest a backup task
        if ($result.blocked -and (Test-Path $taskQueueFile)) {
            $queue = Get-Content $taskQueueFile -Raw | ConvertFrom-Json
            $agentKey = "burst-$Agent"
            if ($queue.agents.$agentKey -and $queue.agents.$agentKey.backup_tasks) {
                $backupTasks = $queue.agents.$agentKey.backup_tasks | Sort-Object { $_.priority }
                if ($backupTasks.Count -gt 0) {
                    $result.suggested_backup_task = $backupTasks[0]
                }
            }
        }

        $result | ConvertTo-Json -Depth 5
    }

    "task-switch" {
        # Record task switch in agent-task-queue.json
        # Usage: powershell -File scripts/agent-helpers.ps1 -Action task-switch -Agent 2 -Data '{"to":"backup","task_type":"template_ab_test","reason":"email_lock"}'

        $taskQueueFile = Join-Path $ProgressDir "agent-task-queue.json"
        if (-not (Test-Path $taskQueueFile)) {
            Write-Output "ERROR: agent-task-queue.json not found"
            return
        }

        $queue = Get-Content $taskQueueFile -Raw | ConvertFrom-Json
        $agentKey = "burst-$Agent"

        if ($Data) {
            $switchData = $Data | ConvertFrom-Json

            if ($queue.agents.$agentKey) {
                # Update current task
                $queue.agents.$agentKey.current_task = $switchData.to
                if ($switchData.to -eq "backup") {
                    $queue.agents.$agentKey.blocked_reason = $switchData.reason
                    $queue.agents.$agentKey.blocked_until = (Get-Date).AddMinutes(5).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
                } else {
                    $queue.agents.$agentKey.blocked_reason = $null
                    $queue.agents.$agentKey.blocked_until = $null
                }

                $queue.last_updated = Get-Timestamp
                $queue | ConvertTo-Json -Depth 10 | Set-Content -Path $taskQueueFile -Encoding UTF8

                Write-Output "OK: Agent $agentKey switched to $($switchData.to) task ($($switchData.task_type))"
            } else {
                Write-Output "ERROR: Agent $agentKey not found in task queue"
            }
        }
    }

    "task-status" {
        # Get current task status for an agent
        # Usage: powershell -File scripts/agent-helpers.ps1 -Action task-status -Agent 2

        $taskQueueFile = Join-Path $ProgressDir "agent-task-queue.json"
        if (-not (Test-Path $taskQueueFile)) {
            Write-Output "{}"
            return
        }

        $queue = Get-Content $taskQueueFile -Raw | ConvertFrom-Json
        $agentKey = "burst-$Agent"

        if ($queue.agents.$agentKey) {
            $status = @{
                agent = $agentKey
                current_task = $queue.agents.$agentKey.current_task
                main_task = $queue.agents.$agentKey.main_task
                backup_tasks = $queue.agents.$agentKey.backup_tasks
                blocked_until = $queue.agents.$agentKey.blocked_until
                blocked_reason = $queue.agents.$agentKey.blocked_reason
            }
            $status | ConvertTo-Json -Depth 5
        } else {
            Write-Output "{}"
        }
    }

    "approval-check" {
        # Check status of an approval request (V3.9.1 Work-While-Waiting)
        # Usage: powershell -File scripts/agent-helpers.ps1 -Action approval-check -Key "approval_burst2_1737234567"
        # Output: PENDING | APPROVED | REJECTED | EXPIRED

        $approvalFile = Join-Path $ProgressDir "approval-queue.md"
        if (-not (Test-Path $approvalFile)) {
            Write-Output "ERROR: approval-queue.md not found"
            return
        }

        $content = Get-Content $approvalFile -Raw
        $requestId = $Key

        # Define max ages for each level (in minutes)
        $maxAges = @{
            "Critical" = 30
            "Important" = 120
            "Informational" = 99999
        }

        # Search for the request in the file
        # Pattern: Look for request ID and its status
        if ($content -match "(?s)### \[.*?\] $requestId.*?Priority.*?(\w+).*?Status:.*?(\w+)") {
            $level = $Matches[1]
            $status = $Matches[2]

            if ($status -eq "APPROVED") {
                Write-Output "APPROVED"
            } elseif ($status -match "REJECTED|TIMEOUT") {
                Write-Output "REJECTED"
            } else {
                # Check if expired based on timestamp
                if ($content -match "$requestId.*?Submitted:.*?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)") {
                    $submittedStr = $Matches[1]
                    try {
                        $submitted = [DateTime]::ParseExact($submittedStr, "yyyy-MM-ddTHH:mm:ssZ", $null)
                        $ageMinutes = ((Get-Date).ToUniversalTime() - $submitted).TotalMinutes
                        $maxAge = if ($maxAges.ContainsKey($level)) { $maxAges[$level] } else { 120 }

                        if ($ageMinutes -gt $maxAge) {
                            Write-Output "EXPIRED"
                        } else {
                            $remaining = [math]::Round($maxAge - $ageMinutes)
                            Write-Output "PENDING (${remaining}min remaining)"
                        }
                    } catch {
                        Write-Output "PENDING"
                    }
                } else {
                    Write-Output "PENDING"
                }
            }
        } elseif ($content -match $requestId) {
            # Found request but couldn't parse status - assume pending
            Write-Output "PENDING"
        } else {
            Write-Output "NOT_FOUND"
        }
    }

    "approval-expire" {
        # Auto-expire old approval requests (run by pre-deploy-safety or cron)
        # Usage: powershell -File scripts/agent-helpers.ps1 -Action approval-expire
        # Output: List of expired requests

        $approvalFile = Join-Path $ProgressDir "approval-queue.md"
        if (-not (Test-Path $approvalFile)) {
            Write-Output "ERROR: approval-queue.md not found"
            return
        }

        $content = Get-Content $approvalFile -Raw
        $expired = @()

        # Max ages in minutes
        $maxAges = @{
            "Critical" = 30
            "Important" = 120
        }

        # Find all PENDING items and check their age
        $matches = [regex]::Matches($content, "### \[(\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC)\].*?Priority:.*?(\w+).*?Status:.*?PENDING", "Singleline")

        foreach ($match in $matches) {
            try {
                $dateStr = $match.Groups[1].Value
                $level = $match.Groups[2].Value

                # Parse date (format: "2026-01-17 22:45 UTC")
                $submitted = [DateTime]::ParseExact($dateStr, "yyyy-MM-dd HH:mm 'UTC'", $null)
                $ageMinutes = ((Get-Date).ToUniversalTime() - $submitted).TotalMinutes
                $maxAge = if ($maxAges.ContainsKey($level)) { $maxAges[$level] } else { 120 }

                if ($ageMinutes -gt $maxAge) {
                    $expired += @{
                        date = $dateStr
                        level = $level
                        age_minutes = [math]::Round($ageMinutes)
                        max_age = $maxAge
                    }
                }
            } catch {
                # Skip unparseable entries
            }
        }

        if ($expired.Count -gt 0) {
            Write-Output "EXPIRED_ITEMS:"
            $expired | ConvertTo-Json -Depth 3
        } else {
            Write-Output "NO_EXPIRED_ITEMS"
        }
    }
}


# === REAL USER METRICS CHECK ===
# Usage: powershell -File scripts/agent-helpers.ps1 -Action check-real-users
if ($Action -eq "check-real-users") {
    $metricsFile = "content/claude-progress/real-user-metrics.json"
    
    if (Test-Path $metricsFile) {
        $metrics = Get-Content $metricsFile | ConvertFrom-Json
        $lastUpdate = [DateTime]::Parse($metrics.lastUpdated)
        $hoursSinceUpdate = ((Get-Date) - $lastUpdate).TotalHours
        
        Write-Host "=== REAL USER METRICS ===" -ForegroundColor Cyan
        Write-Host "Last Updated: $($metrics.lastUpdated) ($([math]::Round($hoursSinceUpdate, 1))h ago)"
        Write-Host "Organic Users: $($metrics.realUsers.organic)" -ForegroundColor $(if ($metrics.realUsers.organic -eq 0) { "Red" } else { "Green" })
        Write-Host "Activated: $($metrics.realUsers.activated)"
        Write-Host "Paying: $($metrics.realUsers.paying)"
        Write-Host ""
        
        if ($hoursSinceUpdate -gt 24) {
            Write-Host "[!] Metrics are STALE (>24h) - run /data-analyze to update" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "[!] Metrics file not found - run /data-analyze to create" -ForegroundColor Red
        exit 1
    }
    exit 0
}
