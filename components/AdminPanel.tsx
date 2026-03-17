import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, Tour } from '../types';
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

interface AnalyticsData {
    totalUsers: number;
    newUsersToday: number;
    newUsersWeek: number;
    activeUsersWeek: number;
    totalMiles: number;
    totalTours: number;
    totalCities: number;
    topCities: { city: string; count: number }[];
    topCountries: { country: string; count: number }[];
    topLanguages: { language: string; count: number }[];
    rankDistribution: { rank: string; count: number }[];
    recentUsers: { username: string; email: string; miles: number; rank: string; city: string; country: string; join_date: string; updated_at: string }[];
    dailySignups: { date: string; count: number }[];
}

type AdminTab = 'analytics' | 'cache' | 'users';

export const AdminPanel: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

    // Cache tab state
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0, pendingTasks: 0 });
    const [cityList, setCityList] = useState<CityProgress[]>([]);
    const [isWorking, setIsWorking] = useState(false);
    const [apiStatus, setApiStatus] = useState<{ ok: boolean, message: string } | null>(null);
    const [isCheckingApi, setIsCheckingApi] = useState(false);
    const [log, setLog] = useState<string[]>(['Sistemas listos.']);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const stopRef = useRef(false);

    const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 30));

    useEffect(() => {
        loadAnalytics();
        fetchSummary();
        handleCheckApi();
        return () => { stopRef.current = true; };
    }, []);

    const loadAnalytics = async () => {
        setIsLoadingAnalytics(true);
        try {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('username, email, miles, rank, city, country, language, join_date, updated_at, visited_cities, completed_tours, stats, badges');

            if (!profiles) return;

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

            const newToday = profiles.filter((p: any) => p.join_date?.startsWith(todayStr)).length;
            const newWeek = profiles.filter((p: any) => p.join_date && p.join_date > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()).length;
            const activeWeek = profiles.filter((p: any) => p.updated_at && p.updated_at > weekAgo).length;
            const totalMiles = profiles.reduce((acc: number, p: any) => acc + (p.miles || 0), 0);
            const totalTours = profiles.reduce((acc: number, p: any) => acc + (p.completed_tours?.length || 0), 0);

            // Cities visited
            const cityCount: Record<string, number> = {};
            profiles.forEach((p: any) => {
                (p.visited_cities || []).forEach((c: string) => {
                    const name = c.split('_')[0];
                    cityCount[name] = (cityCount[name] || 0) + 1;
                });
            });
            const topCities = Object.entries(cityCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([city, count]) => ({ city, count }));

            // Countries
            const countryCount: Record<string, number> = {};
            profiles.forEach((p: any) => { if (p.country) countryCount[p.country] = (countryCount[p.country] || 0) + 1; });
            const topCountries = Object.entries(countryCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([country, count]) => ({ country, count }));

            // Languages
            const langCount: Record<string, number> = {};
            profiles.forEach((p: any) => { if (p.language) langCount[p.language] = (langCount[p.language] || 0) + 1; });
            const topLanguages = Object.entries(langCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([language, count]) => ({ language, count }));

            // Rank distribution
            const rankCount: Record<string, number> = { ZERO: 0, SCOUT: 0, ROVER: 0, TITAN: 0, ZENITH: 0 };
            profiles.forEach((p: any) => { if (p.rank && rankCount[p.rank] !== undefined) rankCount[p.rank]++; });
            const rankDistribution = Object.entries(rankCount).map(([rank, count]) => ({ rank, count }));

            // Daily signups last 14 days
            const dailyMap: Record<string, number> = {};
            for (let i = 13; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                dailyMap[d.toISOString().split('T')[0]] = 0;
            }
            profiles.forEach((p: any) => {
                if (p.join_date) {
                    const d = p.join_date.split('T')[0];
                    if (dailyMap[d] !== undefined) dailyMap[d]++;
                }
            });
            const dailySignups = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

            // Recent users
            const recentUsers = [...profiles]
                .sort((a: any, b: any) => new Date(b.join_date || 0).getTime() - new Date(a.join_date || 0).getTime())
                .slice(0, 20);

            // Total unique cities in cache
            const { count: cacheCities } = await supabase.from('tours_cache').select('city', { count: 'exact', head: true });

            setAnalytics({
                totalUsers: profiles.length,
                newUsersToday: newToday,
                newUsersWeek: newWeek,
                activeUsersWeek: activeWeek,
                totalMiles,
                totalTours,
                totalCities: cacheCities || 0,
                topCities,
                topCountries,
                topLanguages,
                rankDistribution,
                recentUsers,
                dailySignups,
            });
        } catch (e) {
            console.error('Analytics error:', e);
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    const fetchSummary = async () => {
        const { data: allRecords } = await supabase.from('tours_cache').select('city, language');
        if (!allRecords) return;
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
            return { name: baseName, key: base.city, count, isComplete: count >= LANGUAGES.length, isShortKey: !base.city.includes('_') };
        });

        progressData.sort((a, b) => (a.isComplete === b.isComplete) ? 0 : a.isComplete ? 1 : -1);
        setCityList(progressData);
        setStats({ totalCities: progressData.length, totalEntries: allRecords.length, pendingTasks: pendingCount });
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
                await saveToursToCache(matchingLongKey.city, "", record.language, record.data);
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
                if (taskQueue.length < limitTasks) taskQueue.push({ cityKey: base.city, langCode: lang.code, cityName: baseName, baseTours: base.data as Tour[] });
            });
            if (taskQueue.length >= limitTasks) break;
        }
        if (taskQueue.length === 0) { addLog("✨ Todo al día."); setIsWorking(false); return; }
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
            } catch (e) { addLog(`   ✗ Falló.`); }
            setProgress(p => ({ ...p, current: i + 1 }));
        }
        setIsWorking(false);
        addLog("🏁 Proceso finalizado.");
        fetchSummary();
    };

    const RANK_COLORS: Record<string, string> = {
        ZERO: '#64748b', SCOUT: '#34d399', ROVER: '#60a5fa', TITAN: '#c084fc', ZENITH: '#fbbf24'
    };

    const maxDaily = analytics ? Math.max(...analytics.dailySignups.map(d => d.count), 1) : 1;

    return (
        <div className="fixed inset-0 z-[200] bg-[#080c14] flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-white/5 shrink-0">
                <div>
                    <h1 className="text-xl font-black text-white uppercase tracking-tighter">bdai control</h1>
                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.3em]">Mission Control</p>
                </div>
                <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90">
                    <i className="fas fa-times text-xs"></i>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 py-3 border-b border-white/5 shrink-0">
                {([
                    { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
                    { id: 'users', icon: 'fa-users', label: 'Usuarios' },
                    { id: 'cache', icon: 'fa-database', label: 'Caché' },
                ] as { id: AdminTab, icon: string, label: string }[]).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                        <i className={`fas ${tab.icon} text-[10px]`}></i>{tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">

                {/* ── ANALYTICS TAB ── */}
                {activeTab === 'analytics' && (
                    <div className="p-5 space-y-4">
                        {isLoadingAnalytics ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : analytics ? (
                            <>
                                {/* KPIs principales */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Usuarios</p>
                                        <p className="text-2xl font-black text-white">{analytics.totalUsers}</p>
                                        <p className="text-[8px] text-green-400 font-bold mt-1">+{analytics.newUsersToday} hoy · +{analytics.newUsersWeek} semana</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Activos 7d</p>
                                        <p className="text-2xl font-black text-purple-400">{analytics.activeUsersWeek}</p>
                                        <p className="text-[8px] text-slate-500 font-bold mt-1">{analytics.totalUsers > 0 ? Math.round(analytics.activeUsersWeek / analytics.totalUsers * 100) : 0}% retención</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Millas Totales</p>
                                        <p className="text-2xl font-black text-yellow-400">{analytics.totalMiles.toLocaleString()}</p>
                                        <p className="text-[8px] text-slate-500 font-bold mt-1">~{analytics.totalUsers > 0 ? Math.round(analytics.totalMiles / analytics.totalUsers) : 0} / usuario</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Tours Completados</p>
                                        <p className="text-2xl font-black text-cyan-400">{analytics.totalTours}</p>
                                        <p className="text-[8px] text-slate-500 font-bold mt-1">{analytics.totalCities} ciudades en caché</p>
                                    </div>
                                </div>

                                {/* Signups últimos 14 días */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">Registros Últimos 14 Días</p>
                                    <div className="flex items-end gap-1 h-16">
                                        {analytics.dailySignups.map((d, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <div className="w-full bg-purple-600 rounded-sm transition-all"
                                                    style={{ height: `${Math.max(2, (d.count / maxDaily) * 56)}px`, opacity: d.count > 0 ? 1 : 0.2 }}
                                                    title={`${d.date}: ${d.count}`}
                                                />
                                                {i % 7 === 0 && <span className="text-[5px] text-slate-600">{d.date.slice(5)}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Distribución de rangos */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">Distribución de Rangos</p>
                                    <div className="space-y-2">
                                        {analytics.rankDistribution.map(({ rank, count }) => (
                                            <div key={rank} className="flex items-center gap-3">
                                                <span className="text-[8px] font-black w-12 uppercase" style={{ color: RANK_COLORS[rank] }}>{rank}</span>
                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all" style={{
                                                        width: `${analytics.totalUsers > 0 ? (count / analytics.totalUsers) * 100 : 0}%`,
                                                        backgroundColor: RANK_COLORS[rank]
                                                    }} />
                                                </div>
                                                <span className="text-[8px] font-black text-slate-400 w-6 text-right">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Top ciudades + países */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-3">Top Ciudades</p>
                                        <div className="space-y-2">
                                            {analytics.topCities.slice(0, 6).map(({ city, count }, i) => (
                                                <div key={city} className="flex items-center justify-between">
                                                    <span className="text-[8px] font-bold text-slate-300 uppercase truncate flex-1">{city}</span>
                                                    <span className="text-[8px] font-black text-purple-400 ml-2">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-3">Top Países</p>
                                        <div className="space-y-2">
                                            {analytics.topCountries.slice(0, 6).map(({ country, count }) => (
                                                <div key={country} className="flex items-center justify-between">
                                                    <span className="text-[8px] font-bold text-slate-300 uppercase truncate flex-1">{country || '—'}</span>
                                                    <span className="text-[8px] font-black text-cyan-400 ml-2">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Top idiomas */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Idiomas de la App</p>
                                    <div className="flex flex-wrap gap-2">
                                        {analytics.topLanguages.map(({ language, count }) => (
                                            <div key={language} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                                                <span className="text-[9px] font-black text-white uppercase">{language}</span>
                                                <span className="text-[8px] font-black text-purple-400">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={loadAnalytics} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest active:scale-95 transition-all">
                                    <i className="fas fa-sync-alt mr-2"></i>Actualizar datos
                                </button>
                            </>
                        ) : (
                            <p className="text-slate-500 text-center py-10 text-xs">Error cargando analytics</p>
                        )}
                    </div>
                )}

                {/* ── USERS TAB ── */}
                {activeTab === 'users' && (
                    <div className="p-5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">Últimos Usuarios Registrados</p>
                        {analytics?.recentUsers.length ? (
                            <div className="space-y-2">
                                {analytics.recentUsers.map((u, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black"
                                            style={{ background: `${RANK_COLORS[u.rank]}20`, color: RANK_COLORS[u.rank] }}>
                                            {u.rank?.slice(0,1)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-white uppercase truncate">@{u.username || 'traveler'}</span>
                                                <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full" style={{ background: `${RANK_COLORS[u.rank]}20`, color: RANK_COLORS[u.rank] }}>{u.rank}</span>
                                            </div>
                                            <p className="text-[7px] text-slate-500 truncate">{u.email}</p>
                                            <p className="text-[7px] text-slate-600">{u.city || '—'} · {u.country || '—'}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-black text-yellow-400">{(u.miles || 0).toLocaleString()}</p>
                                            <p className="text-[6px] text-slate-600">millas</p>
                                            <p className="text-[6px] text-slate-600 mt-1">{u.join_date ? new Date(u.join_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-10 text-xs">Cargando usuarios...</p>
                        )}
                    </div>
                )}

                {/* ── CACHE TAB ── */}
                {activeTab === 'cache' && (
                    <div className="p-5 space-y-4">
                        {/* Stats caché */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudades</p>
                                <span className="text-xl font-black text-white">{stats.totalCities}</span>
                            </div>
                            <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-4 text-center">
                                <p className="text-[6px] font-black text-purple-500 uppercase tracking-widest mb-1">Pendientes</p>
                                <span className="text-xl font-black text-purple-400">{stats.pendingTasks}</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Entradas</p>
                                <span className="text-xl font-black text-slate-400">{stats.totalEntries}</span>
                            </div>
                        </div>

                        {/* API Status */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${apiStatus?.ok ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                                <div>
                                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Gemini API</p>
                                    <p className={`text-[9px] font-black uppercase ${apiStatus?.ok ? 'text-green-400' : 'text-red-400'}`}>{apiStatus?.message || 'Checking...'}</p>
                                </div>
                            </div>
                            <button onClick={handleCheckApi} disabled={isCheckingApi} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90">
                                <i className={`fas fa-sync-alt text-xs ${isCheckingApi ? 'fa-spin' : ''}`}></i>
                            </button>
                        </div>

                        {/* City progress list */}
                        <div className="overflow-x-auto no-scrollbar">
                            <div className="flex gap-2 pb-2">
                                {cityList.map(c => (
                                    <div key={c.key} className={`px-3 py-2.5 rounded-xl border flex flex-col min-w-[120px] ${c.isComplete ? 'bg-green-600/15 border-green-500/50' : 'bg-white/5 border-white/10'}`}>
                                        <span className="text-[8px] font-black text-white uppercase truncate mb-0.5">{c.name}</span>
                                        <span className="text-[6px] font-bold text-slate-600 uppercase mb-1.5 truncate">{c.key}</span>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[9px] font-black ${c.isComplete ? 'text-green-400' : 'text-slate-400'}`}>{c.isComplete ? '✓' : `${c.count}/20`}</span>
                                            {c.isShortKey && !c.isComplete && <i className="fas fa-exclamation-triangle text-amber-500 text-[9px]"></i>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button disabled={isWorking} onClick={() => runBatchTranslation(10)}
                                className="py-5 rounded-2xl bg-white text-slate-950 font-black uppercase text-[9px] tracking-widest active:scale-95 disabled:opacity-50">
                                Lote 10
                            </button>
                            <button disabled={isWorking} onClick={() => runBatchTranslation(30)}
                                className="py-5 rounded-2xl bg-purple-600 text-white font-black uppercase text-[9px] tracking-widest active:scale-95 disabled:opacity-50">
                                Lote 30
                            </button>
                        </div>

                        <button disabled={isWorking} onClick={repairKeys}
                            className="w-full py-3.5 border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-xl font-black uppercase text-[8px] tracking-widest active:scale-95">
                            <i className="fas fa-magic mr-2"></i>Reparar Llaves Huérfanas
                        </button>

                        {isWorking && (
                            <>
                                <div>
                                    <div className="flex justify-between text-[7px] font-black uppercase text-slate-500 mb-1.5">
                                        <span>Progreso</span>
                                        <span>{progress.current} / {progress.total}</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                                    </div>
                                </div>
                                <button onClick={() => { stopRef.current = true; setIsWorking(false); }}
                                    className="w-full py-2 text-red-500 font-black uppercase text-[8px] tracking-widest">
                                    Detener Proceso
                                </button>
                            </>
                        )}

                        {/* Log */}
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 h-40 overflow-y-auto no-scrollbar font-mono text-[8px] lowercase text-slate-500">
                            {log.map((m, i) => (
                                <p key={i} className={`mb-0.5 ${m.includes('✅') || m.includes('✓') ? 'text-green-400' : m.includes('🚀') ? 'text-blue-400' : ''}`}>&gt; {m}</p>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

