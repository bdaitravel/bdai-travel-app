
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, Tour } from '../types';
// Fixed: Removed testSupabaseConnection as it is not exported from supabaseClient.ts and not used in this component.
import { supabase, saveToursToCache, getAdminStats } from '../services/supabaseClient';
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
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0, pendingTasks: 0, audios: 0, community: 0, users: 0 });
    const [cityList, setCityList] = useState<CityProgress[]>([]);
    const [isWorking, setIsWorking] = useState(false);
    const [log, setLog] = useState<string[]>(['Sistemas listos.']);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const stopRef = useRef(false);

    const [selectedCityKey, setSelectedCityKey] = useState<string | null>(null);
    const [cityTours, setCityTours] = useState<Tour[]>([]);
    const [selectedTourIndex, setSelectedTourIndex] = useState<number>(0);
    const [selectedStopIndex, setSelectedStopIndex] = useState<number>(0);
    const [showGpsFixer, setShowGpsFixer] = useState(false);
    const [tempCoords, setTempCoords] = useState<{lat: number, lng: number} | null>(null);

    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const L = (window as any).L;

    const fetchCityTours = async (key: string) => {
        setIsWorking(true);
        const { data } = await supabase.from('tours_cache').select('data').eq('city', key).eq('language', 'es').single();
        if (data) {
            setCityTours(data.data as Tour[]);
            setSelectedCityKey(key);
            setShowGpsFixer(true);
        }
        setIsWorking(false);
    };

    const saveNewCoords = async () => {
        if (!tempCoords || !selectedCityKey) return;
        setIsWorking(true);
        const tour = cityTours[selectedTourIndex];
        const stop = tour.stops[selectedStopIndex];
        
        // Update in all languages
        const { data: allLangs } = await supabase.from('tours_cache').select('language, data').eq('city', selectedCityKey);
        if (allLangs) {
            for (const record of allLangs) {
                const tours = record.data as Tour[];
                const targetTour = tours[selectedTourIndex];
                if (targetTour) {
                    const targetStop = targetTour.stops[selectedStopIndex];
                    if (targetStop) {
                        targetStop.latitude = tempCoords.lat;
                        targetStop.longitude = tempCoords.lng;
                        await supabase.from('tours_cache').update({ data: tours }).eq('city', selectedCityKey).eq('language', record.language);
                    }
                }
            }
            addLog(`✅ GPS Actualizado para ${stop.name} en todas las lenguas.`);
        }
        setIsWorking(false);
        setTempCoords(null);
    };

    useEffect(() => {
        if (showGpsFixer && mapContainerRef.current && L && !mapRef.current) {
            const map = L.map(mapContainerRef.current).setView([0, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            map.on('click', (e: any) => {
                setTempCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
            });
            
            mapRef.current = map;
        }
        
        if (showGpsFixer && mapRef.current && cityTours.length > 0) {
            const stop = cityTours[selectedTourIndex]?.stops[selectedStopIndex];
            if (stop) {
                mapRef.current.setView([stop.latitude, stop.longitude], 15);
                // Clear old markers
                mapRef.current.eachLayer((layer: any) => {
                    if (layer instanceof L.Marker) mapRef.current.removeLayer(layer);
                });
                L.marker([stop.latitude, stop.longitude]).addTo(mapRef.current).bindPopup('Ubicación Actual').openPopup();
                if (tempCoords) {
                    L.marker([tempCoords.lat, tempCoords.lng], { icon: L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }) }).addTo(mapRef.current).bindPopup('Nueva Ubicación').openPopup();
                }
            }
        }
    }, [showGpsFixer, selectedTourIndex, selectedStopIndex, tempCoords]);

    const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 30));

    useEffect(() => {
        fetchSummary();
        return () => { stopRef.current = true; };
    }, []);

    const fetchSummary = async () => {
        const adminStats = await getAdminStats();
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
            totalEntries: adminStats.tours,
            pendingTasks: pendingCount,
            audios: adminStats.audios,
            community: adminStats.community,
            users: adminStats.users
        });
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
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Admin Panel</h2>
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-2">Gestor de Datos</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
            </header>

            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudades</p>
                    <span className="text-lg font-black text-white">{stats.totalCities}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center border-purple-500/20">
                    <p className="text-[6px] font-black text-purple-500 uppercase tracking-widest mb-1">Pendientes</p>
                    <span className="text-lg font-black text-purple-400">{stats.pendingTasks}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Tours</p>
                    <span className="text-lg font-black text-slate-400">{stats.totalEntries}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Audios</p>
                    <span className="text-lg font-black text-blue-400">{stats.audios}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Posts</p>
                    <span className="text-lg font-black text-emerald-400">{stats.community}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Usuarios</p>
                    <span className="text-lg font-black text-yellow-500">{stats.users}</span>
                </div>
            </div>

            <div className="mb-8 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 pb-2">
                    {cityList.map(c => (
                        <div key={c.key} onClick={() => fetchCityTours(c.key)} className={`px-4 py-3 rounded-2xl border flex flex-col min-w-[140px] transition-all cursor-pointer hover:scale-105 active:scale-95 ${c.isComplete ? 'bg-green-600/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-white/5 border-white/10'}`}>
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

            {showGpsFixer && (
                <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col p-8 animate-fade-in">
                    <header className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">GPS Fixer: {selectedCityKey}</h3>
                        <button onClick={() => { setShowGpsFixer(false); mapRef.current = null; }} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
                    </header>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <select 
                            value={selectedTourIndex} 
                            onChange={(e) => { setSelectedTourIndex(Number(e.target.value)); setSelectedStopIndex(0); setTempCoords(null); }}
                            className="bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none"
                        >
                            {cityTours.map((t, i) => <option key={i} value={i} className="bg-slate-900">{t.title}</option>)}
                        </select>
                        <select 
                            value={selectedStopIndex} 
                            onChange={(e) => { setSelectedStopIndex(Number(e.target.value)); setTempCoords(null); }}
                            className="bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none"
                        >
                            {cityTours[selectedTourIndex]?.stops.map((s, i) => <option key={i} value={i} className="bg-slate-900">{s.name}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            placeholder="Lat, Lng (ej: 40.4167, -3.7037)" 
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[10px] font-mono outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value;
                                    const [lat, lng] = val.split(',').map(v => parseFloat(v.trim()));
                                    if (!isNaN(lat) && !isNaN(lng)) {
                                        setTempCoords({ lat, lng });
                                        mapRef.current.setView([lat, lng], 18);
                                    }
                                }
                            }}
                        />
                        <div className="px-4 bg-white/5 border border-white/10 rounded-xl flex items-center text-slate-500 text-[8px] uppercase font-black">Enter para ir</div>
                    </div>

                    <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden mb-6 relative">
                        <div ref={mapContainerRef} className="w-full h-full" />
                        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 z-[400] text-[10px] text-white">
                            <p className="font-black uppercase tracking-widest mb-2">Instrucciones</p>
                            <p className="opacity-60">Haz click en el mapa para marcar la nueva ubicación.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            disabled={!tempCoords || isWorking}
                            onClick={saveNewCoords}
                            className="flex-1 py-5 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isWorking ? 'Guardando...' : 'Confirmar Nueva Ubicación'}
                        </button>
                    </div>
                </div>
            )}

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
