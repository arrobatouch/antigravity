import React, { useState, useEffect } from 'react';
import { Key, Copy, CheckCircle2, RefreshCw, Code, Send } from 'lucide-react';
import './APIDocsTab.css';

const APIDocsTab = () => {
    const [apiKey, setApiKey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState({});
    const [regenerating, setRegenerating] = useState(false);
    const [tenants, setTenants] = useState([]);
    const [selectedTenantId, setSelectedTenantId] = useState('');

    // Load tenants on mount
    useEffect(() => {
        fetchTenants();
    }, []);

    // Load API key when tenant is selected
    useEffect(() => {
        if (selectedTenantId) {
            fetchApiKey(selectedTenantId);
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

    const fetchApiKey = async (tenantId) => {
        try {
            const token = localStorage.getItem('token');
            // Try to get existing key
            let response = await fetch(`http://localhost:3002/api/admin/tenants/${tenantId}/apikey`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // If 404, generate a new one
            if (response.status === 404) {
                response = await fetch(`http://localhost:3002/api/admin/tenants/${tenantId}/apikey`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            if (response.ok) {
                const data = await response.json();
                setApiKey(data);
            }
        } catch (err) {
            console.error('Error fetching API key:', err);
        }
    };

    const handleRegenerateKey = async () => {
        if (!selectedTenantId) {
            alert('Selecciona un tenant primero');
            return;
        }

        if (!window.confirm('¿Regenerar API Key? Esto invalidará la clave anterior.')) return;

        setRegenerating(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3002/api/admin/tenants/${selectedTenantId}/apikey/regenerate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setApiKey(data);
            }
        } catch (err) {
            console.error('Error regenerating API key:', err);
        } finally {
            setRegenerating(false);
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied({ ...copied, [id]: true });
        setTimeout(() => {
            setCopied({ ...copied, [id]: false });
        }, 2000);
    };

    const endpoints = [
        {
            id: 'auth',
            title: 'Autenticación',
            method: 'POST',
            path: '/api/agent/auth',
            description: 'Obtener token JWT para autenticar al agente',
            request: {
                tenantId: selectedTenantId || 'YOUR_TENANT_ID',
                apiKey: apiKey?.key || 'YOUR_API_KEY'
            },
            curl: `curl -X POST http://localhost:3002/api/agent/auth \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenantId": "${selectedTenantId || 'YOUR_TENANT_ID'}",
    "apiKey": "${apiKey?.key || 'YOUR_API_KEY'}"
  }'`
        },
        {
            id: 'send',
            title: 'Enviar Mensaje',
            method: 'POST',
            path: '/api/agent/messages/send',
            description: 'Enviar un mensaje de WhatsApp a través del agente',
            request: {
                to: '+5491122334455',
                message: 'Hola, este es un mensaje desde ORUS/TECCIA'
            },
            curl: `curl -X POST http://localhost:3002/api/agent/messages/send \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+5491122334455",
    "message": "Hola desde el agente"
  }'`
        },
        {
            id: 'tags',
            title: 'Obtener Etiquetas',
            method: 'GET',
            path: '/api/agent/tags',
            description: 'Obtener todas las etiquetas/plantillas de la empresa',
            curl: `curl http://localhost:3002/api/agent/tags \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`
        },
        {
            id: 'query-tags',
            title: 'Buscar Etiquetas',
            method: 'POST',
            path: '/api/agent/tags/query',
            description: 'Buscar etiquetas por palabra clave',
            request: {
                query: 'horario de atención'
            },
            curl: `curl -X POST http://localhost:3002/api/agent/tags/query \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "horario de atención"
  }'`
        },
        {
            id: 'config',
            title: 'Configuración',
            method: 'GET',
            path: '/api/agent/tenant/config',
            description: 'Obtener configuración de la empresa y estado de WhatsApp',
            curl: `curl http://localhost:3002/api/agent/tenant/config \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`
        },
        {
            id: 'log',
            title: 'Registrar Actividad',
            method: 'POST',
            path: '/api/agent/logs',
            description: 'Registrar una acción del agente (para auditoría)',
            request: {
                action: 'tag_selected',
                metadata: {
                    tag: '/horario_atencion',
                    confidence: 0.95
                }
            },
            curl: `curl -X POST http://localhost:3002/api/agent/logs \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "tag_selected",
    "metadata": {
      "tag": "/horario_atencion",
      "confidence": 0.95
    }
  }'`
        }
    ];

    if (loading) {
        return (
            <div className="api-docs-container">
                <div className="loading-state">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="api-docs-container">
            {/* API Key Section */}
            <div className="api-key-section glass-panel">
                <div className="section-header">
                    <div className="header-with-icon">
                        <Key size={20} />
                        <h3>API Key</h3>
                    </div>
                    <button
                        className="btn-regenerate"
                        onClick={handleRegenerateKey}
                        disabled={regenerating}
                    >
                        <RefreshCw size={14} className={regenerating ? 'spinning' : ''} />
                        {regenerating ? 'Regenerando...' : 'Regenerar'}
                    </button>
                </div>

                {/* Tenant Selector */}
                <div className="tenant-selector">
                    <label htmlFor="tenant-select">Seleccionar Empresa:</label>
                    <select
                        id="tenant-select"
                        value={selectedTenantId}
                        onChange={(e) => setSelectedTenantId(e.target.value)}
                        className="tenant-dropdown"
                    >
                        {tenants.map(tenant => (
                            <option key={tenant.tenantId} value={tenant.tenantId}>
                                {tenant.companyName || tenant.username}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="api-key-display">
                    <code>{apiKey?.key || 'No disponible'}</code>
                    <button
                        className="btn-copy"
                        onClick={() => copyToClipboard(apiKey?.key, 'apikey')}
                    >
                        {copied.apikey ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    </button>
                </div>

                <div className="api-key-info">
                    <p className="text-muted">
                        <strong>Tenant ID:</strong> {selectedTenantId || 'Selecciona un tenant'}
                    </p>
                    {apiKey?.createdAt && (
                        <p className="text-muted">
                            <strong>Creada:</strong> {new Date(apiKey.createdAt).toLocaleString('es-AR')}
                        </p>
                    )}
                    {apiKey?.lastUsed && (
                        <p className="text-muted">
                            <strong>Último uso:</strong> {new Date(apiKey.lastUsed).toLocaleString('es-AR')}
                        </p>
                    )}
                </div>
            </div>

            {/* Introduction */}
            <div className="intro-section glass-panel">
                <h3><Code size={20} /> Documentación API Externa</h3>
                <p>
                    Esta API permite que agentes inteligentes externos (como ORUS o TECCIA)
                    controlen el sistema de WhatsApp SaaS de forma programática.
                </p>
                <div className="quick-start">
                    <h4>Quick Start:</h4>
                    <ol>
                        <li>Copiar el <strong>API Key</strong> de arriba</li>
                        <li>Autenticar usando <code>/api/agent/auth</code></li>
                        <li>Usar el token JWT en todas las demás llamadas</li>
                    </ol>
                </div>
            </div>

            {/* Endpoints */}
            <div className="endpoints-section">
                <h3 className="section-title">Endpoints Disponibles</h3>

                {endpoints.map(endpoint => (
                    <div key={endpoint.id} className="endpoint-card glass-panel">
                        <div className="endpoint-header">
                            <div>
                                <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
                                    {endpoint.method}
                                </span>
                                <code className="endpoint-path">{endpoint.path}</code>
                            </div>
                            <h4>{endpoint.title}</h4>
                        </div>

                        <p className="endpoint-description">{endpoint.description}</p>

                        {endpoint.request && (
                            <div className="code-block">
                                <div className="code-header">
                                    <span>Request Body</span>
                                    <button
                                        className="btn-copy-small"
                                        onClick={() => copyToClipboard(JSON.stringify(endpoint.request, null, 2), `req-${endpoint.id}`)}
                                    >
                                        {copied[`req-${endpoint.id}`] ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <pre><code>{JSON.stringify(endpoint.request, null, 2)}</code></pre>
                            </div>
                        )}

                        <div className="code-block">
                            <div className="code-header">
                                <span>cURL Example</span>
                                <button
                                    className="btn-copy-small"
                                    onClick={() => copyToClipboard(endpoint.curl, `curl-${endpoint.id}`)}
                                >
                                    {copied[`curl-${endpoint.id}`] ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                            <pre><code>{endpoint.curl}</code></pre>
                        </div>
                    </div>
                ))}
            </div>

            {/* Example Flow */}
            <div className="example-flow glass-panel">
                <h3><Send size={20} /> Flujo Completo de Ejemplo</h3>
                <p>Cómo un agente externo respondería a un mensaje usando la API:</p>

                <div className="flow-steps">
                    <div className="flow-step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h4>Autenticar</h4>
                            <p>POST /api/agent/auth con tenantId y apiKey</p>
                        </div>
                    </div>

                    <div className="flow-step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h4>Obtener Etiquetas</h4>
                            <p>GET /api/agent/tags con el token recibido</p>
                        </div>
                    </div>

                    <div className="flow-step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h4>Buscar Tag Apropiado</h4>
                            <p>POST /api/agent/tags/query con la consulta del cliente</p>
                        </div>
                    </div>

                    <div className="flow-step">
                        <div className="step-number">4</div>
                        <div className="step-content">
                            <h4>Enviar Respuesta</h4>
                            <p>POST /api/agent/messages/send con el mensaje</p>
                        </div>
                    </div>

                    <div className="flow-step">
                        <div className="step-number">5</div>
                        <div className="step-content">
                            <h4>Registrar Actividad</h4>
                            <p>POST /api/agent/logs para auditoría</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default APIDocsTab;
