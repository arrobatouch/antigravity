const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');
const { getClientManager } = require('../whatsappClient');

// ============================================
// AUTHENTICATION MIDDLEWARE FOR AGENT API
// ============================================

const agentAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded.isAgent) {
            return res.status(403).json({ error: 'Invalid agent token' });
        }
        req.agent = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// ============================================
// AGENT AUTHENTICATION
// ============================================

/**
 * POST /api/agent/auth
 * Authenticate an external agent
 * Body: { tenantId, apiKey }
 * Returns: JWT token for subsequent requests
 */
router.post('/auth', (req, res) => {
    const { tenantId, apiKey } = req.body;

    if (!tenantId || !apiKey) {
        return res.status(400).json({ error: 'tenantId and apiKey are required' });
    }

    // Validate API key
    const isValid = db.validateApiKey(tenantId, apiKey);
    if (!isValid) {
        // Log failed attempt
        db.logAgentActivity(tenantId, 'auth_failed', { apiKey: apiKey.substring(0, 10) + '...' });
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get tenant info
    const users = db.getAllUsers();
    const tenant = users.find(u => u.tenantId === tenantId);
    if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
    }

    // Generate JWT token
    const token = jwt.sign({
        tenantId,
        isAgent: true,
        tenantName: tenant.companyName || tenant.username
    }, JWT_SECRET, { expiresIn: '24h' });

    // Log successful auth
    db.logAgentActivity(tenantId, 'auth_success', { tenantName: tenant.companyName });

    res.json({
        token,
        tenant: {
            tenantId,
            name: tenant.companyName || tenant.username,
            email: tenant.email
        }
    });
});

// ============================================
// MESSAGES API
// ============================================

/**
 * POST /api/agent/messages/send
 * Send a WhatsApp message via agent
 * Body: { to, message }
 */
router.post('/messages/send', agentAuthMiddleware, async (req, res) => {
    const { tenantId } = req.agent;
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'to and message are required' });
    }

    try {
        const clientManager = getClientManager();
        await clientManager.sendMessage(tenantId, to, message);

        // Log activity
        db.logAgentActivity(tenantId, 'message_sent', { to, messageLength: message.length });

        res.json({
            success: true,
            to,
            sentAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Agent message send error:', err);
        db.logAgentActivity(tenantId, 'message_send_failed', { to, error: err.message });
        res.status(500).json({ error: 'Failed to send message', details: err.message });
    }
});

/**
 * POST /api/agent/messages/incoming
 * Webhook for receiving incoming messages (for future use)
 * Body: { from, message, timestamp }
 */
router.post('/messages/incoming', agentAuthMiddleware, (req, res) => {
    const { tenantId } = req.agent;
    const { from, message, timestamp } = req.body;

    if (!from || !message) {
        return res.status(400).json({ error: 'from and message are required' });
    }

    // Log incoming message
    db.logAgentActivity(tenantId, 'message_received', { from, messageLength: message.length, timestamp });

    res.json({
        success: true,
        received: true,
        processedAt: new Date().toISOString()
    });
});

// ============================================
// TAGS API
// ============================================

/**
 * GET /api/agent/tags
 * Get all tags for the tenant
 */
router.get('/tags', agentAuthMiddleware, (req, res) => {
    const { tenantId } = req.agent;

    try {
        const tags = db.getTagsByTenant(tenantId);

        // Log activity
        db.logAgentActivity(tenantId, 'tags_retrieved', { count: tags.length });

        res.json(tags);
    } catch (err) {
        console.error('Agent tags retrieval error:', err);
        res.status(500).json({ error: 'Failed to retrieve tags', details: err.message });
    }
});

/**
 * POST /api/agent/tags/query
 * Query tags by keyword (optional helper endpoint)
 * Body: { query }
 */
router.post('/tags/query', agentAuthMiddleware, (req, res) => {
    const { tenantId } = req.agent;
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'query is required' });
    }

    try {
        const allTags = db.getTagsByTenant(tenantId);
        const queryLower = query.toLowerCase();

        // Simple fuzzy match
        const matchedTags = allTags.filter(tag =>
            tag.description.toLowerCase().includes(queryLower) ||
            tag.category.toLowerCase().includes(queryLower) ||
            tag.template.toLowerCase().includes(queryLower)
        );

        // Log activity
        db.logAgentActivity(tenantId, 'tags_queried', { query, matches: matchedTags.length });

        res.json({
            query,
            matches: matchedTags.length,
            tags: matchedTags
        });
    } catch (err) {
        console.error('Agent tags query error:', err);
        res.status(500).json({ error: 'Failed to query tags', details: err.message });
    }
});

// ============================================
// TENANT CONFIGURATION
// ============================================

/**
 * GET /api/agent/tenant/config
 * Get tenant configuration and status
 */
router.get('/tenant/config', agentAuthMiddleware, (req, res) => {
    const { tenantId } = req.agent;

    try {
        const users = db.getAllUsers();
        const tenant = users.find(u => u.tenantId === tenantId);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        const clientManager = getClientManager();
        const whatsappStatus = clientManager.getClientStatus ?
            clientManager.getClientStatus(tenantId) :
            { status: 'unknown' };

        // Log activity
        db.logAgentActivity(tenantId, 'config_retrieved', {});

        res.json({
            tenantId,
            name: tenant.companyName || tenant.username,
            email: tenant.email,
            mobile: tenant.mobile,
            employees: tenant.employees,
            status: tenant.status,
            createdAt: tenant.createdAt,
            whatsapp: whatsappStatus
        });
    } catch (err) {
        console.error('Agent config retrieval error:', err);
        res.status(500).json({ error: 'Failed to retrieve configuration', details: err.message });
    }
});

// ============================================
// AGENT ACTIVITY LOGS
// ============================================

/**
 * POST /api/agent/logs
 * Log agent activity (for external agents to report their actions)
 * Body: { action, metadata }
 */
router.post('/logs', agentAuthMiddleware, (req, res) => {
    const { tenantId } = req.agent;
    const { action, metadata = {} } = req.body;

    if (!action) {
        return res.status(400).json({ error: 'action is required' });
    }

    try {
        const logEntry = db.logAgentActivity(tenantId, action, metadata);
        res.json({
            success: true,
            logId: logEntry.id,
            timestamp: logEntry.timestamp
        });
    } catch (err) {
        console.error('Agent logging error:', err);
        res.status(500).json({ error: 'Failed to log activity', details: err.message });
    }
});

/**
 * GET /api/agent/logs
 * Get agent activity logs
 * Query: ?limit=100
 */
router.get('/logs', agentAuthMiddleware, (req, res) => {
    const { tenantId } = req.agent;
    const limit = parseInt(req.query.limit) || 100;

    try {
        const logs = db.getAgentLogs(tenantId, limit);
        res.json({
            tenantId,
            count: logs.length,
            logs
        });
    } catch (err) {
        console.error('Agent logs retrieval error:', err);
        res.status(500).json({ error: 'Failed to retrieve logs', details: err.message });
    }
});

module.exports = router;
