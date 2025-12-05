import React, { useState } from 'react';
import './ChatView.css';

const ChatView = ({ messages, chatName, onSendMessage, disabled }) => {
    const [inputText, setInputText] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputText.trim()) {
                onSendMessage(inputText);
                setInputText('');
            }
        }
    };

    return (
        <div className="chat-view-container">
            <div className="chat-view-header glass-panel">
                <div className="avatar-circle">{chatName[0]}</div>
                <div className="chat-header-info">
                    <span className="header-name">{chatName}</span>
                    <span className="header-status">en línea</span>
                </div>
                <div className="header-actions">
                    <button className="icon-btn">🔍</button>
                    <button className="icon-btn">⋮</button>
                </div>
            </div>

            <div className="messages-area custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-muted mt-4">
                        Esta es una nueva conversación.
                    </div>
                )}
                {messages.map(msg => (
                    <div key={msg.id} className={`message-row ${msg.sender === 'ai' ? 'sent' : 'received'}`}>
                        <div className={`message-bubble ${msg.sender === 'ai' ? 'ai-bubble' : 'client-bubble'}`}>
                            <div className="message-text">{msg.text}</div>
                            <div className="message-meta">
                                <span className="message-time">{msg.time}</span>
                                {msg.sender === 'ai' && <span className="message-status">✓✓</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`chat-input-area glass-panel ${disabled ? 'disabled' : ''}`}>
                <button className="icon-btn">😊</button>
                <button className="icon-btn">📎</button>
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder={disabled ? "IA Activa - Desactívala para escribir" : "Escribe un mensaje"}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                    />
                </div>
                <button className="icon-btn">🎤</button>
            </div>
        </div>
    );
};

export default ChatView;
