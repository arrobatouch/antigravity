import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, ChevronDown, Moon, Sun, List, Variable } from 'lucide-react';
import TagTable from './TagTable';
import Simulator from './Simulator';
import EditTagModal from './EditTagModal';
import VariableManager from './VariableManager';

const AITraining = () => {
    // Dark mode - default to dark
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Tenants from API
    const [tenants, setTenants] = useState([]);
    const [selectedTenantId, setSelectedTenantId] = useState('');
    const [loading, setLoading] = useState(true);

    // Tags for current tenant
    const [tags, setTags] = useState([]);
    const [loadingTags, setLoadingTags] = useState(false);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState(null);

    // Dropdown open state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Active tab: 'tags' or 'variables'
    const [activeTab, setActiveTab] = useState('tags');

    // Fetch tenants on mount
    useEffect(() => {
        fetchTenants();
    }, []);

    // Fetch tags when tenant changes
    useEffect(() => {
        if (selectedTenantId) {
            fetchTags(selectedTenantId);
        }
    }, [selectedTenantId]);

    const fetchTenants = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3002/api/admin/tenants', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTenants(data);
                if (data.length > 0) {
                    setSelectedTenantId(data[0].tenantId);
                }
            }
        } catch (err) {
            console.error('Error fetching tenants:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTags = async (tenantId) => {
        setLoadingTags(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3002/api/admin/tenants/${tenantId}/tags`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTags(data);
            }
        } catch (err) {
            console.error('Error fetching tags:', err);
        } finally {
            setLoadingTags(false);
        }
    };

    const currentTenant = tenants.find(t => t.tenantId === selectedTenantId);

    // Handlers
    const handleAddTag = () => {
        setEditingTag(null);
        setIsModalOpen(true);
    };

    const handleEditTag = (tag) => {
        setEditingTag(tag);
        setIsModalOpen(true);
    };

    const handleDeleteTag = async (id) => {
        // Temporarily removed confirmation to test deletion
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3002/api/admin/tenants/${selectedTenantId}/tags/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setTags(tags.filter(t => t.id !== id));
                console.log('Tag deleted successfully');
            } else {
                console.error('Failed to delete tag:', response.status);
            }
        } catch (err) {
            console.error('Error deleting tag:', err);
        }
    };

    const handleSaveTag = async (tagData) => {
        const token = localStorage.getItem('token');

        try {
            if (editingTag) {
                // Update existing
                const response = await fetch(`http://localhost:3002/api/admin/tenants/${selectedTenantId}/tags/${tagData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(tagData)
                });
                if (response.ok) {
                    const updatedTag = await response.json();
                    setTags(tags.map(t => t.id === updatedTag.id ? updatedTag : t));
                }
            } else {
                // Create new
                const response = await fetch(`http://localhost:3002/api/admin/tenants/${selectedTenantId}/tags`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(tagData)
                });
                if (response.ok) {
                    const newTag = await response.json();
                    setTags([newTag, ...tags]);
                }
            }
        } catch (err) {
            console.error('Error saving tag:', err);
        }

        setIsModalOpen(false);
    };

    const handleSelectTenant = (tenantId) => {
        setSelectedTenantId(tenantId);
        setIsDropdownOpen(false);
    };

    // Theme colors
    const theme = {
        bg: isDarkMode ? '#0f172a' : '#f8fafc',
        cardBg: isDarkMode ? '#1e293b' : 'white',
        text: isDarkMode ? '#f1f5f9' : '#1f2937',
        textMuted: isDarkMode ? '#94a3b8' : '#6b7280',
        border: isDarkMode ? '#334155' : '#e5e7eb',
        headerBg: isDarkMode ? '#1e293b' : '#f3f4f6'
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#6b7280' }}>
                Cargando empresas...
            </div>
        );
    }

    if (tenants.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#6b7280', gap: '16px' }}>
                <Building2 size={48} />
                <p>No hay empresas registradas para configurar.</p>
                <p style={{ fontSize: '0.875rem' }}>Primero registra empresas en "Gestionar Usuario"</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 180px)', background: theme.bg, margin: '-24px', padding: '24px', borderRadius: '16px', transition: 'all 0.3s ease' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LayoutDashboard size={24} color="#6366f1" />
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.text, margin: 0 }}>TagMaster AI</h1>
                    </div>

                    {/* Company Selector */}
                    <div style={{ position: 'relative' }}>
                        <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px',
                                background: theme.headerBg, borderRadius: '10px', cursor: 'pointer',
                                border: `1px solid ${theme.border}`, minWidth: '200px'
                            }}
                        >
                            <div style={{
                                width: '32px', height: '32px', background: '#6366f1', borderRadius: '6px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 700, fontSize: '0.75rem'
                            }}>
                                {(currentTenant?.companyName || currentTenant?.username || 'EM').substring(0, 2).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.65rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Empresa</div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {currentTenant?.companyName || currentTenant?.username || 'Seleccionar'}
                                    <ChevronDown size={14} color={theme.textMuted} />
                                </div>
                            </div>
                        </div>

                        {/* Dropdown */}
                        {isDropdownOpen && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                                background: theme.cardBg, borderRadius: '10px', border: `1px solid ${theme.border}`,
                                boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 100, minWidth: '200px', overflow: 'hidden'
                            }}>
                                {tenants.map(tenant => (
                                    <div
                                        key={tenant.id}
                                        onClick={() => handleSelectTenant(tenant.tenantId)}
                                        style={{
                                            padding: '12px 16px', cursor: 'pointer',
                                            background: tenant.tenantId === selectedTenantId ? (isDarkMode ? '#166534' : '#f0fdf4') : 'transparent',
                                            borderLeft: tenant.tenantId === selectedTenantId ? '3px solid #10b981' : '3px solid transparent',
                                            display: 'flex', alignItems: 'center', gap: '12px'
                                        }}
                                    >
                                        <div style={{
                                            width: '28px', height: '28px',
                                            background: tenant.tenantId === selectedTenantId ? '#10b981' : theme.border,
                                            borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: tenant.tenantId === selectedTenantId ? 'white' : theme.textMuted,
                                            fontWeight: 600, fontSize: '0.65rem'
                                        }}>
                                            {(tenant.companyName || tenant.username).substring(0, 2).toUpperCase()}
                                        </div>
                                        <span style={{
                                            fontWeight: tenant.tenantId === selectedTenantId ? 600 : 400,
                                            color: tenant.tenantId === selectedTenantId ? (isDarkMode ? '#4ade80' : '#047857') : theme.text,
                                            fontSize: '0.875rem'
                                        }}>
                                            {tenant.companyName || tenant.username}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        style={{
                            padding: '10px', background: theme.headerBg, border: `1px solid ${theme.border}`,
                            borderRadius: '10px', cursor: 'pointer', color: theme.textMuted, display: 'flex'
                        }}
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <div style={{
                        display: 'flex', alignItems: 'center', padding: '6px 12px',
                        background: isDarkMode ? 'rgba(251, 191, 36, 0.1)' : '#fffbeb',
                        color: isDarkMode ? '#fbbf24' : '#b45309',
                        fontSize: '0.75rem', fontWeight: 500, borderRadius: '20px',
                        border: isDarkMode ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid #fde68a', gap: '6px'
                    }}>
                        <Building2 size={14} />SuperAdmin
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', height: 'calc(100% - 80px)' }}>
                {/* Left Column: Tabs + Content */}
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: `1px solid ${theme.border}` }}>
                        <button
                            onClick={() => setActiveTab('tags')}
                            style={{
                                padding: '12px 20px',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'tags' ? '2px solid #6366f1' : '2px solid transparent',
                                color: activeTab === 'tags' ? '#6366f1' : theme.textMuted,
                                fontWeight: activeTab === 'tags' ? 600 : 400,
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <List size={16} />
                            Catálogo de Etiquetas
                        </button>
                        <button
                            onClick={() => setActiveTab('variables')}
                            style={{
                                padding: '12px 20px',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'variables' ? '2px solid #6366f1' : '2px solid transparent',
                                color: activeTab === 'variables' ? '#6366f1' : theme.textMuted,
                                fontWeight: activeTab === 'variables' ? 600 : 400,
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Variable size={16} />
                            Variables Dinámicas
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'tags' ? (
                        <>
                            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: theme.text, margin: 0 }}>Catálogo de Etiquetas</h2>
                                    <p style={{ fontSize: '0.75rem', color: theme.textMuted, margin: 0 }}>
                                        Configura las respuestas rápidas para <strong style={{ color: theme.text }}>{currentTenant?.companyName || currentTenant?.username}</strong>
                                    </p>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: theme.textMuted, background: theme.cardBg, padding: '4px 10px', borderRadius: '4px', border: `1px solid ${theme.border}` }}>
                                    {loadingTags ? '...' : `${tags.length} activas`}
                                </span>
                            </div>
                            <div style={{ flex: 1, minHeight: 0 }}>
                                <TagTable tags={tags} onAdd={handleAddTag} onEdit={handleEditTag} onDelete={handleDeleteTag} isDarkMode={isDarkMode} />
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                            <VariableManager tenantId={selectedTenantId} />
                        </div>
                    )}
                </div>

                {/* Right Column: Simulator */}
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderLeft: `1px dashed ${theme.border}`, paddingLeft: '24px' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: theme.text, margin: 0 }}>Test en Vivo</h2>
                        <p style={{ fontSize: '0.75rem', color: theme.textMuted, margin: 0 }}>
                            Prueba las respuestas de <strong style={{ color: theme.text }}>{currentTenant?.companyName || currentTenant?.username}</strong>
                        </p>
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <Simulator tags={tags} isDarkMode={isDarkMode} />
                    </div>
                </div>
            </div>

            {/* Click outside to close dropdown */}
            {isDropdownOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setIsDropdownOpen(false)} />}

            {/* Edit Modal */}
            <EditTagModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTag} initialTag={editingTag} isDarkMode={isDarkMode} />
        </div>
    );
};

export default AITraining;
