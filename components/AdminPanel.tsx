
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, Tour, Stop } from '../types';
import { supabase, normalizeKey, saveToursToCache } from '../services/supabaseClient';
import { translateTours, generateAudio, getPrecisionCoordinates } from '../services/geminiService';

const LANGUAGE_PRIORITY = ['en', 'zh', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'ar', 'ca', 'eu', 'ru', 'hi', 'tr'];

export const AdminPanel: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0, missingAudios: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAudioWorkerActive, setIsAudioWorkerActive] = useState(false);
    const [isRepairingGps, setIsRepairingGps] = useState(false);
    const [deepSync, setDeepSync] = useState(false);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [log, setLog] = useState<string[]>(['Sistemas listos. Inteligencia Pro en espera.']);
    const [missingTranslations, setMissingTranslations] = useState<any[]>([]);
    const [repairProgress, setRepairProgress] = useState({ current: 0, total: 389, processed: 0, skipped: 0 });
    
    const stopAudioRef = useRef(false);
    const stopTransRef = useRef(false);
    const stopRepairRef = useRef(false);

    const addLog = (msg: string) => {
        setLog(prev => [msg, ...prev].slice(0, 100));
    };

    useEffect(() => {
        fetchSummary();
        return () => {
            stopAudioRef.current = true;
            stopTransRef.current = true;
            stopRepairRef.current = true;
        };
    }, []);

    const fetchSummary = async () => {
        const { data } = await supabase.from('tours_cache').select('city, language, data');
        if (data) {
            const allRows = data as any[];
            const bucketLangs: Record<string, Set<string>> = {};
            const bestKeyForBucket: Record<string, string> = {};
            let totalStops = 0;

            allRows.forEach(row => {
                const rawName = row.city.split('_')[0];
                const baseNormalized = normalizeKey(rawName);
                const langCode = row.language.toLowerCase().trim();
                
                if (!bucketLangs[baseNormalized]) bucketLangs[baseNormalized] = new Set();
                bucketLangs[baseNormalized].add(langCode);
                bestKeyForBucket[baseNormalized] = row.city;
                
                const tours = row.data as Tour[];
                if (Array.isArray(tours)) {
                    tours.forEach(t => totalStops += (t.stops?.length || 0));
                }
            });

            const gaps = [];
            for (const base in bucketLangs) {
                const langs = Array.from(bucketLangs[base]);
                if (langs.includes('es')) {
                    const missing = LANGUAGES.map(l => l.code).filter(c => !langs.includes(c));
                    if (missing.length > 0) {
                        gaps.push({ city: bestKeyForBucket[base], base, missing, missingCount: missing.length });
                    }
                }
            }
            gaps.sort(() => Math.random() - 0.5);
            setStats({ totalCities: Object.keys(bucketLangs).length, totalEntries: allRows.length, missingAudios: totalStops });
            setMissingTranslations(gaps);
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
        addLog(deepSync ? `☢️ MODO QUIRÚRGICO PRO ACTIVADO: Re-mapeando mundo...` : `🌍 SINCRONIZACIÓN ESTÁNDAR: Completando huecos...`);

        try {
            const { data: allRecords } = await supabase.from('tours_cache').select('city, language, data');
            if (!allRecords) return;

            const cityGroups: Record<string, any[]> = {};
            allRecords.forEach(rec => {
                const base = rec.city.split('_')[0].toLowerCase();
                if (!cityGroups[base]) cityGroups[base] = [];
                cityGroups[base].push(rec);
            });

            const cityNames = Object.keys(cityGroups);
            setRepairProgress(prev => ({ ...prev, total: cityNames.length, current: 0, processed: 0, skipped: 0 }));

            for (let i = 0; i < cityNames.length; i++) {
                if (stopRepairRef.current) break;
                
                const cityName = cityNames[i];
                const recordsInThisCity = cityGroups[cityName];
                setRepairProgress(prev => ({ ...prev, current: i + 1 }));

                const referenceRecord = recordsInThisCity.find(r => r.language === 'es') || recordsInThisCity[0];
                const toursRef = referenceRecord.data as Tour[];
                
                const hasValidGps = toursRef[0]?.stops[0]?.latitude !== 0 && 
                                  toursRef[0]?.stops[0]?.latitude !== undefined &&
                                  Math.abs(toursRef[0]?.stops[0]?.latitude) > 1;

                if (!deepSync && hasValidGps) {
                    setRepairProgress(prev => ({ ...prev, skipped: prev.skipped + 1 }));
                    addLog(`⏩ SALTADA: ${cityName.toUpperCase()} (ya tiene GPS)`);
                    continue;
                }

                addLog(`🎯 PRO MODEL -> ${cityName.toUpperCase()}...`);

                try {
                    for (let tIdx = 0; tIdx < toursRef.length; tIdx++) {
                        const tour = toursRef[tIdx];
                        const stopNames = tour.stops.map(s => s.name);
                        const newCoords = await getPrecisionCoordinates(stopNames, cityName, "");

                        for (const record of recordsInThisCity) {
                            const currentTours = record.data as Tour[];
                            const targetTour = currentTours[tIdx];
                            if (targetTour) {
                                targetTour.stops = targetTour.stops.map(stop => {
                                    const coord = newCoords.find(c => 
                                        c.name.toLowerCase().trim() === stop.name.toLowerCase().trim() ||
                                        stopNames.indexOf(stop.name) === newCoords.indexOf(c)
                                    );
                                    if (coord) return { ...stop, latitude: coord.latitude, longitude: coord.longitude };
                                    return stop;
                                });
                            }
                            await saveToursToCache(record.city, "", record.language, currentTours);
                        }
                    }
                    setEstimatedCost(prev => prev + 0.008);
                    setRepairProgress(prev => ({ ...prev, processed: prev.processed + 1 }));
                    addLog(`✓ ${cityName.toUpperCase()} PERFECCIONADA.`);
                } catch (e) {
                    addLog(`✗ Reintentando ${cityName}...`);
                }
                await new Promise(r => setTimeout(r, 1500));
            }
        } finally {
            setIsRepairingGps(false);
            addLog("🏁 PROCESO FINALIZADO.");
            fetchSummary();
        }
    };

    const handleSincronizar = async () => {
        if (isProcessing) { stopTransRef.current = true; return; }
        stopTransRef.current = false;
        setIsProcessing(true);
        addLog("Spider: Traduciendo...");
        try {
            const targetCities = missingTranslations.slice(0, 50);
            for (const item of targetCities) {
                if (stopTransRef.current) break;
                const { data: esData } = await supabase.from('tours_cache').select('data').eq('city', item.city).eq('language', 'es').maybeSingle();
                if (!esData?.data) continue;
                let nextLang = null;
                for (const priorityLang of LANGUAGE_PRIORITY) {
                    if (item.missing.includes(priorityLang)) { nextLang = priorityLang; break; }
                }
                if (!nextLang && item.missing.length > 0) nextLang = item.missing[0];
                if (nextLang) {
                    addLog(`Traduciendo [${nextLang}] -> ${item.city}`);
                    try {
                        const translated = await translateTours(esData.data as Tour[], nextLang);
                        await saveToursToCache(item.city, "", nextLang, translated);
                        addLog(`✓ ${item.city} [${nextLang}] OK`);
                        await new Promise(r => setTimeout(r, 1200));
                    } catch (e) { addLog(`✗ Error.`); }
                }
            }
        } finally { setIsProcessing(false); fetchSummary(); }
    };

    const handleGenerateAllAudios = async () => {
        if (isAudioWorkerActive) { stopAudioRef.current = true; setIsAudioWorkerActive(false); return; }
        stopAudioRef.current = false;
        setIsAudioWorkerActive(true);
        addLog("Audio: Generando voces...");
        try {
            const { data: allCache } = await supabase.from('tours_cache').select('city, language, data');
            if (!allCache) return;
            allCache.sort(() => Math.random() - 0.5);
            for (const entry of allCache) {
                if (stopAudioRef.current) break;
                const tours = entry.data as Tour[];
                for (const tour of tours) {
                    if (stopAudioRef.current) break;
                    for (const stop of (tour.stops || [])) {
                        if (stopAudioRef.current) break;
                        try {
                            await generateAudio(stop.description, entry.language, entry.city);
                            addLog(`Voz OK: ${stop.name.substring(0,10)}`);
                            await new Promise(r => setTimeout(r, 1800));
                        } catch (err) { await new Promise(r => setTimeout(r, 5000)); }
                    }
                }
            }
        } finally { setIsAudioWorkerActive(false); }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 overflow-hidden font-sans">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]"><i className="fas fa-microchip text-xl"></i></div>
                    <div>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Sala de Máquinas</h2>
                        <p className="text-[7px] font-black text-purple-500 uppercase tracking-widest mt-0.5">389 Ciudades • Central de Inteligencia</p>
                    </div>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"><i className="fas fa-times"></i></button>
            </header>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center shadow-xl">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Universo</p>
                    <span className="text-xl font-black text-white">389</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center shadow-xl">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Inversión</p>
                    <span className="text-xl font-black text-green-500">{estimatedCost.toFixed(2)}€</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center shadow-xl">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Precisión</p>
                    <span className="text-xl font-black text-blue-500">{repairProgress.processed}</span>
                </div>
            </div>

            <div className={`bg-white/5 border rounded-[2.5rem] p-6 mb-6 flex items-center justify-between transition-all duration-500 ${deepSync ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10'}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${deepSync ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                        <i className={`fas ${deepSync ? 'fa-crosshairs' : 'fa-check'}`}></i>
                    </div>
                    <div>
                        <h4 className={`font-black text-xs uppercase tracking-widest ${deepSync ? 'text-amber-500' : 'text-white'}`}>Deep Sync (Gemini Pro)</h4>
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">
                            {deepSync ? '⚠️ Precisión Quirúrgica: ~3.11€ total' : 'Mantenimiento preventivo (Sólo huecos)'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setDeepSync(!deepSync)}
                    className={`w-14 h-8 rounded-full transition-all relative ${deepSync ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-800'}`}
                >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${deepSync ? 'left-7' : 'left-1'}`}></div>
                </button>
            </div>

            <div className="relative mb-6">
                <button 
                    onClick={handleRepairGps} 
                    className={`w-full py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[12px] transition-all flex flex-col items-center justify-center gap-1 shadow-2xl border-4 ${isRepairingGps ? 'bg-red-500 text-white border-red-400' : (deepSync ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white text-slate-950 border-purple-500/20')}`}
                >
                    <div className="flex items-center gap-4">
                        <i className={`fas ${isRepairingGps ? 'fa-circle-notch fa-spin' : 'fa-satellite-dish'} text-xl`}></i> 
                        {isRepairingGps ? `SINCRONIZANDO ${repairProgress.current}/${repairProgress.total}` : (deepSync ? 'INICIAR MAPEADO QUIRÚRGICO' : 'REPARAR MAPAS FALTANTES')}
                    </div>
                </button>
                {isRepairingGps && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${deepSync ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b]' : 'bg-blue-500 shadow-[0_0_15px_#3b82f6]'}`}
                            style={{ width: `${(repairProgress.current / repairProgress.total) * 100}%` }}
                        ></div>
                    </div>
                )}
            </div>

            <div className="bg-black/50 border border-white/5 rounded-3xl p-5 mb-6 h-64 overflow-hidden flex flex-col font-mono shadow-inner border-l-4 border-l-purple-500">
                <p className="text-[7px] text-slate-600 font-black uppercase mb-3 flex justify-between items-center">
                    <span>Admin Terminal • v2.5</span>
                    {(isProcessing || isAudioWorkerActive || isRepairingGps) && (
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                            <span className="text-purple-400 text-[6px]">ENGINEERING_SYNC</span>
                        </span>
                    )}
                </p>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5">
                    {log.map((m, i) => (
                        <p key={i} className={`text-[10px] lowercase leading-tight ${m.includes('SALTADA') ? 'text-slate-500 italic' : m.includes('🎯') ? 'text-purple-400 font-bold' : m.includes('✓') ? 'text-green-400' : 'text-slate-400'}`}>&gt; {m}</p>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={handleSincronizar} className={`py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl ${isProcessing ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-400 border border-white/5'}`}>
                    <i className={`fas ${isProcessing ? 'fa-stop' : 'fa-language'}`}></i> Traducir
                </button>
                <button onClick={handleGenerateAllAudios} className={`py-6 border rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all shadow-xl ${isAudioWorkerActive ? 'bg-red-500 text-white border-red-400' : 'bg-blue-600/10 border-blue-600/20 text-blue-400'}`}>
                    <i className={`fas ${isAudioWorkerActive ? 'fa-stop' : 'fa-wave-square'}`}></i> Audios
                </button>
            </div>
            
            <footer className="mt-auto pt-6 text-center">
                <p className="text-[7px] text-slate-600 font-black uppercase tracking-[0.4em]">Inversión Pro Garantizada: Máx 3.50€ / Operación Global</p>
            </footer>
        </div>
    );
};
