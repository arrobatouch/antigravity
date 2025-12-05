import React, { useState } from 'react';
import { Bot, Save, Play, AlertCircle, CheckCircle } from 'lucide-react';

// Available AI models
const AVAILABLE_MODELS = [
    { id: 'gemini-pro', name: 'Gemini Pro' },
    { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' },
    { id: 'gpt-4', name: 'GPT-4 (OpenAI)' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (OpenAI)' },
    { id: 'deepseek-chat', name: 'DeepSeek Chat' }
];

// Default configuration
const DEFAULT_AI_CONFIG = {
    modelName: 'gemini-pro',
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    systemInstruction: 'Eres un asistente virtual amable y profesional para atender consultas de clientes por WhatsApp.'
};

const AISettings = () => {
    const [config, setConfig] = useState(DEFAULT_AI_CONFIG);
    const [testResponse, setTestResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle' | 'success' | 'error'

    const handleSave = () => {
        // In a real app, this would persist to backend
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
    };

    const runTest = async () => {
        setLoading(true);
        setTestResponse('');

        // Simulate API test
        setTimeout(() => {
            setTestResponse('✅ Conexión exitosa con el modelo: ' + config.modelName);
            setLoading(false);
        }, 2000);
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1><Bot size={28} /> Configuración de IA (Gemini)</h1>
                    <p>Configure global defaults for the AI assistant models.</p>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '24px'
            }}>

                {/* Settings Form */}
                <div style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb'
                }}>
                    <h2 style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        marginBottom: '16px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        Parámetros del Modelo
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label>Modelo Seleccionado</label>
                            <select
                                value={config.modelName}
                                onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '10px',
                                    fontSize: '0.95rem',
                                    background: 'white'
                                }}
                            >
                                {AVAILABLE_MODELS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>Temperatura ({config.temperature})</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={config.temperature}
                                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                                    style={{ width: '100%', accentColor: '#059669' }}
                                />
                                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                    Controla la creatividad (0 = Preciso, 2 = Creativo)
                                </span>
                            </div>
                            <div className="form-group">
                                <label>Top K ({config.topK})</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={config.topK}
                                    onChange={(e) => setConfig({ ...config, topK: parseInt(e.target.value) })}
                                    style={{ width: '100%', accentColor: '#059669' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Instrucción del Sistema</label>
                            <textarea
                                rows={4}
                                value={config.systemInstruction}
                                onChange={(e) => setConfig({ ...config, systemInstruction: e.target.value })}
                                placeholder="Instrucciones base para el comportamiento del modelo..."
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '10px',
                                    fontSize: '0.95rem',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleSave}
                            className="btn-primary"
                        >
                            {status === 'success' ? <CheckCircle size={18} /> : <Save size={18} />}
                            {status === 'success' ? 'Guardado' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>

                {/* Testing Panel */}
                <div style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h2 style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        marginBottom: '16px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        Probar Conexión
                    </h2>

                    <div style={{
                        flex: 1,
                        background: '#111827',
                        borderRadius: '10px',
                        padding: '16px',
                        marginBottom: '16px',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: '#34d399',
                        overflowY: 'auto',
                        minHeight: '200px'
                    }}>
                        <span style={{ color: '#6b7280' }}># System Output</span>
                        <br />
                        {loading ? (
                            <span style={{ animation: 'pulse 2s infinite' }}>Connecting to AI model...</span>
                        ) : (
                            testResponse || "Ready to test."
                        )}
                    </div>

                    <div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <AlertCircle size={12} />
                            Requiere API Key configurada
                        </div>
                        <button
                            onClick={runTest}
                            disabled={loading}
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px',
                                border: '1px solid #059669',
                                background: 'transparent',
                                color: '#059669',
                                borderRadius: '10px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.5 : 1,
                                fontWeight: 500
                            }}
                        >
                            <Play size={18} />
                            {loading ? 'Testing...' : 'Test Configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AISettings;
