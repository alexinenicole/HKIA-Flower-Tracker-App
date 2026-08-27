Add-Type -AssemblyName System.Drawing
$imgPath = Resolve-Path 'assets/app-logo.png'
$img = [System.Drawing.Image]::FromFile($imgPath.Path)
$w = $img.Width
$h = $img.Height
$cropW = [int][Math]::Floor($w * 0.6)
$cropH = [int][Math]::Floor($h * 0.6)
$x = [int][Math]::Floor($w * 0.2)
$y = [int][Math]::Floor($h * 0.2)

$bmp = New-Object System.Drawing.Bitmap($cropW, $cropH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$rect = New-Object System.Drawing.Rectangle($x, $y, $cropW, $cropH)
$g.DrawImage($img, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()
$img.Dispose()

$outPath = 'assets/app-logo-cropped.png'
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Move-Item -Force $outPath 'assets/app-logo.png'
Copy-Item -Force 'assets/app-logo.png' 'assets/app-logo.jpg'
Write-Host 'Cropped logo successfully.'
