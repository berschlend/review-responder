# Generate demos for hot leads using LinkedIn endpoint
# This endpoint has better Place ID lookup

$headers = @{
    'x-admin-key' = 'rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U'
    'Content-Type' = 'application/json'
}

# Hot leads needing demos (identified from outreach dashboard)
$hotLeads = @(
    @{name='Wirtshaus'; business='Wirtshaus in der Au'; city='Munich'},
    @{name='Manager'; business='Sphere Tim Raue'; city='Berlin'},
    @{name='Owner'; business='Komodo Miami'; city='Miami'},
    @{name='Manager'; business='The Capital Grille'; city='Seattle'},
    @{name='Owner'; business='Restaurant Sonnenberg'; city='Zurich'},
    @{name='Owner'; business='Trattoria Sempre'; city='Zurich'},
    @{name='Manager'; business='IntercityHotel Hamburg Dammtor-Messe'; city='Hamburg'},
    @{name='Manager'; business='St James Quarter'; city='Edinburgh'},
    @{name='Manager'; business='Bullring'; city='Birmingham'},
    @{name='Owner'; business='Alder and Ash'; city='Seattle'},
    @{name='Partner'; business='Romano Law'; city='New York'},
    @{name='Owner'; business='terrasse Restaurant'; city='Zurich'},
    @{name='Concierge'; business='The Dolder Grand'; city='Zurich'},
    @{name='Manager'; business='The Smith'; city='New York'},
    @{name='Manager'; business='AWAY SPA'; city='Edinburgh'},
    @{name='Manager'; business='Six Seven Restaurant'; city='Seattle'}
)

Write-Host "Starting demo generation for $($hotLeads.Count) hot leads..."
Write-Host ""

$successCount = 0
$failCount = 0
$demos = @()

foreach ($lead in $hotLeads) {
    $body = @{
        name = $lead.name
        business_name = $lead.business
        city = $lead.city
        company = $lead.business
    } | ConvertTo-Json

    Write-Host "Generating demo for: $($lead.business) ($($lead.city))..."

    try {
        $response = Invoke-RestMethod -Uri 'https://review-responder.onrender.com/api/outreach/linkedin-demo' `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -TimeoutSec 120

        if ($response.success) {
            Write-Host "  [OK] Demo: $($response.demo_url)" -ForegroundColor Green
            $successCount++
            $demos += @{
                business = $lead.business
                city = $lead.city
                demo_url = $response.demo_url
                reviews = $response.reviews_processed
            }
        } else {
            Write-Host "  [FAIL] $($response.error)" -ForegroundColor Red
            $failCount++
        }
    }
    catch {
        Write-Host "  [ERROR] $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }

    # Rate limit protection
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "========================================="
Write-Host "SUMMARY"
Write-Host "========================================="
Write-Host "Success: $successCount"
Write-Host "Failed: $failCount"
Write-Host ""
Write-Host "Generated Demos:"
foreach ($d in $demos) {
    Write-Host "  - $($d.business): $($d.demo_url)"
}
