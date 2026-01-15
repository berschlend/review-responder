# Check which hot leads already have demos
$headers = @{ 'x-admin-key' = 'rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U' }
$resp = Invoke-RestMethod -Uri 'https://review-responder.onrender.com/api/admin/demos?limit=700' -Headers $headers
$demos = $resp.demos

# Hot lead keywords
$keywords = @('augustiner', 'dolder', 'wirtshaus', 'sphere', 'komodo', 'grille', 'sonnenberg', 'trattoria', 'intercity', 'st james', 'bullring', 'alder', 'romano', 'terrasse', 'away spa', 'six seven', 'smith')

Write-Host "Total demos in system: $($demos.Count)"
Write-Host ""
Write-Host "Searching for Hot Lead matches in demos..."

$matches = @()
foreach ($d in $demos) {
    $name = $d.business_name.ToLower()
    foreach ($k in $keywords) {
        if ($name -like "*$k*") {
            $matches += $d
            break
        }
    }
}

Write-Host ""
Write-Host "=== Found $($matches.Count) demos matching hot lead keywords ==="
foreach ($m in $matches) {
    Write-Host "  - $($m.business_name) | $($m.city) | Viewed: $($m.demo_page_viewed_at -ne $null)"
}
