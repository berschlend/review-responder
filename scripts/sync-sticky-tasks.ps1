# sync-sticky-tasks.ps1
# Synchronizes Sticky Tasks from Database (call_preps + hot leads)
# Called by: Stop-Hook, Night-Agents, manually
# PowerShell 5.1 compatible

param(
    [switch]$Verbose
)

$ADMIN_KEY = "rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U"
$API_BASE = "https://review-responder.onrender.com"

# Resolve path (PS 5.1 compatible - no ?? operator)
$STICKY_FILE = "$PSScriptRoot\..\.claude\sticky-tasks.json"
$resolved = Resolve-Path $STICKY_FILE -ErrorAction SilentlyContinue
if ($resolved) { $STICKY_FILE = $resolved.Path }

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

    # Priority 5 = HOT (fire emoji via unicode)
    $fireEmoji = [char]::ConvertFromUtf32(0x1F525)
    foreach ($call in ($pendingCalls | Where-Object { $_.priority_score -eq 5 })) {
        $text = "$fireEmoji ANRUFEN: $($call.business_name) $($call.phone)"
        if ($call.problem -and $call.problem.Length -gt 0) {
            $maxLen = [Math]::Min(30, $call.problem.Length)
            $text += " ($($call.problem.Substring(0, $maxLen))...)"
        }
        $tasks += @{ id = $id; text = $text }
        $id++
    }

    # Priority 4 = WARM (green circle via unicode)
    $greenEmoji = [char]::ConvertFromUtf32(0x1F7E2)
    foreach ($call in ($pendingCalls | Where-Object { $_.priority_score -eq 4 })) {
        $text = "$greenEmoji ANRUFEN: $($call.business_name) $($call.phone)"
        if ($call.problem -and $call.problem.Length -gt 0) {
            $maxLen = [Math]::Min(30, $call.problem.Length)
            $text += " ($($call.problem.Substring(0, $maxLen))...)"
        }
        $tasks += @{ id = $id; text = $text }
        $id++
    }

    # 3. Add static tasks (Demo Video, etc.)
    $mailEmoji = [char]::ConvertFromUtf32(0x1F4E7)
    $movieEmoji = [char]::ConvertFromUtf32(0x1F3AC)

    $tasks += @{ id = $id; text = "$mailEmoji EMAILS an registrierte User senden (Drafts in outreach-materials-18-01.md)" }
    $id++
    $tasks += @{ id = $id; text = "$movieEmoji Demo-Video aufnehmen (Guide in content/BEREND-VIDEO-RECORDING-GUIDE.md)" }

    # 4. Write to JSON
    $stickyJson = @{ tasks = $tasks } | ConvertTo-Json -Depth 3
    [System.IO.File]::WriteAllText($STICKY_FILE, $stickyJson, [System.Text.Encoding]::UTF8)

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
