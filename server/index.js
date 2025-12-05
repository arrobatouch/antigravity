const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initializeWhatsApp, getClientManager } = require('./whatsappClient');
const db = require('./db');
const { authMiddleware, socketAuthMiddleware, JWT_SECRET } = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const path = require('path');
const agentApiRoutes = require('./routes/agentApi');
require('dotenv').config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend (carpeta dist)
app.use(express.static(path.join(__dirname, '../dist')));

// Mount Agent API routes
app.use('/api/agent', agentApiRoutes);

// API Routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.getUserByUsername(username);

    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Include tenantId and isSuperAdmin in the token payload
    const token = jwt.sign({
        id: user.id,
        username: user.username,
        tenantId: user.tenantId,
        isSuperAdmin: user.isSuperAdmin || false
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            tenantId: user.tenantId,
            isSuperAdmin: user.isSuperAdmin || false
        }
    });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    try {
        // For now, new users get their own tenant (independent)
        const user = db.createUser(username, password);
        res.json({ message: 'User created', userId: user.id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ============ ADMIN API ROUTES ============
// Middleware to check if user is super admin
const requireSuperAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded.isSuperAdmin) {
            return res.status(403).json({ error: 'Access denied. Super admin only.' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware for authenticated users
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Get all tenants
app.get('/api/admin/tenants', requireSuperAdmin, (req, res) => {
    try {
        const tenants = db.getAllTenants();
        res.json(tenants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new tenant
app.post('/api/admin/tenants', requireSuperAdmin, (req, res) => {
    try {
        const { username, password, companyName, mobile, email, employees } = req.body;
        const user = db.createUser(username, password, null, {
            companyName,
            mobile,
            email,
            employees: parseInt(employees) || 0
        });
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update tenant
app.put('/api/admin/tenants/:id', requireSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Don't allow changing isSuperAdmin via API
        delete updates.isSuperAdmin;
        const user = db.updateUser(id, updates);
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete tenant
app.delete('/api/admin/tenants/:id', requireSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        db.deleteUser(id);
        res.json({ message: 'Tenant deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ============ TAG API ROUTES (ADMIN) ============
// Get tags for a specific tenant (admin only)
app.get('/api/admin/tenants/:tenantId/tags', requireSuperAdmin, (req, res) => {
    try {
        const { tenantId } = req.params;
        const tags = db.getTagsByTenant(tenantId);
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create tag for a tenant (admin only)
app.post('/api/admin/tenants/:tenantId/tags', requireSuperAdmin, (req, res) => {
    try {
        const { tenantId } = req.params;
        const tag = db.addTag(tenantId, req.body);
        res.json(tag);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update tag for a tenant (admin only)
app.put('/api/admin/tenants/:tenantId/tags/:tagId', requireSuperAdmin, (req, res) => {
    try {
        const { tenantId, tagId } = req.params;
        const tag = db.updateTag(tenantId, tagId, req.body);
        res.json(tag);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete tag for a tenant (admin only)
app.delete('/api/admin/tenants/:tenantId/tags/:tagId', requireSuperAdmin, (req, res) => {
    try {
        const { tenantId, tagId } = req.params;
        db.deleteTag(tenantId, tagId);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// Get contact data
app.get('/api/contacts/:phoneNumber', requireAuth, (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const contact = contactManager.getContact(phoneNumber);
        res.json(contact || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save/update contact data
app.post('/api/contacts/:phoneNumber', requireAuth, (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const contact = contactManager.saveContact(phoneNumber, req.body);
        res.json(contact);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update contact field
app.patch('/api/contacts/:phoneNumber/:field', requireAuth, (req, res) => {
    try {
        const { phoneNumber, field } = req.params;
        const { value } = req.body;
        const contact = contactManager.updateContactField(phoneNumber, field, value);
        res.json(contact);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ============ TAG API ROUTES (TENANT - for their own tags) ============

// Get own tags (tenant)
app.get('/api/tags', requireAuth, (req, res) => {
    try {
        const tags = db.getTagsByTenant(req.user.tenantId);
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create own tag (tenant)
app.post('/api/tags', requireAuth, (req, res) => {
    try {
        const tag = db.addTag(req.user.tenantId, req.body);
        res.json(tag);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update own tag (tenant)
app.put('/api/tags/:tagId', requireAuth, (req, res) => {
    try {
        const tag = db.updateTag(req.user.tenantId, req.params.tagId, req.body);
        res.json(tag);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete own tag (tenant)
app.delete('/api/tags/:tagId', requireAuth, (req, res) => {
    try {
        db.deleteTag(req.user.tenantId, req.params.tagId);
        res.json({ message: 'Tag deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ============ API KEY MANAGEMENT (for tenant users) ============
app.get('/api/tenant/apikey', requireAuth, (req, res) => {
    try {
        const { tenantId } = req.user;
        let apiKeyData = db.getApiKey(tenantId);

        // If no API key exists, generate one
        if (!apiKeyData) {
            const newKey = db.generateApiKey(tenantId);
            apiKeyData = db.getApiKey(tenantId);
        }

        res.json(apiKeyData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Regenerate API key for tenant
app.post('/api/tenant/apikey/regenerate', requireAuth, (req, res) => {
    try {
        const { tenantId } = req.user;
        const newKey = db.generateApiKey(tenantId);
        const apiKeyData = db.getApiKey(tenantId);
        res.json(apiKeyData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ API KEY MANAGEMENT (for super admin) ============
app.get('/api/admin/tenants/:tenantId/apikey', requireSuperAdmin, (req, res) => {
    try {
        const { tenantId } = req.params;
        const apiKeyData = db.getApiKey(tenantId);

        if (!apiKeyData) {
            return res.status(404).json({ error: 'API key not found' });
        }

        res.json(apiKeyData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/tenants/:tenantId/apikey', requireSuperAdmin, (req, res) => {
    try {
        const { tenantId } = req.params;
        const newKey = db.generateApiKey(tenantId);
        const apiKeyData = db.getApiKey(tenantId);
        res.json(apiKeyData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/tenants/:tenantId/apikey/regenerate', requireSuperAdmin, (req, res) => {
    try {
        const { tenantId } = req.params;
        const newKey = db.generateApiKey(tenantId);
        const apiKeyData = db.getApiKey(tenantId);
        res.json(apiKeyData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cualquier ruta que no sea API, devuelve el index.html (para React Router)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const server = http.createServer(app);

// Configuración de CORS para Socket.io
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176"
];
if (process.env.ALLOWED_ORIGIN) {
    allowedOrigins.push(process.env.ALLOWED_ORIGIN);
}

const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? "*" : allowedOrigins, // En producción permitir todo o configurar específicamente
        methods: ["GET", "POST"]
    }
});

// Initialize WhatsApp Manager (Singleton)
const clientManager = initializeWhatsApp(io);

// Socket.io Auth Middleware
io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
    const userId = socket.user.id;
    const tenantId = socket.user.tenantId; // Get tenantId from token
    console.log(`User connected: ${socket.user.username} (${userId}) Tenant: ${tenantId}`);

    // Join user to their own room AND tenant room
    socket.join(userId);
    socket.join(tenantId);

    // Initialize/Get WhatsApp Client for this TENANT (shared session)
    // We pass tenantId as the identifier for the WhatsApp client
    clientManager.initializeClient(tenantId);

    socket.on('send_message', async (data) => {
        try {
            const sessionId = data.sessionId || 'main';
            await clientManager.sendMessage(tenantId, sessionId, data.chatId, data.text);
        } catch (err) {
            console.error(`Error sending message for tenant ${tenantId}:`, err);
        }
    });

    socket.on('toggle_ai', (data) => {
        const sessionId = data.sessionId || 'main';
        const enabled = data.enabled !== undefined ? data.enabled : data;
        clientManager.toggleAI(tenantId, sessionId, enabled);
    });

    socket.on('toggle_auto_reply_mode', (data) => {
        const sessionId = data.sessionId || 'main';
        const enabled = data.enabled !== undefined ? data.enabled : data;
        clientManager.toggleAutoReplyMode(tenantId, sessionId, enabled);
    });

    socket.on('update_auto_responses', (data) => {
        const sessionId = data.sessionId || 'main';
        const responses = data.responses || data;
        clientManager.updateAutoResponses(tenantId, sessionId, responses);
    });

    socket.on('restart_client', async (data) => {
        const sessionId = data?.sessionId || 'main';
        const hard = data?.hard || false;
        await clientManager.restartClient(tenantId, sessionId, hard);
    });

    socket.on('request_status', (data) => {
        const sessionId = data?.sessionId || 'main';
        clientManager.initializeClient(tenantId, sessionId);
    });

    // New events for multi-session support
    socket.on('request_session_qr', (data) => {
        const sessionId = data.sessionId;
        console.log(`[DEBUG] Received request_session_qr for sessionId: ${sessionId}, tenantId: ${tenantId}`);
        if (sessionId) {
            clientManager.initializeClient(tenantId, sessionId);
        }
    });

    socket.on('init_session', (data) => {
        console.log('[DEBUG] init_session payload:', data);
        const sessionId = data.sessionId;
        console.log(`[DEBUG] Received init_session for sessionId: ${sessionId}, tenantId: ${tenantId}`);
        if (sessionId) {
            console.log(`[DEBUG] Calling initializeClient(${tenantId}, ${sessionId})`);
            clientManager.initializeClient(tenantId, sessionId);
        } else {
            console.error('[DEBUG] init_session received but sessionId is missing!');
        }
    });

    socket.on('disconnect_session', async (data) => {
        const sessionId = data.sessionId;
        if (sessionId) {
            await clientManager.restartClient(tenantId, sessionId, false);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
    });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
