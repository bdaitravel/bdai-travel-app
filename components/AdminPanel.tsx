
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, Tour, Stop } from '../types';
import { supabase, normalizeKey, saveToursToCache } from '../services/supabaseClient';
import { translateTours, generateAudio, getPrecisionCoordinates } from '../services/geminiService';

const LANGUAGE_PRIORITY = ['en', 'fr', 'de', 'pt', 'it', 'zh', 'ja', 'ko', 'ar', 'ca', 'eu', 'ru', 'hi', 'tr'];

export const AdminPanel: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0, missingAudios: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAudioWorkerActive, setIsAudioWorkerActive] = useState(false);
    const [isRepairingGps, setIsRepairingGps] = useState(false);
    const [deepSync, setDeepSync] = useState(false);
    const [log, setLog] = useState<string[]>(['Sistemas listos. Modelo Pro disponible para GPS.']);
    const [missingTranslations, setMissingTranslations] = useState<any[]>([]);
    const [repairProgress, setRepairProgress] = useState({ current: 0, total: 0 });
    
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
        addLog(`🚀 Iniciando Reparación GPS [Motor: Gemini 3 Pro] ${deepSync ? '(MODO PROFUNDO)' : '(MODO SALTO)'}`);

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
            setRepairProgress({ current: 0, total: cityNames.length });

            for (let i = 0; i < cityNames.length; i++) {
                if (stopRepairRef.current) break;
                
                const cityName = cityNames[i];
                const recordsInThisCity = cityGroups[cityName];
                setRepairProgress(prev => ({ ...prev, current: i + 1 }));

                const referenceRecord = recordsInThisCity.find(r => r.language === 'es') || recordsInThisCity[0];
                const toursRef = referenceRecord.data as Tour[];
                
                // LÓGICA DE SALTO (Solo si deepSync está apagado)
                const alreadyHasGps = toursRef[0]?.stops[0]?.latitude !== 0 && toursRef[0]?.stops[0]?.latitude !== undefined;
                if (!deepSync && alreadyHasGps) {
                    addLog(`⏩ SALTO: ${cityName.toUpperCase()} ya sincronizada.`);
                    continue;
                }

                addLog(`🎯 SINCRONIZANDO: ${cityName.toUpperCase()} (Buscando precisión Pro...)`);

                try {
                    for (let tIdx = 0; tIdx < toursRef.length; tIdx++) {
                        const tour = toursRef[tIdx];
                        const stopNames = tour.stops.map(s => s.name);
                        
                        // Usamos el nuevo motor de alta precisión Pro
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
                                    if (coord) {
                                        return { ...stop, latitude: coord.latitude, longitude: coord.longitude };
                                    }
                                    return stop;
                                });
                            }
                            await saveToursToCache(record.city, "", record.language, currentTours);
                        }
                    }
                    addLog(`✓ ${cityName.toUpperCase()} reparada con precisión Pro.`);
                } catch (e) {
                    addLog(`✗ Fallo en ${cityName}. Reintentando con siguiente.`);
                }
                // Pausa prudencial para Gemini Pro
                await new Promise(r => setTimeout(r, 1200));
            }
        } finally {
            setIsRepairingGps(false);
            addLog("🏁 Sincronización finalizada.");
            fetchSummary();
        }
    };

    const handleSincronizar = async () => {
        if (isProcessing) {
            stopTransRef.current = true;
            return;
        }
        stopTransRef.current = false;
        setIsProcessing(true);
        addLog("Iniciando Spider por Orden de Prioridad...");
        
        try {
            const targetCities = missingTranslations.slice(0, 20);
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
                    addLog(`Spider [${nextLang.toUpperCase()}] -> ${item.city.split('_')[0]}`);
                    try {
                        const translated = await translateTours(esData.data as Tour[], nextLang);
                        await saveToursToCache(item.city, "", nextLang, translated);
                        addLog(`✓ Éxito: ${item.city} [${nextLang.toUpperCase()}]`);
                        await new Promise(r => setTimeout(r, 1500));
                    } catch (e) { addLog(`✗ Fallo temporal.`); }
                }
            }
        } finally {
            setIsProcessing(false);
            await fetchSummary();
        }
    };

    const handleGenerateAllAudios = async () => {
        if (isAudioWorkerActive) {
            stopAudioRef.current = true;
            setIsAudioWorkerActive(false);
            return;
        }
        stopAudioRef.current = false;
        setIsAudioWorkerActive(true);
        addLog("Laboratorio de Voz: Priorizando audios...");
        try {
            const { data: allCache } = await supabase.from('tours_cache').select('city, language, data');
            if (!allCache) return;
            allCache.sort(() => Math.random() - 0.5);
            for (const entry of allCache) {
                if (stopAudioRef.current) break;
                const tours = entry.data as Tour[];
                const lang = entry.language;
                for (const tour of tours) {
                    if (stopAudioRef.current) break;
                    for (const stop of (tour.stops || [])) {
                        if (stopAudioRef.current) break;
                        try {
                            const res = await generateAudio(stop.description, lang, entry.city);
                            if (res) {
                                addLog(`Voz ✓ [${lang.toUpperCase()}] ${stop.name.substring(0,15)}...`);
                                await new Promise(r => setTimeout(r, 2000));
                            }
                        } catch (err) {
                            addLog(`✗ API saturada. Pausa de 10s...`);
                            await new Promise(r => setTimeout(r, 10000));
                        }
                    }
                }
            }
        } finally { setIsAudioWorkerActive(false); }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 overflow-hidden font-sans">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Sala de Máquinas</h2>
                    <p className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-1">Sistemas de Optimización Global</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"><i className="fas fa-times"></i></button>
            </header>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudades Reales</p>
                    <span className="text-xl font-black text-white">{stats.totalCities}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Idiomas Caché</p>
                    <span className="text-xl font-black text-purple-500">{stats.totalEntries}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Puntos GPS</p>
                    <span className="text-xl font-black text-blue-500">{stats.missingAudios}</span>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 mb-6 flex items-center justify-between">
                <div>
                    <h4 className="text-white font-black text-xs uppercase tracking-widest">Modo Deep Sync (Pro)</h4>
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">Fuerza la re-sincronización total con Gemini 3 Pro</p>
                </div>
                <button 
                    onClick={() => setDeepSync(!deepSync)}
                    className={`w-14 h-8 rounded-full transition-all relative ${deepSync ? 'bg-purple-600' : 'bg-slate-800'}`}
                >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${deepSync ? 'left-7' : 'left-1'}`}></div>
                </button>
            </div>

            <div className="relative mb-6">
                <button 
                    onClick={handleRepairGps} 
                    className={`w-full py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[13px] transition-all flex items-center justify-center gap-4 shadow-2xl border-4 ${isRepairingGps ? 'bg-red-500 text-white border-red-400' : 'bg-white text-slate-950 border-purple-500/20'}`}
                >
                    <i className={`fas ${isRepairingGps ? 'fa-stop' : 'fa-satellite-dish'} text-xl`}></i> 
                    {isRepairingGps ? `Sincronizando Pro (${repairProgress.current}/${repairProgress.total})` : 'Ejecutar Sincro de Mapas Pro'}
                </button>
                {isRepairingGps && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${(repairProgress.current / repairProgress.total) * 100}%` }}
                        ></div>
                    </div>
                )}
            </div>

            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-6 h-64 overflow-hidden flex flex-col font-mono shadow-inner border-l-4 border-l-purple-500">
                <p className="text-[7px] text-slate-600 font-black uppercase mb-2 flex justify-between">
                    <span>Consola de Operaciones Pro</span>
                    {(isProcessing || isAudioWorkerActive || isRepairingGps) && <span className="text-purple-400 animate-pulse">EXTRAYENDO GPS...</span>}
                </p>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                    {log.map((m, i) => (
                        <p key={i} className={`text-[10px] lowercase leading-tight ${m.includes('SALTO') ? 'text-slate-500 italic' : m.includes('🎯') ? 'text-purple-400' : m.includes('✓') ? 'text-green-400' : 'text-slate-400'}`}>&gt; {m}</p>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={handleSincronizar} className={`py-6 rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 shadow-2xl ${isProcessing ? 'bg-red-500 text-white' : 'bg-white/10 text-white border border-white/10'}`}>
                    <i className={`fas ${isProcessing ? 'fa-stop' : 'fa-bolt'}`}></i> {isProcessing ? 'Parar' : 'Cura Traducción'}
                </button>
                <button onClick={handleGenerateAllAudios} className={`py-6 border rounded-[2rem] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all shadow-2xl ${isAudioWorkerActive ? 'bg-red-500 text-white border-red-400' : 'bg-blue-600/10 border-blue-600/30 text-blue-400'}`}>
                    <i className={`fas ${isAudioWorkerActive ? 'fa-stop' : 'fa-microphone'}`}></i> {isAudioWorkerActive ? 'Parar Voces' : 'Sincro Voces'}
                </button>
            </div>
        </div>
    );
};
