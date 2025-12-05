const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

class ClientManager {
    constructor(io) {
        this.io = io;
        // clientId -> { sessions: Map<sessionId, Client>, activeSessions: Set<sessionId> }
        this.clients = new Map();
        // clientId -> sessionId -> { qr, status, aiEnabled, ... }
        this.clientData = new Map();
    }

    async initializeClient(clientId, sessionId = 'main') {
        // Initialize client structure if doesn't exist
        if (!this.clients.has(clientId)) {
            this.clients.set(clientId, {
                sessions: new Map(),
                activeSessions: new Set()
            });
        }

        if (!this.clientData.has(clientId)) {
            this.clientData.set(clientId, new Map());
        }

        const clientStructure = this.clients.get(clientId);
        const clientDataMap = this.clientData.get(clientId);

        // Check if session already exists
        if (clientStructure.sessions.has(sessionId)) {
            const info = clientDataMap.get(sessionId);
            if (info) {
                this.io.to(clientId).emit('status', { status: info.status, sessionId });
                if (info.qr && info.status === 'disconnected') {
                    this.io.to(clientId).emit('qr', info.qr);
                }
                this.io.to(clientId).emit('ai_status', info.aiEnabled);
            }
            return;
        }

        console.log(`Initializing session ${sessionId} for client: ${clientId}`);

        // Initialize session data
        clientDataMap.set(sessionId, {
            qr: null,
            status: 'disconnected',
            aiEnabled: true,
            autoReplyMode: true,
            autoResponses: []
        });

        console.log(`[DEBUG] Creating new Client for ${clientId} session ${sessionId}. AuthId: ${clientId}-${sessionId}`);

        // Configuración de LocalAuth - ruta de sesiones configurable para VPS
        const authConfig = {
            clientId: `${clientId}-${sessionId}`
        };

        // Si existe WA_SESSIONS_PATH, usar esa ruta (para VPS)
        if (process.env.WA_SESSIONS_PATH) {
            authConfig.dataPath = process.env.WA_SESSIONS_PATH;
        }

        // Configuración de Puppeteer - compatible con Ubuntu/VPS
        const puppeteerConfig = {
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
        };

        // Si existe CHROME_PATH, usar ese ejecutable (para VPS con Chromium instalado)
        if (process.env.CHROME_PATH) {
            puppeteerConfig.executablePath = process.env.CHROME_PATH;
        }

        const client = new Client({
            authStrategy: new LocalAuth(authConfig),
            puppeteer: puppeteerConfig
        });

        clientStructure.sessions.set(sessionId, client);
        clientStructure.activeSessions.add(sessionId);
        this.setupEventListeners(client, clientId, sessionId);

        try {
            await client.initialize();
        } catch (err) {
            console.error(`Error initializing session ${sessionId} for ${clientId}:`, err);
        }
    }

