import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Save, X } from 'lucide-react';
import './TemplatesTab.css';

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

const TemplatesTab = () => {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTag, setEditingTag] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        category: '',
        description: '',
        template: '',
        location: ''
    });

    // Fetch tags on mount
    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3002/api/tags', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTags(data);
            }
        } catch (err) {
            console.error('Error fetching tags:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.category || !formData.description || !formData.template) return;

        const token = localStorage.getItem('token');
        const tagData = {
            code: `/${formData.description.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}`,
            category: formData.category,
            description: formData.description,
            template: formData.template,
            location: formData.location || ''
        };

        try {
            if (editingTag) {
                // Update
                const response = await fetch(`http://localhost:3002/api/tags/${editingTag.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(tagData)
                });
                if (response.ok) {
                    const updated = await response.json();
                    setTags(tags.map(t => t.id === updated.id ? updated : t));
                }
            } else {
                // Create
                const response = await fetch('http://localhost:3002/api/tags', {
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

        // Reset form
        setFormData({ category: '', description: '', template: '', location: '' });
        setEditingTag(null);
        setIsModalOpen(false);
    };

    const handleEdit = (tag) => {
        setEditingTag(tag);
        setFormData({
            category: tag.category,
            description: tag.description,
            template: tag.template,
            location: tag.location || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        // Temporarily removed confirmation to test deletion
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3002/api/tags/${id}`, {
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

    const handleNewTag = () => {
        setEditingTag(null);
        setFormData({ category: '', description: '', template: '', location: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTag(null);
        setFormData({ category: '', description: '', template: '', location: '' });
    };

    if (loading) {
        return <div className="templates-tab-container" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Cargando...</div>;
    }

    return (
        <div className="templates-tab-container">
            {/* Header with Add Button */}
            <div className="templates-header">
                <h3 className="section-title">Respuestas Automáticas</h3>
                <button className="add-template-btn" onClick={handleNewTag}>
                    <Plus size={16} />
                    Nueva Respuesta
                </button>
            </div>

            {/* Tags List */}
            <div className="templates-list custom-scrollbar">
                {tags.length === 0 ? (
                    <div className="empty-state">
                        <p>No hay respuestas automáticas aún.</p>
                        <p className="text-muted">Crea una usando el botón de arriba.</p>
                    </div>
                ) : (
                    tags.map(tag => (
                        <div key={tag.id} className="template-card glass-panel">
                            <div className="template-card-header">
                                <span className="template-category">{tag.category}</span>
                                <div className="template-actions">
                                    <button className="action-btn edit" onClick={() => handleEdit(tag)}>
                                        <Edit2 size={14} style={{ pointerEvents: 'none' }} />
                                    </button>
                                    <button className="action-btn delete" onClick={() => handleDelete(tag.id)}>
                                        <Trash2 size={14} style={{ pointerEvents: 'none' }} />
                                    </button>
                                </div>
                            </div>
                            <div className="template-title">{tag.description}</div>
                            <div className="template-preview">{tag.template}</div>
                            {tag.location && (
                                <div className="template-location">
                                    <MapPin size={12} />
                                    {tag.location}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Respuestas Count */}
            <div className="templates-footer">
                <span>Respuestas Guardadas ({tags.length})</span>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingTag ? 'Editar Respuesta' : 'Nueva Respuesta Automática'}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Categoría</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Elige una categoría</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Título</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Saludo de bienvenida"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    placeholder="Escribe la respuesta automática aquí..."
                                    rows={4}
                                    value={formData.template}
                                    onChange={e => setFormData({ ...formData, template: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                    Ubicación (opcional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
                            <button className="btn-primary" onClick={handleSave}>
                                <Save size={16} />
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatesTab;
