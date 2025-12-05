import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    X,
    Check,
    Download,
    SlidersHorizontal,
    ChevronDown,
    ChevronUp,
    User as UserIcon,
    ArrowRightCircle
} from 'lucide-react';

const UserManagement = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showPassword, setShowPassword] = useState({});
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [formData, setFormData] = useState({
        companyName: '',
        mobile: '',
        username: '',
        password: '',
        email: '',
        employees: 0
    });

    // Fetch tenants from API
    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3002/api/admin/tenants', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setTenants(data);
            }
        } catch (err) {
            console.error('Error fetching tenants:', err);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (id) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleRowExpansion = (userId) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
        } else {
            setExpandedUserId(userId);
        }
    };

    // Mock generator for employees based on company ID
    const getMockEmployees = (companyId, count) => {
        return Array.from({ length: count }).map((_, index) => ({
            id: `emp-${companyId}-${index}`,
            name: `Empleado ${index + 1}`,
            role: index === 0 ? 'Supervisor' : 'Vendedor',
            username: `user_${companyId.slice(0, 6)}_${index + 1}`,
            password: `pass${index + 1}!`
        }));
    };

    const handleOpenAddModal = () => {
        setEditingId(null);
        setFormData({
            companyName: '',
            mobile: '',
            username: '',
            password: '',
            email: '',
            employees: 0
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (tenant) => {
        setEditingId(tenant.id);
        setFormData({
            companyName: tenant.companyName || '',
            mobile: tenant.mobile || '',
            username: tenant.username,
            password: tenant.password || '',
            email: tenant.email || '',
            employees: tenant.employees || 0
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');

        try {
            if (editingId) {
                // Update existing tenant
                const response = await fetch(`http://localhost:3002/api/admin/tenants/${editingId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    await fetchTenants();
                    setIsModalOpen(false);
                }
            } else {
                // Create new tenant
                const response = await fetch('http://localhost:3002/api/admin/tenants', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    await fetchTenants();
                    setIsModalOpen(false);
                }
            }
        } catch (err) {
            console.error('Error saving tenant:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta empresa?')) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3002/api/admin/tenants/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                if (expandedUserId === id) setExpandedUserId(null);
                await fetchTenants();
            }
        } catch (err) {
            console.error('Error deleting tenant:', err);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Cargando...</div>;
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>👥 Gestionar Usuario</h1>
                    <p>Administra las empresas registradas y sus credenciales</p>
                </div>
                <button className="btn-primary" onClick={handleOpenAddModal}>
                    <Plus size={18} />
                    Alta de Empresa
                </button>
            </div>

            {/* Table */}
            <div className="table-container">
                <div className="table-toolbar">
                    <div className="toolbar-filters">
                        <button className="toolbar-btn">
                            <SlidersHorizontal size={16} /> Columns
                        </button>
                        <button className="toolbar-btn">
                            <SlidersHorizontal size={16} /> Filters
                        </button>
                    </div>
                    <button className="toolbar-btn">
                        <Download size={16} /> Export
                    </button>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>Detalle</th>
                            <th>Empresa</th>
                            <th>Móvil</th>
                            <th>Usuario</th>
                            <th>Contraseña</th>
                            <th>Empleados</th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                    No hay empresas registradas
                                </td>
                            </tr>
                        ) : (
                            tenants.map(tenant => (
                                <React.Fragment key={tenant.id}>
                                    <tr style={{
                                        background: expandedUserId === tenant.id ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                                    }}>
                                        <td>
                                            <button
                                                onClick={() => toggleRowExpansion(tenant.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#10b981',
                                                    cursor: 'pointer',
                                                    padding: '4px'
                                                }}
                                            >
                                                <ArrowRightCircle size={20} />
                                            </button>
                                        </td>
                                        <td>
                                            <div className="company-cell">
                                                <div className="company-avatar">
                                                    {(tenant.companyName || tenant.username).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="company-info">
                                                    <strong>{tenant.companyName || tenant.username}</strong>
                                                    <span>{tenant.email || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                            {tenant.mobile || '-'}
                                        </td>
                                        <td>
                                            <span className="username-badge">{tenant.username}</span>
                                        </td>
                                        <td>
                                            <div className="password-cell">
                                                <span className="password-text">
                                                    {showPassword[tenant.id] ? tenant.password : '••••••••'}
                                                </span>
                                                <button
                                                    className="toggle-password"
                                                    onClick={() => togglePasswordVisibility(tenant.id)}
                                                >
                                                    {showPassword[tenant.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleRowExpansion(tenant.id)}
                                                className="employees-badge"
                                                style={{
                                                    background: expandedUserId === tenant.id ? '#2563eb' : '#dbeafe',
                                                    color: expandedUserId === tenant.id ? 'white' : '#1d4ed8',
                                                    border: expandedUserId === tenant.id ? '1px solid #2563eb' : '1px solid transparent'
                                                }}
                                            >
                                                {tenant.employees || 0}
                                                {expandedUserId === tenant.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => handleOpenEditModal(tenant)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(tenant.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Row for Employees */}
                                    {expandedUserId === tenant.id && (
                                        <tr style={{ background: '#f9fafb' }}>
                                            <td colSpan={7} style={{ padding: 0 }}>
                                                <div style={{
                                                    padding: '24px',
                                                    paddingLeft: '64px',
                                                    borderBottom: '2px solid #e5e7eb',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginBottom: '16px'
                                                    }}>
                                                        <div style={{
                                                            background: '#dbeafe',
                                                            padding: '10px',
                                                            borderRadius: '10px',
                                                            marginRight: '12px',
                                                            color: '#2563eb'
                                                        }}>
                                                            <UserIcon size={18} />
                                                        </div>
                                                        <div>
                                                            <h3 style={{
                                                                fontWeight: 700,
                                                                color: '#1f2937',
                                                                fontSize: '0.9rem',
                                                                margin: 0
                                                            }}>
                                                                Empleados de {tenant.companyName || tenant.username}
                                                            </h3>
                                                            <p style={{
                                                                fontSize: '0.75rem',
                                                                color: '#6b7280',
                                                                margin: 0
                                                            }}>
                                                                Listado de personal registrado
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div style={{
                                                        background: 'white',
                                                        borderRadius: '10px',
                                                        border: '1px solid #e5e7eb',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <table style={{
                                                            width: '100%',
                                                            borderCollapse: 'collapse',
                                                            fontSize: '0.875rem'
                                                        }}>
                                                            <thead>
                                                                <tr style={{ background: '#f3f4f6' }}>
                                                                    <th style={{
                                                                        padding: '12px 16px',
                                                                        textAlign: 'left',
                                                                        fontSize: '0.7rem',
                                                                        textTransform: 'uppercase',
                                                                        fontWeight: 600,
                                                                        color: '#6b7280'
                                                                    }}>Nombre</th>
                                                                    <th style={{
                                                                        padding: '12px 16px',
                                                                        textAlign: 'left',
                                                                        fontSize: '0.7rem',
                                                                        textTransform: 'uppercase',
                                                                        fontWeight: 600,
                                                                        color: '#6b7280'
                                                                    }}>Rol</th>
                                                                    <th style={{
                                                                        padding: '12px 16px',
                                                                        textAlign: 'left',
                                                                        fontSize: '0.7rem',
                                                                        textTransform: 'uppercase',
                                                                        fontWeight: 600,
                                                                        color: '#6b7280'
                                                                    }}>Usuario</th>
                                                                    <th style={{
                                                                        padding: '12px 16px',
                                                                        textAlign: 'left',
                                                                        fontSize: '0.7rem',
                                                                        textTransform: 'uppercase',
                                                                        fontWeight: 600,
                                                                        color: '#6b7280'
                                                                    }}>Contraseña</th>
                                                                    <th style={{
                                                                        padding: '12px 16px',
                                                                        textAlign: 'right',
                                                                        fontSize: '0.7rem',
                                                                        textTransform: 'uppercase',
                                                                        fontWeight: 600,
                                                                        color: '#6b7280'
                                                                    }}>Acciones</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(tenant.employees || 0) === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={5} style={{
                                                                            padding: '24px',
                                                                            textAlign: 'center',
                                                                            color: '#9ca3af'
                                                                        }}>
                                                                            No hay empleados registrados
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    getMockEmployees(tenant.id, tenant.employees).map((emp) => (
                                                                        <tr key={emp.id} style={{
                                                                            borderTop: '1px solid #f3f4f6'
                                                                        }}>
                                                                            <td style={{
                                                                                padding: '12px 16px',
                                                                                fontWeight: 500,
                                                                                color: '#1f2937'
                                                                            }}>
                                                                                {emp.name}
                                                                            </td>
                                                                            <td style={{ padding: '12px 16px' }}>
                                                                                <span style={{
                                                                                    background: '#f3f4f6',
                                                                                    color: '#4b5563',
                                                                                    padding: '4px 8px',
                                                                                    borderRadius: '4px',
                                                                                    fontSize: '0.75rem',
                                                                                    border: '1px solid #e5e7eb'
                                                                                }}>
                                                                                    {emp.role}
                                                                                </span>
                                                                            </td>
                                                                            <td style={{
                                                                                padding: '12px 16px',
                                                                                fontFamily: 'monospace',
                                                                                fontSize: '0.8rem',
                                                                                color: '#2563eb'
                                                                            }}>
                                                                                {emp.username}
                                                                            </td>
                                                                            <td style={{ padding: '12px 16px' }}>
                                                                                <div style={{
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '8px'
                                                                                }}>
                                                                                    <span style={{
                                                                                        fontFamily: 'monospace',
                                                                                        fontSize: '0.75rem',
                                                                                        color: '#9ca3af'
                                                                                    }}>
                                                                                        {showPassword[emp.id] ? emp.password : '••••••••'}
                                                                                    </span>
                                                                                    <button
                                                                                        onClick={() => togglePasswordVisibility(emp.id)}
                                                                                        style={{
                                                                                            background: 'none',
                                                                                            border: 'none',
                                                                                            color: '#d1d5db',
                                                                                            cursor: 'pointer',
                                                                                            padding: '2px'
                                                                                        }}
                                                                                    >
                                                                                        {showPassword[emp.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                            <td style={{
                                                                                padding: '12px 16px',
                                                                                textAlign: 'right'
                                                                            }}>
                                                                                <button style={{
                                                                                    background: 'none',
                                                                                    border: 'none',
                                                                                    color: '#9ca3af',
                                                                                    cursor: 'pointer',
                                                                                    marginRight: '8px'
                                                                                }}>
                                                                                    <Edit2 size={14} />
                                                                                </button>
                                                                                <button style={{
                                                                                    background: 'none',
                                                                                    border: 'none',
                                                                                    color: '#9ca3af',
                                                                                    cursor: 'pointer'
                                                                                }}>
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="table-pagination">
                    <span>Rows per page: 100</span>
                    <span>1-{tenants.length} of {tenants.length}</span>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <span className="modal-header-icon">
                                    <Plus size={20} />
                                </span>
                                {editingId ? 'Editar Empresa' : 'Alta de Nueva Empresa'}
                            </h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nombre de la Empresa</label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                        placeholder="Ej. Tech Solutions SRL"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Móvil / Contacto</label>
                                    <input
                                        type="text"
                                        value={formData.mobile}
                                        onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                        placeholder="+54 9 11..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="empresa@ejemplo.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Cantidad de Empleados</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.employees}
                                        onChange={e => setFormData({ ...formData, employees: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Usuario de Acceso</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="usuario_admin"
                                        disabled={!!editingId}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Contraseña</label>
                                    <input
                                        type="text"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </button>
                            <button className="btn-primary" onClick={handleSave}>
                                <Check size={18} />
                                {editingId ? 'Guardar Cambios' : 'Guardar Empresa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
