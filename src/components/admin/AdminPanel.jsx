import React, { useState, useEffect } from 'react';
import { Bell, User } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import DashboardHome from './DashboardHome';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import AISettings from './AISettings';
import AITraining from './AITraining';
import APIDocsTab from './APIDocsTab';
import './AdminPanel.css';

const AdminPanel = ({ user, onLogout }) => {
    const [currentView, setCurrentView] = useState('users');
    const [tenantCount, setTenantCount] = useState(0);

    // Fetch tenant count for dashboard
    useEffect(() => {
        const fetchTenantCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3002/api/admin/tenants', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setTenantCount(data.length);
                }
            } catch (err) {
                console.error('Error fetching tenant count:', err);
            }
        };
        fetchTenantCount();
    }, [currentView]);

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardHome tenantCount={tenantCount} />;
            case 'users':
                return <UserManagement />;
            case 'ai-settings':
                return <AISettings />;
            case 'ai-training':
                return <AITraining />;
            case 'api-docs':
                return <APIDocsTab />;
            case 'roles':
                return <RoleManagement />;
            default:
                return <UserManagement />;
        }
    };

    const getViewTitle = () => {
        const titles = {
            dashboard: 'Panel de Control',
            users: 'Gestionar Usuario',
            'ai-settings': 'Configuración IA',
            'ai-training': 'Entrenamiento IA',
            'api-docs': 'API Externa',
            roles: 'Roles y Permisos'
        };
        return titles[currentView] || 'Panel';
    };

    return (
        <div className="admin-container">
            <AdminSidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                user={user}
                onLogout={onLogout}
            />

            <div className="admin-content">
                <header className="admin-topbar">
                    <span className="topbar-title">{getViewTitle()}</span>
                    <div className="topbar-actions">
                        <button style={{
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            padding: '8px'
                        }}>
                            <Bell size={20} />
                        </button>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            background: '#f3f4f6',
                            borderRadius: '8px'
                        }}>
                            <User size={18} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                {user?.username}
                            </span>
                        </div>
                    </div>
                </header>

                <main className="admin-main">
                    {renderContent()}
                </main>

                <footer className="admin-footer">
                    Copyright © 2025 | Version: 1.0
                </footer>
            </div>
        </div>
    );
};

export default AdminPanel;
