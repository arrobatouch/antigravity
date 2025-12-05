const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TAGS_FILE = path.join(DATA_DIR, 'tags.json');
const API_KEYS_FILE = path.join(DATA_DIR, 'api_keys.json');
const AGENT_LOGS_FILE = path.join(DATA_DIR, 'agent_logs.json');
const VARIABLES_FILE = path.join(DATA_DIR, 'variables.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure users file exists
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

// Ensure tags file exists
if (!fs.existsSync(TAGS_FILE)) {
    fs.writeFileSync(TAGS_FILE, JSON.stringify({}, null, 2));
}

// Ensure API keys file exists
if (!fs.existsSync(API_KEYS_FILE)) {
    fs.writeFileSync(API_KEYS_FILE, JSON.stringify({}, null, 2));
}

// Ensure agent logs file exists
if (!fs.existsSync(AGENT_LOGS_FILE)) {
    fs.writeFileSync(AGENT_LOGS_FILE, JSON.stringify({}, null, 2));
}

// Ensure variables file exists
if (!fs.existsSync(VARIABLES_FILE)) {
    fs.writeFileSync(VARIABLES_FILE, JSON.stringify({}, null, 2));
}

const readUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading users file:', err);
        return [];
    }
};

const writeUsers = (users) => {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error writing users file:', err);
    }
};

const db = {
    getAllUsers: () => readUsers(),

    getUserByUsername: (username) => {
        const users = readUsers();
        return users.find(u => u.username === username);
    },

    getUserById: (id) => {
        const users = readUsers();
        return users.find(u => u.id === id);
    },

    createUser: (username, password, tenantId, options = {}) => {
        const users = readUsers();
        if (users.find(u => u.username === username)) {
            throw new Error('User already exists');
        }

        const newUser = {
            id: uuidv4(),
            username,
            password, // In a real app, HASH THIS!
            tenantId: tenantId || uuidv4(), // Use provided tenantId or generate new one (for independent users)
            isSuperAdmin: options.isSuperAdmin || false,
            companyName: options.companyName || '',
            mobile: options.mobile || '',
            email: options.email || '',
            employees: options.employees || 0,
            status: options.status || 'active',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);
        return newUser;
    },

    updateUser: (id, updates) => {
        const users = readUsers();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) {
            throw new Error('User not found');
        }
        users[index] = { ...users[index], ...updates };
        writeUsers(users);
        return users[index];
    },

    deleteUser: (id) => {
        const users = readUsers();
        const filtered = users.filter(u => u.id !== id);
        if (filtered.length === users.length) {
            throw new Error('User not found');
        }
        writeUsers(filtered);
        return true;
    },

    // Tenant management (for super admin)
    getAllTenants: () => {
        const users = readUsers();
        // Return all non-superadmin users (these are the "tenants")
        return users.filter(u => !u.isSuperAdmin);
    },

    // ============ TAG MANAGEMENT ============
    readTags: () => {
        try {
            const data = fs.readFileSync(TAGS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error('Error reading tags file:', err);
            return {};
        }
    },

    writeTags: (tags) => {
        try {
            fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2));
        } catch (err) {
            console.error('Error writing tags file:', err);
        }
    },

    getTagsByTenant: (tenantId) => {
        const allTags = db.readTags();
        return allTags[tenantId] || [];
    },

    saveTagsForTenant: (tenantId, tags) => {
        const allTags = db.readTags();
        allTags[tenantId] = tags;
        db.writeTags(allTags);
        return tags;
    },

    addTag: (tenantId, tagData) => {
        const allTags = db.readTags();
        if (!allTags[tenantId]) {
            allTags[tenantId] = [];
        }
        const newTag = {
            id: uuidv4(),
            code: tagData.code,
            category: tagData.category,
            description: tagData.description,
            template: tagData.template,
            location: tagData.location || '',
            variables: tagData.variables || [],
            createdAt: new Date().toISOString()
        };
        allTags[tenantId].unshift(newTag);
        db.writeTags(allTags);
        return newTag;
    },

    updateTag: (tenantId, tagId, updates) => {
        const allTags = db.readTags();
        if (!allTags[tenantId]) {
            throw new Error('Tenant not found');
        }
        const index = allTags[tenantId].findIndex(t => t.id === tagId);
        if (index === -1) {
            throw new Error('Tag not found');
        }
        allTags[tenantId][index] = { ...allTags[tenantId][index], ...updates };
        db.writeTags(allTags);
        return allTags[tenantId][index];
    },

    deleteTag: (tenantId, tagId) => {
        const allTags = db.readTags();
        if (!allTags[tenantId]) {
            throw new Error('Tenant not found');
        }
        const filtered = allTags[tenantId].filter(t => t.id !== tagId);
        if (filtered.length === allTags[tenantId].length) {
            throw new Error('Tag not found');
        }
        allTags[tenantId] = filtered;
        db.writeTags(allTags);
        return true;
    },

    // ============ API KEY MANAGEMENT ============
    readApiKeys: () => {
        try {
            const data = fs.readFileSync(API_KEYS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error('Error reading API keys file:', err);
            return {};
        }
    },

    writeApiKeys: (keys) => {
        try {
            fs.writeFileSync(API_KEYS_FILE, JSON.stringify(keys, null, 2));
        } catch (err) {
            console.error('Error writing API keys file:', err);
        }
    },

    getApiKey: (tenantId) => {
        const allKeys = db.readApiKeys();
        return allKeys[tenantId];
    }
};

