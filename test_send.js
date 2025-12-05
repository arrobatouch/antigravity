const { io } = require('socket.io-client');
const socket = io('http://localhost:3001');
socket.on('connect', () => {
    console.log('Test client connected');
    // Use a dummy chatId; replace with real if needed
    const chatId = '12345@c.us';
    socket.emit('send_message', { chatId, text: 'Test message from test script' });
    console.log('Message emitted');
    setTimeout(() => socket.disconnect(), 2000);
});
socket.on('error', err => console.error('Socket error', err));
