@echo off
echo ========================================
echo   TECCIA - Empaquetando para VPS
echo ========================================
echo.

echo [1/4] Instalando dependencias y construyendo Frontend...
call npm install
call npm run build

echo.
echo [2/4] Preparando carpeta de despliegue (teccia_vps)...
if exist "teccia_vps" rmdir /s /q "teccia_vps"
mkdir "teccia_vps"

echo.
echo [3/4] Copiando archivos necesarios...
echo   - Copiando Backend...
xcopy "server" "teccia_vps\server\" /E /I /Y
echo   - Copiando Frontend Build (dist)...
xcopy "dist" "teccia_vps\dist\" /E /I /Y
echo   - Copiando package.json raiz...
copy "package.json" "teccia_vps\"

echo.
echo [4/4] Creando instrucciones de instalacion...
echo # Instrucciones de Despliegue en VPS > teccia_vps\LEEME.txt
echo. >> teccia_vps\LEEME.txt
echo 1. Sube la carpeta 'teccia_vps' a tu servidor. >> teccia_vps\LEEME.txt
echo 2. Entra en la carpeta: >> teccia_vps\LEEME.txt
echo    cd teccia_vps >> teccia_vps\LEEME.txt
echo. >> teccia_vps\LEEME.txt
echo 3. Instala las dependencias del servidor: >> teccia_vps\LEEME.txt
echo    cd server >> teccia_vps\LEEME.txt
echo    npm install >> teccia_vps\LEEME.txt
echo    cd .. >> teccia_vps\LEEME.txt
echo. >> teccia_vps\LEEME.txt
echo 4. Configuracion: >> teccia_vps\LEEME.txt
echo    - Renombra 'server/.env.example' a 'server/.env' >> teccia_vps\LEEME.txt
echo    - Edita 'server/.env' y configura el PUERTO y otros valores si es necesario. >> teccia_vps\LEEME.txt
echo. >> teccia_vps\LEEME.txt
echo 5. IMPORTANTE - Persistencia de Datos: >> teccia_vps\LEEME.txt
echo    - La carpeta 'server/data' contiene la base de datos de usuarios. >> teccia_vps\LEEME.txt
echo    - Asegurate de NO SOBREESCRIBIR esta carpeta en futuros despliegues si quieres conservar los usuarios. >> teccia_vps\LEEME.txt
echo    - Haz backups regulares de 'server/data'. >> teccia_vps\LEEME.txt
echo. >> teccia_vps\LEEME.txt
echo 6. Inicia la aplicacion: >> teccia_vps\LEEME.txt
echo    node server/index.js >> teccia_vps\LEEME.txt
echo. >> teccia_vps\LEEME.txt
echo La aplicacion estara corriendo en el puerto configurado (default 3002). >> teccia_vps\LEEME.txt
echo Puedes usar PM2 para mantenerla activa: >> teccia_vps\LEEME.txt
echo    npm install -g pm2 >> teccia_vps\LEEME.txt
echo    pm2 start server/index.js --name "teccia-app" >> teccia_vps\LEEME.txt

echo.
echo ========================================
echo   LISTO! Carpeta 'teccia_vps' creada.
echo ========================================
echo Sube el contenido de 'teccia_vps' a tu servidor.
echo.
echo.
