# 🚀 TECCIA - Guía de Deployment en VPS

## 🌐 Dominio: **k4.com.ar**

## 📋 INFORMACIÓN TÉCNICA DEL ENTORNO LOCAL

---

## ✅ 1. VERSIÓN EXACTA DE NODE.JS

```
Node.js: v22.13.1
npm: 10.9.2
```

⚠️ **IMPORTANTE**: Esta versión de Node.js es relativamente nueva. Para whatsapp-web.js se recomienda usar **Node 18.x LTS** o **Node 20.x LTS** en producción para mayor estabilidad.

**Recomendación para VPS:**
```bash
# Usar NVM para instalar la versión correcta
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20.10.0
nvm use 20.10.0
nvm alias default 20.10.0
```

---

## ✅ 2. SISTEMA OPERATIVO RECOMENDADO

**Recomendación: Ubuntu 22.04 LTS**

### Dependencias necesarias para Puppeteer/Chromium:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  gconf-service \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils \
  wget \
  libgbm-dev
```

---

## ✅ 3. RUTA EXACTA DE SESIONES (LocalAuth)

Las sesiones de WhatsApp se guardan en:

```
📁 server/.wwebjs_auth/
   └── session-{tenantId}-{sessionId}/
       └── Default/
           └── ... (datos de Chrome/Puppeteer)

📁 server/.wwebjs_cache/
   └── ... (caché de puppeteer)
```

### Estructura de ejemplo:
```
server/
├── .wwebjs_auth/
│   ├── session-tenant_abc123-main/
│   ├── session-tenant_abc123-secundaria/
│   └── session-tenant_xyz789-main/
└── .wwebjs_cache/
```

**Código relevante (whatsappClient.js línea 57):**
```javascript
authStrategy: new LocalAuth({ clientId: `${clientId}-${sessionId}` })
```

### Para deploy:
```bash
# Crear directorios con permisos correctos
mkdir -p /var/www/teccia/server/.wwebjs_auth
mkdir -p /var/www/teccia/server/.wwebjs_cache
chmod -R 755 /var/www/teccia/server/.wwebjs_auth
chmod -R 755 /var/www/teccia/server/.wwebjs_cache
chown -R www-data:www-data /var/www/teccia
```

---

## ✅ 4. ARCHIVO .ENV DEL BACKEND

Crear archivo `server/.env`:

```env
# Puerto del servidor
PORT=3002

# Secreto para JWT (¡CAMBIAR ESTO EN PRODUCCIÓN!)
JWT_SECRET=tu_secreto_super_seguro_CAMBIAR_ESTO_12345

# Entorno
NODE_ENV=production

# Origen permitido para CORS (tu dominio o IP pública)
ALLOWED_ORIGIN=https://tu-dominio.com
# O si usas IP:
# ALLOWED_ORIGIN=http://45.172.xxx.xxx
```

### ⚠️ JWT_SECRET ACTUAL EN CÓDIGO (auth.js línea 3):
```javascript
const JWT_SECRET = 'tu_secreto_super_seguro_123';
```

**Para producción, CAMBIAR a variable de entorno en `server/middleware/auth.js`:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_123';
```

---

## ✅ 5. COMANDO EXACTO PARA INICIAR BACKEND

```bash
cd server
node index.js
```

### Con PM2 (recomendado para producción):
```bash
pm2 start server/index.js --name "teccia-backend" --cwd /var/www/teccia
pm2 save
pm2 startup
```

---

## ✅ 6. COMANDO EXACTO PARA INICIAR FRONTEND

**Desarrollo:**
```bash
npm run dev
```

**Producción (generar build):**
```bash
npm run build
```

Esto genera la carpeta `dist/` que se sirve estáticamente.

---

## ✅ 7. URL DONDE EL FRONTEND CONSUME EL BACKEND

**Configuración actual (`src/socket.js` línea 24):**
```javascript
export const socket = io('http://localhost:3002', {
    transports: ['websocket', 'polling'],
    // ...
});
```

