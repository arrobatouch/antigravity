import React, { useState, useEffect } from 'react';
import './AIActionTab.css';

const getEventLabel = (type) => {
    const labels = {
        incoming: 'ENTRANTE',
        analysis: 'ANÁLISIS',
        decision: 'DECISIÓN',
        generation: 'GENERACIÓN',
        outgoing: 'SALIENTE'
    };
    return labels[type] || type.toUpperCase();
};

const AIActionTab = ({ socket }) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (event) => {
            // Generar ID único para evitar colisiones de keys en React
            const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            setEvents(prev => [{ ...event, id: uniqueId }, ...prev]);
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket]);

    return (
        <div className="action-tab-container">
            <div className="timeline">
                {events.length === 0 && (
                    <div className="text-muted text-center p-4">Esperando actividad...</div>
                )}
                {events.map((event) => (
                    <div key={event.id} className="timeline-item">
                        <div className="timeline-line"></div>
                        <div className={`timeline-dot ${event.type}`}></div>
                        <div className="timeline-content glass-panel">
                            <div className="event-header">
                                <span className="event-time">{event.time}</span>
                                <span className={`event-type-badge ${event.type}`}>{getEventLabel(event.type)}</span>
                            </div>
                            <div className="event-body">
                                <p className="event-text">{event.text}</p>
                                {event.details && <p className="event-details">"{event.details}"</p>}
                                {event.output && <div className="event-output">{event.output}</div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIActionTab;
