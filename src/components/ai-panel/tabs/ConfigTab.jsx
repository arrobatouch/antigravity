import React, { useState, useEffect } from 'react';
import './ConfigTab.css';

const ConfigTab = ({ socket }) => {
    const [automations, setAutomations] = useState({
        autoReply: true,
        followUp: true,
        postSale: false,
        offHours: true
    });
    const [qrCode, setQrCode] = useState('');
    const [status, setStatus] = useState('Desconectado');

    // Estado para sesiones adicionales con persistencia
    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem('whatsapp_sessions');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        if (!socket) return;

        const handleQr = (qr) => {
            setQrCode(qr);
            setStatus('Esperando escaneo...');
        };

        const handleStatus = (data) => {
            if (data.status === 'connected') {
                setStatus('Conectado');
                setQrCode('');
            } else if (data.status === 'authenticated') {
                setStatus('Autenticado');
            } else {
                setStatus('Desconectado');
            }
        };

        // Listener para QR de TODAS las sesiones (incluida main)
        const handleSessionQr = (data) => {
            console.log('✅ Received session_qr event:', data);
            if (data.sessionId) {
                console.log('🔄 Updating session QR for:', data.sessionId);

                // Si es la sesión principal, actualizar el QR principal
                if (data.sessionId === 'main') {
                    setQrCode(data.qr);
                    setStatus('Esperando escaneo...');
                }

                // Actualizar sesiones adicionales
                setSessions(prev => {
                    console.log('📊 Current sessions:', prev);
                    const updated = prev.map(s => {
                        console.log(`🔍 Comparing s.id="${s.id}" with data.sessionId="${data.sessionId}"`);
                        return s.id === data.sessionId
                            ? { ...s, qrCode: data.qr, status: 'Esperando escaneo...' }
                            : s;
                    });
                    console.log('✨ Updated sessions:', updated);

                    // Guardar en localStorage después de actualizar
                    localStorage.setItem('whatsapp_sessions', JSON.stringify(updated));

                    return updated;
                });
            } else {
                console.error('❌ session_qr event missing sessionId:', data);
            }
        };

        socket.on('qr', handleQr);
        socket.on('status', handleStatus);
        socket.on('session_qr', handleSessionQr);
        socket.emit('request_status');

        return () => {
            socket.off('qr', handleQr);
            socket.off('status', handleStatus);
            socket.off('session_qr', handleSessionQr);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const syncAutoResponses = () => {
            const saved = localStorage.getItem('autoResponses');
            if (saved) {
                const responses = JSON.parse(saved);
                socket.emit('update_auto_responses', responses);
            }
        };

        syncAutoResponses();

        const handleStorageChange = (e) => {
            if (e.key === 'autoResponses') {
                syncAutoResponses();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(syncAutoResponses, 5000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [socket]);

    const toggleAutomation = (key) => {
        setAutomations(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            if (key === 'autoReply' && socket) {
                socket.emit('toggle_auto_reply_mode', newState.autoReply);
            }
            return newState;
        });
    };

    const createNewSession = () => {
        const newSession = {
            id: `session-${Date.now()}`,
            name: `Conexión ${sessions.length + 2}`,
            qrCode: '', // Vacío - esperar QR del backend
            status: 'Generando QR...'
        };

        const updatedSessions = [...sessions, newSession];
        setSessions(updatedSessions);
        localStorage.setItem('whatsapp_sessions', JSON.stringify(updatedSessions));

        // Verificar e inicializar sesión en el backend
        console.log('=== DEBUGGING SESSION CREATION ===');
        console.log('Socket exists:', !!socket);
        console.log('Socket connected:', socket?.connected);
        console.log('Socket ID:', socket?.id);
        console.log('Session ID to create:', newSession.id);

        if (socket && socket.connected) {
            console.log('Emitting init_session event...');
            socket.emit('init_session', { sessionId: newSession.id });

            // Intentar múltiples veces por si falla
            setTimeout(() => {
                console.log('Retry: Emitting init_session again...');
                socket.emit('init_session', { sessionId: newSession.id });
            }, 1000);
        } else {
            console.error('Socket not connected! Cannot initialize session.');
            alert('Error: Socket no conectado. Recarga la página (F5).');
        }
    };

    const deleteSession = (sessionId) => {
        console.log('Deleting session directly:', sessionId);

        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);
        localStorage.setItem('whatsapp_sessions', JSON.stringify(updatedSessions));

        // Notificar al backend para desconectar la sesión
        if (socket) {
            socket.emit('disconnect_session', { sessionId });
            console.log('Emitted disconnect_session for:', sessionId);
        }
    };

    return (
        <div className="config-tab-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>Conexiones WhatsApp</h2>
                <button
                    onClick={createNewSession}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <span style={{ fontSize: '18px' }}>+</span> Nueva Conexión
                </button>
            </div>

            <div className="config-section glass-panel">
                <h3 className="section-title">Conexión WhatsApp</h3>
                <div className="connection-status">
                    <div className="qr-placeholder">
                        {status === 'Conectado' ? (
                            <div className="qr-connected">✓</div>
                        ) : qrCode ? (
                            <img src={qrCode} alt="QR Code" className="qr-image" />
                        ) : (
                            <div className="qr-loading">Cargando QR...</div>
                        )}
                        <span className="qr-status">{status}</span>
                    </div>
                    <div className="connection-info">
                        <div className="info-row">
                            <span className="label">Estado:</span>
                            <span className={`value ${status === 'Conectado' ? 'success' : ''}`}>{status}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Número:</span>
                            <span className="value">{status === 'Conectado' ? 'Vinculado' : '-'}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Sesión:</span>
                            <span className="value">{status === 'Conectado' ? 'Activa' : '-'}</span>
                        </div>
                        <button className="danger-btn">Desconectar</button>
                        <button className="secondary-btn mt-2" onClick={() => socket?.emit('restart_client')}>
                            Reiniciar Conexión
                        </button>
                        <button className="danger-btn mt-2" style={{ marginLeft: '10px' }} onClick={() => {
                            if (window.confirm('¿Estás seguro? Esto borrará la sesión actual y tendrás que escanear el QR de nuevo.')) {
                                socket?.emit('restart_client', { hard: true });
                            }
                        }}>
                            Restablecimiento de Fábrica
                        </button>
                    </div>
                </div>
            </div>

            {sessions.map(session => (
                <div key={session.id} className="config-section glass-panel" style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 className="section-title" style={{ margin: 0 }}>{session.name}</h3>
                        <button
                            onClick={() => deleteSession(session.id)}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            🗑️ Eliminar
                        </button>
                    </div>
                    <div className="connection-status">
                        <div className="qr-placeholder">
                            {session.status === 'Conectado' ? (
                                <div className="qr-connected">✓</div>
                            ) : session.qrCode ? (
                                <img src={session.qrCode} alt="QR Code" className="qr-image" />
                            ) : (
                                <div className="qr-loading">Cargando QR...</div>
                            )}
                            <span className="qr-status">{session.status}</span>
                        </div>
                        <div className="connection-info">
                            <div className="info-row">
                                <span className="label">Estado:</span>
                                <span className="value">{session.status}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Número:</span>
                                <span className="value">-</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Sesión:</span>
                                <span className="value">-</span>
                            </div>
                            <button
                                className="secondary-btn"
                                onClick={() => {
                                    console.log('Manual QR generation for:', session.id);
                                    if (socket) {
                                        socket.emit('init_session', { sessionId: session.id });
                                        socket.emit('request_status', { sessionId: session.id });
                                    }
                                }}
                            >
                                Generar QR
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            <div className="config-section glass-panel">
                <h3 className="section-title">Automatizaciones</h3>
                <div className="switches-list">
                    <div className="switch-row">
                        <div className="switch-info">
                            <span className="switch-label">Respuestas Automáticas</span>
                            <span className="switch-desc">La IA responde consultas de precio y stock.</span>
                        </div>
                        <button
                            className={`switch-btn ${automations.autoReply ? 'active' : ''}`}
                            onClick={() => toggleAutomation('autoReply')}
                        >
                            <div className="switch-handle"></div>
                        </button>
                    </div>
                    <div className="switch-row">
                        <div className="switch-info">
                            <span className="switch-label">Seguimientos</span>
                            <span className="switch-desc">Reactivar clientes inactivos tras 48hs.</span>
                        </div>
                        <button
                            className={`switch-btn ${automations.followUp ? 'active' : ''}`}
                            onClick={() => toggleAutomation('followUp')}
                        >
                            <div className="switch-handle"></div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="config-section glass-panel">
                <h3 className="section-title">Proveedores de IA</h3>
                <div className="api-config-list">
                    <div className="api-row">
                        <div className="api-info">
                            <span className="api-label">OpenAI (GPT-4)</span>
                            <input type="password" placeholder="sk-..." className="api-input" />
                        </div>
                        <button className="save-btn-small">Guardar</button>
                    </div>
                    <div className="api-row">
                        <div className="api-info">
                            <span className="api-label">Google Gemini</span>
                            <input type="password" placeholder="AIza..." className="api-input" />
                        </div>
                        <button className="save-btn-small">Guardar</button>
                    </div>
                    <div className="api-row">
                        <div className="api-info">
                            <span className="api-label">DeepSeek</span>
                            <input type="password" placeholder="ds-..." className="api-input" />
                        </div>
                        <button className="save-btn-small">Guardar</button>
                    </div>
                </div>
            </div>

            <div className="config-section glass-panel">
                <h3 className="section-title">Reglas Avanzadas</h3>
                <div className="rules-table-container custom-scrollbar">
                    <table className="rules-table">
                        <thead>
                            <tr>
                                <th>Condición</th>
                                <th>Acción</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Incluye "precio"</td>
                                <td><span className="badge auto">Responder Auto</span></td>
                                <td>✎</td>
                            </tr>
                            <tr>
                                <td>Mensaje negativo</td>
                                <td><span className="badge manual">Derivar</span></td>
                                <td>✎</td>
                            </tr>
                            <tr>
                                <td>Cliente inactivo</td>
                                <td><span className="badge follow">Seguimiento</span></td>
                                <td>✎</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ConfigTab;
