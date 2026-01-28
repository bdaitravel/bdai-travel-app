
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText, generateAudio } from '../services/geminiService';

const TEXTS: any = {
    en: { start: "Launch", stop: "Hub", of: "of", photoSpot: "Technical Angle", capture: "Log Data", rewardReceived: "Sync Successful", prev: "Back", next: "Advance", meters: "m", itinerary: "Sequence", syncing: "Syncing voice...", tooFar: "Too far! Move closer to the spot.", locked: "GPS Locked" },
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Ángulo Técnico", capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Avanzar", meters: "m", itinerary: "Secuencia", syncing: "Sincronizando voz...", tooFar: "¡Demasiado lejos! Acércate al punto real.", locked: "GPS Bloqueado" },
    ca: { start: "Llançar", stop: "Parada", of: "de", photoSpot: "Angle Tècnic", capture: "Loguejar Dades", rewardReceived: "Sincronitzat", prev: "Enrere", next: "Avançar", meters: "m", itinerary: "Seqüència", syncing: "Sincronitzant veu...", tooFar: "Massa lluny! Apropa't al punt.", locked: "GPS Bloquejat" }
};

// Fórmula de Haversine para validación GPS real
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Radio de la tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  const tl = TEXTS[language] || TEXTS.es;
  const duration = tour.stops.length * 20 + "m";
  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-md p-7 mb-4 cursor-pointer relative">
      <div className="flex flex-col">
          <div className="mb-4 flex justify-between items-center">
             <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white">{tour.theme}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter leading-tight">{tour.title}</h3>
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{tour.description}</p>
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-50">
               <span className="text-slate-900 font-black text-[10px] uppercase tracking-widest"><i className="fas fa-clock mr-2"></i> {duration} • {tour.distance}</span>
               <span className="text-purple-600 font-black text-[10px] uppercase tracking-widest">{tl.start} <i className="fas fa-chevron-right ml-1"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, user, currentStopIndex, onNext, onPrev, onJumpTo, onUpdateUser, onBack, language = 'es', userLocation }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [photoClaimed, setPhotoClaimed] = useState(false);

    // Audio Engine con Jitter Buffer (Playback continuo)
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    
    const phrases = useMemo(() => {
        // Dividimos el texto en oraciones para procesamiento por bloques
        return currentStop.description.split(/[.!?]+\s/).filter(p => p.trim().length > 3);
    }, [currentStop.id]);

    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const preloadedBuffersRef = useRef<Map<number, AudioBuffer>>(new Map());
    const isPlayingRef = useRef(false);

    useEffect(() => {
        stopAudio();
        setIsPlaying(false);
        setIsLoading(false);
        setCurrentPhraseIndex(0);
        preloadedBuffersRef.current.clear();
        setRewardClaimed(false);
        setPhotoClaimed(false);
        
        // Empezamos a precargar el primer bloque
        preloadPhrases(0);
    }, [currentStop.id]);

    const preloadPhrases = async (startIndex: number) => {
        for (let i = startIndex; i < Math.min(startIndex + 3, phrases.length); i++) {
            if (!preloadedBuffersRef.current.has(i)) {
                const base64 = await generateAudio(phrases[i], language, tour.city);
                if (base64) {
                    const buffer = await decodeBase64ToBuffer(base64);
                    if (buffer) preloadedBuffersRef.current.set(i, buffer);
                }
            }
        }
    };

    const decodeBase64ToBuffer = async (base64: string): Promise<AudioBuffer | null> => {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        
        // Decodificación de PCM raw 16bit 24kHz
        const dataInt16 = new Int16Array(bytes.buffer, 0, Math.floor(bytes.byteLength / 2));
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        return buffer;
    };

    const stopAudio = () => {
        isPlayingRef.current = false;
        activeSourcesRef.current.forEach(s => {
            try { s.stop(); } catch(e) {}
        });
        activeSourcesRef.current = [];
        nextStartTimeRef.current = 0;
    };

    const startContinuousPlayback = async (startIndex: number) => {
        if (isPlayingRef.current) return;
        
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        isPlayingRef.current = true;
        setIsPlaying(true);
        nextStartTimeRef.current = ctx.currentTime + 0.1;

        playNextInQueue(startIndex);
    };

    const playNextInQueue = async (index: number) => {
        if (!isPlayingRef.current || index >= phrases.length) {
            if (index >= phrases.length) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                handleVisitReward(); // Gana millas al terminar de escuchar
            }
            return;
        }

        setCurrentPhraseIndex(index);
        let buffer = preloadedBuffersRef.current.get(index);

        if (!buffer) {
            setIsLoading(true);
            const base64 = await generateAudio(phrases[index], language, tour.city);
            if (base64) buffer = await decodeBase64ToBuffer(base64);
            setIsLoading(false);
        }

        if (buffer && isPlayingRef.current) {
            const ctx = audioContextRef.current!;
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            
            // Programamos el inicio exacto para evitar GAPS
            const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
            source.start(startTime);
            
            nextStartTimeRef.current = startTime + buffer.duration;
            activeSourcesRef.current.push(source);

            // Precarga la siguiente mientras suena esta
            preloadPhrases(index + 1);

            source.onended = () => {
                activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
                if (activeSourcesRef.current.length === 0 && isPlayingRef.current) {
                    playNextInQueue(index + 1);
                }
            };

            // Si hay buffer de la siguiente, la encolamos ya mismo para que el hilo no muera
            if (preloadedBuffersRef.current.has(index + 1)) {
                // Pequeño delay para no saturar el event loop
                setTimeout(() => playNextInQueue(index + 1), 10);
            }
        } else {
            setIsPlaying(false);
            isPlayingRef.current = false;
        }
    };

    // VALIDACIÓN GPS
    const getDistance = () => {
        if (!userLocation) return Infinity;
        return calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude);
    };

    const handleVisitReward = () => {
        if (rewardClaimed) return;
        const dist = getDistance();
        if (dist > 50) return; // Demasiado lejos

        onUpdateUser({ ...user, miles: user.miles + 25 });
        setRewardClaimed(true);
    };

    const handlePhotoReward = () => {
        if (photoClaimed) return;
        const dist = getDistance();
        
        if (dist > 50) {
            alert(`${tl.tooFar} (${Math.round(dist)}m)`);
            return;
        }

        // Distinción de puntos: Millas + Puntos de Foto (Insignias)
        onUpdateUser({ 
            ...user, 
            photoPoints: (user.photoPoints || 0) + 1, // Puntos de estatus/insignia
            miles: user.miles + 50, // Recompensa económica
            stats: { ...user.stats, photosTaken: user.stats.photosTaken + 1 }
        });
        setPhotoClaimed(true);
    };

    const isLocked = getDistance() > 50;

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             {/* Header */}
             <div className="bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between z-[6000] shrink-0 pt-safe-iphone shadow-sm">
                <button onClick={() => { stopAudio(); onBack(); }} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950"><i className="fas fa-arrow-left"></i></button>
                <div className="text-center">
                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                    <h2 className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{currentStop.name}</h2>
                </div>
                <div className="w-12 h-12 flex items-center justify-center">
                    {isLocked && <i className="fas fa-lock text-slate-300 text-xs"></i>}
                </div>
             </div>
             
             {/* Content */}
             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col relative">
                <div className="h-[35vh] w-full relative z-[100] shrink-0 border-b border-slate-100 bg-slate-200">
                    <SchematicMap 
                        stops={tour.stops} 
                        currentStopIndex={currentStopIndex} 
                        language={language} 
                        onStopSelect={onJumpTo} 
                        onPlayAudio={() => isPlaying ? stopAudio() : startContinuousPlayback(currentPhraseIndex)} 
                        audioPlayingId={isPlaying ? currentStop.id : null} 
                        audioLoadingId={isLoading ? currentStop.id : null} 
                        userLocation={userLocation} 
                    />
                </div>

                <div className="px-8 pt-10 pb-40 space-y-10 bg-white rounded-t-[3rem] -mt-10 shadow-[0_-30px_60px_rgba(0,0,0,0.05)] z-[200]">
                    {/* Control de Audio */}
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                             <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isPlaying ? 'Dai narrando...' : 'Audio Pausado'}</p>
                             </div>
                        </div>
                        <button 
                            onClick={() => isPlaying ? stopAudio() : startContinuousPlayback(currentPhraseIndex)} 
                            disabled={isLoading} 
                            className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all active:scale-95 shrink-0 ${isPlaying ? 'bg-red-600' : 'bg-slate-950'} text-white`}
                        >
                            {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-play ml-1"></i>}
                        </button>
                    </div>

                    {/* Photo Spot con bloqueo GPS */}
                    <div className={`bg-slate-50 rounded-[2.5rem] border ${isLocked ? 'border-slate-200 opacity-60' : 'border-purple-200 bg-purple-50/30'} p-6 flex flex-col gap-4 transition-all`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl ${isLocked ? 'bg-slate-400' : 'bg-purple-600'} text-white flex items-center justify-center text-sm shadow-lg`}><i className="fas fa-camera"></i></div>
                                <div>
                                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{tl.photoSpot}</p>
                                    <h4 className="text-[10px] font-black uppercase text-slate-900">{isLocked ? tl.locked : currentStop.photoSpot?.angle}</h4>
                                </div>
                            </div>
                            {!isLocked && <span className="text-[10px] font-black text-purple-600 animate-bounce">¡AQUÍ!</span>}
                        </div>
                        
                        <button 
                            onClick={handlePhotoReward} 
                            disabled={photoClaimed} 
                            className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${photoClaimed ? 'bg-green-100 text-green-600 border border-green-200' : isLocked ? 'bg-slate-200 text-slate-400' : 'bg-slate-950 text-white shadow-xl hover:bg-purple-700'}`}
                        >
                            {photoClaimed ? <><i className="fas fa-check-circle mr-2"></i> {tl.rewardReceived}</> : isLocked ? <><i className="fas fa-location-arrow mr-2"></i> {Math.round(getDistance())}m lejos</> : tl.capture}
                        </button>
                    </div>

                    {/* Texto Narrativo */}
                    <div className="space-y-10 text-slate-800 text-lg leading-relaxed font-medium pb-20">
                        {currentStop.description.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="animate-fade-in first-letter:text-6xl first-letter:font-black first-letter:text-slate-950 first-letter:mr-3 first-letter:float-left first-letter:mt-1 opacity-90">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>
             </div>

             {/* Footer Nav */}
             <div className="bg-white/80 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] shrink-0 pb-safe-iphone">
                <button onClick={() => { stopAudio(); onPrev(); }} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest disabled:opacity-0">{tl.prev}</button>
                <button onClick={() => { stopAudio(); onNext(); }} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-2xl">{tl.next}</button>
             </div>
        </div>
    );
};