### Para producción, MODIFICAR `src/socket.js`:
```javascript
// Detectar automáticamente el host en producción
const BACKEND_URL = import.meta.env.PROD 
    ? window.location.origin 
    : 'http://localhost:3002';

export const socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    // ...
});
```

**O crear `.env` en raíz del frontend:**
```env
VITE_BACKEND_URL=https://tu-dominio.com
# O
VITE_BACKEND_URL=http://45.172.xxx.xxx:3002
```

---

## ✅ 8. IP PÚBLICA / DOMINIO DEL VPS

**Esto lo debes proporcionar tú:**
```
IP Pública: _____________
Dominio: _____________
```

---

# 🔧 CONFIGURACIÓN COMPLETA PARA VPS

## Paso 1: Preparar servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias de Chromium (ver sección 2)

# Instalar NVM y Node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20.10.0
nvm use 20.10.0
nvm alias default 20.10.0

# Instalar PM2
npm install -g pm2

# Instalar Nginx
sudo apt install nginx -y
```

## Paso 2: Clonar/Subir proyecto

```bash
sudo mkdir -p /var/www/teccia
cd /var/www/teccia
# Subir archivos vía SCP, Git, o FTP

# Instalar dependencias backend
cd server
npm install

# Instalar dependencias frontend
cd ..
npm install
```

## Paso 3: Crear archivo .env

```bash
cat > /var/www/teccia/server/.env << 'EOF'
PORT=3002
JWT_SECRET=TU_SECRETO_SUPER_SEGURO_AQUI_CAMBIAR
NODE_ENV=production
ALLOWED_ORIGIN=https://tu-dominio.com
EOF
```

## Paso 4: Compilar frontend

```bash
cd /var/www/teccia
npm run build
```

## Paso 5: Configurar PM2

```bash
cd /var/www/teccia/server
pm2 start index.js --name "teccia-backend"
pm2 save
pm2 startup
```

## Paso 6: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/teccia
```

**Contenido del archivo:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # O tu IP pública

    # Frontend - servir archivos estáticos
    root /var/www/teccia/dist;
    index index.html;

    # Proxy para API
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy para WebSocket (Socket.IO)
    location /socket.io {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/teccia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Paso 7: SSL con Certbot (Opcional pero recomendado)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com
```

---

# 📝 MODIFICACIONES NECESARIAS EN EL CÓDIGO

## 1. `src/socket.js` - Hacer dinámico el URL del backend

```javascript
import { io } from 'socket.io-client';

const getToken = () => {
    const token = localStorage.getItem('token');
    if (token) return token;

    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            return userData.token;
        } catch (e) {
            console.error('[SOCKET] Error parsing user data:', e);
            return null;
        }
    }
    return null;
};

// URL dinámica según entorno
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
    (import.meta.env.PROD ? window.location.origin : 'http://localhost:3002');

export const socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    auth: {
        token: getToken()
    }
});

// ... resto del código igual
```

## 2. `server/middleware/auth.js` - JWT desde variable de entorno

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_123';

// ... resto igual
```

---

# 🔍 VERIFICACIÓN POST-DEPLOY

```bash
# Verificar que PM2 está corriendo
pm2 status

# Ver logs del backend
pm2 logs teccia-backend

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar puertos
sudo netstat -tlnp | grep -E '80|443|3002'

# Verificar sesiones WhatsApp
ls -la /var/www/teccia/server/.wwebjs_auth/
```

---

# ⚡ COMANDOS ÚTILES

```bash
# Reiniciar backend
pm2 restart teccia-backend

# Ver logs en tiempo real
pm2 logs teccia-backend --lines 100

# Reiniciar Nginx
sudo systemctl restart nginx

# Reconstruir frontend después de cambios
cd /var/www/teccia && npm run build

# Backup de sesiones
tar -czvf wwebjs_backup.tar.gz /var/www/teccia/server/.wwebjs_auth
```

---

**Fecha de generación:** 2025-12-05
**Entorno de origen:** Windows 10/11, Node v22.13.1
