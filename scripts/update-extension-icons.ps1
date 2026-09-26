Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = (Get-Location).Path
}

$pngSource = Join-Path $projectRoot "client\public\jobflow-cyan-radar.png"
$srcBmp = [System.Drawing.Bitmap]::FromFile($pngSource)

$sizes = @(16, 48, 128)
foreach ($s in $sizes) {
    $targetPath = Join-Path $projectRoot "extension\assets\icon$s.png"
    $resized = New-Object System.Drawing.Bitmap($s, $s)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcBmp, 0, 0, $s, $s)
    $resized.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $resized.Dispose()
    Write-Host "Extension icon$s.png actualizada."
}

$srcBmp.Dispose()
Write-Host "Todos los iconos de la extension actualizados a Cyber Cyan Radar!" -ForegroundColor Green
