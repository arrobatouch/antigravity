import React, { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, Check, X, Lock } from 'lucide-react';

// Mock data for roles
const MOCK_ROLES = [
    {
        id: '1',
        name: 'Super Administrador',
        description: 'Acceso completo a todas las funciones del sistema',
        permissions: ['all'],
        usersCount: 1
    },
    {
        id: '2',
        name: 'Administrador',
        description: 'Gestión de usuarios y configuración básica',
        permissions: ['dashboard', 'users', 'reports'],
        usersCount: 3
    },
    {
        id: '3',
        name: 'Supervisor',
        description: 'Supervisión de empleados y reportes',
        permissions: ['dashboard', 'reports'],
        usersCount: 5
    },
    {
        id: '4',
        name: 'Vendedor',
        description: 'Acceso limitado a funciones de venta',
        permissions: ['dashboard'],
        usersCount: 12
    }
];

const RoleManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);

    const availablePermissions = [
        { id: 'dashboard', label: 'Ver Panel de Control' },
        { id: 'users', label: 'Gestionar Usuarios y Empleados' },
        { id: 'billing', label: 'Ver Facturación y Planes' },
        { id: 'ai_config', label: 'Configurar Modelos IA' },
        { id: 'reports', label: 'Exportar Reportes' },
        { id: 'roles', label: 'Gestionar Roles y Permisos' },
    ];

    const handleEdit = (role) => {
        setSelectedRole(role);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedRole(null);
        setIsModalOpen(true);
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1><Shield size={28} /> Roles y Permisos</h1>
                    <p>Define los roles de administración de tu empresa</p>
                </div>
                <button className="btn-primary" onClick={handleNew}>
                    <Plus size={16} />
                    Nuevo Rol
                </button>
            </div>

            {/* Grid of Roles */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                {MOCK_ROLES.map((role) => (
                    <div
                        key={role.id}
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            border: '1px solid #e5e7eb',
                            padding: '24px',
                            transition: 'box-shadow 0.2s'
                        }}
                        className="hover-shadow"
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{
                                padding: '10px',
                                background: '#d1fae5',
                                borderRadius: '10px',
                                color: '#059669'
                            }}>
                                <Lock size={24} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleEdit(role)}
                                    style={{
                                        padding: '6px',
                                        background: 'none',
                                        border: 'none',
                                        color: '#9ca3af',
                                        cursor: 'pointer',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    style={{
                                        padding: '6px',
                                        background: 'none',
                                        border: 'none',
                                        color: '#9ca3af',
                                        cursor: 'pointer',
                                        borderRadius: '6px'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>
                            {role.name}
                        </h3>
                        <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            marginBottom: '16px',
                            minHeight: '40px',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {role.description}
                        </p>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid #f3f4f6',
                            paddingTop: '16px',
                            fontSize: '0.75rem',
                            color: '#6b7280'
                        }}>
                            <div style={{ display: 'flex' }}>
                                {[...Array(Math.min(role.usersCount, 4))].map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: '#e5e7eb',
                                            border: '2px solid white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '8px',
                                            fontWeight: 600,
                                            color: '#6b7280',
                                            marginLeft: i > 0 ? '-8px' : 0
                                        }}
                                    >
                                        U{i + 1}
                                    </div>
                                ))}
                                {role.usersCount > 4 && (
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: '#f3f4f6',
                                        border: '2px solid white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '8px',
                                        fontWeight: 600,
                                        color: '#6b7280',
                                        marginLeft: '-8px'
                                    }}>
                                        +{role.usersCount - 4}
                                    </div>
                                )}
                            </div>
                            <span style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                border: '1px solid #a7f3d0',
                                fontSize: '0.75rem',
                                fontWeight: 500
                            }}>
                                {role.usersCount} Usuarios
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Role Editor */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>
                                <span className="modal-header-icon">
                                    <Shield size={20} />
                                </span>
                                {selectedRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
                            </h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label>Nombre del Rol</label>
                                <input
                                    type="text"
                                    defaultValue={selectedRole?.name}
                                    placeholder="Ej. Gerente de Marketing"
                                />
                            </div>

                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    rows={2}
                                    defaultValue={selectedRole?.description}
                                    placeholder="Describe las responsabilidades de este rol..."
                                    style={{
                                        padding: '12px 16px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '10px',
                                        fontSize: '0.95rem',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Permisos de Administración</label>
                                <div style={{
                                    background: '#f9fafb',
                                    padding: '16px',
                                    borderRadius: '10px',
                                    border: '1px solid #e5e7eb',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {availablePermissions.map((perm) => (
                                        <label
                                            key={perm.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px',
                                                cursor: 'pointer',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                defaultChecked={selectedRole?.permissions.includes(perm.id) || selectedRole?.permissions.includes('all')}
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    accentColor: '#059669'
                                                }}
                                            />
                                            <span style={{ fontSize: '0.875rem', color: '#374151' }}>{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </button>
                            <button className="btn-primary" onClick={() => setIsModalOpen(false)}>
                                <Check size={18} />
                                Guardar Rol
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagement;
