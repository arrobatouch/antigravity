import { useState, useEffect } from 'react'
import './App.css'
import Sidebar from './components/layout/Sidebar'
import ChatView from './components/chat/ChatView'
import AIPanel from './components/ai-panel/AIPanel'
import AdminPanel from './components/admin/AdminPanel'
import Login from './components/auth/Login'
import { io } from 'socket.io-client'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState({}); // { chatId: [messages] }
  const [aiEnabled, setAiEnabled] = useState(true);

  // Multi-session support
  const [activeSessionId, setActiveSessionId] = useState('main');
  const [availableSessions, setAvailableSessions] = useState([{ id: 'main', name: 'Conexión WhatsApp', status: 'disconnected' }]);

  // Check for existing token on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:3002', {
      auth: { token }
    });

    setSocket(newSocket);

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      if (err.message.includes('Authentication error')) {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    });

    newSocket.on('new_message', (msg) => {
      // Ignore AI internal events for the main chat view
      if (!msg.sender && (msg.type === 'analysis' || msg.type === 'decision' || msg.type === 'generation')) {
        return;
      }

      // Safety check
      if (!msg.sender) return;

      const msgSessionId = msg.sessionId || 'main';

      // Determine the chat ID (sender for incoming, chatId for outgoing)
      const chatKey = msg.sender || msg.chatId;
      if (!chatKey) return; // Skip if no chat identifier

      // 1. Update Chats List (only for incoming messages with sender)
      if (msg.sender) {
        setChats(prevChats => {
          const chatExists = prevChats.find(c => c.id === msg.sender);
          const newChat = {
            id: msg.sender,
            name: msg.sender.replace('@c.us', ''),
            lastMsg: msg.text,
            time: msg.time,
            unread: chatExists && activeChatId !== msg.sender ? (chatExists.unread || 0) + 1 : 0,
            active: false,
            sessionId: msgSessionId  // ← AGREGADO: Identificar sesión
          };

          const otherChats = prevChats.filter(c => c.id !== msg.sender);
          return [newChat, ...otherChats];
        });
        // Auto-select chat if none is active
        if (!activeChatId) {
          setActiveChatId(msg.sender);
        }
      }

      // 2. Update Messages (for both incoming and outgoing)
      setMessages(prev => {
        const chatMsgs = prev[chatKey] || [];
        // Avoid duplicates if possible (simple check)
        const isDuplicate = chatMsgs.some(m => m.time === msg.time && m.text === msg.text);
        if (isDuplicate) return prev;

        return {
          ...prev,
          [chatKey]: [...chatMsgs, {
            id: Date.now(),
            text: msg.output || msg.details || msg.text,
            sender: msg.type === 'incoming' ? 'client' : (msg.type === 'outgoing' ? 'ai' : 'system'),
            time: msg.time,
            status: 'delivered'
          }]
        };
      });
    });

    // Listen for sessions list updates
    newSocket.on('sessions_list', (sessions) => {
      setAvailableSessions(sessions);
    });

    newSocket.on('ai_status', (enabled) => {
      setAiEnabled(enabled);
    });

    return () => newSocket.close();
  }, [isAuthenticated]); // Removed activeChatId dependency to avoid reconnect loops

  // Filter chats by active session
  const filteredChats = chats.filter(chat =>
    chat.sessionId === activeSessionId
  );

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, unread: 0 } : c));
  };

  const handleSendMessage = (text) => {
    if (!socket || !activeChatId) return;

    // Emit to backend
    socket.emit('send_message', { chatId: activeChatId, text });

    // Optimistic update
    setMessages(prev => {
      const chatMsgs = prev[activeChatId] || [];
      return {
        ...prev,
        [activeChatId]: [...chatMsgs, {
          id: Date.now(),
          text: text,
          sender: 'ai', // Treated as "me"
          time: new Date().toLocaleTimeString(),
          status: 'sent'
        }]
      };
    });
  };

  const toggleAI = () => {
    const newState = !aiEnabled;
    setAiEnabled(newState);
    if (socket) {
      socket.emit('toggle_ai', newState);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  // If user is SuperAdmin, show Admin Panel instead of WhatsApp panel
  if (user?.isSuperAdmin) {
    return (
      <ThemeProvider>
        <AdminPanel user={user} onLogout={handleLogout} />
      </ThemeProvider>
    );
  }

  const activeMessages = activeChatId ? (messages[activeChatId] || []) : [];
  const activeChatName = chats.find(c => c.id === activeChatId)?.name || 'Selecciona un chat';

  return (
    <ThemeProvider>
      <div className="app-container">
        <div className="layout-grid">
          <div className="col-left glass-panel">
            <Sidebar
              chats={filteredChats}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              activeSessionId={activeSessionId}
              availableSessions={availableSessions}
              onSessionChange={setActiveSessionId}
            />
            <button onClick={handleLogout} style={{ marginTop: 'auto', padding: '10px', background: 'rgba(255,0,0,0.2)', border: 'none', color: 'white', cursor: 'pointer' }}>Cerrar Sesión</button>
          </div>
          <div className="col-center">
            <ChatView
              messages={activeMessages}
              chatName={activeChatName}
              onSendMessage={handleSendMessage}
              disabled={aiEnabled}
            />
          </div>
          <div className="col-right glass-panel">
            <AIPanel aiEnabled={aiEnabled} onToggleAI={toggleAI} socket={socket} />
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
