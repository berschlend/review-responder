$source = "C:\Users\Berend Mainz\Documents\Start-up\reviewresponder-4\chrome-extension\screenshots"
$dest = "C:\Users\Berend Mainz\Desktop\Chrome-Web-Store-Upload"

# Create folder if not exists
if (!(Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force
}

# Copy promo images
Copy-Item "$source\promo-marquee-1400x560.png" $dest -Force
Copy-Item "$source\promo-small-440x280.png" $dest -Force

# Also copy the ZIP
$zipSource = "C:\Users\Berend Mainz\Documents\Start-up\reviewresponder-4\chrome-extension-v1.6.2.zip"
if (Test-Path $zipSource) {
    Copy-Item $zipSource $dest -Force
}

# List contents
Write-Host "`nFiles in Upload folder:"
Get-ChildItem $dest | Select-Object Name, Length | Format-Table -AutoSize
