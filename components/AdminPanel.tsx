
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, Tour, Stop } from '../types';
import { supabase, normalizeKey, saveToursToCache, deleteCityFromCache } from '../services/supabaseClient';
// Fix: Removed non-existent export getPrecisionCoordinates
import { translateTours, generateAudio } from '../services/geminiService';

export const AdminPanel: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
    const [stats, setStats] = useState({ totalCities: 0, totalEntries: 0, missingAudios: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAudioWorkerActive, setIsAudioWorkerActive] = useState(false);
    const [isRepairingGps, setIsRepairingGps] = useState(false);
    const [deepSync, setDeepSync] = useState(false);
    const [log, setLog] = useState<string[]>(['Sistemas listos.']);
    const [missingTranslations, setMissingTranslations] = useState<any[]>([]);
    const [purgeName, setPurgeName] = useState('');
    
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
            allRows.forEach(row => {
                const baseNormalized = row.city;
                if (!bucketLangs[baseNormalized]) bucketLangs[baseNormalized] = new Set();
                bucketLangs[baseNormalized].add(row.language);
            });
            setStats({ totalCities: Object.keys(bucketLangs).length, totalEntries: allRows.length, missingAudios: 0 });
        }
    };

    const handlePurge = async () => {
        if (!purgeName) return;
        addLog(`Pugando ciudad: ${purgeName}...`);
        await deleteCityFromCache(purgeName, "");
        addLog(`✓ ${purgeName} eliminada de Supabase.`);
        setPurgeName('');
        fetchSummary();
    };

    const handleGenerateAllAudios = async () => {
        if (isAudioWorkerActive) { stopAudioRef.current = true; setIsAudioWorkerActive(false); return; }
        stopAudioRef.current = false;
        setIsAudioWorkerActive(true);
        addLog("Laboratorio de Voz activo...");
        try {
            const { data } = await supabase.from('tours_cache').select('city, language, data');
            if (!data) return;
            for (const entry of data) {
                if (stopAudioRef.current) break;
                const tours = entry.data as Tour[];
                for (const tour of tours) {
                    for (const stop of tour.stops) {
                        if (stopAudioRef.current) break;
                        await generateAudio(stop.description, entry.language, entry.city);
                        addLog(`Audio ✓ [${entry.language}] ${stop.name.substring(0,10)}`);
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }
            }
        } finally { setIsAudioWorkerActive(false); }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col p-8 overflow-hidden font-sans">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Admin TechTravel</h2>
                    <p className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-1">Sistemas de Depuración</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"><i className="fas fa-times"></i></button>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Ciudades en Caché</p>
                    <span className="text-2xl font-black text-white">{stats.totalCities}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-1">Entradas Totales</p>
                    <span className="text-2xl font-black text-purple-500">{stats.totalEntries}</span>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 mb-6 space-y-4">
                <h4 className="text-white font-black text-[10px] uppercase tracking-widest">Limpiar Caché Específica</h4>
                <div className="flex gap-2">
                    <input value={purgeName} onChange={e => setPurgeName(e.target.value)} placeholder="Ej: Madrid" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none" />
                    <button onClick={handlePurge} className="bg-red-600 text-white px-6 rounded-xl font-black uppercase text-[10px]">Borrar</button>
                </div>
            </div>

            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-6 h-64 overflow-hidden flex flex-col font-mono shadow-inner border-l-4 border-l-purple-500">
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                    {log.map((m, i) => (
                        <p key={i} className={`text-[10px] lowercase leading-tight text-slate-400`}>&gt; {m}</p>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <button onClick={handleGenerateAllAudios} className={`py-6 rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 shadow-2xl ${isAudioWorkerActive ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}>
                    <i className={`fas ${isAudioWorkerActive ? 'fa-stop' : 'fa-microphone'}`}></i> {isAudioWorkerActive ? 'Parar Sincro Voces' : 'Forzar Sincro Voces'}
                </button>
            </div>
        </div>
    );
};