    setupEventListeners(client, clientId, sessionId = 'main') {
        const getSessionData = () => {
            const clientDataMap = this.clientData.get(clientId);
            return clientDataMap ? clientDataMap.get(sessionId) : null;
        };

        const setSessionData = (updates) => {
            const clientDataMap = this.clientData.get(clientId);
            if (clientDataMap) {
                const data = clientDataMap.get(sessionId) || {};
                clientDataMap.set(sessionId, { ...data, ...updates });
            }
        };
        client.on('loading_screen', (percent, message) => {
            console.log(`[${clientId}][${sessionId}] LOADING SCREEN`, percent, message);
            this.io.to(clientId).emit('status', {
                status: `Cargando: ${percent}%`,
                sessionId
            });
        });

        client.on('qr', async (qr) => {
            console.log(`[${clientId}][${sessionId}] QR Code received. Hash: ${qr.substring(0, 20)}...`);
            try {
                const qrImage = await qrcode.toDataURL(qr);
                setSessionData({ qr: qrImage, status: 'disconnected' });

                // Emit session_qr for ALL sessions (including main)
                this.io.to(clientId).emit('session_qr', { sessionId, qr: qrImage });

                // Also emit plain 'qr' for backward compatibility with main session
                if (sessionId === 'main') {
                    this.io.to(clientId).emit('qr', qrImage);
                }

                this.io.to(clientId).emit('status', { status: 'disconnected', sessionId });
            } catch (err) {
                console.error(`[${clientId}][${sessionId}] Error generating QR code`, err);
            }
        });

        client.on('ready', () => {
            console.log(`[${clientId}][${sessionId}] WhatsApp Client is ready!`);
            setSessionData({ status: 'connected', qr: null });
            this.io.to(clientId).emit('status', { status: 'connected', sessionId });

            // Emit session list update
            this.emitSessionsList(clientId);
        });

        client.on('authenticated', () => {
            console.log(`[${clientId}][${sessionId}] Authenticated`);
            setSessionData({ status: 'authenticated' });
            this.io.to(clientId).emit('status', { status: 'authenticated', sessionId });
        });

        client.on('auth_failure', (msg) => {
            console.error(`[${clientId}][${sessionId}] AUTHENTICATION FAILURE`, msg);
            setSessionData({ status: 'disconnected' });
            this.io.to(clientId).emit('status', { status: 'disconnected', sessionId });
        });

        client.on('disconnected', (reason) => {
            console.log(`[${clientId}][${sessionId}] Client was logged out`, reason);
            setSessionData({ status: 'disconnected' });
            this.io.to(clientId).emit('status', { status: 'disconnected', sessionId });

            // Re-initialize to allow scanning again
            client.destroy().then(() => {
                client.initialize();
            });
        });

        client.on('message', async msg => {
            const data = getSessionData();
            const isAIEnabled = data ? data.aiEnabled : true;

            console.log(`[${clientId}][${sessionId}] Message received. AI enabled?`, isAIEnabled);

            if (msg.isStatus || msg.broadcast) return;

            this.io.to(clientId).emit('new_message', {
                type: 'incoming',
                text: 'Mensaje recibido',
                time: new Date().toLocaleTimeString(),
                details: msg.body,
                sender: msg.from,
                sessionId  // ← AGREGADO: Identificar sesión de origen
            });

            if (isAIEnabled) {
                this.handleAIResponse(client, clientId, sessionId, msg);
            } else {
                this.io.to(clientId).emit('new_message', {
                    type: 'decision',
                    text: 'Decisión: MANUAL',
                    time: new Date().toLocaleTimeString(),
                    reason: 'IA Desactivada'
                });
            }
        });
    }

