
import React, { useState, useEffect } from 'react';
import { UserProfile, LANGUAGES, Tour } from '../types';
import { supabase, normalizeKey, clearAllToursCache, purgeBrokenToursBatch, saveToursToCache } from '../services/supabaseClient';
import { translateTours } from '../services/geminiService';

export const AdminPanel: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [log, setLog] = useState<string[]>(['Esperando órdenes...']);
    const [missingTranslations, setMissingTranslations] = useState<any[]>([]);
    const [purgeConfirm, setPurgeConfirm] = useState('');

    const addLog = (msg: string) => {
        setLog(prev => [msg, ...prev].slice(0, 15));
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        const { data } = await supabase.from('tours_cache').select('city, language');
        if (data) {
            const allRows = data as any[];
            const bucketLangs: Record<string, Set<string>> = {};
            const bestKeyForBucket: Record<string, string> = {};

            allRows.forEach(row => {
                const rawName = row.city.split('_')[0];
                const baseNormalized = normalizeKey(rawName);
                const langCode = row.language.toLowerCase().trim();
                if (!bucketLangs[baseNormalized]) bucketLangs[baseNormalized] = new Set();
                bucketLangs[baseNormalized].add(langCode);
                bestKeyForBucket[baseNormalized] = row.city;
            });

            const gaps = [];
            for (const base in bucketLangs) {
                const langs = Array.from(bucketLangs[base]);
                if (langs.includes('es')) {
                    const missing = LANGUAGES.map(l => l.code).filter(c => !langs.includes(c));
                    if (missing.length > 0) gaps.push({ city: bestKeyForBucket[base], base, missing });
                }
            }
            setStats({ totalCities: Object.keys(bucketLangs).length, totalEntries: allRows.length });
            setMissingTranslations(gaps);
        }
    };

    const handleReparar = async () => {
        setIsProcessing(true);
        addLog("Iniciando reparación...");
        try {
            const deleted = await purgeBrokenToursBatch((msg) => addLog(msg));
            addLog(`Reparación finalizada. Eliminados ${deleted} registros basura.`);
            fetchSummary();
        } catch (e) {
            addLog("Error crítico durante la reparación.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePurgeAll = async () => {
        if (purgeConfirm !== 'BORRAR TODO') return;
        setIsProcessing(true);
        addLog("Ejecutando purga total...");
        try {
            await clearAllToursCache();
            setPurgeConfirm('');
            addLog("Base de datos vaciada.");
            fetchSummary();
        } catch (e) {
            addLog("Error en la purga.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSincronizar = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        addLog("Iniciando traducción de lote...");
        let count = 0;
        for (let i = 0; i < Math.min(missingTranslations.length, 5); i++) {
            const item = missingTranslations[i];
            const { data: esData } = await supabase.from('tours_cache').select('data').eq('city', item.city).eq('language', 'es').maybeSingle();
            if (esData && esData.data) {
                for (const langCode of item.missing) {
                    try {
                        addLog(`Traduciendo ${item.city} a ${langCode}...`);
                        const translated = await translateTours(esData.data as Tour[], langCode);
                        await saveToursToCache(item.city, "", langCode, translated);
                        count++;
                    } catch (e) {}
                }
            }
        }
        addLog(`Sincronización de lote terminada: ${count} nuevas traducciones.`);
        setIsProcessing(false);
        fetchSummary();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 overflow-hidden font-sans">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter">SALA DE MÁQUINAS</h2>
                    <p className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-1">Control de 1300+ Ciudades</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudades Base</p>
                    <span className="text-2xl font-black text-white">{stats.totalCities}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Registros Totales</p>
                    <span className="text-2xl font-black text-purple-500">{stats.totalEntries}</span>
                </div>
            </div>

            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-8 h-40 overflow-hidden flex flex-col font-mono">
                <p className="text-[7px] text-slate-600 font-black uppercase mb-2">Monitor de Sistema</p>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                    {log.map((m, i) => (
                        <p key={i} className="text-[9px] text-green-500/80 lowercase">&gt; {m}</p>
                    ))}
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <button 
                    onClick={handleReparar} 
                    disabled={isProcessing}
                    className="w-full py-5 bg-blue-600/10 border-2 border-blue-600/30 text-blue-400 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg"
                >
                    {isProcessing ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-hammer"></i>}
                    Reparar Base de Datos (Seguro)
                </button>
                
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Escribe BORRAR TODO" 
                        value={purgeConfirm} 
                        onChange={e => setPurgeConfirm(e.target.value)} 
                        className="flex-1 bg-red-950/20 border border-red-900/30 rounded-xl px-4 text-[8px] font-black text-red-500 outline-none" 
                    />
                    <button 
                        onClick={handlePurgeAll} 
                        disabled={isProcessing || purgeConfirm !== 'BORRAR TODO'} 
                        className="px-6 py-4 bg-red-600/10 border border-red-600/30 text-red-600 rounded-xl font-black uppercase text-[8px] disabled:opacity-10"
                    >
                        Purgar
                    </button>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex-1 flex flex-col overflow-hidden shadow-inner">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-black text-xs uppercase tracking-tight">Traducciones Pendientes</h3>
                    <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-[8px] font-black">{missingTranslations.length} ciudades</span>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 mb-6">
                    {missingTranslations.slice(0, 30).map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                            <span className="text-[9px] font-black text-slate-400 uppercase">{m.city.replace(/_/g, ' ')}</span>
                            <div className="flex gap-1">
                                {m.missing.slice(0, 3).map((c: string) => (
                                    <span key={c} className="text-[7px] font-black text-slate-600 uppercase bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{c}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    disabled={isProcessing || missingTranslations.length === 0}
                    onClick={handleSincronizar}
                    className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 disabled:opacity-20 transition-all"
                >
                    {isProcessing ? 'Procesando Lote...' : 'Sincronizar Lote (5 ciudades)'}
                </button>
            </div>
        </div>
    );
};
