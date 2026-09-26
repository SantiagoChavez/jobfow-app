@echo off
title JobFlow - Radar & Career Tracker
color 0B
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo   🚀 INICIANDO JOBFLOW (Radar & Career Tracker)
echo ========================================================
echo.

:: Detectar gestor de paquetes (pnpm o npm)
where pnpm >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "RUN_CMD=pnpm dev"
) else (
    set "RUN_CMD=npm run dev"
)

echo [*] Iniciando Backend en puerto 5000...
start "JobFlow_Backend" /min cmd /k "cd /d "%~dp0server" && %RUN_CMD%"

echo [*] Iniciando Frontend en puerto 5173...
start "JobFlow_Frontend" /min cmd /k "cd /d "%~dp0client" && %RUN_CMD%"

echo [*] Esperando que los servidores se inicialicen...
timeout /t 3 /nobreak >nul

echo [*] Abriendo JobFlow en el navegador...
powershell -NoProfile -Command "Start-Process 'http://localhost:5173'"

echo.
echo ========================================================
echo   ✅ JobFlow está ejecutándose correctamente:
echo      • Frontend Web: http://localhost:5173
echo      • Backend API:  http://localhost:5000
echo.
echo   [!] Para detener JobFlow y cerrar los servidores,
echo       presiona cualquier tecla en esta ventana.
echo ========================================================
echo.
pause >nul

echo [*] Deteniendo servidores de JobFlow...
taskkill /fi "WINDOWTITLE eq JobFlow_Backend*" /f /t >nul 2>&1
taskkill /fi "WINDOWTITLE eq JobFlow_Frontend*" /f /t >nul 2>&1
echo [OK] Servidores detenidos.
timeout /t 1 /nobreak >nul
exit
