@echo off
title Instalar Acceso Directo de JobFlow
color 0A
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo   Configurando Acceso Directo de JobFlow en Escritorio
echo ========================================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\crear-acceso-directo.ps1"

echo.
echo Presiona cualquier tecla para finalizar...
pause >nul
