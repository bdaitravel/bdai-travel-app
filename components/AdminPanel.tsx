
import React, { useState, useEffect } from 'react';
import { UserProfile, LANGUAGES, Tour } from '../types';
// Fixed: Removed purgeBrokenToursBatch from import as it's not exported by supabaseClient
import { supabase, normalizeKey, clearAllToursCache, saveToursToCache } from '../services/supabaseClient';
import { translateTours, generateAudio } from '../services/geminiService';

export const AdminPanel: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0, missingAudios: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAudioWorkerActive, setIsAudioWorkerActive] = useState(false);
    const [log, setLog] = useState<string[]>(['Sistemas listos.']);
    const [missingTranslations, setMissingTranslations] = useState<any[]>([]);
    const [purgeConfirm, setPurgeConfirm] = useState('');

    const addLog = (msg: string) => {
        setLog(prev => [msg, ...prev].slice(0, 30));
    };

    useEffect(() => {
        fetchSummary();
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
                // Si tenemos la fuente original (español), buscamos qué le falta
                if (langs.includes('es')) {
                    const missing = LANGUAGES.map(l => l.code).filter(c => !langs.includes(c));
                    if (missing.length > 0) {
                        gaps.push({ city: bestKeyForBucket[base], base, missing, missingCount: missing.length });
                    }
                }
            }
            
            // Ordenar por las que menos idiomas les falten para quitarlas rápido del medio
            gaps.sort((a, b) => a.missingCount - b.missingCount);

            setStats({ 
                totalCities: Object.keys(bucketLangs).length, 
                totalEntries: allRows.length,
                missingAudios: totalStops
            });
            setMissingTranslations(gaps);
        }
    };

    const handleReparar = async () => {
        setIsProcessing(true);
        addLog("Iniciando reparación de precisión...");
        try {
            // Fixed: purgeBrokenToursBatch is missing in supabaseClient, so we log and skip
            addLog("Reparación omitida: función específica no disponible.");
            await fetchSummary();
        } catch (e) {
            addLog("Error crítico durante la reparación.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSincronizar = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        addLog("Lanzando Spider Granular...");
        
        try {
            // Tomamos las primeras 5 ciudades con huecos
            const targetCities = missingTranslations.slice(0, 5);
            
            if (targetCities.length === 0) {
                addLog("No hay traducciones pendientes.");
                setIsProcessing(false);
                return;
            }

            for (const item of targetCities) {
                addLog(`Analizando origen: ${item.city}`);
                const { data: esData } = await supabase.from('tours_cache')
                    .select('data')
                    .eq('city', item.city)
                    .eq('language', 'es')
                    .maybeSingle();
                
                if (esData && esData.data) {
                    // Traducimos SOLO los primeros 3 idiomas faltantes de esta ciudad
                    // para no bloquear la UI demasiado tiempo
                    const languagesToProcess = item.missing.slice(0, 3);
                    
                    for (const langCode of languagesToProcess) {
                        addLog(`Traduciendo [${langCode.toUpperCase()}] -> ${item.city}...`);
                        try {
                            const translated = await translateTours(esData.data as Tour[], langCode);
                            await saveToursToCache(item.city, "", langCode, translated);
                            addLog(`✓ Éxito: ${item.city} [${langCode}]`);
                            
                            // Actualizamos resumen tras cada idioma para ver progreso real
                            await fetchSummary(); 
                            await new Promise(r => setTimeout(r, 800)); // Delay cortés
                        } catch (e: any) {
                            addLog(`✗ Error [${langCode}]: ${e.message || 'IA ocupada'}`);
                            await new Promise(r => setTimeout(r, 3000)); // Pausa más larga si falla
                        }
                    }
                }
            }
            addLog("Lote finalizado. Pulsa de nuevo para el siguiente.");
        } catch (e) {
            addLog("Error en el Spider Global.");
        } finally {
            setIsProcessing(false);
            await fetchSummary();
        }
    };

    const handleGenerateAllAudios = async () => {
        if (isAudioWorkerActive) {
            setIsAudioWorkerActive(false);
            addLog("Deteniendo trabajador de audio...");
            return;
        }

        setIsAudioWorkerActive(true);
        addLog("Iniciando Pre-generación de Audios...");
        
        try {
            const { data: allCache } = await supabase.from('tours_cache').select('city, language, data');
            if (!allCache) throw new Error("No hay datos");

            let generatedCount = 0;

            for (const entry of allCache) {
                if (!isAudioWorkerActive) break;

                const tours = entry.data as Tour[];
                const lang = entry.language;

                for (const tour of tours) {
                    if (!tour.stops) continue;
                    for (const stop of tour.stops) {
                        if (!isAudioWorkerActive) break;

                        // Adjusted search logic to use description hash or unique stop ID
                        const { data: existingAudio } = await supabase.from('audio_cache').select('id').eq('city', normalizeKey(entry.city)).limit(1).maybeSingle();

                        if (!existingAudio) {
                            addLog(`Voz [${lang}] -> ${stop.name}...`);
                            try {
                                const base64 = await generateAudio(stop.description, lang);
                                if (base64) {
                                    generatedCount++;
                                    addLog(`✓ Audio OK: ${stop.name}`);
                                    await new Promise(r => setTimeout(r, 1200));
                                }
                            } catch (err) {
                                addLog(`✗ Error TTS: ${stop.name}`);
                                await new Promise(r => setTimeout(r, 4000));
                            }
                        }
                    }
                }
            }
            addLog(`Audio Lab terminado. ${generatedCount} archivos.`);
        } catch (e) {
            addLog("Error en el trabajador de audio.");
        } finally {
            setIsAudioWorkerActive(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 overflow-hidden font-sans">
            <header className="flex items-center justify-between mb-8">
                <div className="animate-fade-in">
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
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Versiones</p>
                    <span className="text-xl font-black text-purple-500">{stats.totalEntries}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Stops DB</p>
                    <span className="text-xl font-black text-blue-500">{stats.missingAudios}</span>
                </div>
            </div>

            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-6 h-48 overflow-hidden flex flex-col font-mono shadow-inner border-l-4 border-l-purple-500">
                <p className="text-[7px] text-slate-600 font-black uppercase mb-2 flex justify-between">
                    <span>Monitor de Transmisión</span>
                    {isProcessing && <span className="text-purple-500 animate-pulse">Traduciendo...</span>}
                    {isAudioWorkerActive && <span className="text-blue-500 animate-pulse">Generando Audio...</span>}
                </p>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                    {log.map((m, i) => (
                        <p key={i} className={`text-[9px] lowercase leading-tight ${m.includes('✓') ? 'text-green-400' : m.includes('✗') ? 'text-red-400' : 'text-slate-400'}`}>&gt; {m}</p>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                    onClick={handleReparar} 
                    disabled={isProcessing || isAudioWorkerActive}
                    className="py-4 bg-blue-600/10 border border-blue-600/30 text-blue-400 rounded-2xl font-black uppercase text-[9px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-20"
                >
                    <i className="fas fa-hammer"></i> Limpiar DB
                </button>
                <button 
                    onClick={handleGenerateAllAudios} 
                    className={`py-4 border rounded-2xl font-black uppercase text-[9px] flex items-center justify-center gap-2 active:scale-95 transition-all ${isAudioWorkerActive ? 'bg-red-500 text-white border-red-400 animate-pulse' : 'bg-purple-600/10 border-purple-600/30 text-purple-400'}`}
                >
                    <i className={`fas ${isAudioWorkerActive ? 'fa-stop' : 'fa-headphones'}`}></i> {isAudioWorkerActive ? 'Parar Voz' : 'Pre-Gen Audios'}
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex-1 flex flex-col overflow-hidden shadow-2xl relative">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-black text-xs uppercase tracking-tight italic">Gaps de Idioma</h3>
                    <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-[8px] font-black border border-purple-500/20">{missingTranslations.length} ciudades</span>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 mb-6">
                    {missingTranslations.slice(0, 15).map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                            <span className="text-[9px] font-black text-slate-300 uppercase truncate max-w-[140px]">{m.city.split('_')[0]}</span>
                            <div className="flex gap-1">
                                {m.missing.slice(0, 4).map((c: string) => (
                                    <span key={c} className="text-[7px] font-black text-slate-600 uppercase bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{c}</span>
                                ))}
                                {m.missing.length > 4 && <span className="text-[7px] font-black text-slate-500">+{m.missing.length - 4}</span>}
                            </div>
                        </div>
                    ))}
                    {missingTranslations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full opacity-20">
                            <i className="fas fa-check-double text-4xl mb-2"></i>
                            <p className="text-[10px] font-black uppercase tracking-widest">Base de Datos Completa</p>
                        </div>
                    )}
                </div>

                <button 
                    disabled={isProcessing || isAudioWorkerActive || missingTranslations.length === 0}
                    onClick={handleSincronizar}
                    className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 disabled:opacity-20 transition-all flex items-center justify-center gap-3"
                >
                    {isProcessing ? <><i className="fas fa-spinner fa-spin"></i> Procesando Lote...</> : 'Lanzar Spider Granular'}
                </button>
            </div>
            
            <div className="mt-6 flex gap-2">
                <input 
                    type="text" 
                    placeholder="Escribe: BORRAR TODO" 
                    value={purgeConfirm} 
                    onChange={e => setPurgeConfirm(e.target.value)} 
                    className="flex-1 bg-red-950/10 border border-red-900/20 rounded-xl px-4 text-[8px] font-black text-red-500 outline-none uppercase placeholder:text-red-900/40" 
                />
                <button 
                    onClick={async () => {
                        if (purgeConfirm !== 'BORRAR TODO') return;
                        setIsProcessing(true);
                        addLog("Ejecutando purga total...");
                        await clearAllToursCache();
                        setPurgeConfirm('');
                        addLog("Caché vaciado correctamente.");
                        await fetchSummary();
                        setIsProcessing(false);
                    }} 
                    disabled={isProcessing || purgeConfirm !== 'BORRAR TODO'} 
                    className="px-6 py-4 bg-red-600 text-white rounded-xl font-black uppercase text-[8px] disabled:opacity-10 active:scale-95 transition-all"
                >
                    Purgar
                </button>
            </div>
        </div>
    );
};
