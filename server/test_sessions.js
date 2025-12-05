const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'tu_secreto_super_seguro_123';
const URL = 'http://localhost:3002';

// Create a valid token
const token = jwt.sign({
    id: 'test-user-id',
    username: 'testuser',
    tenantId: 'tenant_test',
    isSuperAdmin: true
}, JWT_SECRET, { expiresIn: '1h' });

console.log('Connecting with token:', token.substring(0, 10) + '...');

const socket = io(URL, {
    auth: {
        token: token
    }
});

let session1QR = null;
let session2QR = null;

socket.on('connect', () => {
    console.log('✅ Connected to server');

    // Start Session 1
    console.log('🚀 Requesting Session 1');
    socket.emit('init_session', { sessionId: 'session-1' });
});

socket.on('session_qr', (data) => {
    console.log(`📷 Received QR for ${data.sessionId}, Length: ${data.qr.length}`);
    const hash = data.qr.substring(0, 50); // Just use beginning as proxy for diff

    if (data.sessionId === 'session-1') {
        session1QR = data.qr;
        console.log('Session 1 QR Hash Start:', hash);
        
        // Start Session 2 ONLY after getting Session 1 QR
        setTimeout(() => {
            console.log('🚀 Requesting Session 2');
            socket.emit('init_session', { sessionId: 'session-2' });
        }, 2000);
    } 
    else if (data.sessionId === 'session-2') {
        session2QR = data.qr;
        console.log('Session 2 QR Hash Start:', hash);

        // COMPARE
        if (session1QR === session2QR) {
             console.error('❌ FAILURE: QRs ARE IDENTICAL!');
             process.exit(1);
        } else {
             console.log('✅ SUCCESS: QRs are DIFFERENT!');
             process.exit(0);
        }
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected');
});
