import { io } from 'socket.io-client';

// URL del backend - configurable via variable de entorno
// En desarrollo: http://localhost:3002
// En producción: https://k4.com.ar (o la URL configurada en VITE_API_URL)
const BACKEND_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? window.location.origin : 'http://localhost:3002');

console.log('[SOCKET] Conectando a:', BACKEND_URL);

// Obtener token JWT del localStorage
const getToken = () => {
    // Intentar obtener token directo (como hace App.jsx)
    const token = localStorage.getItem('token');
    if (token) return token;

    // Fallback: intentar obtener del objeto user
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

// Cliente Socket.IO centralizado con autenticación
export const socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    auth: {
        token: getToken() // Enviar token JWT para autenticación
    }
});

// Event listeners para debugging
socket.on('connect', () => {
    console.log('[SOCKET] ✅ Conectado al servidor. ID:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('[SOCKET] ❌ Desconectado:', reason);
});

socket.on('connect_error', (error) => {
    console.error('[SOCKET] ⚠️ Error de conexión:', error.message);
});

socket.on('reconnect', (attemptNumber) => {
    console.log('[SOCKET] 🔄 Reconectado después de', attemptNumber, 'intentos');
});

export default socket;
