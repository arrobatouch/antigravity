import React from 'react';
import './Sidebar.css';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = ({ chats, activeChatId, onSelectChat, activeSessionId, availableSessions, onSessionChange }) => {
    const { theme, toggleTheme } = useTheme();

    // Get session name by ID
    const getSessionName = (sessionId) => {
        const session = availableSessions.find(s => s.id === sessionId);
        return session?.name || sessionId;
    };

    // Count contacts per session
    const getSessionContactCount = (sessionId) => {
        return chats.filter(c => c.sessionId === sessionId).length;
    };
    return (
        <div className="sidebar-container">
            <div className="sidebar-header glass-panel">
                <div className="avatar-circle user-avatar"></div>
                <div className="header-icons">
                    <button className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="icon-btn" title="Estado">⭘</button>
                    <button className="icon-btn" title="Nuevo Chat">+</button>
                    <button className="icon-btn" title="Menú">⋮</button>
                </div>
            </div>

            {/* Session Selector */}
            {availableSessions && availableSessions.length > 1 && (
                <div style={{
                    padding: '10px 15px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <select
                        value={activeSessionId}
                        onChange={(e) => onSessionChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        {availableSessions.map(session => (
                            <option key={session.id} value={session.id} style={{ backgroundColor: '#1e1e1e' }}>
                                {session.name} ({getSessionContactCount(session.id)})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="search-bar-container">
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Buscar o iniciar un nuevo chat" className="search-input" />
                </div>
            </div>

            <div className="chat-list custom-scrollbar">
                {chats.length === 0 && (
                    <div className="p-4 text-center text-muted" style={{ fontSize: '13px' }}>
                        No hay chats activos. Esperando mensajes...
                    </div>
                )}
                {chats.map(chat => (
                    <div
                        key={chat.id}
                        className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                        onClick={() => onSelectChat(chat.id)}
                    >
                        <div className="avatar-circle">{chat.name[0]}</div>
                        <div className="chat-info">
                            <div className="chat-header">
                                <span className="chat-name">{chat.name}</span>
                                <span className="chat-time">{chat.time}</span>
                            </div>
                            <div className="chat-preview">
                                <span className="last-msg">{chat.lastMsg}</span>
                                {chat.unread > 0 && <span className="unread-badge">{chat.unread}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
