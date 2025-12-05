import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, Building2, UserCog, Clock } from 'lucide-react';
import './VariableManager.css';

const VariableManager = ({ tenantId }) => {
    const [variables, setVariables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVariable, setEditingVariable] = useState(null);

    useEffect(() => {
        if (tenantId) {
            fetchVariables();
        }
    }, [tenantId]);

    const fetchVariables = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3002/api/admin/tenants/${tenantId}/variables`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Variables loaded:', data);
                setVariables(data);
            }
        } catch (err) {
            console.error('Error fetching variables:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingVariable(null);
        setShowModal(true);
    };

    const handleEdit = (variable) => {
        setEditingVariable(variable);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar esta variable? Las etiquetas que la usen mostrarán el código sin reemplazar.')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3002/api/admin/tenants/${tenantId}/variables/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setVariables(variables.filter(v => v.id !== id));
            }
        } catch (err) {
            console.error('Error deleting variable:', err);
        }
    };

    const handleSave = async (variableData) => {
        console.log('🔵 handleSave called with:', variableData);
        console.log('🔵 tenantId:', tenantId);

        try {
            const token = localStorage.getItem('token');
            const url = editingVariable
                ? `http://localhost:3002/api/admin/tenants/${tenantId}/variables/${editingVariable.id}`
                : `http://localhost:3002/api/admin/tenants/${tenantId}/variables`;

            const method = editingVariable ? 'PUT' : 'POST';

            console.log('🔵 Request URL:', url);
            console.log('🔵 Request method:', method);

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(variableData)
            });

            console.log('🔵 Response status:', response.status);

            if (response.ok) {
                const savedVariable = await response.json();
                console.log('✅ Variable saved:', savedVariable);

                if (editingVariable) {
                    setVariables(variables.map(v => v.id === savedVariable.id ? savedVariable : v));
                } else {
                    setVariables([...variables, savedVariable]);
                }
                setShowModal(false);
                alert('✅ Variable creada exitosamente!');
            } else {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                alert(`Error: ${errorText}`);
            }
        } catch (err) {
            console.error('❌ Error saving variable:', err);
            alert(`Error: ${err.message}`);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'contact': return <User size={16} />;
            case 'tenant': return <Building2 size={16} />;
            case 'operator': return <UserCog size={16} />;
            case 'system': return <Clock size={16} />;
            default: return null;
        }
    };

    const getTypeBadgeClass = (type) => {
        switch (type) {
            case 'contact': return 'badge-contact';
            case 'tenant': return 'badge-tenant';
            case 'operator': return 'badge-operator';
            case 'system': return 'badge-system';
            default: return '';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'contact': return 'Contacto';
            case 'tenant': return 'Empresa';
            case 'operator': return 'Operador';
            case 'system': return 'Sistema';
            default: return type;
        }
    };

    if (loading) {
        return <div className="loading-state">Cargando variables...</div>;
    }

    return (
        <div className="variable-manager">
            <div className="variable-header">
                <div>
                    <h2>Variables Dinámicas</h2>
                    <p className="subtitle">{variables.length} variable{variables.length !== 1 ? 's' : ''} configurada{variables.length !== 1 ? 's' : ''}</p>
                </div>
                <button className="btn-add-variable" onClick={handleAdd}>
                    <Plus size={18} />
                    Agregar
                </button>
            </div>

            {variables.length === 0 ? (
                <div className="empty-state">
                    <Clock size={48} className="empty-icon" />
                    <h3>No hay variables configuradas</h3>
                    <p>Las variables dinámicas permiten personalizar las respuestas automáticamente.</p>
                    <button className="btn-primary" onClick={handleAdd}>
                        <Plus size={18} />
                        Crear primera variable
                    </button>
                </div>
            ) : (
                <div className="variables-table-container">
                    <table className="variables-table">
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>Tipo</th>
                                <th>Origen / Descripción</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variables.map(variable => (
                                <tr key={variable.id}>
                                    <td>
                                        <code className="variable-code">{`{${variable.name}}`}</code>
                                    </td>
                                    <td>
                                        <span className={`type-badge ${getTypeBadgeClass(variable.type)}`}>
                                            {getTypeIcon(variable.type)}
                                            {getTypeLabel(variable.type)}
                                        </span>
                                    </td>
                                    <td className="description-cell">
                                        {variable.description || variable.value || '-'}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn edit"
                                                onClick={() => handleEdit(variable)}
                                                title="Editar"
                                            >
                                                <Edit2 size={14} style={{ pointerEvents: 'none' }} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDelete(variable.id)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} style={{ pointerEvents: 'none' }} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <AddVariableModal
                    variable={editingVariable}
                    onSave={handleSave}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

// Modal Component
const AddVariableModal = ({ variable, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: variable?.name || '',
        type: variable?.type || 'contact',
        description: variable?.description || '',
        value: variable?.value || '',
        askIfMissing: variable?.askIfMissing ?? true,
        askMessage: variable?.askMessage || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('📝 Form submitted:', formData);

        // Validar nombre de variable
        if (!/^[a-z_][a-z0-9_]*$/i.test(formData.name)) {
            alert('El nombre de la variable solo puede contener letras, números y guiones bajos, y debe comenzar con una letra.');
            return;
        }

        console.log('✅ Validation passed, calling onSave');
        onSave(formData);
    };

    const typeOptions = [
        { value: 'contact', label: 'Contacto (Preguntar)', description: 'Datos del cliente que se pueden solicitar' },
        { value: 'tenant', label: 'Empresa', description: 'Datos fijos de la empresa' },
        { value: 'operator', label: 'Operador', description: 'Datos del operador actual' },
        { value: 'system', label: 'Sistema', description: 'Valores generados automáticamente' }
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content variable-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{variable ? 'Editar Variable' : 'Nueva Variable'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Nombre Variable</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="ej: nombre"
                            required
                        />
                        <small>Sin llaves, solo letras, números y guiones bajos</small>
                    </div>

                    <div className="form-group">
                        <label>Tipo</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            required
                        >
                            {typeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <small>{typeOptions.find(o => o.value === formData.type)?.description}</small>
                    </div>

                    {formData.type === 'contact' ? (
                        <>
                            <div className="form-group">
                                <label>Descripción / Valor por Defecto</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="ej: Nombre de pila del cliente"
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.askIfMissing}
                                        onChange={e => setFormData({ ...formData, askIfMissing: e.target.checked })}
                                    />
                                    Preguntar si falta este dato
                                </label>
                            </div>

                            {formData.askIfMissing && (
                                <div className="form-group">
                                    <label>Mensaje para solicitar</label>
                                    <textarea
                                        value={formData.askMessage}
                                        onChange={e => setFormData({ ...formData, askMessage: e.target.value })}
                                        placeholder="ej: ¡Hola! ¿Me decís tu nombre para continuar?"
                                        rows={3}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="form-group">
                            <label>Valor / Descripción</label>
                            <input
                                type="text"
                                value={formData.value || formData.description}
                                onChange={e => setFormData({ ...formData, value: e.target.value, description: e.target.value })}
                                placeholder={formData.type === 'system' ? 'Se genera automáticamente' : 'ej: WORLD GUNS S.A.'}
                                disabled={formData.type === 'system'}
                            />
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            {variable ? 'Guardar Cambios' : 'Crear Variable'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VariableManager;
