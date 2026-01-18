$data = Get-Content 'C:/Users/Berend Mainz/Documents/Start-up/ReviewResponder/temp_all_new.json' | ConvertFrom-Json
$total = $data.leads.Count
$withEmail = ($data.leads | Where-Object { $_.email -ne $null }).Count
$noEmail = $total - $withEmail

Write-Host "============================================"
Write-Host "NEW LEADS STATUS"
Write-Host "============================================"
Write-Host "Total NEW leads: $total"
Write-Host "With Email: $withEmail"
Write-Host "Without Email: $noEmail"
Write-Host ""

# Count by quality
$highValue = ($data.leads | Where-Object {
    $_.email -ne $null -and
    $_.google_reviews_count -ge 500 -and
    $_.email -notmatch '^info@|^contact@|^hello@|^office@'
}).Count

$mediumValue = ($data.leads | Where-Object {
    $_.email -ne $null -and
    $_.google_reviews_count -ge 100 -and
    $_.google_reviews_count -lt 500
}).Count

$genericEmail = ($data.leads | Where-Object {
    $_.email -match '^info@|^contact@|^hello@|^office@'
}).Count

Write-Host "LEAD QUALITY:"
Write-Host "  High-Value (500+ reviews, personal email): $highValue"
Write-Host "  Medium-Value (100-500 reviews): $mediumValue"
Write-Host "  Generic Emails (info@, contact@): $genericEmail"
Write-Host ""

# Top cities
Write-Host "TOP CITIES:"
$data.leads | Group-Object city | Sort-Object Count -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Count) leads"
}
