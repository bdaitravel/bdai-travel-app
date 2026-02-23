
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export const PartnerDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        // Simulamos datos de analytics basados en la estructura real para la demo de venta
        // En producción, esto consultaría una tabla de 'analytics_events'
        setTimeout(() => {
            setStats({
                totalVisitors: 1240,
                activeTours: 85,
                avgCompletion: '78%',
                topCities: [
                    { name: 'Madrid', visitors: 450, color: '#8b5cf6' },
                    { name: 'Vienna', visitors: 320, color: '#ec4899' },
                    { name: 'Paris', visitors: 280, color: '#3b82f6' },
                    { name: 'Rome', visitors: 190, color: '#10b981' }
                ],
                demographics: [
                    { name: '18-24', value: 35 },
                    { name: '25-34', value: 45 },
                    { name: '35-44', value: 15 },
                    { name: '45+', value: 5 }
                ],
                languages: [
                    { name: 'Español', value: 40 },
                    { name: 'English', value: 35 },
                    { name: 'Deutsch', value: 15 },
                    { name: 'Otros', value: 10 }
                ]
            });
            setLoading(false);
        }, 1000);
    };

    if (loading) return (
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[5000]">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white font-black uppercase text-[10px] tracking-[0.3em]">Cargando Inteligencia de Mercado...</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#020617] z-[5000] flex flex-col overflow-y-auto no-scrollbar p-8 font-sans">
            <header className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Partner Insights</h2>
                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-2">bdai B2B / Government Portal</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
                    <i className="fas fa-times"></i>
                </button>
            </header>

            <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-2">Visitantes Totales</p>
                    <span className="text-2xl font-black text-white">{stats.totalVisitors}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-2">Tours Activos</p>
                    <span className="text-2xl font-black text-purple-400">{stats.activeTours}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-2">Tasa de Éxito</p>
                    <span className="text-2xl font-black text-emerald-400">{stats.avgCompletion}</span>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                        <i className="fas fa-chart-bar text-purple-500"></i> Tráfico por Destino
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topCities}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="visitors" radius={[8, 8, 0, 0]}>
                                    {stats.topCities.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pb-12">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6">Idiomas Guía</h3>
                        <div className="space-y-4">
                            {stats.languages.map((lang: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{lang.name}</span>
                                    <div className="flex items-center gap-3 flex-1 mx-4">
                                        <div className="h-1.5 bg-white/5 rounded-full flex-1 overflow-hidden">
                                            <div className="h-full bg-purple-500" style={{ width: `${lang.value}%` }}></div>
                                        </div>
                                        <span className="text-[9px] font-black text-white">{lang.value}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6">Perfil Edad</h3>
                        <div className="space-y-4">
                            {stats.demographics.map((demo: any, i: number) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{demo.name}</span>
                                    <div className="flex items-center gap-3 flex-1 mx-4">
                                        <div className="h-1.5 bg-white/5 rounded-full flex-1 overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${demo.value}%` }}></div>
                                        </div>
                                        <span className="text-[9px] font-black text-white">{demo.value}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <footer className="mt-auto py-8 border-t border-white/5 text-center">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">bdai proprietary analytics engine v1.0</p>
            </footer>
        </div>
    );
};
