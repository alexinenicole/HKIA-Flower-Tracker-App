Add-Type -AssemblyName System.Drawing
$imgPath = Resolve-Path 'assets/app-logo.png'
$img = [System.Drawing.Image]::FromFile($imgPath.Path)

$w = $img.Width
$h = $img.Height
$minSize = [Math]::Min($w, $h)

# Create a square bitmap with a transparent background
$bmp = New-Object System.Drawing.Bitmap($minSize, $minSize)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Create circular clip path
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, $minSize, $minSize)
$g.SetClip($path)

# Draw image centered
$srcX = [Math]::Floor(($w - $minSize) / 2)
$srcY = [Math]::Floor(($h - $minSize) / 2)
$srcRect = New-Object System.Drawing.Rectangle($srcX, $srcY, $minSize, $minSize)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $minSize, $minSize)

$g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()
$img.Dispose()
$path.Dispose()

$outPath = 'assets/app-logo-circle.png'
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Move-Item -Force $outPath 'assets/app-logo.png'
Copy-Item -Force 'assets/app-logo.png' 'assets/app-logo.jpg'

# Also save as .ico which might help Windows shortcuts pick it up
function ConvertTo-Icon {
    param($pngPath, $icoPath)
    $bitmap = [System.Drawing.Bitmap]::FromFile($pngPath)
    $iconStream = [System.IO.File]::OpenWrite($icoPath)
    $writer = New-Object System.IO.BinaryWriter($iconStream)
    
    # Write ICO header
    $writer.Write([int16]0) # Reserved
    $writer.Write([int16]1) # Type (1=ICO)
    $writer.Write([int16]1) # Image count
    
    # Write Directory entry
    $width = if ($bitmap.Width -ge 256) { 0 } else { $bitmap.Width }
    $height = if ($bitmap.Height -ge 256) { 0 } else { $bitmap.Height }
    $writer.Write([byte]$width)
    $writer.Write([byte]$height)
    $writer.Write([byte]0) # Color count
    $writer.Write([byte]0) # Reserved
    $writer.Write([int16]1) # Planes
    $writer.Write([int16]32) # BPP
    
    # Get PNG bytes
    $ms = New-Object System.IO.MemoryStream
    $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $ms.ToArray()
    $ms.Dispose()
    
    $writer.Write([int]$pngBytes.Length) # Image size
    $writer.Write([int]22) # Image offset (6 header + 16 dir)
    
    # Write image data
    $writer.Write($pngBytes)
    
    $writer.Close()
    $iconStream.Close()
    $bitmap.Dispose()
}

ConvertTo-Icon 'assets/app-logo.png' 'assets/app-logo.ico'

Write-Host "Circular logo created and ICO generated."
