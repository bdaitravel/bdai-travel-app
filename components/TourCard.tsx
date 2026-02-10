
import React, { useState } from 'react';
import { Tour, Stop, UserProfile } from '../types';
import { generateAudio } from '../services/geminiService';
import { SchematicMap } from './SchematicMap';

export const TourCard = ({ tour, onSelect, language }: any) => (
  <div onClick={onSelect} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4 active:scale-[0.98] transition-all cursor-pointer group hover:border-purple-500/50">
    <div className="flex justify-between items-start">
      <h3 className="text-xl font-black uppercase leading-tight flex-1">{tour.title}</h3>
      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shrink-0 ml-4"><i className="fas fa-play text-[10px] ml-0.5" /></div>
    </div>
    <p className="text-xs text-slate-400 line-clamp-3 font-medium">{tour.description}</p>
    <div className="flex gap-4 border-t border-white/5 pt-4">
      <div className="flex flex-col"><span className="text-[7px] font-black text-slate-500 uppercase">{language === 'es' ? 'TIEMPO' : 'TIME'}</span><span className="text-[10px] font-black">{tour.duration}</span></div>
      <div className="flex flex-col"><span className="text-[7px] font-black text-slate-500 uppercase">{language === 'es' ? 'DISTANCIA' : 'DIST'}</span><span className="text-[10px] font-black">{tour.distance}</span></div>
    </div>
  </div>
);

export const ActiveTourCard = ({ tour, user, onBack, onUpdateUser, language }: any) => {
  const [idx, setIdx] = useState(0);
  const [audioId, setAudioId] = useState<string | null>(null);
  const stop = tour.stops[idx];

  const playAudio = async () => {
    if (audioId) { setAudioId(null); return; }
    setAudioId(stop.id);
    const base64 = await generateAudio(stop.description, language, tour.city);
    if (!base64) return setAudioId(null);
    const audio = new Audio(`data:audio/pcm;base64,${base64}`); // Nota: El SDK devuelve PCM raw en el ejemplo, aquí asumimos compatibilidad o uso de decodeAudioData si fuera necesario
    // Para simplificar esta versión usamos el flow del audio context en el ejemplo SDK real
    const ctx = new AudioContext();
    const buffer = await ctx.decodeAudioData(Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer);
    const source = ctx.createBufferSource();
    source.buffer = buffer; source.connect(ctx.destination);
    source.onended = () => setAudioId(null);
    source.start(0);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[1000] flex flex-col">
      <header className="p-6 pt-safe-iphone flex items-center justify-between border-b border-white/5 bg-slate-950/80 backdrop-blur-xl z-10">
        <button onClick={onBack} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><i className="fas fa-times"/></button>
        <div className="text-center flex-1 mx-4">
          <p className="text-[7px] font-black text-purple-500 uppercase tracking-widest leading-none mb-1">PARADA {idx + 1} DE {tour.stops.length}</p>
          <h2 className="text-[10px] font-black uppercase truncate">{stop.name}</h2>
        </div>
        <button onClick={playAudio} className={`w-10 h-10 rounded-xl flex items-center justify-center ${audioId ? 'bg-red-500' : 'bg-purple-600'}`}>
          <i className={`fas ${audioId ? 'fa-stop' : 'fa-play'}`} />
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="h-[40vh] w-full bg-slate-900">
          <SchematicMap stops={tour.stops} currentStopIndex={idx} language={language} onStopSelect={setIdx} />
        </div>
        <div className="p-8 pb-32 space-y-6">
          <div className="space-y-4 text-slate-300 text-sm leading-relaxed font-medium">
            {stop.description.split('\n\n').map((p: string, i: number) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent flex gap-3">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] disabled:opacity-20">{language === 'es' ? 'ANTERIOR' : 'PREV'}</button>
        {idx === tour.stops.length - 1 ? (
          <button onClick={onBack} className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px]">{language === 'es' ? 'FINALIZAR' : 'FINISH'}</button>
        ) : (
          <button onClick={() => setIdx(idx + 1)} className="flex-[2] py-4 bg-white text-slate-950 rounded-2xl font-black uppercase text-[10px]">{language === 'es' ? 'SIGUIENTE' : 'NEXT'}</button>
        )}
      </footer>
    </div>
  );
};
