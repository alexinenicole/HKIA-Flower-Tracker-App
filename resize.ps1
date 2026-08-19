Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param([string]$path)
    
    $orig = [System.Drawing.Image]::FromFile($path)
    $bmp = New-Object System.Drawing.Bitmap(400, 400)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Set high quality resizing
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($orig, 0, 0, 400, 400)
    
    $g.Dispose()
    $orig.Dispose()
    
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Resize-Image -path (Resolve-Path 'assets/patterns/glitter.png').Path
Resize-Image -path (Resolve-Path 'assets/patterns/glow.png').Path
Write-Host 'Done resizing glitter.png and glow.png'
