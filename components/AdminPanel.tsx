
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, Tour } from '../types';
import { supabase, normalizeKey, clearAllToursCache, saveToursToCache, purgeBrokenToursBatch } from '../services/supabaseClient';
import { translateTours, generateAudio } from '../services/geminiService';

export const AdminPanel: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0, missingAudios: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAudioWorkerActive, setIsAudioWorkerActive] = useState(false);
    const [log, setLog] = useState<string[]>(['Sistemas de control listos.']);
    const [missingTranslations, setMissingTranslations] = useState<any[]>([]);
    
    const stopAudioRef = useRef(false);
    const stopTransRef = useRef(false);

    const addLog = (msg: string) => {
        setLog(prev => [msg, ...prev].slice(0, 40));
    };

    useEffect(() => {
        fetchSummary();
        return () => {
            stopAudioRef.current = true;
            stopTransRef.current = true;
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
            gaps.sort((a, b) => a.missingCount - b.missingCount);
            setStats({ totalCities: Object.keys(bucketLangs).length, totalEntries: allRows.length, missingAudios: totalStops });
            setMissingTranslations(gaps);
        }
    };

    const handleLimpiar = async () => {
        setIsProcessing(true);
        addLog("Iniciando purga de datos corruptos...");
        await purgeBrokenToursBatch();
        await fetchSummary();
        setIsProcessing(false);
        addLog("Base de datos optimizada.");
    };

    const handleSincronizar = async () => {
        if (isProcessing) {
            stopTransRef.current = true;
            return;
        }
        stopTransRef.current = false;
        setIsProcessing(true);
        addLog("Lanzando Spider de Traducción...");
        
        try {
            const targetCities = missingTranslations.slice(0, 2);
            if (targetCities.length === 0) {
                addLog("No hay traducciones pendientes.");
                setIsProcessing(false);
                return;
            }

            for (const item of targetCities) {
                if (stopTransRef.current) break;
                addLog(`Procesando: ${item.city}`);
                const { data: esData } = await supabase.from('tours_cache').select('data').eq('city', item.city).eq('language', 'es').maybeSingle();
                
                if (esData?.data) {
                    // Traducir solo un idioma a la vez para evitar timeouts
                    const nextLang = item.missing[0];
                    if (nextLang) {
                        addLog(`IA Traduciendo -> [${nextLang.toUpperCase()}] ${item.city}...`);
                        try {
                            const translated = await translateTours(esData.data as Tour[], nextLang);
                            await saveToursToCache(item.city, "", nextLang, translated);
                            addLog(`✓ Éxito: ${item.city} [${nextLang}]`);
                            await fetchSummary(); 
                            await new Promise(r => setTimeout(r, 2000));
                        } catch (e: any) {
                            addLog(`✗ Fallo en IA. Saltando...`);
                        }
                    }
                }
            }
        } catch (e) {
            addLog("Error crítico en el Spider.");
        } finally {
            setIsProcessing(false);
            await fetchSummary();
        }
    };

    const handleGenerateAllAudios = async () => {
        if (isAudioWorkerActive) {
            stopAudioRef.current = true;
            setIsAudioWorkerActive(false);
            addLog("Deteniendo Laboratorio de Audio...");
            return;
        }

        stopAudioRef.current = false;
        setIsAudioWorkerActive(true);
        addLog("Escaneando contenido para voces...");
        
        try {
            const { data: allCache } = await supabase.from('tours_cache').select('city, language, data');
            if (!allCache) return;

            for (const entry of allCache) {
                if (stopAudioRef.current) break;
                const tours = entry.data as Tour[];
                const lang = entry.language;

                for (const tour of tours) {
                    if (stopAudioRef.current) break;
                    if (!tour.stops) continue;
                    for (const stop of tour.stops) {
                        if (stopAudioRef.current) break;
                        
                        // Generar un hash único para este texto y este idioma
                        // La función generateAudio ya comprueba si existe en Supabase antes de llamar a la IA
                        addLog(`Verificando Voz [${lang}] -> ${stop.name.substring(0,20)}...`);
                        try {
                            const result = await generateAudio(stop.description, lang, entry.city);
                            if (result) {
                                addLog(`✓ Audio sincronizado.`);
                                // Pausa para no saturar la API de Gemini
                                await new Promise(r => setTimeout(r, 2500));
                            }
                        } catch (err) {
                            addLog(`✗ IA Ocupada. Reintentando en 10s...`);
                            await new Promise(r => setTimeout(r, 10000));
                        }
                    }
                }
            }
        } catch (e) {
            addLog("Error en el Laboratorio de Audio.");
        } finally {
            setIsAudioWorkerActive(false);
            addLog("Proceso de audio finalizado.");
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 overflow-hidden font-sans">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Sala de Máquinas</h2>
                    <p className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-1">Control Maestro BDAI</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"><i className="fas fa-times"></i></button>
            </header>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudades</p>
                    <span className="text-xl font-black text-white">{stats.totalCities}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Caché total</p>
                    <span className="text-xl font-black text-purple-500">{stats.totalEntries}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Stops Totales</p>
                    <span className="text-xl font-black text-blue-500">{stats.missingAudios}</span>
                </div>
            </div>

            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-6 h-48 overflow-hidden flex flex-col font-mono shadow-inner border-l-4 border-l-purple-500">
                <p className="text-[7px] text-slate-600 font-black uppercase mb-2 flex justify-between">
                    <span>Monitor de Transmisión</span>
                    {(isProcessing || isAudioWorkerActive) && <span className="text-purple-500 animate-pulse">Trabajando...</span>}
                </p>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                    {log.map((m, i) => (
                        <p key={i} className={`text-[9px] lowercase leading-tight ${m.includes('✓') ? 'text-green-400' : m.includes('✗') ? 'text-red-400' : 'text-slate-400'}`}>&gt; {m}</p>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                    onClick={handleLimpiar} 
                    className="py-4 bg-blue-600/10 border border-blue-600/30 text-blue-400 rounded-2xl font-black uppercase text-[9px] flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <i className="fas fa-hammer"></i> Optimizar DB
                </button>
                <button 
                    onClick={handleGenerateAllAudios} 
                    className={`py-4 border rounded-2xl font-black uppercase text-[9px] flex items-center justify-center gap-2 active:scale-95 transition-all ${isAudioWorkerActive ? 'bg-red-500 text-white border-red-400 animate-pulse' : 'bg-purple-600/10 border-purple-600/30 text-purple-400'}`}
                >
                    <i className={`fas ${isAudioWorkerActive ? 'fa-stop' : 'fa-headphones'}`}></i> {isAudioWorkerActive ? 'Detener Voces' : 'Laboratorio de Voz'}
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex-1 flex flex-col overflow-hidden shadow-2xl relative">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-black text-xs uppercase tracking-tight italic">Estado de Traducciones</h3>
                    <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-[8px] font-black border border-purple-500/20">{missingTranslations.length} pendientes</span>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 mb-6">
                    {missingTranslations.slice(0, 20).map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                            <span className="text-[9px] font-black text-slate-300 uppercase truncate max-w-[140px]">{m.city.split('_')[0]}</span>
                            <div className="flex gap-1">
                                {m.missing.slice(0, 5).map((c: string) => (
                                    <span key={c} className="text-[7px] font-black text-slate-600 uppercase bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{c}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={handleSincronizar}
                    className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all flex items-center justify-center gap-3 ${isProcessing ? 'bg-red-500 text-white' : 'bg-white text-slate-950'}`}
                >
                    {isProcessing ? 'Detener Spider' : 'Lanzar Spider de Traducción'}
                </button>
            </div>
        </div>
    );
};
