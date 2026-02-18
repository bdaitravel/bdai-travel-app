
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, Tour } from '../types';
import { supabase, saveToursToCache, testSupabaseConnection } from '../services/supabaseClient';
import { translateToursBatch } from '../services/geminiService';

interface CityProgress {
    name: string;
    key: string;
    count: number;
    isComplete: boolean;
    isShortKey: boolean;
}

interface TranslationTask {
    cityKey: string;
    langCode: string;
    cityName: string;
    baseTours: Tour[];
}

export const AdminPanel: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0, pendingTasks: 0 });
    const [cityList, setCityList] = useState<CityProgress[]>([]);
    const [isWorking, setIsWorking] = useState(false);
    const [log, setLog] = useState<string[]>(['Sistemas listos.']);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const stopRef = useRef(false);

    const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 30));

    useEffect(() => {
        fetchSummary();
        return () => { stopRef.current = true; };
    }, []);

    const fetchSummary = async () => {
        const { data: allRecords } = await supabase.from('tours_cache').select('city, language');
        if (!allRecords) return;

        const { data: baseRecords } = await supabase.from('tours_cache').select('city').eq('language', 'es');
        if (!baseRecords) return;

        const globalCityMap: Record<string, Set<string>> = {};
        allRecords.forEach(r => {
            if (r.city) {
                const baseName = r.city.split('_')[0].toLowerCase();
                if (!globalCityMap[baseName]) globalCityMap[baseName] = new Set();
                globalCityMap[baseName].add(r.language);
            }
        });

        let pendingCount = 0;
        const progressData: CityProgress[] = baseRecords.map(base => {
            const baseName = base.city.split('_')[0].toLowerCase();
            const translatedLangs = Array.from(globalCityMap[baseName] || []);
            const count = translatedLangs.length;
            const missing = Math.max(0, LANGUAGES.length - count);
            pendingCount += missing;
            
            return {
                name: baseName,
                key: base.city,
                count: count,
                isComplete: count >= LANGUAGES.length,
                isShortKey: !base.city.includes('_')
            };
        });

        progressData.sort((a, b) => (a.isComplete === b.isComplete) ? 0 : a.isComplete ? 1 : -1);

        setCityList(progressData);
        setStats({ 
            totalCities: progressData.length, 
            totalEntries: allRecords.length,
            pendingTasks: pendingCount
        });
    };

    const repairKeys = async () => {
        setIsWorking(true);
        addLog("🛠️ Iniciando reparación de llaves...");
        
        // 1. Buscamos todas las llaves cortas que tienen traducciones
        const { data: allRecords } = await supabase.from('tours_cache').select('*');
        if (!allRecords) { setIsWorking(false); return; }

        const shortKeys = allRecords.filter(r => !r.city.includes('_'));
        const longKeysMap = allRecords.filter(r => r.city.includes('_') && r.language === 'es');

        let repairedCount = 0;
        for (const record of shortKeys) {
            const baseName = record.city.toLowerCase();
            const matchingLongKey = longKeysMap.find(l => l.city.startsWith(baseName));

            if (matchingLongKey) {
                addLog(`🔧 Migrando: ${record.city} (${record.language}) -> ${matchingLongKey.city}`);
                // Guardamos con la nueva llave
                await saveToursToCache(matchingLongKey.city, "", record.language, record.data);
                // Borramos la vieja (opcional, pero recomendado para limpiar)
                await supabase.from('tours_cache').delete().eq('city', record.city).eq('language', record.language);
                repairedCount++;
            }
        }

        addLog(`✅ Reparación finalizada. ${repairedCount} registros migrados.`);
        setIsWorking(false);
        fetchSummary();
    };

    const runBatchTranslation = async (limitTasks: number = 20) => {
        setIsWorking(true);
        stopRef.current = false;
        
        const { data: baseRecords } = await supabase.from('tours_cache').select('*').eq('language', 'es');
        if (!baseRecords) { setIsWorking(false); return; }

        const { data: allRecords } = await supabase.from('tours_cache').select('city, language');
        const globalCityMap: Record<string, Set<string>> = {};
        allRecords?.forEach(r => {
            if (r.city) {
                const baseName = r.city.split('_')[0].toLowerCase();
                if (!globalCityMap[baseName]) globalCityMap[baseName] = new Set();
                globalCityMap[baseName].add(r.language);
            }
        });

        const taskQueue: TranslationTask[] = [];
        for (const base of baseRecords) {
            const baseName = base.city.split('_')[0].toLowerCase();
            const existingLangs = globalCityMap[baseName] || new Set();
            const missingLangs = LANGUAGES.filter(l => !existingLangs.has(l.code));
            
            if (missingLangs.length === 0) continue;

            missingLangs.forEach(lang => {
                if (taskQueue.length < limitTasks) {
                    taskQueue.push({
                        cityKey: base.city,
                        langCode: lang.code,
                        cityName: baseName,
                        baseTours: base.data as Tour[]
                    });
                }
            });
            if (taskQueue.length >= limitTasks) break;
        }

        if (taskQueue.length === 0) {
            addLog("✨ Todo al día.");
            setIsWorking(false);
            return;
        }

        setProgress({ current: 0, total: taskQueue.length });
        addLog(`🚀 Procesando ${taskQueue.length} tareas...`);

        for (let i = 0; i < taskQueue.length; i++) {
            if (stopRef.current) break;
            const task = taskQueue[i];
            
            try {
                addLog(`[${i+1}/${taskQueue.length}] ${task.cityName.toUpperCase()} -> ${task.langCode}`);
                const translated = await translateToursBatch(task.baseTours, task.langCode);
                await saveToursToCache(task.cityKey, "", task.langCode, translated);
                addLog(`   ✓ Guardado.`);
            } catch (e) {
                addLog(`   ✗ Falló.`);
            }
            setProgress(p => ({ ...p, current: i + 1 }));
        }

        setIsWorking(false);
        addLog("🏁 Proceso finalizado.");
        fetchSummary();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 overflow-hidden font-sans">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Admin Panel</h2>
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-2">Gestor de Datos</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
            </header>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudades</p>
                    <span className="text-xl font-black text-white">{stats.totalCities}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center border-purple-500/20">
                    <p className="text-[6px] font-black text-purple-500 uppercase tracking-widest mb-1">Pendientes</p>
                    <span className="text-xl font-black text-purple-400">{stats.pendingTasks}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Entradas</p>
                    <span className="text-xl font-black text-slate-400">{stats.totalEntries}</span>
                </div>
            </div>

            <div className="mb-8 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 pb-2">
                    {cityList.map(c => (
                        <div key={c.key} className={`px-4 py-3 rounded-2xl border flex flex-col min-w-[140px] transition-all ${c.isComplete ? 'bg-green-600/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-white/5 border-white/10'}`}>
                            <span className="text-[9px] font-black text-white uppercase truncate mb-0.5">{c.name}</span>
                            <span className="text-[6px] font-bold text-slate-600 uppercase mb-2 truncate">ID: {c.key}</span>
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black ${c.isComplete ? 'text-green-400' : 'text-slate-400'}`}>
                                    {c.isComplete ? 'HECHO' : `${c.count}/20`}
                                </span>
                                {c.isComplete ? <i className="fas fa-check-circle text-green-500 text-[10px]"></i> : (c.isShortKey && <i className="fas fa-exclamation-triangle text-amber-500 text-[10px]"></i>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        disabled={isWorking}
                        onClick={() => runBatchTranslation(10)}
                        className="py-6 rounded-[2rem] bg-white text-slate-950 font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all disabled:opacity-50"
                    >
                        Lote 10
                    </button>
                    <button 
                        disabled={isWorking}
                        onClick={() => runBatchTranslation(30)}
                        className="py-6 rounded-[2rem] bg-purple-600 text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all disabled:opacity-50"
                    >
                        Lote 30
                    </button>
                </div>
                
                <button 
                    disabled={isWorking}
                    onClick={repairKeys}
                    className="w-full py-4 border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-2xl font-black uppercase text-[8px] tracking-[0.2em] active:scale-95 transition-all"
                >
                    <i className="fas fa-magic mr-2"></i> Reparar Llaves Huérfanas
                </button>

                {isWorking && (
                    <button 
                        onClick={() => { stopRef.current = true; setIsWorking(false); }}
                        className="w-full py-2 text-red-500 font-black uppercase text-[8px] tracking-[0.3em]"
                    >
                        Detener Proceso
                    </button>
                )}
            </div>

            {isWorking && (
                <div className="mb-6">
                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-500 mb-2">
                        <span>Progreso...</span>
                        <span>{progress.current} / {progress.total}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                    </div>
                </div>
            )}

            <div className="flex-1 bg-black/50 border border-white/5 rounded-[2rem] p-6 overflow-y-auto no-scrollbar font-mono shadow-inner text-[9px] lowercase text-slate-500">
                {log.map((m, i) => <p key={i} className={`mb-1 ${m.includes('✅') || m.includes('✓') ? 'text-green-400' : m.includes('🚀') ? 'text-blue-400' : ''}`}>&gt; {m}</p>)}
            </div>
        </div>
    );
};
