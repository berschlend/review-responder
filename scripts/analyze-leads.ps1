$data = Get-Content 'C:/Users/Berend Mainz/Documents/Start-up/ReviewResponder/temp_leads.json' | ConvertFrom-Json
$highValue = $data.leads | Where-Object {
    $_.google_reviews_count -ge 500 -and
    $_.email -ne $null -and
    $_.email -notmatch '^info@' -and
    $_.email -notmatch '^contact@' -and
    $_.email -notmatch '^hello@' -and
    $_.email -notmatch '^office@' -and
    $_.email -notmatch '@ihg.com' -and
    $_.email -notmatch '@accor.com' -and
    $_.email -notmatch '@hilton.com' -and
    $_.email -notmatch '@marriott.com'
} | Sort-Object -Property google_reviews_count -Descending | Select-Object -First 30

Write-Host "============================================"
Write-Host "HIGH-VALUE LEADS (500+ Reviews, Personal Email)"
Write-Host "============================================"
Write-Host ""
Write-Host "Found $($highValue.Count) leads:"
Write-Host ""

$highValue | ForEach-Object {
    $score = 0
    # Score based on reviews
    if ($_.google_reviews_count -ge 2000) { $score += 50 }
    elseif ($_.google_reviews_count -ge 500) { $score += 40 }

    # Score based on email type
    if ($_.email -match '@gmail.com') { $score += 10 }
    if ($_.email -match '^[a-z]+@') { $score += 20 }

    Write-Host "[$score] $($_.business_name)"
    Write-Host "    City: $($_.city) | Reviews: $($_.google_reviews_count) | Rating: $($_.google_rating)"
    Write-Host "    Email: $($_.email)"
    Write-Host "    ID: $($_.id)"
    Write-Host ""
}

# Output IDs for handoff
$ids = ($highValue | Select-Object -ExpandProperty id) -join ","
Write-Host "============================================"
Write-Host "Lead IDs for Burst-2 handoff: $ids"
Write-Host "============================================"