// Seed default users
const seedUsers = () => {
    const users = readUsers();

    // Check and update admin user
    const existingAdmin = users.find(u => u.username === 'admin');
    if (!existingAdmin) {
        console.log('Seeding default admin user...');
        db.createUser('admin', 'admin', 'tenant_admin', { isSuperAdmin: true });
    } else if (!existingAdmin.isSuperAdmin) {
        // Update existing admin to be superadmin
        console.log('Updating admin to superadmin...');
        existingAdmin.isSuperAdmin = true;
        writeUsers(users);
    }

    if (!db.getUserByUsername('user1')) {
        console.log('Seeding user1...');
        db.createUser('user1', 'password', 'tenant_default', {
            companyName: 'Demo Company',
            mobile: '+54 9 11 1234-5678',
            email: 'user1@demo.com',
            employees: 3
        });
    }

    if (!db.getUserByUsername('user2')) {
        console.log('Seeding user2...');
        db.createUser('user2', 'password', 'tenant_company2', {
            companyName: 'Tech Solutions',
            mobile: '+54 9 11 9876-5432',
            email: 'user2@techsolutions.com',
            employees: 5
        });
    }
};

seedUsers();

// ============ VARIABLES MANAGEMENT ============

const readVariables = () => {
    try {
        const data = fs.readFileSync(VARIABLES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading variables file:', err);
        return {};
    }
};

const writeVariables = (variables) => {
    try {
        fs.writeFileSync(VARIABLES_FILE, JSON.stringify(variables, null, 2));
    } catch (err) {
        console.error('Error writing variables file:', err);
    }
};

db.getVariables = (tenantId) => {
    const allVariables = readVariables();
    return allVariables[tenantId] || [];
};

db.createVariable = (tenantId, variableData) => {
    const allVariables = readVariables();
    if (!allVariables[tenantId]) {
        allVariables[tenantId] = [];
    }

    // Check if variable name already exists
    const exists = allVariables[tenantId].find(v => v.name === variableData.name);
    if (exists) {
        throw new Error('Variable with this name already exists');
    }

    const newVariable = {
        id: `var_${uuidv4()}`,
        ...variableData,
        createdAt: new Date().toISOString()
    };

    allVariables[tenantId].push(newVariable);
    writeVariables(allVariables);
    return newVariable;
};

db.updateVariable = (tenantId, variableId, variableData) => {
    const allVariables = readVariables();
    if (!allVariables[tenantId]) {
        throw new Error('Tenant not found');
    }

    const index = allVariables[tenantId].findIndex(v => v.id === variableId);
    if (index === -1) {
        throw new Error('Variable not found');
    }

    // Check if new name conflicts with another variable
    if (variableData.name !== allVariables[tenantId][index].name) {
        const exists = allVariables[tenantId].find(v => v.name === variableData.name && v.id !== variableId);
        if (exists) {
            throw new Error('Variable with this name already exists');
        }
    }

    allVariables[tenantId][index] = {
        ...allVariables[tenantId][index],
        ...variableData,
        id: variableId, // Keep original ID
        updatedAt: new Date().toISOString()
    };

    writeVariables(allVariables);
    return allVariables[tenantId][index];
};

db.deleteVariable = (tenantId, variableId) => {
    const allVariables = readVariables();
    if (!allVariables[tenantId]) {
        throw new Error('Tenant not found');
    }

    const filtered = allVariables[tenantId].filter(v => v.id !== variableId);
    if (filtered.length === allVariables[tenantId].length) {
        throw new Error('Variable not found');
    }

    allVariables[tenantId] = filtered;
    writeVariables(allVariables);
    return true;
};

// ============ API KEYS ============
db.generateApiKey = (tenantId) => {
    const allKeys = db.readApiKeys();
    const apiKey = 'sk-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    allKeys[tenantId] = {
        key: apiKey,
        createdAt: new Date().toISOString(),
        lastUsed: null
    };

    db.writeApiKeys(allKeys);
    return apiKey;
};

