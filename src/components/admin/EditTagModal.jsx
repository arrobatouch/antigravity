import React, { useState, useEffect } from 'react';
import { X, Save, MapPin } from 'lucide-react';

const EMPTY_TAG = {
    id: '',
    code: '/',
    category: '',
    description: '',
    template: '',
    location: '',
    variables: []
};

const CATEGORIES = [
    'Atención',
    'Ventas',
    'Pagos',
    'Logística',
    'Trámites',
    'Gestoría',
    'Soporte',
    'Información',
    'Otros'
];

const EditTagModal = ({ isOpen, onClose, onSave, initialTag, isDarkMode = true }) => {
    const [formData, setFormData] = useState(EMPTY_TAG);

    // Theme colors
    const theme = {
        bg: isDarkMode ? '#1e293b' : 'white',
        text: isDarkMode ? '#f1f5f9' : '#1f2937',
        textMuted: isDarkMode ? '#94a3b8' : '#6b7280',
        border: isDarkMode ? '#334155' : '#e5e7eb',
        inputBg: isDarkMode ? '#334155' : 'white',
        inputBorder: isDarkMode ? '#475569' : '#d1d5db',
        headerBg: isDarkMode ? '#0f172a' : '#f9fafb',
        footerBg: isDarkMode ? '#0f172a' : '#f9fafb'
    };

    useEffect(() => {
        if (isOpen) {
            setFormData(initialTag ? { ...initialTag } : { ...EMPTY_TAG, id: Date.now().toString() });
        }
    }, [isOpen, initialTag]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        border: `1px solid ${theme.inputBorder}`,
        borderRadius: '10px',
        fontSize: '0.9rem',
        background: theme.inputBg,
        color: theme.text,
        outline: 'none'
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: theme.bg,
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '650px',
                    border: `1px solid ${theme.border}`,
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: `1px solid ${theme.border}`,
                    background: theme.headerBg
                }}>
                    <h2 style={{
                        margin: 0, fontSize: '1.1rem', fontWeight: 700, color: theme.text,
                        display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                        <div style={{
                            width: '36px', height: '36px',
                            background: isDarkMode ? '#312e81' : '#e0e7ff',
                            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Save size={18} color="#6366f1" />
                        </div>
                        {initialTag ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: '8px' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Row 1: Code and Category */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 500, color: theme.text }}>
                                    Código
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    required
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="/ejemplo_codigo"
                                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 500, color: theme.text }}>
                                    Categoría
                                </label>
                                <select
                                    name="category"
                                    required
                                    value={formData.category}
                                    onChange={handleChange}
                                    style={inputStyle}
                                >
                                    <option value="">Elige una categoría</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Title (description for display) */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 500, color: theme.text }}>
                                Título
                            </label>
                            <input
                                type="text"
                                name="description"
                                required
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Ej: Saludo de bienvenida"
                                style={inputStyle}
                            />
                            <p style={{ marginTop: '4px', fontSize: '0.7rem', color: theme.textMuted }}>
                                Esta descripción ayuda a la IA a decidir cuándo usar esta respuesta.
                            </p>
                        </div>

                        {/* Row 3: Template */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 500, color: theme.text }}>
                                Descripción / Respuesta
                            </label>
                            <textarea
                                name="template"
                                required
                                rows={5}
                                value={formData.template}
                                onChange={handleChange}
                                placeholder="Escribe la respuesta automática aquí..."
                                style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                            />
                            <p style={{ marginTop: '4px', fontSize: '0.7rem', color: theme.textMuted }}>
                                Usa variables entre llaves como {'{nombre}'} o {'{precio}'}.
                            </p>
                        </div>

                        {/* Row 4: Location */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 500, color: theme.text }}>
                                <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                Ubicación (opcional)
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location || ''}
                                onChange={handleChange}
                                placeholder="Ej: Av. Corrientes 1234, CABA"
                                style={inputStyle}
                            />
                            <p style={{ marginTop: '4px', fontSize: '0.7rem', color: theme.textMuted }}>
                                Dirección o ubicación relacionada con esta respuesta.
                            </p>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex', justifyContent: 'flex-end', gap: '12px',
                        padding: '20px 24px', borderTop: `1px solid ${theme.border}`, background: theme.footerBg
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px', border: `1px solid ${theme.border}`,
                                background: 'transparent', color: theme.text, borderRadius: '8px',
                                cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 20px', border: 'none', background: '#10b981',
                                color: 'white', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: 500, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <Save size={16} />
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTagModal;
