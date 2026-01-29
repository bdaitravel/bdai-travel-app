
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText, generateAudio } from '../services/geminiService';

const TEXTS: any = {
    en: { start: "Launch", stop: "Hub", of: "of", photoSpot: "Technical Angle", capture: "Log Data", rewardReceived: "Sync Successful", prev: "Back", next: "Advance", meters: "m", itinerary: "Sequence", syncing: "Syncing voice..." },
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Ángulo Técnico", capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Avanzar", meters: "m", itinerary: "Secuencia", syncing: "Sincronizando voz..." },
    de: { start: "Start", stop: "Stop", of: "von", photoSpot: "Technischer Winkel", capture: "Daten protokollieren", rewardReceived: "Synchronisiert", prev: "Zurück", next: "Weiter", meters: "m", itinerary: "Reihenfolge", syncing: "Stimme wird synchronisiert..." },
    ca: { start: "Llançar", stop: "Parada", of: "de", photoSpot: "Angle Tècnic", capture: "Registrar", rewardReceived: "Sincronitzat", prev: "Enrere", next: "Avançar", meters: "m", itinerary: "Seqüència", syncing: "Sincronitzant veu..." },
    eu: { start: "Abiarazi", stop: "Geldialdia", of: "/", photoSpot: "Angelu Teknikoa", capture: "Erregistratu", rewardReceived: "Sinkronizatuta", prev: "Atzera", next: "Aurrera", meters: "m", itinerary: "Sekuentzia", syncing: "Ahotsa sinkronizatzen..." }
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  const tl = TEXTS[language] || TEXTS.es;
  if (!tour) return null;
  const title = tour.title || tour.name || "Tour";
  const desc = tour.description || "";
  const theme = tour.theme || "Exploración";
  const duration = (tour.stops?.length || 0) * 20 + "m";

  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-md p-7 mb-4 cursor-pointer relative active:scale-[0.98] transition-all">
      <div className="flex flex-col">
          <div className="mb-4 flex justify-between items-center">
             <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white">{theme}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter leading-tight">{title}</h3>
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{desc}</p>
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-50">
               <span className="text-slate-900 font-black text-[10px] uppercase tracking-widest"><i className="fas fa-clock mr-2"></i> {duration} • {tour.distance || '---'}</span>
               <span className="text-purple-600 font-black text-[10px] uppercase tracking-widest">{tl.start} <i className="fas fa-chevron-right ml-1"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, user, currentStopIndex, onNext, onPrev, onJumpTo, onUpdateUser, onBack, language = 'es' }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [photoClaimed, setPhotoClaimed] = useState(false);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const decodeBase64ToBuffer = async (base64: string): Promise<AudioBuffer | null> => {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        
        try {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            
            // Raw PCM 16-bit Mono 24kHz as specified in guidelines
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) {
                channelData[i] = dataInt16[i] / 32768.0;
            }
            return buffer;
        } catch (e) {
            console.error("Audio Decode Error:", e);
            return null;
        }
    };

    const handlePlayVocal = async () => {
        if (isPlaying) {
            if (audioSourceRef.current) audioSourceRef.current.stop();
            setIsPlaying(false);
            return;
        }

        setIsLoading(true);
        try {
            const base64 = await generateAudio(currentStop.description, language);
            const buffer = await decodeBase64ToBuffer(base64);
            
            if (buffer && audioContextRef.current) {
                const ctx = audioContextRef.current;
                if (ctx.state === 'suspended') await ctx.resume();
                
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.onended = () => setIsPlaying(false);
                source.start(0);
                audioSourceRef.current = source;
                setIsPlaying(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (audioSourceRef.current) audioSourceRef.current.stop();
        setIsPlaying(false);
        setPhotoClaimed(false);
    }, [currentStop.id]);

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden animate-fade-in">
             <div className="bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between z-[6000] pt-safe-iphone shadow-sm">
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950"><i className="fas fa-arrow-left"></i></button>
                <div className="text-center">
                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                    <h2 className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{currentStop.name}</h2>
                </div>
                <div className="w-12 h-12"></div>
             </div>
             
             <div className="flex-1 overflow-y-auto no-scrollbar bg-white p-8 space-y-10 pb-40">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                         {isLoading && <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest animate-pulse">{tl.syncing}</p>}
                    </div>
                    <button onClick={handlePlayVocal} disabled={isLoading} className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all active:scale-95 shrink-0 ${isPlaying ? 'bg-red-600' : 'bg-slate-950'} text-white`}>
                        {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-play ml-1"></i>}
                    </button>
                </div>

                <div className="space-y-10 text-slate-800 text-lg leading-relaxed font-medium">
                    {currentStop.description.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="animate-fade-in first-letter:text-6xl first-letter:font-black first-letter:text-slate-950 first-letter:mr-3 first-letter:float-left first-letter:mt-1">
                            {paragraph}
                        </p>
                    ))}
                </div>
             </div>

             <div className="bg-white/80 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] pb-safe-iphone">
                <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest disabled:opacity-0">{tl.prev}</button>
                <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-2xl">{tl.next}</button>
             </div>
        </div>
    );
};
