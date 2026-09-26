Add-Type -AssemblyName System.Drawing

function Create-JobflowIcon {
    param(
        [string]$outputPath = "jobflow.ico",
        [string]$pngPath = "jobflow-logo.png"
    )

    $size = 256
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # 1. Fondo Cuadrado Redondeado (Squircle Dark Navy #060C1B)
    $rect = New-Object System.Drawing.Rectangle(8, 8, 240, 240)
    $radius = 52
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2

    $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()

    # Relleno degradado azul profundo/navy
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point(256, 256)),
        [System.Drawing.Color]::FromArgb(255, 14, 26, 56), # #0E1A38
        [System.Drawing.Color]::FromArgb(255, 6, 12, 27)    # #060C1B
    )
    $g.FillPath($bgBrush, $path)

    # Borde sutil Cyan Neón
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 0, 229, 255), 4) # #00E5FF
    $g.DrawPath($borderPen, $path)

    # 2. Resplandor Ambiental Cyan en el centro del radar
    $glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glowPath.AddEllipse(38, 38, 180, 180)
    $pghBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
    $pghBrush.CenterColor = [System.Drawing.Color]::FromArgb(70, 0, 229, 255)
    $pghBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 6, 12, 27))
    $g.FillEllipse($pghBrush, 38, 38, 180, 180)

    # 3. Anillos Concéntricos del Radar (Cyber Cyan)
    $cx = 128
    $cy = 128

    # Anillo exterior
    $penOuter = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(130, 2, 132, 199), 3.5) # #0284C7
    $g.DrawEllipse($penOuter, 38, 38, 180, 180)

    # Anillo medio
    $penMid = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 0, 229, 255), 4.5) # #00E5FF
    $g.DrawEllipse($penMid, 64, 64, 128, 128)

    # Anillo interior
    $penInner = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 103, 232, 249), 4.5) # #67E8F9
    $g.DrawEllipse($penInner, 92, 92, 72, 72)

    # 4. Retícula guía / Crosshair sutil
    $penCross = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 56, 189, 248), 2) # #38BDF8
    $penCross.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
    $g.DrawLine($penCross, 128, 38, 128, 218)
    $g.DrawLine($penCross, 38, 128, 218, 128)

    # 5. Haz / Brazo de detección del Radar (Hacia la diagonal superior derecha)
    # Haz de barrido translúcido
    $sweepPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $sweepPath.AddPie(38, 38, 180, 180, -45, 45)
    $sweepBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(128, 128)),
        (New-Object System.Drawing.Point(218, 60)),
        [System.Drawing.Color]::FromArgb(120, 0, 229, 255),
        [System.Drawing.Color]::FromArgb(0, 0, 229, 255)
    )
    $g.FillPath($sweepBrush, $sweepPath)

    # Línea de aguja principal Cyber Cyan brillante
    $penSweep = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 0, 229, 255), 7)
    $penSweep.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penSweep.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($penSweep, 128, 128, 202, 80)

    $penSweepCore = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), 2.5)
    $penSweepCore.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $penSweepCore.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($penSweepCore, 128, 128, 198, 83)

    # 6. Centro del radar con núcleo blanco
    $g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 0, 229, 255))), 116, 116, 24, 24)
    $g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 229, 255))), 120, 120, 16, 16)
    $g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))), 124, 124, 8, 8)

    # 7. Punto de detección activa (Target Ping Pulse)
    $g.DrawEllipse((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 0, 229, 255), 2.5)), 170, 62, 22, 22)
    $g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 103, 232, 249))), 176, 68, 10, 10)
    $g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))), 178, 70, 6, 6)

    # Guardar PNG en alta resolución
    $bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "PNG generado: $pngPath"

    $g.Dispose()
    $bmp.Dispose()
}

Create-JobflowIcon -outputPath "jobflow.ico" -pngPath "client\public\jobflow-cyan-radar.png"
