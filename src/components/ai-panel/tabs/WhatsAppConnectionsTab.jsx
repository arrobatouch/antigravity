import React, { useState, useEffect } from 'react';
import ConnectionCard from './ConnectionCard';
import { Plus } from 'lucide-react';

const WhatsAppConnectionsTab = ({ socket }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();

        // Listen for QR updates
        if (socket) {
            socket.on('qr_code', (data) => {
                console.log('QR received:', data);
                updateSessionQR(data.sessionId, data.qr);
            });

            socket.on('session_connected', (data) => {
                console.log('Session connected:', data);
                updateSessionStatus(data.sessionId, 'connected', data.phoneNumber);
            });

            socket.on('session_disconnected', (data) => {
                console.log('Session disconnected:', data);
                updateSessionStatus(data.sessionId, 'disconnected');
            });
        }

        return () => {
            if (socket) {
                socket.off('qr_code');
                socket.off('session_connected');
                socket.off('session_disconnected');
            }
        };
    }, [socket]);

    const loadSessions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3002/api/tenant/sessions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSessions(data);
            }
        } catch (err) {
            console.error('Error loading sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const createSession = async () => {
        const name = prompt('Nombre de la nueva conexión:', `Cuenta ${sessions.length + 1}`);
        if (!name) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3002/api/tenant/sessions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                const newSession = await response.json();
                setSessions([...sessions, newSession]);

                // Request QR generation via socket
                if (socket) {
                    socket.emit('init_session', { sessionId: newSession.id });
                }
            }
        } catch (err) {
            console.error('Error creating session:', err);
        }
    };

    const updateSession = async (sessionId, updates) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3002/api/tenant/sessions/${sessionId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const updatedSession = await response.json();
                setSessions(sessions.map(s => s.id === sessionId ? updatedSession : s));

                // If status changed to waiting, request new QR
                if (updates.status === 'waiting' && socket) {
                    socket.emit('init_session', { sessionId });
                }

                // If disconnecting
                if (updates.status === 'disconnected' && socket) {
                    socket.emit('disconnect_session', { sessionId });
                }
            }
        } catch (err) {
            console.error('Error updating session:', err);
        }
    };

    const deleteSession = async (sessionId) => {
        if (!confirm('¿Estás seguro de eliminar esta conexión?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3002/api/tenant/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setSessions(sessions.filter(s => s.id !== sessionId));

                // Disconnect session via socket
                if (socket) {
                    socket.emit('disconnect_session', { sessionId });
                }
            }
        } catch (err) {
            console.error('Error deleting session:', err);
        }
    };

    const updateSessionQR = (sessionId, qrCode) => {
        setSessions(sessions.map(s =>
            s.id === sessionId ? { ...s, qrCode, status: 'waiting' } : s
        ));
    };

    const updateSessionStatus = (sessionId, status, phoneNumber = null) => {
        setSessions(sessions.map(s =>
            s.id === sessionId ? { ...s, status, phoneNumber, qrCode: status === 'connected' ? null : s.qrCode } : s
        ));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-400">Cargando conexiones...</div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Conexiones WhatsApp</h2>
                <button
                    onClick={createSession}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                    <Plus size={20} />
                    Nueva Conexión
                </button>
            </div>

            {sessions.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">No hay conexiones configuradas</p>
                    <button
                        onClick={createSession}
                        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        Crear primera conexión
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.map(session => (
                        <ConnectionCard
                            key={session.id}
                            session={session}
                            onUpdate={updateSession}
                            onDelete={deleteSession}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default WhatsAppConnectionsTab;