    handleAIResponse(client, clientId, sessionId, msg) {
        const clientDataMap = this.clientData.get(clientId);
        const data = clientDataMap ? clientDataMap.get(sessionId) : null;
        const autoReplyMode = data ? data.autoReplyMode : true;
        const autoResponses = data ? data.autoResponses : [];
        const lowerBody = msg.body.toLowerCase();

        if (autoReplyMode) {
            // Modo Respuestas Automáticas: Solo usar respuestas predefinidas
            const matchedResponse = this.findMatchingAutoResponse(lowerBody, autoResponses);

            if (matchedResponse) {
                this.io.to(clientId).emit('new_message', {
                    type: 'analysis',
                    text: `Clasificación: ${matchedResponse.category.toUpperCase()}`,
                    time: new Date().toLocaleTimeString(),
                    confidence: '100%'
                });

                setTimeout(() => {
                    this.io.to(clientId).emit('new_message', {
                        type: 'decision',
                        text: 'Decisión: RESPUESTA_PREDEFINIDA',
                        time: new Date().toLocaleTimeString(),
                        reason: `Respuesta automática: ${matchedResponse.title}`
                    });
                }, 500);

                setTimeout(() => {
                    const reply = matchedResponse.description;
                    msg.reply(reply);

                    this.io.to(clientId).emit('new_message', {
                        type: 'generation',
                        text: 'Enviando respuesta predefinida...',
                        time: new Date().toLocaleTimeString(),
                        output: reply
                    });

                    this.io.to(clientId).emit('new_message', {
                        type: 'outgoing',
                        text: reply,
                        chatId: msg.from,  // Para identificar el chat, pero no como sender
                        time: new Date().toLocaleTimeString(),
                        status: 'success',
                        sessionId
                    });
                }, 1000);
            } else {
                // No hay respuesta predefinida que coincida
                this.io.to(clientId).emit('new_message', {
                    type: 'decision',
                    text: 'Decisión: SIN RESPUESTA',
                    time: new Date().toLocaleTimeString(),
                    reason: 'No hay respuesta automática para esta consulta'
                });
            }
        } else {
            // Modo IA Cognitiva: Usar inteligencia artificial
            const keywords = ['precio', 'hola', 'info', 'casa', 'vendes', 'cuantas', 'stock', 'disponible'];
            const keywordMatch = keywords.find(k => lowerBody.includes(k)) || 'general';

            this.io.to(clientId).emit('new_message', {
                type: 'analysis',
                text: `Análisis IA: CONSULTA_${keywordMatch.toUpperCase()}`,
                time: new Date().toLocaleTimeString(),
                confidence: '95%'
            });

            setTimeout(() => {
                this.io.to(clientId).emit('new_message', {
                    type: 'decision',
                    text: 'Decisión: RESPONDER_IA_COGNITIVA',
                    time: new Date().toLocaleTimeString(),
                    reason: 'Procesando con Inteligencia Artificial'
                });
            }, 1000);

            setTimeout(() => {
                // Aquí iría la llamada a la API de IA (OpenAI, Gemini, etc.)
                const reply = this.generateCognitiveResponse(keywordMatch, msg.body);
                msg.reply(reply);

                this.io.to(clientId).emit('new_message', {
                    type: 'generation',
                    text: 'Respuesta generada por IA...',
                    time: new Date().toLocaleTimeString(),
                    output: reply
                });

                this.io.to(clientId).emit('new_message', {
                    type: 'outgoing',
                    text: reply,
                    chatId: msg.from,  // Para identificar el chat, pero no como sender
                    time: new Date().toLocaleTimeString(),
                    status: 'success',
                    sessionId
                });
            }, 2000);
        }
    }

    findMatchingAutoResponse(messageBody, autoResponses) {
        // Mapa de palabras clave por categoría
        const categoryKeywords = {
            'Precios': ['precio', 'costo', 'cuanto', 'cuánto', 'vale', 'valor'],
            'Horarios': ['horario', 'hora', 'abre', 'cierra', 'abierto', 'cerrado', 'atención'],
            'Consultas Generales': ['hola', 'buenas', 'buen día', 'info', 'información'],
            'Productos': ['producto', 'artículo', 'item', 'tienes', 'venden'],
            'Servicios': ['servicio', 'ofreces', 'hacen', 'realizan'],
            'Soporte': ['ayuda', 'problema', 'error', 'falla', 'no funciona'],
            'Stock': ['stock', 'disponible', 'hay', 'tienen', 'quedan']
        };

        for (const response of autoResponses) {
            const keywords = categoryKeywords[response.category] || [];
            const titleWords = response.title.toLowerCase().split(' ');
            const allKeywords = [...keywords, ...titleWords];

            for (const keyword of allKeywords) {
                if (messageBody.includes(keyword.toLowerCase())) {
                    return response;
                }
            }
        }
        return null;
    }

