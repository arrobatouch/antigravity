import React from 'react';
import {
    LayoutDashboard,
    Users,
    Settings,
    Shield,
    LogOut,
    Cpu,
    Bot,
    Code,
    Moon,
    Sun
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const AdminSidebar = ({ currentView, setCurrentView, user, onLogout }) => {
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
        { id: 'users', icon: Users, label: 'Gestionar Usuario' },
        { id: 'ai-settings', icon: Cpu, label: 'Configuración IA' },
        { id: 'ai-training', icon: Bot, label: 'Entrenamiento IA' },
        { id: 'api-docs', icon: Code, label: 'API Externa' },
        { id: 'roles', icon: Shield, label: 'Roles y Permisos' },
    ];

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    K<span>EOS</span>
                </div>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="user-info">
                    <h4>{user?.username || 'Admin User'}</h4>
                    <span>Super Admin</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-title">Navegación Principal</div>
                {navItems.map(item => (
                    <div
                        key={item.id}
                        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                        onClick={() => setCurrentView(item.id)}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </div>
                ))}

                <div className="nav-section-title">Sistema</div>
                <div
                    className="nav-item"
                    onClick={toggleTheme}
                    style={{ cursor: 'pointer' }}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </div>
                <div
                    className="nav-item nav-item-logout"
                    onClick={onLogout}
                >
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </div>
            </nav>
        </aside>
    );
};

export default AdminSidebar;
