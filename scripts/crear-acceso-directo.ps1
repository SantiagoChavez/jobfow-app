# Script de generación y actualización de Accesos Directos de JobFlow
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = (Get-Location).Path
}

$icoPath = Join-Path $projectRoot "jobflow-radar.ico"
$batPath = Join-Path $projectRoot "iniciar-jobflow.bat"

# Obtener rutas de escritorio (escritorio activo de Windows / OneDrive)
$desktopPaths = @(
    [Environment]::GetFolderPath('Desktop'),
    [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
) | Select-Object -Unique | Where-Object { Test-Path $_ }

$wshShell = New-Object -ComObject WScript.Shell

foreach ($desktop in $desktopPaths) {
    # 1. Acceso directo para ejecución Local
    $shortcutLocalPath = Join-Path $desktop "JobFlow (Local).lnk"
    if (Test-Path $shortcutLocalPath) {
        Remove-Item $shortcutLocalPath -Force -ErrorAction SilentlyContinue
    }
    $shortcutLocal = $wshShell.CreateShortcut($shortcutLocalPath)
    $shortcutLocal.TargetPath = $batPath
    $shortcutLocal.WorkingDirectory = $projectRoot
    $shortcutLocal.IconLocation = "$icoPath,0"
    $shortcutLocal.Description = "Iniciar JobFlow Localmente (Frontend + Backend)"
    $shortcutLocal.Save()
    Write-Host "Acceso directo local creado: $shortcutLocalPath"

    # 2. Acceso directo para versión Web Oficial en Vercel
    $shortcutWebPath = Join-Path $desktop "JobFlow (Web).lnk"
    if (Test-Path $shortcutWebPath) {
        Remove-Item $shortcutWebPath -Force -ErrorAction SilentlyContinue
    }
    $shortcutWeb = $wshShell.CreateShortcut($shortcutWebPath)
    $shortcutWeb.TargetPath = "https://jobfow-app.vercel.app"
    $shortcutWeb.IconLocation = "$icoPath,0"
    $shortcutWeb.Description = "Abrir JobFlow Web en Produccion"
    $shortcutWeb.Save()
    Write-Host "Acceso directo web creado: $shortcutWebPath"
}

# Refrescar caché de iconos en Windows
try {
    Add-Type -TypeDefinition @"
    using System;
    using System.Runtime.InteropServices;
    public class ShellNotification {
        [DllImport("shell32.dll")]
        public static extern void SHChangeNotify(int eventId, int flags, IntPtr item1, IntPtr item2);
    }
"@
    [ShellNotification]::SHChangeNotify(0x08000000, 0x0000, [IntPtr]::Zero, [IntPtr]::Zero)
} catch {}

Write-Host "`nAccesos directos actualizados con éxito con el icono Cyber Cyan Radar!" -ForegroundColor Green
