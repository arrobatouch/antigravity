import React from 'react';
import { Users, CreditCard, Activity, TrendingUp } from 'lucide-react';

const DashboardHome = ({ tenantCount = 0 }) => {
    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
                    Panel de Control
                </h1>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Resumen de la actividad del sistema
                </p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon green">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <label>Total Empresas</label>
                        <h3>{tenantCount}</h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon blue">
                        <CreditCard size={24} />
                    </div>
                    <div className="stat-info">
                        <label>Ingresos Mensuales</label>
                        <h3>$0</h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon purple">
                        <Activity size={24} />
                    </div>
                    <div className="stat-info">
                        <label>Tokens IA Usados</label>
                        <h3>0</h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon orange">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <label>Sesiones Activas</label>
                        <h3>0</h3>
                    </div>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '24px'
            }}>
                <div style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb'
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
                        Actividad Reciente
                    </h3>
                    <div style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>
                        No hay actividad reciente
                    </div>
                </div>

                <div style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb'
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>
                        Consumo de IA
                    </h3>
                    <div style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>
                        Sin datos de consumo
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
