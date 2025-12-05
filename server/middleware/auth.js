const jwt = require('jsonwebtoken');

// JWT Secret - configurable via variable de entorno
// ⚠️ En producción DEBE configurarse en .env con un valor seguro
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_123';

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
};

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ error: 'Invalid token.' });
    }

    req.user = decoded;
    next();
};

const socketAuthMiddleware = (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
    }

    socket.user = decoded;
    next();
};

module.exports = {
    authMiddleware,
    socketAuthMiddleware,
    JWT_SECRET
};
