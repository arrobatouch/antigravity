import React, { useState } from 'react';
import './AIPanel.css';
import AIActionTab from './tabs/AIActionTab';
import TemplatesTab from './tabs/TemplatesTab';
import ConfigTab from './tabs/ConfigTab';

const AIPanel = ({ aiEnabled, onToggleAI, socket }) => {
    const [activeTab, setActiveTab] = useState('action');

    return (
        <div className="ai-panel-container">
            <div className="ai-panel-header">
                <h2 className="panel-title">Panel IA</h2>
                <div
                    className={`ai-status-indicator ${aiEnabled ? 'active' : 'inactive'}`}
                    onClick={onToggleAI}
                    style={{ cursor: 'pointer' }}
                    title="Click para activar/desactivar"
                >
                    <span className={`status-dot ${aiEnabled ? 'active' : ''}`}></span>
                    {aiEnabled ? 'IA ACTIVA' : 'IA PAUSADA'}
                </div>
            </div>

            <div className="ai-tabs">
                <button
                    className={`tab-btn ${activeTab === 'action' ? 'active' : ''}`}
                    onClick={() => setActiveTab('action')}
                >
                    IA en Acción
                </button>
                <button
                    className={`tab-btn ${activeTab === 'autoresponses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('autoresponses')}
                >
                    Respuestas Automáticas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    Configuración
                </button>
            </div>

            <div className="ai-panel-content custom-scrollbar">
                {activeTab === 'action' && <AIActionTab socket={socket} />}
                {activeTab === 'autoresponses' && <TemplatesTab />}
                {activeTab === 'config' && <ConfigTab socket={socket} />}
            </div>
        </div>
    );
};

export default AIPanel;
