
import React, { useState, useEffect } from 'react';
import { UserProfile, LANGUAGES, Tour } from '../types';
import { supabase, normalizeKey } from '../services/supabaseClient';
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
        // Obtenemos todos los tours cacheados para analizar la cobertura de idiomas
        const { data, error } = await supabase.from('tours_cache').select('city, language');
        if (data) {
            const allRows = data as any[];
            
            // Agrupamos por ciudad normalizada para ver qué idiomas faltan
            const bucketLangs: Record<string, Set<string>> = {};
            const bestKeyForBucket: Record<string, string> = {};

            allRows.forEach(row => {
                const rawName = row.city.split('_')[0];
                const baseNormalized = normalizeKey(rawName);
                const langCode = row.language.toLowerCase().trim();
                
                if (!bucketLangs[baseNormalized]) bucketLangs[baseNormalized] = new Set();
                bucketLangs[baseNormalized].add(langCode);

                if (!bestKeyForBucket[baseNormalized] || row.city.includes('_')) {
                    bestKeyForBucket[baseNormalized] = row.city;
                }
            });

            const gaps = [];
            for (const base in bucketLangs) {
                const langs = Array.from(bucketLangs[base]);
                // Si tenemos el original en español, podemos traducir al resto
                if (langs.includes('es')) {
                    const missing = LANGUAGES.map(l => l.code).filter(c => !langs.includes(c));
                    if (missing.length > 0) {
                        gaps.push({
                            city: bestKeyForBucket[base],
                            base: base,
                            missing
                        });
                    }
                }
            }

            setStats({ 
                totalCities: Object.keys(bucketLangs).length, 
                totalEntries: allRows.length 
            });
            setMissingTranslations(gaps);
        }
    };

    const startMassiveTranslation = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setProgress({ current: 0, total: missingTranslations.length, log: 'Escaneando inventario...' });

        for (let i = 0; i < missingTranslations.length; i++) {
            const item = missingTranslations[i];
            setProgress(prev => ({ ...prev, current: i + 1, log: `Analizando ${item.city}...` }));

            // Obtenemos el tour original en español (nuestra fuente de verdad)
            const { data: esData } = await supabase.from('tours_cache')
                .select('data')
                .eq('city', item.city)
                .eq('language', 'es')
                .maybeSingle();

            if (esData && esData.data) {
                for (const langCode of item.missing) {
                    try {
                        setProgress(prev => ({ ...prev, log: `[Dai] Traduciendo ${item.city} al ${langCode.toUpperCase()}...` }));
                        
                        // Usamos Gemini 3 Flash para la traducción masiva
                        const translated = await translateTours(esData.data as Tour[], langCode);
                        
                        // Guardado seguro (Upsert)
                        await supabase.from('tours_cache').upsert({
                            city: item.city,
                            language: langCode,
                            data: translated,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'city,language' });

                        console.log(`Sincronización completa: ${item.city} -> ${langCode}`);
                    } catch (e) {
                        console.error(`Fallo en traducción de ${item.city} a ${langCode}:`, e);
                    }
                }
            }
        }

        setIsProcessing(false);
        setProgress(prev => ({ ...prev, log: '¡Mundo 100% Sincronizado!' }));
        fetchSummary();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 animate-fade-in overflow-hidden">
            <header className="flex items-center justify-between mb-12 shrink-0">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Sala de Máquinas</h2>
                    <p className="text-purple-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Automatización Global TechTravel</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white"><i className="fas fa-arrow-left"></i></button>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-12 shrink-0">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudades en Base</p>
                    <span className="text-3xl font-black text-white">{stats.totalCities}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Registros Cache</p>
                    <span className="text-3xl font-black text-purple-500">{stats.totalEntries}</span>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex-1 flex flex-col overflow-hidden mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-black text-lg uppercase tracking-tight">Análisis de Cobertura</h3>
                    <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-[8px] font-black uppercase">{missingTranslations.length} Gaps Detectados</span>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 mb-6 font-mono">
                    {missingTranslations.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-bold text-slate-300 uppercase">{m.city}</span>
                            <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
                                {m.missing.map((code: string) => (
                                    <span key={code} className="text-[7px] font-black text-slate-600 uppercase bg-slate-800 px-2 py-0.5 rounded border border-white/5">{code}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {missingTranslations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                            <i className="fas fa-globe text-4xl mb-4 text-green-500"></i>
                            <p className="text-[10px] font-black uppercase tracking-widest">Estado: Óptimo.<br/>Todas las ciudades están traducidas.</p>
                        </div>
                    )}
                </div>

                {isProcessing && (
                    <div className="space-y-4 mb-6">
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-purple-500 transition-all duration-500" 
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            ></div>
                        </div>
                        <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                            <p className="text-[8px] font-mono text-green-500 uppercase tracking-widest animate-pulse">&gt; {progress.log}</p>
                        </div>
                    </div>
                )}

                <button 
                    disabled={isProcessing || missingTranslations.length === 0}
                    onClick={startMassiveTranslation}
                    className="w-full py-6 bg-white text-slate-950 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all disabled:opacity-30"
                >
                    {isProcessing ? 'PROCESANDO TOUR EN CASCADA...' : 'SINCRONIZAR TODO EL MUNDO'}
                </button>
            </div>
            
            <p className="text-[8px] text-slate-600 text-center uppercase tracking-widest">Dai utiliza Gemini 3 Flash para traducciones de alta velocidad.</p>
        </div>
    );
};
