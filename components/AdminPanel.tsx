
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, Tour, Stop } from '../types';
import { supabase, normalizeKey, saveToursToCache } from '../services/supabaseClient';
import { translateTours, generateAudio, getPrecisionCoordinates } from '../services/geminiService';

export const AdminPanel: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0, missingAudios: 0 });
    const [isRepairingGps, setIsRepairingGps] = useState(false);
    const [deepSync, setDeepSync] = useState(false);
    const [log, setLog] = useState<string[]>(['Sistemas listos. Motor de búsqueda Google Maps activado.']);
    const [repairProgress, setRepairProgress] = useState({ current: 0, total: 0 });
    
    const stopRepairRef = useRef(false);

    const addLog = (msg: string) => {
        setLog(prev => [msg, ...prev].slice(0, 100));
    };

    useEffect(() => {
        fetchSummary();
        return () => { stopRepairRef.current = true; };
    }, []);

    const fetchSummary = async () => {
        const { data } = await supabase.from('tours_cache').select('city, language, data');
        if (data) {
            const allRows = data as any[];
            const bucketLangs: Record<string, Set<string>> = {};
            allRows.forEach(row => {
                const baseNormalized = row.city.split('_')[0];
                if (!bucketLangs[baseNormalized]) bucketLangs[baseNormalized] = new Set();
                bucketLangs[baseNormalized].add(row.language);
            });
            setStats({ totalCities: Object.keys(bucketLangs).length, totalEntries: allRows.length, missingAudios: 0 });
        }
    };

    const handleRepairGps = async () => {
        if (isRepairingGps) {
            stopRepairRef.current = true;
            setIsRepairingGps(false);
            return;
        }
        stopRepairRef.current = false;
        setIsRepairingGps(true);
        addLog(`🚀 INICIANDO SINCRONIZACIÓN GPS (GOOGLE GROUNDING)`);

        try {
            const { data: allRecords } = await supabase.from('tours_cache').select('city, language, data');
            if (!allRecords) return;

            // Agrupamos por ciudad real para ahorrar llamadas y dinero
            const cityGroups: Record<string, any[]> = {};
            allRecords.forEach(rec => {
                const base = rec.city.split('_')[0].toLowerCase();
                if (!cityGroups[base]) cityGroups[base] = [];
                cityGroups[base].push(rec);
            });

            const cityKeys = Object.keys(cityGroups);
            setRepairProgress({ current: 0, total: cityKeys.length });

            for (let i = 0; i < cityKeys.length; i++) {
                if (stopRepairRef.current) break;
                
                const cityName = cityKeys[i];
                const group = cityGroups[cityName];
                setRepairProgress(prev => ({ ...prev, current: i + 1 }));

                // Reparar si forzamos DeepSync o si detectamos latitud 0
                const needsRepair = deepSync || group.some(r => r.data[0]?.stops[0]?.latitude === 0);
                if (!needsRepair) {
                    addLog(`⏩ SALTO: ${cityName.toUpperCase()} ya validada.`);
                    continue;
                }

                addLog(`🎯 BUSCANDO EN GOOGLE MAPS: ${cityName.toUpperCase()}...`);

                try {
                    // Tomamos un tour de referencia para sacar los nombres de los monumentos
                    const referenceTours = group[0].data as Tour[];
                    
                    for (let tIdx = 0; tIdx < referenceTours.length; tIdx++) {
                        const tourRef = referenceTours[tIdx];
                        const stopNames = tourRef.stops.map(s => s.name);
                        
                        // OBLIGAMOS a Gemini a buscar en Google Maps
                        const preciseCoords = await getPrecisionCoordinates(stopNames, cityName, "");

                        // Sincronizamos las coordenadas encontradas en TODOS los idiomas de esa ciudad a la vez
                        for (const record of group) {
                            const toursToUpdate = [...(record.data as Tour[])];
                            if (toursToUpdate[tIdx]) {
                                toursToUpdate[tIdx].stops = toursToUpdate[tIdx].stops.map((stop, sIdx) => {
                                    const match = preciseCoords.find(c => 
                                        c.name.toLowerCase().trim() === stop.name.toLowerCase().trim() ||
                                        sIdx === preciseCoords.findIndex(pc => pc.name === c.name)
                                    );
                                    if (match) {
                                        return { ...stop, latitude: match.latitude, longitude: match.longitude };
                                    }
                                    return stop;
                                });
                            }
                            // Guardamos en la base de datos la versión perfeccionada
                            await saveToursToCache(record.city, "", record.language, toursToUpdate);
                        }
                    }
                    addLog(`✓ GPS PERFECTO: ${cityName.toUpperCase()} sincronizada en ${group.length} idiomas.`);
                } catch (e) {
                    addLog(`✗ ERROR EN ${cityName}: Reintentando en próxima pasada.`);
                }
                
                // Delay preventivo para no estresar el límite de búsqueda gratuita
                await new Promise(r => setTimeout(r, 1200));
            }
        } finally {
            setIsRepairingGps(false);
            addLog("🏁 PROCESO COMPLETADO. REVISA TUS CIUDADES CONOCIDAS.");
            fetchSummary();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 overflow-hidden font-sans">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Sala de Máquinas</h2>
                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-2">Extractor de Alta Precisión GPS</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
            </header>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudades</p>
                    <span className="text-xl font-black text-white">{stats.totalCities}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Caché Idiomas</p>
                    <span className="text-xl font-black text-purple-500">{stats.totalEntries}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Fuente</p>
                    <span className="text-xl font-black text-blue-500">G-MAPS</span>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 mb-6 flex items-center justify-between">
                <div className="flex-1">
                    <h4 className="text-white font-black text-xs uppercase tracking-widest">Sincronización Profunda</h4>
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">Obliga a re-escanear todo desde cero</p>
                </div>
                <button onClick={() => setDeepSync(!deepSync)} className={`w-14 h-8 rounded-full transition-all relative ${deepSync ? 'bg-blue-600' : 'bg-slate-800'}`}>
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${deepSync ? 'left-7' : 'left-1'}`}></div>
                </button>
            </div>

            <button 
                onClick={handleRepairGps} 
                className={`w-full py-8 mb-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[13px] transition-all flex items-center justify-center gap-4 shadow-2xl border-4 ${isRepairingGps ? 'bg-red-500 text-white border-red-400' : 'bg-white text-slate-950 border-blue-500/20'}`}
            >
                <i className={`fas ${isRepairingGps ? 'fa-stop' : 'fa-satellite'} text-xl`}></i> 
                {isRepairingGps ? `REPARANDO ${repairProgress.current}/${repairProgress.total}` : 'REPARAR GPS (GOOGLE SEARCH)'}
            </button>

            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-6 flex-1 overflow-hidden flex flex-col font-mono shadow-inner border-l-4 border-l-blue-500">
                <p className="text-[7px] text-slate-600 font-black uppercase mb-2">Monitor de Grounding Tiempo Real</p>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                    {log.map((m, i) => (
                        <p key={i} className={`text-[10px] lowercase leading-tight ${m.includes('SALTO') ? 'text-slate-500 italic' : m.includes('🎯') ? 'text-blue-400' : m.includes('✓') ? 'text-green-400' : 'text-slate-400'}`}>&gt; {m}</p>
                    ))}
                </div>
            </div>
        </div>
    );
};
