import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, CheckCircle2, AlertCircle, ArrowRight, Activity } from 'lucide-react';

// Simulated AI classification function
const classifyIntent = async (query, tags) => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

    const queryLower = query.toLowerCase();
    let matchedTag = null;

    for (const tag of tags) {
        const descLower = tag.description.toLowerCase();
        const keywords = descLower.split(' ').filter(w => w.length > 4);

        for (const keyword of keywords) {
            if (queryLower.includes(keyword)) {
                matchedTag = tag;
                break;
            }
        }
        if (matchedTag) break;
    }

    if (!matchedTag && Math.random() > 0.3 && tags.length > 0) {
        matchedTag = tags[Math.floor(Math.random() * tags.length)];
    }

    return {
        query,
        selectedTagCode: matchedTag ? matchedTag.code : '/ninguna',
        matchedTag,
        finalResponse: matchedTag ? matchedTag.template.replace(/\{[^}]+\}/g, '[VARIABLE]') : null
    };
};

const Simulator = ({ tags, isDarkMode = true }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const scrollRef = useRef(null);

    // Theme colors
    const theme = {
        bg: isDarkMode ? '#0f172a' : '#f9fafb',
        cardBg: isDarkMode ? '#1e293b' : 'white',
        text: isDarkMode ? '#f1f5f9' : '#1f2937',
        textMuted: isDarkMode ? '#94a3b8' : '#6b7280',
        border: isDarkMode ? '#334155' : '#e5e7eb',
        inputBg: isDarkMode ? '#334155' : 'white',
        inputBorder: isDarkMode ? '#475569' : '#d1d5db',
        userBubble: isDarkMode ? '#4f46e5' : '#6366f1',
        botBubbleBg: isDarkMode ? '#166534' : '#d1fae5'
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    const handleSimulate = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        const result = await classifyIntent(query, tags);
        setHistory(prev => [...prev, result]);
        setQuery('');
        setIsLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSimulate();
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: theme.bg,
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
            transition: 'all 0.3s ease'
        }}>
            {/* Header */}
            <div style={{
                background: theme.cardBg,
                padding: '16px 20px',
                borderBottom: `1px solid ${theme.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{
                    fontWeight: 600,
                    color: theme.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: 0,
                    fontSize: '0.9rem'
                }}>
                    <Activity size={18} color="#6366f1" />
                    Simulador de Clasificación
                </h3>
                <span style={{
                    fontSize: '0.65rem',
                    fontFamily: 'monospace',
                    color: theme.textMuted,
                    background: isDarkMode ? '#334155' : '#f3f4f6',
                    padding: '4px 8px',
                    borderRadius: '4px'
                }}>
                    gemini-2.5-flash
                </span>
            </div>

            {/* Chat History */}
            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}
            >
                {history.length === 0 ? (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.textMuted,
                        gap: '16px'
                    }}>
                        <Bot size={48} />
                        <p style={{ textAlign: 'center', maxWidth: '280px', fontSize: '0.875rem' }}>
                            Escribe un mensaje simulando ser un cliente para probar qué etiqueta selecciona la IA.
                        </p>
                    </div>
                ) : (
                    history.map((item, index) => (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* User Message */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '8px' }}>
                                <div style={{
                                    background: theme.userBubble,
                                    color: 'white',
                                    padding: '12px 16px',
                                    borderRadius: '16px 16px 4px 16px',
                                    maxWidth: '80%',
                                    fontSize: '0.875rem'
                                }}>
                                    {item.query}
                                </div>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: isDarkMode ? '#312e81' : '#e0e7ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <User size={16} color={isDarkMode ? '#a5b4fc' : '#6366f1'} />
                                </div>
                            </div>

                            {/* AI Response */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: isDarkMode ? '#14532d' : '#d1fae5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Bot size={16} color={isDarkMode ? '#4ade80' : '#059669'} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                    {/* Classification Step */}
                                    <div style={{
                                        background: theme.cardBg,
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: '12px',
                                        padding: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Paso 1: Clasificación IA
                                            </span>
                                            {item.selectedTagCode !== '/ninguna' ? (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    background: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
                                                    color: isDarkMode ? '#4ade80' : '#047857',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <CheckCircle2 size={10} />
                                                    Match
                                                </span>
                                            ) : (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    background: isDarkMode ? 'rgba(251, 191, 36, 0.2)' : '#fef3c7',
                                                    color: isDarkMode ? '#fbbf24' : '#b45309',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <AlertCircle size={10} />
                                                    No Match
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                                            <span style={{ color: theme.textMuted }}>Etiqueta:</span>
                                            <code style={{
                                                background: isDarkMode ? '#334155' : '#f3f4f6',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 600,
                                                color: theme.text
                                            }}>
                                                {item.selectedTagCode}
                                            </code>
                                        </div>
                                    </div>

                                    {/* Response Step */}
                                    {item.matchedTag && (
                                        <div style={{
                                            background: theme.cardBg,
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: '12px',
                                            padding: '12px'
                                        }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Paso 2: Plantilla
                                            </span>
                                            <p style={{
                                                marginTop: '8px',
                                                color: theme.text,
                                                fontSize: '0.8rem',
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: 1.5
                                            }}>
                                                {item.finalResponse}
                                            </p>
                                            <div style={{
                                                marginTop: '8px',
                                                paddingTop: '8px',
                                                borderTop: `1px solid ${theme.border}`,
                                                fontSize: '0.65rem',
                                                color: theme.textMuted,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <ArrowRight size={10} />
                                                Variables auto-completadas
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {isLoading && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '16px',
                        color: theme.textMuted,
                        fontSize: '0.8rem'
                    }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{
                                    width: '6px',
                                    height: '6px',
                                    background: theme.textMuted,
                                    borderRadius: '50%',
                                    animation: `pulse 1s infinite ${i * 0.2}s`
                                }} />
                            ))}
                        </div>
                        <span>Analizando...</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div style={{
                background: theme.cardBg,
                padding: '16px',
                borderTop: `1px solid ${theme.border}`
            }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Escribe una pregunta de prueba..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            border: `1px solid ${theme.inputBorder}`,
                            borderRadius: '25px',
                            padding: '12px 50px 12px 20px',
                            fontSize: '0.875rem',
                            outline: 'none',
                            background: theme.inputBg,
                            color: theme.text
                        }}
                    />
                    <button
                        onClick={handleSimulate}
                        disabled={isLoading || !query.trim()}
                        style={{
                            position: 'absolute',
                            right: '8px',
                            padding: '8px',
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            cursor: isLoading || !query.trim() ? 'not-allowed' : 'pointer',
                            opacity: isLoading || !query.trim() ? 0.5 : 1
                        }}
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p style={{
                    fontSize: '0.65rem',
                    color: theme.textMuted,
                    marginTop: '8px',
                    textAlign: 'center'
                }}>
                    La IA elige basándose en las descripciones configuradas.
                </p>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
};

export default Simulator;
