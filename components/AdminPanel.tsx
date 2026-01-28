
import React, { useState, useEffect } from 'react';
import { UserProfile, LANGUAGES, Tour } from '../types';
import { supabase } from '../services/supabaseClient';
import { translateTours } from '../services/geminiService';

export const AdminPanel: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, log: '' });
    const [missingTranslations, setMissingTranslations] = useState<any[]>([]);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        const { data, error } = await supabase.from('tours_cache').select('city, language');
        if (data) {
            const uniqueCities = Array.from(new Set(data.map(d => d.city)));
            setStats({ totalCities: uniqueCities.length, totalEntries: data.length });

            // Encontrar qué ciudades tienen "es" pero les faltan otros idiomas
            const gaps = [];
            for (const city of uniqueCities) {
                const cityLangs = data.filter(d => d.city === city).map(d => d.language);
                if (cityLangs.includes('es')) {
                    const missing = LANGUAGES.map(l => l.code).filter(code => !cityLangs.includes(code));
                    if (missing.length > 0) gaps.push({ city, missing });
                }
            }
            setMissingTranslations(gaps);
        }
    };

    const startMassiveTranslation = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setProgress({ current: 0, total: missingTranslations.length, log: 'Iniciando proceso...' });

        for (let i = 0; i < missingTranslations.length; i++) {
            const item = missingTranslations[i];
            setProgress(prev => ({ ...prev, current: i + 1, log: `Traduciendo ${item.city}...` }));

            // 1. Obtener el original en español
            const { data: esData } = await supabase.from('tours_cache')
                .select('data')
                .eq('city', item.city)
                .eq('language', 'es')
                .single();

            if (esData && esData.data) {
                // 2. Para cada idioma que falta, traducir y guardar
                for (const langCode of item.missing) {
                    try {
                        setProgress(prev => ({ ...prev, log: `Traduciendo ${item.city} a ${langCode}...` }));
                        const translated = await translateTours(esData.data as Tour[], langCode);
                        
                        await supabase.from('tours_cache').upsert({
                            city: item.city,
                            language: langCode,
                            data: translated
                        });
                    } catch (e) {
                        console.error(`Error en ${item.city} (${langCode}):`, e);
                    }
                }
            }
        }

        setIsProcessing(false);
        setProgress(prev => ({ ...prev, log: '¡Traducción masiva completada!' }));
        fetchSummary();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 animate-fade-in">
            <header className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">SALA DE MÁQUINAS</h2>
                    <p className="text-purple-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Traducción Masiva de Inteligencia</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white"><i className="fas fa-arrow-left"></i></button>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-12">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudades Únicas</p>
                    <span className="text-3xl font-black text-white">{stats.totalCities}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Entradas Cache</p>
                    <span className="text-3xl font-black text-purple-500">{stats.totalEntries}</span>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex-1 flex flex-col overflow-hidden mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-black text-lg uppercase tracking-tight">Estado de la Base de Datos</h3>
                    <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-[8px] font-black uppercase">{missingTranslations.length} Gaps Detectados</span>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 mb-6">
                    {missingTranslations.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-xs font-bold text-white uppercase">{m.city}</span>
                            <div className="flex gap-1">
                                {m.missing.map((code: string) => (
                                    <span key={code} className="text-[8px] font-black text-slate-500 uppercase bg-slate-800 px-2 py-0.5 rounded">{code}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {isProcessing && (
                    <div className="space-y-4 mb-6">
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-purple-500 transition-all duration-500" 
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest text-center animate-pulse">{progress.log}</p>
                    </div>
                )}

                <button 
                    disabled={isProcessing || missingTranslations.length === 0}
                    onClick={startMassiveTranslation}
                    className="w-full py-6 bg-white text-slate-950 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all disabled:opacity-30"
                >
                    {isProcessing ? 'PROCESANDO...' : 'REPARAR TODOS LOS GAPS'}
                </button>
            </div>
            
            <p className="text-[8px] text-slate-600 text-center uppercase tracking-widest">Este proceso consume tokens de la API. Úsalo con responsabilidad.</p>
        </div>
    );
};
