@echo off
echo Iniciando servidor local para Trozos de Sabiduria...
echo.
echo Una vez que el servidor este listo:
echo 1. Abre tu navegador
echo 2. Ve a http://localhost:8000
echo.
echo Presiona Ctrl+C para detener el servidor.
echo.
python -m http.server 8000
pause
