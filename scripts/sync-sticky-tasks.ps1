# sync-sticky-tasks.ps1
# Synchronizes Sticky Tasks from Database (call_preps + hot leads)
# Called by: Stop-Hook, Night-Agents, manually

param(
    [switch]$Verbose
)

$ADMIN_KEY = "rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"
$API_BASE = "https://review-responder.onrender.com"
$STICKY_FILE = "$PSScriptRoot\..\/.claude/sticky-tasks.json"

# Resolve path
$STICKY_FILE = (Resolve-Path "$PSScriptRoot\..\.claude\sticky-tasks.json" -ErrorAction SilentlyContinue) ?? "$PSScriptRoot\..\.claude\sticky-tasks.json"

if ($Verbose) { Write-Host "[Sync] Starting sticky tasks sync..." -ForegroundColor Cyan }

try {
    # 1. Fetch pending calls from DB (priority 4+)
    $headers = @{ "X-Admin-Key" = $ADMIN_KEY }
    $callsResponse = Invoke-RestMethod -Uri "$API_BASE/api/admin/call-preps" -Headers $headers -Method GET -ErrorAction Stop

    $pendingCalls = $callsResponse.calls | Where-Object {
        $_.status -eq 'pending' -and $_.priority_score -ge 4
    } | Sort-Object -Property priority_score -Descending

    if ($Verbose) { Write-Host "[Sync] Found $($pendingCalls.Count) high-priority pending calls" -ForegroundColor Green }

    # 2. Build tasks array
    $tasks = @()
    $id = 1

    # Priority 5 = HOT (fire emoji)
    foreach ($call in ($pendingCalls | Where-Object { $_.priority_score -eq 5 })) {
        $emoji = "🔥"
        $text = "$emoji ANRUFEN: $($call.business_name) $($call.phone)"
        if ($call.problem) { $text += " ($($call.problem.Substring(0, [Math]::Min(30, $call.problem.Length)))...)" }
        $tasks += @{ id = $id++; text = $text }
    }

    # Priority 4 = WARM (green circle)
    foreach ($call in ($pendingCalls | Where-Object { $_.priority_score -eq 4 })) {
        $emoji = "🟢"
        $text = "$emoji ANRUFEN: $($call.business_name) $($call.phone)"
        if ($call.problem) { $text += " ($($call.problem.Substring(0, [Math]::Min(30, $call.problem.Length)))...)" }
        $tasks += @{ id = $id++; text = $text }
    }

    # 3. Add static tasks (Demo Video, etc.)
    # Check if demo video task should be shown
    $staticTasks = @(
        @{ id = $id++; text = "📧 EMAILS an registrierte User senden (Drafts in outreach-materials-18-01.md)" }
        @{ id = $id++; text = "🎬 Demo-Video aufnehmen (Guide in content/BEREND-VIDEO-RECORDING-GUIDE.md)" }
    )
    $tasks += $staticTasks

    # 4. Write to JSON
    $stickyJson = @{ tasks = $tasks } | ConvertTo-Json -Depth 3
    $stickyJson | Out-File -FilePath $STICKY_FILE -Encoding utf8 -Force

    if ($Verbose) {
        Write-Host "[Sync] Updated sticky-tasks.json with $($tasks.Count) tasks" -ForegroundColor Green
        Write-Host $stickyJson
    }

    # 5. Return summary for calling scripts
    return @{
        success = $true
        total_tasks = $tasks.Count
        hot_calls = ($pendingCalls | Where-Object { $_.priority_score -eq 5 }).Count
        warm_calls = ($pendingCalls | Where-Object { $_.priority_score -eq 4 }).Count
    }

} catch {
    Write-Host "[Sync Error] $_" -ForegroundColor Red
    return @{ success = $false; error = $_.ToString() }
}
