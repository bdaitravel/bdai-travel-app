
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, Tour } from '../types';
// Fixed: Removed testSupabaseConnection as it is not exported from supabaseClient.ts and not used in this component.
import { supabase, saveToursToCache } from '../services/supabaseClient';
import { translateToursBatch, checkApiStatus } from '../services/geminiService';

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
    const [activeTab, setActiveTab] = useState<'DATA' | 'USERS'>('DATA');
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0, pendingTasks: 0 });
    const [cityList, setCityList] = useState<CityProgress[]>([]);
    const [isWorking, setIsWorking] = useState(false);
    const [apiStatus, setApiStatus] = useState<{ ok: boolean, message: string } | null>(null);
    const [isCheckingApi, setIsCheckingApi] = useState(false);
    const [log, setLog] = useState<string[]>(['Sistemas listos.']);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const stopRef = useRef(false);

    // User Dashboard State
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [userStats, setUserStats] = useState({ total: 0, activeToday: 0, byLanguage: {} as Record<string, number>, byCountry: {} as Record<string, number> });
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 30));

    useEffect(() => {
        if (activeTab === 'DATA') {
            fetchSummary();
        } else if (activeTab === 'USERS') {
            fetchUsers();
        }
        return () => { stopRef.current = true; };
    }, [activeTab]);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) throw error;
            if (data) {
                setUsers(data);
                
                const today = new Date().toISOString().split('T')[0];
                let activeToday = 0;
                const byLanguage: Record<string, number> = {};
                const byCountry: Record<string, number> = {};

                data.forEach((u: any) => {
                    // Active today?
                    if (u.stats?.lastActive?.startsWith(today)) activeToday++;
                    
                    // Language
                    const lang = u.language || 'es';
                    byLanguage[lang] = (byLanguage[lang] || 0) + 1;

                    // Country
                    const country = u.country || 'Unknown';
                    byCountry[country] = (byCountry[country] || 0) + 1;
                });

                setUserStats({
                    total: data.length,
                    activeToday,
                    byLanguage,
                    byCountry
                });
            }
        } catch (e) {
            console.error("Error fetching users", e);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const fetchSummary = async () => {
        const { data: allRecords } = await supabase.from('tours_cache').select('city, language');
        if (!allRecords) return;

        handleCheckApi(); // Check API status when opening admin
        const { data: baseRecords } = await supabase.from('tours_cache').select('city').eq('language', 'es');
        if (!baseRecords) return;

        const globalCityMap: Record<string, Set<string>> = {};
        allRecords.forEach((r: any) => {
            if (r.city) {
                const baseName = r.city.split('_')[0].toLowerCase();
                if (!globalCityMap[baseName]) globalCityMap[baseName] = new Set();
                globalCityMap[baseName].add(r.language);
            }
        });

        let pendingCount = 0;
        const progressData: CityProgress[] = baseRecords.map((base: any) => {
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

    const handleCheckApi = async () => {
        setIsCheckingApi(true);
        try {
            const status = await checkApiStatus();
            setApiStatus(status);
            addLog(`📡 API Status: ${status.message}`);
        } catch (e) {
            setApiStatus({ ok: false, message: "Error" });
        } finally {
            setIsCheckingApi(false);
        }
    };

    const repairKeys = async () => {
        setIsWorking(true);
        addLog("🛠️ Iniciando reparación de llaves...");
        
        // 1. Buscamos todas las llaves cortas que tienen traducciones
        const { data: allRecords } = await supabase.from('tours_cache').select('*');
        if (!allRecords) { setIsWorking(false); return; }

        const shortKeys = allRecords.filter((r: any) => !r.city.includes('_'));
        const longKeysMap = allRecords.filter((r: any) => r.city.includes('_') && r.language === 'es');

        let repairedCount = 0;
        for (const record of shortKeys) {
            const baseName = record.city.toLowerCase();
            const matchingLongKey = longKeysMap.find((l: any) => l.city.startsWith(baseName));

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
        allRecords?.forEach((r: any) => {
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
            <header className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Admin Panel</h2>
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-2">Centro de Control</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
            </header>

            <div className="flex gap-2 mb-6">
                <button 
                    onClick={() => setActiveTab('DATA')}
                    className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'DATA' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                >
                    <i className="fas fa-database mr-2"></i> Datos
                </button>
                <button 
                    onClick={() => setActiveTab('USERS')}
                    className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'USERS' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                >
                    <i className="fas fa-users mr-2"></i> Usuarios
                </button>
            </div>

            {activeTab === 'DATA' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="grid grid-cols-3 gap-4 mb-6">
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

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${apiStatus?.ok ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                            <div>
                                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Gemini API Status</p>
                                <p className={`text-[10px] font-black uppercase ${apiStatus?.ok ? 'text-green-400' : 'text-red-400'}`}>{apiStatus?.message || 'Checking...'}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleCheckApi} 
                            disabled={isCheckingApi}
                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
                        >
                            <i className={`fas fa-sync-alt ${isCheckingApi ? 'fa-spin' : ''}`}></i>
                        </button>
                    </div>

                    <div className="mb-6 overflow-x-auto no-scrollbar">
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

                    <div className="space-y-4 mb-6">
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

                        <button 
                            disabled={isWorking}
                            onClick={async () => {
                                if (window.aistudio) {
                                    await window.aistudio.openSelectKey();
                                    addLog("🔑 API Key reset triggered.");
                                }
                            }}
                            className="w-full py-4 border border-purple-500/30 bg-purple-500/10 text-purple-400 rounded-2xl font-black uppercase text-[8px] tracking-[0.2em] active:scale-95 transition-all"
                        >
                            <i className="fas fa-key mr-2"></i> Reset API Key
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
            )}

            {activeTab === 'USERS' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    {isLoadingUsers ? (
                        <div className="flex-1 flex items-center justify-center">
                            <i className="fas fa-spinner fa-spin text-3xl text-purple-500"></i>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Usuarios</p>
                                    <span className="text-2xl font-black text-white">{userStats.total}</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center border-green-500/20">
                                    <p className="text-[6px] font-black text-green-500 uppercase tracking-widest mb-1">Activos Hoy</p>
                                    <span className="text-2xl font-black text-green-400">{userStats.activeToday}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Por Idioma</p>
                                    <div className="space-y-2">
                                        {Object.entries(userStats.byLanguage).sort((a,b) => b[1] - a[1]).map(([lang, count]) => (
                                            <div key={lang} className="flex justify-between items-center text-[10px]">
                                                <span className="text-white font-bold uppercase">{lang}</span>
                                                <span className="text-purple-400 font-black">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Por País</p>
                                    <div className="space-y-2">
                                        {Object.entries(userStats.byCountry).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([country, count]) => (
                                            <div key={country} className="flex justify-between items-center text-[10px]">
                                                <span className="text-white font-bold uppercase truncate max-w-[80px]">{country}</span>
                                                <span className="text-blue-400 font-black">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-4 overflow-hidden flex flex-col">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Últimos Usuarios</p>
                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                                    {users.slice().sort((a, b) => {
                                        const dateA = a.stats?.lastActive || '';
                                        const dateB = b.stats?.lastActive || '';
                                        return dateB.localeCompare(dateA);
                                    }).map(u => (
                                        <div key={u.id} className="bg-black/40 rounded-2xl p-3 flex items-center gap-3">
                                            <img src={u.avatar} className="w-8 h-8 rounded-full bg-slate-800" alt="" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-white truncate">{u.name || u.email}</p>
                                                <p className="text-[8px] text-slate-500 uppercase truncate">{u.city || 'Unknown'} • {u.language}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-purple-400">{u.miles} M</p>
                                                <p className="text-[7px] text-slate-500 uppercase">{u.rank}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
