import React, { useState } from 'react';
import { Edit2, Trash2, Plus, Search, Braces } from 'lucide-react';

const TagTable = ({ tags, onAdd, onEdit, onDelete, isDarkMode = true }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTags = tags.filter(tag =>
        tag.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper to extract variables from template string
    const extractVariables = (template) => {
        const matches = template.match(/\{([^}]+)\}/g);
        if (!matches) return [];
        return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
    };

    // Theme colors
    const theme = {
        bg: isDarkMode ? '#1e293b' : 'white',
        headerBg: isDarkMode ? '#0f172a' : '#f9fafb',
        text: isDarkMode ? '#f1f5f9' : '#1f2937',
        textMuted: isDarkMode ? '#94a3b8' : '#6b7280',
        border: isDarkMode ? '#334155' : '#e5e7eb',
        rowHover: isDarkMode ? '#334155' : '#f9fafb',
        inputBg: isDarkMode ? '#334155' : 'white',
        inputBorder: isDarkMode ? '#475569' : '#d1d5db',
        codeBg: isDarkMode ? '#1e293b' : '#dbeafe',
        codeText: isDarkMode ? '#60a5fa' : '#2563eb',
        categoryBg: isDarkMode ? '#334155' : '#f3f4f6',
        categoryText: isDarkMode ? '#e2e8f0' : '#374151'
    };

    return (
        <div style={{
            background: theme.bg,
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            transition: 'all 0.3s ease'
        }}>
            {/* Header & Actions */}
            <div style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${theme.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: theme.headerBg
            }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: theme.textMuted
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Buscar por código o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            border: `1px solid ${theme.inputBorder}`,
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            background: theme.inputBg,
                            color: theme.text
                        }}
                    />
                </div>
                <button
                    onClick={onAdd}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    <Plus size={16} />
                    Nueva Etiqueta
                </button>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{
                            background: theme.headerBg,
                            position: 'sticky',
                            top: 0
                        }}>
                            <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: theme.textMuted, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Código
                            </th>
                            <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: theme.textMuted, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Categoría
                            </th>
                            <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: theme.textMuted, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Descripción (IA)
                            </th>
                            <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: theme.textMuted, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Plantilla & Variables
                            </th>
                            <th style={{ padding: '12px 20px', textAlign: 'center', fontWeight: 600, color: theme.textMuted, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTags.map((tag) => (
                            <tr
                                key={tag.id}
                                style={{ borderBottom: `1px solid ${theme.border}` }}
                                onMouseEnter={(e) => e.currentTarget.style.background = theme.rowHover}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={{
                                    padding: '14px 20px',
                                    fontFamily: 'monospace',
                                    color: theme.codeText,
                                    fontWeight: 500
                                }}>
                                    {tag.code}
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                    <span style={{
                                        background: theme.categoryBg,
                                        color: theme.categoryText,
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500
                                    }}>
                                        {tag.category}
                                    </span>
                                </td>
                                <td style={{
                                    padding: '14px 20px',
                                    color: theme.textMuted,
                                    maxWidth: '200px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {tag.description}
                                </td>
                                <td style={{
                                    padding: '14px 20px',
                                    color: theme.textMuted
                                }}>
                                    <div style={{
                                        maxWidth: '300px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        marginBottom: '8px'
                                    }} title={tag.template}>
                                        {tag.template}
                                    </div>
                                    {(() => {
                                        const vars = extractVariables(tag.template);
                                        if (vars.length > 0) {
                                            return (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {vars.map(v => (
                                                        <span key={v} style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '2px',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.65rem',
                                                            fontFamily: 'monospace',
                                                            background: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#eef2ff',
                                                            color: isDarkMode ? '#a5b4fc' : '#6366f1',
                                                            border: isDarkMode ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #c7d2fe'
                                                        }}>
                                                            <Braces size={10} />
                                                            {v}
                                                        </span>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </td>
                                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        <button
                                            onClick={() => onEdit(tag)}
                                            style={{
                                                padding: '8px',
                                                background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: '#3b82f6',
                                                cursor: 'pointer'
                                            }}
                                            title="Editar"
                                        >
                                            <Edit2 size={14} style={{ pointerEvents: 'none' }} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(tag.id)}
                                            style={{
                                                padding: '8px',
                                                background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: '#ef4444',
                                                cursor: 'pointer'
                                            }}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} style={{ pointerEvents: 'none' }} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredTags.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{
                                    padding: '48px 20px',
                                    textAlign: 'center',
                                    color: theme.textMuted
                                }}>
                                    No se encontraron etiquetas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TagTable;
