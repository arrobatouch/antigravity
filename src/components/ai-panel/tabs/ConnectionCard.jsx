import React from 'react';
import QRCodeDisplay from './QRCodeDisplay';
import { Smartphone, RefreshCw, Power, Trash2 } from 'lucide-react';

const ConnectionCard = ({ session, onUpdate, onDelete }) => {

    const handleToggleConfig = (key) => {
        onUpdate(session.id, {
            config: {
                ...session.config,
                [key]: !session.config[key]
            }
        });
    };

    const getStatusColor = () => {
        switch (session.status) {
            case 'connected':
                return 'bg-green-500';
            case 'waiting':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = () => {
        switch (session.status) {
            case 'connected':
                return 'Conectado';
            case 'waiting':
                return 'Esperando escaneo';
            default:
                return 'Desconectado';
        }
    };

    return (
        <div className="bg-[#1f2937] border border-gray-700/50 rounded-lg p-4 mb-4 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${session.status === 'connected' ? 'animate-pulse' : ''}`}></div>
                    <h3 className="font-semibold text-white">{session.name}</h3>
                </div>
                <button
                    onClick={() => onDelete(session.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Eliminar sesión"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* QR Section */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white/5 p-2 rounded-lg min-w-[160px]">
                    {session.status === 'waiting' && session.qrCode ? (
                        <div className="relative group">
                            <QRCodeDisplay value={session.qrCode} size={140} />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                <span className="text-xs font-bold text-white text-center px-2">Escanear con WhatsApp</span>
                            </div>
                            <p className="text-xs text-yellow-500 mt-2 text-center animate-pulse">Esperando escaneo...</p>
                        </div>
                    ) : session.status === 'connected' ? (
                        <div className="w-[140px] h-[140px] bg-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-400">
                            <Smartphone size={48} className="mb-2 text-green-500" />
                            <span className="text-xs">Conectado</span>
                        </div>
                    ) : (
                        <div className="w-[140px] h-[140px] bg-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-400">
                            <Smartphone size={48} className="mb-2 text-gray-500" />
                            <span className="text-xs">Desconectado</span>
                        </div>
                    )}
                </div>

                {/* Info & Controls */}
                <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <span className="text-gray-400">Estado:</span>
                        <span className={`font-medium ${session.status === 'connected' ? 'text-green-400' :
                                session.status === 'waiting' ? 'text-yellow-400' :
                                    'text-gray-400'
                            }`}>
                            {getStatusText()}
                        </span>

                        <span className="text-gray-400">Número:</span>
                        <span className="text-white">{session.phoneNumber || '-'}</span>

                        <span className="text-gray-400">ID Sesión:</span>
                        <span className="text-white font-mono text-xs truncate">{session.id.slice(0, 12)}...</span>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                        {session.status === 'connected' ? (
                            <button
                                onClick={() => onUpdate(session.id, { status: 'disconnected', phoneNumber: null })}
                                className="w-full py-1.5 border border-red-500/50 text-red-400 rounded hover:bg-red-500/10 text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                <Power size={14} /> Desconectar
                            </button>
                        ) : (
                            <button
                                onClick={() => onUpdate(session.id, { status: 'waiting' })}
                                className="w-full py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded hover:bg-green-500/20 text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={14} /> Generar QR
                            </button>
                        )}

                        {/* Automations Section */}
                        <div className="mt-4 pt-3 border-t border-gray-700/50">
                            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Automatizaciones</h4>

                            <div className="flex items-center justify-between mb-2">
                                <div className="flex flex-col">
                                    <span className="text-sm text-white">Respuestas Automáticas</span>
                                    <span className="text-[10px] text-gray-400">IA responde precio y stock</span>
                                </div>
                                <button
                                    onClick={() => handleToggleConfig('autoReplies')}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${session.config.autoReplies ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${session.config.autoReplies ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm text-white">Utilizar Variables</span>
                                    <span className="text-[10px] text-gray-400">Habilitar datos dinámicos</span>
                                </div>
                                <button
                                    onClick={() => handleToggleConfig('followUp')}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${session.config.followUp ? 'bg-green-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${session.config.followUp ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectionCard;
