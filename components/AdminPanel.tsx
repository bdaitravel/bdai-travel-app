
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, Tour } from '../types';
import { supabase, saveToursToCache } from '../services/supabaseClient';
import { translateToursBatch } from '../services/geminiService';

export const AdminPanel: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0 });
    const [isWorking, setIsWorking] = useState(false);
    const [log, setLog] = useState<string[]>(['Sistemas listos.']);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const stopRef = useRef(false);
    
    // @ts-ignore
    const currentEnv = process.env.APP_ENV || 'PROD';

    const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 30));

    useEffect(() => {
        fetchSummary();
        return () => { stopRef.current = true; };
    }, []);

    const fetchSummary = async () => {
        try {
            const { data } = await supabase.from('tours_cache').select('city, language');
            if (data) {
                const citySet = new Set(data.map(d => (d.city || "").split('_')[0]));
                setStats({ totalCities: citySet.size, totalEntries: data.length });
            }
        } catch (e) {
            addLog("⚠️ Error conectando con la base de datos del entorno.");
        }
    };

    const runBatchTranslation = async (batchSize: number = 10) => {
        setIsWorking(true);
        stopRef.current = false;
        addLog(`🚀 INICIANDO TRADUCCIÓN EN ENTORNO: ${currentEnv}`);

        const { data: baseRecords } = await supabase.from('tours_cache').select('*').eq('language', 'es');
        if (!baseRecords) { setIsWorking(false); return; }

        const { data: allRecords } = await supabase.from('tours_cache').select('city, language');
        const cityMap: Record<string, string[]> = {};
        allRecords?.forEach(r => {
            if (r.city) {
                if (!cityMap[r.city]) cityMap[r.city] = [];
                cityMap[r.city].push(r.language);
            }
        });

        const pendingCities = baseRecords.filter(r => cityMap[r.city]?.length < LANGUAGES.length).slice(0, batchSize);
        setProgress({ current: 0, total: pendingCities.length });

        for (let i = 0; i < pendingCities.length; i++) {
            if (stopRef.current) break;
            const baseRecord = pendingCities[i];
            const existingLangs = cityMap[baseRecord.city] || [];
            const missingLangs = LANGUAGES.filter(l => !existingLangs.includes(l.code));

            addLog(`📍 Ciudad: ${baseRecord.city.toUpperCase()}`);
            
            for (const lang of missingLangs) {
                if (stopRef.current) break;
                try {
                    const translated = await translateToursBatch(baseRecord.data as Tour[], lang.code);
                    await saveToursToCache(baseRecord.city, "", lang.code, translated);
                    addLog(`   ✓ ${lang.code} OK`);
                } catch (e) {
                    addLog(`   ✗ Error en ${lang.code}`);
                }
            }
            setProgress(p => ({ ...p, current: i + 1 }));
        }

        setIsWorking(false);
        addLog(`🏁 FIN DEL LOTE EN ${currentEnv}`);
        fetchSummary();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 overflow-hidden font-sans">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Control Panel</h2>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${currentEnv === 'SIT' ? 'bg-amber-500 text-amber-950' : 'bg-green-500 text-green-950'}`}>
                            {currentEnv}
                        </span>
                    </div>
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Sincronizado con Google Cloud Gemini API</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudades {currentEnv}</p>
                    <span className="text-2xl font-black text-white">{stats.totalCities}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Registros Caché</p>
                    <span className="text-2xl font-black text-purple-500">{stats.totalEntries}</span>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <button 
                    disabled={isWorking}
                    onClick={() => runBatchTranslation(10)}
                    className="w-full py-6 rounded-[2rem] bg-white text-slate-950 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50 shadow-xl"
                >
                    <i className="fas fa-sync text-lg"></i> Traducir Lote en {currentEnv}
                </button>
            </div>

            {isWorking && (
                <div className="mb-6 animate-fade-in">
                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 mb-2">
                        <span>Progreso del lote...</span>
                        <span>{progress.current} / {progress.total}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <div className="flex-1 bg-black/50 border border-white/5 rounded-[2rem] p-6 overflow-y-auto no-scrollbar font-mono shadow-inner">
                {log.map((m, i) => (
                    <p key={i} className={`text-[9px] lowercase mb-1 ${m.includes('✓') ? 'text-green-400' : m.includes('✗') ? 'text-red-400' : 'text-slate-500'}`}>
                        &gt; {m}
                    </p>
                ))}
            </div>
        </div>
    );
};
