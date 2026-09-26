Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = (Get-Location).Path
}

$pngSource = Join-Path $projectRoot "client\public\jobflow-cyan-radar.png"
if (-not (Test-Path $pngSource)) {
    Write-Error "No se encontro la imagen fuente: $pngSource"
    exit 1
}

$srcBmp = [System.Drawing.Bitmap]::FromFile($pngSource)
$sizes = @(256, 128, 64, 48, 32, 16)
$pngStreams = @()

foreach ($s in $sizes) {
    $resized = New-Object System.Drawing.Bitmap($s, $s)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcBmp, 0, 0, $s, $s)
    $g.Dispose()
    
    $ms = New-Object System.IO.MemoryStream
    $resized.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngStreams += @{ Size = $s; Bytes = $ms.ToArray() }
    $resized.Dispose()
    $ms.Dispose()
}

$srcBmp.Dispose()

$count = $pngStreams.Count
$headerSize = 6
$dirEntrySize = 16
$offset = $headerSize + ($dirEntrySize * $count)

$icoMs = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($icoMs)

# Header ICO
$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Type (1 = Icon)
$bw.Write([uint16]$count) # Número de resoluciones

# Entradas del directorio ICO
foreach ($img in $pngStreams) {
    $w = if ($img.Size -ge 256) { [byte]0 } else { [byte]$img.Size }
    $h = if ($img.Size -ge 256) { [byte]0 } else { [byte]$img.Size }
    $bw.Write($w) # Ancho
    $bw.Write($h) # Alto
    $bw.Write([byte]0) # Colores
    $bw.Write([byte]0) # Reservado
    $bw.Write([uint16]1) # Planos de color
    $bw.Write([uint16]32) # Bits por pixel
    $bw.Write([uint32]$img.Bytes.Length) # Tamaño en bytes
    $bw.Write([uint32]$offset) # Offset donde inicia la imagen
    $offset += $img.Bytes.Length
}

# Cuerpos de las imágenes PNG
foreach ($img in $pngStreams) {
    $bw.Write($img.Bytes)
}

$bw.Flush()
$icoBytes = $icoMs.ToArray()

$icoRoot = Join-Path $projectRoot "jobflow-radar.ico"
$icoOld = Join-Path $projectRoot "jobflow.ico"
$icoFavicon = Join-Path $projectRoot "client\public\favicon.ico"

[System.IO.File]::WriteAllBytes($icoRoot, $icoBytes)
[System.IO.File]::WriteAllBytes($icoOld, $icoBytes)
[System.IO.File]::WriteAllBytes($icoFavicon, $icoBytes)

$bw.Dispose()
$icoMs.Dispose()

Write-Host "Icono generado con éxito en: $icoRoot" -ForegroundColor Green
