Write-Host '=== CURRENT AGENT STATUS ===' -ForegroundColor Cyan
$reg = Get-Content 'C:/Users/Berend Mainz/Documents/Start-up/ReviewResponder/.claude/parallel-sessions/registry.json' | ConvertFrom-Json
$now = Get-Date
$activeCount = 0

foreach ($prop in $reg.sessions.PSObject.Properties) {
    $s = $prop.Value
    try {
        $lastBeat = [DateTimeOffset]::Parse($s.lastHeartbeat).LocalDateTime
        $minAgo = [math]::Round(($now - $lastBeat).TotalMinutes, 0)
        $status = if ($minAgo -lt 5) { 'ACTIVE' } elseif ($minAgo -lt 10) { 'RECENT' } else { 'STALE' }
        if ($minAgo -lt 10) { $activeCount++ }

        $color = switch ($status) {
            'ACTIVE' { 'Green' }
            'RECENT' { 'Yellow' }
            default { 'Red' }
        }
        Write-Host "  [$($prop.Name)] $status ($minAgo min ago)" -ForegroundColor $color
    } catch {
        Write-Host "  [$($prop.Name)] NO HEARTBEAT" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Active agents: $activeCount/15" -ForegroundColor Cyan
