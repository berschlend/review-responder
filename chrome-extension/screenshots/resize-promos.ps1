Add-Type -AssemblyName System.Drawing

$screenshotsPath = "C:\Users\Berend Mainz\Documents\Start-up\reviewresponder-4\chrome-extension\screenshots"

# Resize Small Tile to 440x280
$smallPath = "$screenshotsPath\promo-small-440x280.png"
if (Test-Path $smallPath) {
    $img = [System.Drawing.Image]::FromFile($smallPath)
    Write-Host "Original Small Tile: $($img.Width)x$($img.Height)"

    $newWidth = 440
    $newHeight = 280
    $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($newImg)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)

    $img.Dispose()
    $graphics.Dispose()

    # Save to temp first, then replace
    $tempPath = "$screenshotsPath\promo-small-440x280-resized.png"
    $newImg.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $newImg.Dispose()

    # Replace original
    Remove-Item $smallPath -Force
    Rename-Item $tempPath $smallPath
    Write-Host "Small Tile resized to: 440x280"
}

# Resize Marquee to 1400x560
$marqueePath = "$screenshotsPath\promo-marquee-1400x560.png"
if (Test-Path $marqueePath) {
    $img = [System.Drawing.Image]::FromFile($marqueePath)
    Write-Host "Original Marquee: $($img.Width)x$($img.Height)"

    $newWidth = 1400
    $newHeight = 560
    $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($newImg)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)

    $img.Dispose()
    $graphics.Dispose()

    # Save to temp first, then replace
    $tempPath = "$screenshotsPath\promo-marquee-1400x560-resized.png"
    $newImg.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $newImg.Dispose()

    # Replace original
    Remove-Item $marqueePath -Force
    Rename-Item $tempPath $marqueePath
    Write-Host "Marquee resized to: 1400x560"
}

Write-Host "`nDone! Both images resized."
