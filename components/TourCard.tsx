
import React, { useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile } from '../types';
import { SchematicMap } from './SchematicMap';
import { generateAudio } from '../services/geminiService';

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const playRawPcm = async (base64: string, ctx: AudioContext) => {
  const bytes = decodeBase64(base64);
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
  return source;
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  if (!tour) return null;
  return (
    <div onClick={() => onSelect(tour)} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-md p-6 mb-4 cursor-pointer active:scale-[0.98] transition-all">
      <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-slate-900 text-white mb-3 inline-block">{tour.theme}</span>
      <h3 className="text-xl font-black text-slate-900 mb-2 uppercase leading-tight">{tour.title}</h3>
      <p className="text-slate-500 text-[10px] leading-relaxed line-clamp-2">{tour.description}</p>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
           <span className="text-slate-900 font-black text-[9px] uppercase tracking-widest"><i className="fas fa-clock mr-1"></i> {tour.duration}</span>
           <span className="text-purple-600 font-black text-[9px] uppercase tracking-widest">Lanzar <i className="fas fa-chevron-right ml-1"></i></span>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, user, currentStopIndex, onNext, onPrev, onJumpTo, onUpdateUser, onBack, language = 'es', userLocation }) => {
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const [audioLoading, setAudioLoading] = useState(false);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        return () => { if (audioSourceRef.current) audioSourceRef.current.stop(); };
    }, [currentStop.id]);

    const handlePlayAudio = async () => {
        if (audioPlaying) {
            audioSourceRef.current?.stop();
            setAudioPlaying(false);
            return;
        }
        setAudioLoading(true);
        try {
            const base64 = await generateAudio(currentStop.description, language);
            if (base64) {
                if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
                const source = await playRawPcm(base64, audioCtxRef.current);
                audioSourceRef.current = source;
                setAudioPlaying(true);
                source.onended = () => setAudioPlaying(false);
            }
        } catch (e) { console.error(e); } finally { setAudioLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between z-[6000] pt-safe-iphone">
                <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950"><i className="fas fa-arrow-left text-sm"></i></button>
                <div className="text-center flex-1 mx-2">
                    <p className="text-[7px] font-black text-purple-600 uppercase tracking-widest">Stop {currentStopIndex + 1}/{tour.stops.length}</p>
                    <h2 className="text-[11px] font-black text-slate-900 uppercase truncate">{currentStop.name}</h2>
                </div>
                <button className="w-9 h-9 rounded-xl bg-slate-50 text-slate-950 flex items-center justify-center"><i className="fas fa-list-ul text-sm"></i></button>
             </div>
             
             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col relative">
                <div className="h-[35vh] w-full shrink-0 border-b border-slate-100 bg-slate-200">
                    <SchematicMap 
                        stops={tour.stops} 
                        currentStopIndex={currentStopIndex} 
                        userLocation={userLocation}
                        onPlayAudio={handlePlayAudio}
                        audioPlaying={audioPlaying}
                        audioLoading={audioLoading}
                    />
                </div>
                
                <div className="px-6 pt-8 pb-32 space-y-6 bg-white rounded-t-[2.5rem] -mt-8 shadow-2xl z-[200]">
                    <div className="flex gap-2">
                        <button className="flex-1 py-4 rounded-2xl bg-purple-600 text-white font-black uppercase text-[9px] tracking-widest shadow-lg">Confirmar Visita</button>
                        <button className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><i className="fas fa-camera text-xl"></i></button>
                    </div>
                    <div className="space-y-6 text-slate-800 text-base leading-relaxed font-medium">
                        {currentStop.description.split('\n\n').map((p, i) => <p key={i} className="animate-fade-in">{p}</p>)}
                    </div>
                </div>
             </div>
             <div className="bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 flex gap-3 z-[6000] pb-safe-iphone">
                <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex-1 py-4 rounded-xl border border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest disabled:opacity-0">Atrás</button>
                <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-4 bg-slate-950 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl">Siguiente Parada</button>
             </div>
        </div>
    );
};