db.validateApiKey = (tenantId, apiKey) => {
    const storedKey = db.getApiKey(tenantId);
    if (!storedKey) return false;
    if (storedKey.key === apiKey) {
        // Update last used
        const allKeys = db.readApiKeys();
        allKeys[tenantId].lastUsed = new Date().toISOString();
        db.writeApiKeys(allKeys);
        return true;
    }
    return false;
};

// ============ AGENT LOGS ============
db.readAgentLogs = () => {
    try {
        const data = fs.readFileSync(AGENT_LOGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading agent logs file:', err);
        return {};
    }
};

db.writeAgentLogs = (logs) => {
    try {
        fs.writeFileSync(AGENT_LOGS_FILE, JSON.stringify(logs, null, 2));
    } catch (err) {
        console.error('Error writing agent logs file:', err);
    }
};

db.logAgentActivity = (tenantId, action, metadata = {}) => {
    const allLogs = db.readAgentLogs();
    if (!allLogs[tenantId]) {
        allLogs[tenantId] = [];
    }
    const logEntry = {
        id: uuidv4(),
        action,
        metadata,
        timestamp: new Date().toISOString()
    };
    allLogs[tenantId].unshift(logEntry);
    // Keep only last 1000 logs per tenant
    if (allLogs[tenantId].length > 1000) {
        allLogs[tenantId] = allLogs[tenantId].slice(0, 1000);
    }
    db.writeAgentLogs(allLogs);
    return logEntry;
};

db.getAgentLogs = (tenantId, limit = 100) => {
    const allLogs = db.readAgentLogs();
    const logs = allLogs[tenantId] || [];
    return logs.slice(0, limit);
};

// ============ SESSIONS MANAGEMENT ============
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure sessions file exists
if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}, null, 2));
}

const readSessions = () => {
    try {
        const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading sessions file:', err);
        return {};
    }
};

const writeSessions = (sessions) => {
    try {
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    } catch (err) {
        console.error('Error writing sessions file:', err);
    }
};

db.getSessions = (tenantId) => {
    const allSessions = readSessions();
    return allSessions[tenantId] || [];
};

db.createSession = (tenantId, sessionData) => {
    const allSessions = readSessions();
    if (!allSessions[tenantId]) {
        allSessions[tenantId] = [];
    }

    const newSession = {
        id: `session-${uuidv4()}`,
        name: sessionData.name || 'Nueva Sesión',
        status: 'disconnected',
        phoneNumber: null,
        qrCode: null,
        config: {
            autoReplies: true,
            followUp: false,
            aiEnabled: true,
            ...sessionData.config
        },
        createdAt: new Date().toISOString()
    };

    allSessions[tenantId].push(newSession);
    writeSessions(allSessions);
    return newSession;
};

db.updateSession = (tenantId, sessionId, updates) => {
    const allSessions = readSessions();
    if (!allSessions[tenantId]) {
        throw new Error('Tenant not found');
    }

    const index = allSessions[tenantId].findIndex(s => s.id === sessionId);
    if (index === -1) {
        throw new Error('Session not found');
    }

    allSessions[tenantId][index] = {
        ...allSessions[tenantId][index],
        ...updates,
        id: sessionId, // Keep original ID
        updatedAt: new Date().toISOString()
    };

    writeSessions(allSessions);
    return allSessions[tenantId][index];
};

db.deleteSession = (tenantId, sessionId) => {
    const allSessions = readSessions();
    if (!allSessions[tenantId]) {
        throw new Error('Tenant not found');
    }

    const filtered = allSessions[tenantId].filter(s => s.id !== sessionId);
    if (filtered.length === allSessions[tenantId].length) {
        throw new Error('Session not found');
    }

    allSessions[tenantId] = filtered;
    writeSessions(allSessions);
    return true;
};

module.exports = db;
