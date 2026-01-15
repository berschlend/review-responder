Add-Type -AssemblyName System.Drawing

$screenshotsPath = "C:\Users\Berend Mainz\Documents\Start-up\reviewresponder-4\chrome-extension\screenshots"
$targetWidth = 1280
$targetHeight = 800

function Resize-Screenshot($filename) {
    $path = "$screenshotsPath\$filename"
    if (Test-Path $path) {
        $img = [System.Drawing.Image]::FromFile($path)
        Write-Host "Original $filename : $($img.Width)x$($img.Height)"

        if ($img.Width -ne $targetWidth -or $img.Height -ne $targetHeight) {
            $newImg = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
            $graphics = [System.Drawing.Graphics]::FromImage($newImg)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

            # Calculate scaling to fit while maintaining aspect ratio, then center
            $scaleX = $targetWidth / $img.Width
            $scaleY = $targetHeight / $img.Height
            $scale = [Math]::Min($scaleX, $scaleY)

            $newWidth = [int]($img.Width * $scale)
            $newHeight = [int]($img.Height * $scale)
            $x = [int](($targetWidth - $newWidth) / 2)
            $y = [int](($targetHeight - $newHeight) / 2)

            # Fill background with white
            $graphics.Clear([System.Drawing.Color]::White)
            $graphics.DrawImage($img, $x, $y, $newWidth, $newHeight)

            $img.Dispose()
            $graphics.Dispose()

            $tempPath = "$screenshotsPath\temp_$filename"
            $newImg.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
            $newImg.Dispose()

            Remove-Item $path -Force
            Rename-Item $tempPath $path
            Write-Host "Resized $filename to: ${targetWidth}x${targetHeight}"
        } else {
            Write-Host "$filename already correct size"
            $img.Dispose()
        }
    } else {
        Write-Host "File not found: $filename"
    }
}

Resize-Screenshot "screenshot-4-business-context.png"
Resize-Screenshot "screenshot-5-style-preferences.png"

Write-Host "`nDone!"
