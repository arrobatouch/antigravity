@echo off
echo ========================================
echo   TECCIA - Iniciando Aplicacion
echo ========================================
echo.

echo [1/3] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias - esto puede tardar unos minutos...
    call npm install
) else (
    echo Dependencias ya instaladas.
)

echo.
echo [2/3] Iniciando servidor backend (Puerto 3002)...
start "TECCIA Backend" cmd /k "cd /d %~dp0server && node index.js"

echo.
echo [3/3] Esperando 3 segundos antes de iniciar frontend...
timeout /t 3 /nobreak > nul

echo Iniciando servidor frontend (Puerto 5173)...
start "TECCIA Frontend" cmd /k "cd /d %~dp0 && npx vite"

echo.
echo ========================================
echo   Servidores iniciados correctamente
echo ========================================
echo.
echo Backend:  http://localhost:3002
echo Frontend: http://localhost:5173
echo.
echo Abriendo navegador en 5 segundos...
timeout /t 5 /nobreak > nul
start http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
