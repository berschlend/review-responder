Add-Type -AssemblyName System.Drawing
$path = "C:\Users\Berend Mainz\Documents\Start-up\reviewresponder-4\chrome-extension\screenshots"

$files = @(
    "promo-marquee-1400x560.png",
    "promo-small-440x280.png",
    "screenshot-4-business-context.png",
    "screenshot-5-style-preferences.png"
)

foreach ($file in $files) {
    $fullPath = "$path\$file"
    if (Test-Path $fullPath) {
        $img = [System.Drawing.Image]::FromFile($fullPath)
        Write-Host "$file : $($img.Width)x$($img.Height)"
        $img.Dispose()
    } else {
        Write-Host "$file : NOT FOUND"
    }
}