    generateCognitiveResponse(category, originalMessage) {
        // Respuestas simuladas de IA cognitiva (aquí se integraría OpenAI/Gemini)
        const responses = {
            'precio': 'Gracias por tu interés. Para darte un precio exacto, ¿podrías indicarme qué producto específico te interesa?',
            'hola': '¡Hola! Gracias por contactarnos. Soy el asistente virtual de TECCIA. ¿En qué puedo ayudarte hoy?',
            'stock': 'Déjame verificar la disponibilidad de ese producto. ¿Podrías darme más detalles sobre lo que buscas?',
            'disponible': 'Para verificar disponibilidad, necesito saber qué producto específico te interesa.',
            'general': 'Gracias por escribirnos. Un asesor te atenderá en breve. ¿Hay algo específico en lo que pueda ayudarte mientras tanto?'
        };
        return responses[category] || responses['general'];
    }

    async sendMessage(clientId, sessionId, chatId, text) {
        const clientStructure = this.clients.get(clientId);
        if (!clientStructure) throw new Error('Client not found');

        const client = clientStructure.sessions.get(sessionId);
        if (!client) throw new Error(`Session ${sessionId} not found`);

        await client.sendMessage(chatId, text);
    }

    emitSessionsList(clientId) {
        const clientStructure = this.clients.get(clientId);
        const clientDataMap = this.clientData.get(clientId);

        if (!clientStructure || !clientDataMap) return;

        const sessions = [];
        for (const [sessionId, client] of clientStructure.sessions) {
            const data = clientDataMap.get(sessionId);
            sessions.push({
                id: sessionId,
                name: sessionId === 'main' ? 'Conexión WhatsApp' : `Conexión ${sessionId}`,
                status: data?.status || 'disconnected',
                phoneNumber: data?.phoneNumber || null
            });
        }

        this.io.to(clientId).emit('sessions_list', sessions);
    }

    toggleAI(clientId, sessionId, enabled) {
        const clientDataMap = this.clientData.get(clientId);
        if (clientDataMap) {
            const data = clientDataMap.get(sessionId);
            if (data) {
                data.aiEnabled = enabled;
                console.log(`[${clientId}][${sessionId}] AI Toggled: ${enabled}`);
            }
        }
    }

    toggleAutoReplyMode(clientId, sessionId, enabled) {
        const clientDataMap = this.clientData.get(clientId);
        if (clientDataMap) {
            const data = clientDataMap.get(sessionId);
            if (data) {
                data.autoReplyMode = enabled;
                console.log(`[${clientId}][${sessionId}] Auto Reply Mode: ${enabled}`);
            }
        }
    }

    updateAutoResponses(clientId, sessionId, responses) {
        const clientDataMap = this.clientData.get(clientId);
        if (clientDataMap) {
            const data = clientDataMap.get(sessionId);
            if (data) {
                data.autoResponses = responses;
                console.log(`[${clientId}][${sessionId}] Auto Responses Updated: ${responses.length}`);
            }
        }
    }

    async restartClient(clientId, sessionId = 'main', hard = false) {
        console.log(`[${clientId}][${sessionId}] Restarting session... Hard: ${hard}`);

        const clientStructure = this.clients.get(clientId);
        if (!clientStructure) return;

        const client = clientStructure.sessions.get(sessionId);
        if (client) {
            await client.destroy();

            if (hard) {
                const authPath = path.join(__dirname, '.wwebjs_auth', `session-${clientId}-${sessionId}`);
                if (fs.existsSync(authPath)) {
                    fs.rmSync(authPath, { recursive: true, force: true });
                }
            }

            // Remove session
            clientStructure.sessions.delete(sessionId);
            clientStructure.activeSessions.delete(sessionId);

            const clientDataMap = this.clientData.get(clientId);
            if (clientDataMap) {
                clientDataMap.delete(sessionId);
            }

            // Re-init session
            await this.initializeClient(clientId, sessionId);
        }
    }
}

let instance = null;

const initializeWhatsApp = (io) => {
    if (!instance) {
        instance = new ClientManager(io);
    }
    return instance;
};

const getClientManager = () => instance;

module.exports = { initializeWhatsApp, getClientManager };

