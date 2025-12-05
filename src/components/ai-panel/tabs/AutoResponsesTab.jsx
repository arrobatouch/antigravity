import React, { useState, useEffect } from 'react';
import './AutoResponsesTab.css';

const CATEGORIES = [
    'Precios',
    'Horarios',
    'Consultas Generales',
    'Productos',
    'Servicios',
    'Soporte',
    'Otro'
];

const AutoResponsesTab = () => {
    const [responses, setResponses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        category: '',
        title: '',
        description: ''
    });

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('autoResponses');
        if (saved) {
            setResponses(JSON.parse(saved));
        }
    }, []);

    // Save to localStorage whenever responses change
    useEffect(() => {
        localStorage.setItem('autoResponses', JSON.stringify(responses));
    }, [responses]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.category || !formData.title || !formData.description) {
            return;
        }

        if (editingId) {
            // Update existing response
            setResponses(prev => prev.map(resp =>
                resp.id === editingId
                    ? { ...resp, ...formData }
                    : resp
            ));
            setEditingId(null);
        } else {
            // Create new response
            const newResponse = {
                id: Date.now(),
                ...formData,
                createdAt: new Date().toISOString()
            };
            setResponses(prev => [newResponse, ...prev]);
        }

        // Reset form
        setFormData({ category: '', title: '', description: '' });
    };

    const handleEdit = (response) => {
        setFormData({
            category: response.category,
            title: response.title,
            description: response.description
        });
        setEditingId(response.id);
        // Scroll to top to see the editor
        document.querySelector('.ai-panel-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta respuesta automática?')) {
            setResponses(prev => prev.filter(resp => resp.id !== id));
            if (editingId === id) {
                setEditingId(null);
                setFormData({ category: '', title: '', description: '' });
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ category: '', title: '', description: '' });
    };

    return (
        <div className="auto-responses-container">
            {/* Editor Section */}
            <div className="editor-section glass-panel">
                <h3 className="section-title">
                    {editingId ? 'Editar Respuesta Automática' : 'Nueva Respuesta Automática'}
                </h3>
                <form onSubmit={handleSubmit} className="response-form">
                    <div className="form-group">
                        <label htmlFor="category">Categoría</label>
                        <select
                            id="category"
                            className="form-select"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                        >
                            <option value="">Elige una categoría</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="title">Título</label>
                        <input
                            id="title"
                            type="text"
                            className="form-input"
                            placeholder="Ej: Saludo de bienvenida"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Descripción</label>
                        <textarea
                            id="description"
                            className="form-textarea custom-scrollbar"
                            placeholder="Escribe la respuesta automática aquí..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        {editingId && (
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={handleCancelEdit}
                            >
                                Cancelar
                            </button>
                        )}
                        <button type="submit" className="save-btn">
                            {editingId ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Cards Section */}
            <div className="responses-section">
                <h3 className="section-title">
                    Respuestas Guardadas ({responses.length})
                </h3>
                <div className="responses-grid">
                    {responses.length === 0 ? (
                        <div className="empty-state">
                            <p>No hay respuestas automáticas aún.</p>
                            <p>Crea una usando el formulario de arriba.</p>
                        </div>
                    ) : (
                        responses.map(response => (
                            <div
                                key={response.id}
                                className={`response-card glass-panel ${editingId === response.id ? 'editing' : ''}`}
                            >
                                <div className="card-header">
                                    <span className="card-category">{response.category}</span>
                                    <div className="card-actions">
                                        <button
                                            className="icon-btn edit-btn"
                                            onClick={() => handleEdit(response)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="icon-btn delete-btn"
                                            onClick={() => handleDelete(response.id)}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <h4 className="card-title">{response.title}</h4>
                                <p className="card-description">{response.description}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AutoResponsesTab;
