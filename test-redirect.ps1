[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$url = "https://review-responder.onrender.com/api/admin/set-plan?email=berend.mainz@web.de&plan=free&key=rr_admin_7x9Kp2mNqL5wYzR8vTbE3hJcXfGdAs4U&redirect=1"
$request = [System.Net.WebRequest]::Create($url)
$request.AllowAutoRedirect = $false
try {
    $response = $request.GetResponse()
    Write-Host "Status:" $response.StatusCode
    Write-Host "Location:" $response.Headers["Location"]
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $location = $_.Exception.Response.Headers["Location"]
    Write-Host "Status:" $statusCode
    Write-Host "Location:" $location
}
