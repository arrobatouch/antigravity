const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

/**
 * Gestor de Sesiones WhatsApp
 * Crea y gestiona instancias independientes de WhatsApp Web
 * @param {string} sessionId - ID único de la sesión
 * @param {function} onQR - Callback que recibe el QR code como data URL
 * @returns {Promise<Client>} - Cliente WhatsApp inicializado
 */
module.exports = async function makeWASession(sessionId, onQR) {
    console.log(`[WA-SESSION] Creando sesión: ${sessionId}`);

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: sessionId, // Cada QR tiene su carpeta única en .wwebjs_auth
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    // Evento: QR Code generado
    client.on('qr', async (qr) => {
        console.log(`[WA-SESSION] QR generado para: ${sessionId}`);
        try {
            const qrImage = await qrcode.toDataURL(qr);
            onQR(qrImage); // Enviar QR al frontend
        } catch (err) {
            console.error(`[WA-SESSION] Error generando QR para ${sessionId}:`, err);
        }
    });

    // Evento: Cliente listo
    client.on('ready', () => {
        console.log(`[WA-SESSION] ✅ Sesión lista: ${sessionId}`);
    });

    // Evento: Autenticado
    client.on('authenticated', () => {
        console.log(`[WA-SESSION] 🔐 Autenticado: ${sessionId}`);
    });

    // Evento: Fallo de autenticación
    client.on('auth_failure', (msg) => {
        console.error(`[WA-SESSION] ❌ Fallo de autenticación en ${sessionId}:`, msg);
    });

    // Evento: Desconectado
    client.on('disconnected', (reason) => {
        console.log(`[WA-SESSION] 🔌 Desconectado ${sessionId}:`, reason);
    });

    // Inicializar cliente
    try {
        await client.initialize();
        console.log(`[WA-SESSION] Inicialización completada para: ${sessionId}`);
    } catch (err) {
        console.error(`[WA-SESSION] Error inicializando ${sessionId}:`, err);
        throw err;
    }

    return client;
};
