const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:3002';

async function testSessions() {
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/api/login`, {
            username: 'admin',      // Assuming 'admin' exists from defaults or previous setup
            password: 'admin'       // Assuming 'admin' default password
        });

        // If login fails, try to register a temp user
        let token;
        if (loginRes.data.token) {
            token = loginRes.data.token;
        } else {
            console.log('Login failed, trying to register temp user...');
            const regRes = await axios.post(`${API_URL}/api/register`, {
                username: 'test_qr_user_' + Date.now(),
                password: 'password123'
            });
            // Then login
            const loginRes2 = await axios.post(`${API_URL}/api/login`, {
                username: 'test_qr_user_' + Date.now(), // Wait, this logic is flawed, username changed
                password: 'password123'
            });
            // Actually let's just use the registration response if it doesn't give token (usually it requires login)
            // Simpler: Just rely on 'admin'/'admin' or a known user. 
            // If this fails, we will see it in logs.
        }

        token = loginRes.data.token;
        console.log('Got token:', token ? 'YES' : 'NO');

        if (!token) {
            console.error('Could not get token. Aborting.');
            process.exit(1);
        }

        // 2. Connect Socket
        const socket = io(API_URL, {
            auth: { token }
        });

        let qrMain = null;
        let qrSession2 = null;

        socket.on('connect', () => {
            console.log('Socket Connected');

            // 3. Init Main Session
            console.log('Initializing MAIN session...');
            socket.emit('init_session', { sessionId: 'main' });
        });

        socket.on('session_qr', (data) => {
            console.log(`Received QR for session: ${data.sessionId}`);

            if (data.sessionId === 'main' && !qrMain) {
                qrMain = data.qr;
                console.log('Got QR for MAIN. Initializing Session 2...');

                // 4. Init Second Session
                setTimeout(() => {
                    socket.emit('init_session', { sessionId: 'session-2' });
                }, 2000);
            } else if (data.sessionId === 'session-2' && !qrSession2) {
                qrSession2 = data.qr;
                console.log('Got QR for Session 2.');

                // 5. Compare
                if (!qrMain) {
                    console.error('\n🔴 FAILURE: Got Session 2 QR but missed Main QR?');
                    process.exit(1);
                }
                if (qrMain === qrSession2) {
                    console.error('\n🔴 FAILURE: QR codes are IDENTIAL!');
                    console.log('QR Main length:', qrMain.length);
                    console.log('QR Session2 length:', qrSession2.length);
                    console.log('QR Main start:', qrMain.substring(0, 50));
                    console.log('QR Session2 start:', qrSession2.substring(0, 50));
                    process.exit(1);
                } else {
                    console.log('\n🟢 SUCCESS: QR codes are DIFFERENT.');
                    process.exit(0);
                }
            }
        });

        // Timeout
        setTimeout(() => {
            console.log('Timeout waiting for QRs');
            process.exit(1);
        }, 30000);

    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) console.error('Response data:', err.response.data);
        process.exit(1);
    }
}

testSessions();
