
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile, CapturedMoment } from '../types';
import { SchematicMap } from './SchematicMap';
import { generateAudio, generateSmartCaption } from '../services/geminiService';

const TEXTS: any = {
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Ángulo Técnico", capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Avanzar", meters: "m", itinerary: "Itinerario", syncing: "Sincronizando...", tooFar: "GPS Incierto", generateStory: "Verificar por Foto", checkIn: "Check-in GPS", checkedIn: "Verificada", shareInsta: "Copiar Caption", distance: "a", refreshGps: "Refrescar GPS", gpsOk: "GPS OK", gpsLow: "GPS Débil", photoHint: "Usa la cámara si el GPS falla" },
    en: { start: "Launch", stop: "Stop", of: "of", photoSpot: "Technical Angle", capture: "Log Data", rewardReceived: "Synced", prev: "Back", next: "Next", meters: "m", itinerary: "Itinerary", syncing: "Syncing...", tooFar: "GPS Uncertain", generateStory: "Verify by Photo", checkIn: "GPS Check-in", checkedIn: "Verified", shareInsta: "Copy Caption", distance: "at", refreshGps: "Refresh GPS", gpsOk: "GPS OK", gpsLow: "Low GPS", photoHint: "Use camera if GPS fails" }
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  const tl = TEXTS[language] || TEXTS.es;
  if (!tour) return null;
  return (
    <div onClick={() => onSelect(tour)} className="group bg-slate-900 border-2 border-white/5 rounded-[2.5rem] overflow-hidden p-8 mb-6 cursor-pointer relative active:scale-[0.98] transition-all hover:border-purple-500/40 shadow-2xl">
      <div className="flex flex-col">
          <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter leading-tight group-hover:text-purple-400">{tour.title}</h3>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-6">{tour.description}</p>
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
               <div className="flex gap-4 text-white font-black text-xs uppercase"><span>{tour.duration}</span><span>{tour.distance}</span></div>
               <div className="flex items-center gap-3"><span className="text-purple-500 font-black text-[10px] uppercase">{tl.start}</span><div className="w-10 h-10 bg-white text-slate-950 rounded-2xl flex items-center justify-center"><i className="fas fa-play text-[10px] ml-0.5"></i></div></div>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, user, currentStopIndex, onNext, onPrev, onJumpTo, onUpdateUser, onBack, language = 'es', userLocation }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    
    const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
    const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => { stopAudio(); }, [currentStopIndex]);

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch(e) {}
            sourceNodeRef.current = null;
        }
        setAudioPlayingId(null);
    };

    const handlePlayAudio = async (stopId: string, text: string) => {
        if (audioPlayingId === stopId) { stopAudio(); return; }
        stopAudio();
        setAudioLoadingId(stopId);
        
        try {
            // El proceso de recuperación de text_hash es el que hace que sea INSTANTÁNEO
            const base64 = await generateAudio(text, user.language, tour.city);
            if (!base64) throw new Error("No audio data");
            
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            // CONVERSIÓN ULTRA-RÁPIDA (MILISEGUNDOS)
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) {
                channelData[i] = dataInt16[i] / 32768.0;
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => setAudioPlayingId(null);
            sourceNodeRef.current = source;
            source.start(0);
            
            setAudioPlayingId(stopId);
        } catch (e) { 
            console.error("Audio Playback Error:", e);
            alert("Error de audio. Reintenta.");
        } finally { 
            setAudioLoadingId(null); 
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-[6000] pt-safe-iphone">
                <button onClick={onBack} className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 flex items-center justify-center"><i className="fas fa-arrow-left text-xs"></i></button>
                <div className="flex-1 mx-4 text-center">
                    <p className="text-[7px] font-black text-purple-600 uppercase">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                    <h2 className="text-[10px] font-black text-slate-900 uppercase truncate">{currentStop.name}</h2>
                </div>
                <button onClick={() => handlePlayAudio(currentStop.id, currentStop.description)} className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${audioPlayingId === currentStop.id ? 'bg-red-500 text-white' : 'bg-purple-600 text-white'}`}>
                    {audioLoadingId === currentStop.id ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${audioPlayingId === currentStop.id ? 'fa-stop' : 'fa-play'} text-xs`}></i>}
                </button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col">
                <div className="h-[40vh] w-full relative shrink-0">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={language} onStopSelect={(i: number) => onJumpTo(i)} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} userLocation={userLocation} />
                </div>
                <div className="px-8 pt-10 pb-44 space-y-10 bg-white rounded-t-[3.5rem] -mt-12 shadow-2xl z-[200]">
                    <div className="space-y-6 text-slate-800 text-lg leading-relaxed font-medium">
                        {currentStop.description.split('\n\n').map((p, i) => <p key={i} className="animate-fade-in first-letter:text-4xl first-letter:font-black">{p}</p>)}
                    </div>
                </div>
             </div>

             <div className="bg-white/90 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] pb-safe-iphone">
                <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] disabled:opacity-0">{tl.prev}</button>
                <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] shadow-2xl">{tl.next}</button>
             </div>
        </div>
    );
};
