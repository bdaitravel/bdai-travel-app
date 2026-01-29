
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile } from '../types';
import { SchematicMap } from './SchematicMap';
import { generateAudio } from '../services/geminiService';

const TEXTS: any = {
    en: { start: "Launch", stop: "Hub", of: "of", photoSpot: "Technical Angle", capture: "Log Data", rewardReceived: "Sync Successful", prev: "Back", next: "Advance", meters: "m", itinerary: "Sequence", syncing: "Syncing voice..." },
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Ángulo Técnico", capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Avanzar", meters: "m", itinerary: "Secuencia", syncing: "Sincronizando voz..." },
    de: { start: "Starten", stop: "Stopp", of: "von", photoSpot: "Technisch", capture: "Daten Loggen", rewardReceived: "Synchronisiert", prev: "Zurück", next: "Weiter", meters: "m", itinerary: "Sequenz", syncing: "Synchronisiere Stimme..." },
    ca: { start: "Llançar", stop: "Parada", of: "de", photoSpot: "Angle Tècnic", capture: "Registrar", rewardReceived: "Sincronitzat", prev: "Enrere", next: "Avançar", meters: "m", itinerary: "Seqüència", syncing: "Sincronitzant veu..." },
    eu: { start: "Abiarazi", stop: "Geldialdia", of: "/", photoSpot: "Angelu Teknikoa", capture: "Erregistratu", rewardReceived: "Sinkronizatuta", prev: "Atzera", next: "Aurrera", meters: "m", itinerary: "Sekuentzia", syncing: "Ahotsa sinkronizatzen..." },
    ru: { start: "Запуск", stop: "Остановка", of: "из", photoSpot: "Тех угол", capture: "Записать", rewardReceived: "Синхронизировано", prev: "Назад", next: "Далее", meters: "м", itinerary: "Маршрут", syncing: "Синхронизация..." },
    hi: { start: "प्रारंभ", stop: "पड़ाव", of: "का", photoSpot: "तकनीकी", capture: "डेटा रिकॉर्ड करें", rewardReceived: "सफल", prev: "पीछे", next: "आगे", meters: "मी", itinerary: "अनुक्रम", syncing: "आवाज़ सिंक..." },
    fr: { start: "Lancer", stop: "Arrêt", of: "de", photoSpot: "Angle Technique", capture: "Enregistrer", rewardReceived: "Synchronisé", prev: "Retour", next: "Suivant", meters: "m", itinerary: "Séquence", syncing: "Sync de la voix..." },
    ja: { start: "開始", stop: "停留所", of: "/", photoSpot: "角度", capture: "記録", rewardReceived: "完了", prev: "戻る", next: "進む", meters: "m", itinerary: "順序", syncing: "音声同期中..." },
    zh: { start: "启动", stop: "站点", of: "/", photoSpot: "角度", capture: "记录", rewardReceived: "已同步", prev: "返回", next: "下一步", meters: "米", itinerary: "顺序", syncing: "语音同步中..." }
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  const tl = TEXTS[language] || TEXTS.es;
  const duration = (tour.stops?.length || 0) * 20 + "m";

  return (
    <div onClick={() => onSelect(tour)} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-md p-7 mb-4 cursor-pointer active:scale-[0.98] transition-all">
      <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white inline-block mb-4">{tour.theme}</span>
      <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter leading-tight">{tour.title}</h3>
      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-6">{tour.description}</p>
      <div className="flex items-center justify-between pt-5 border-t border-slate-50">
           <span className="text-slate-900 font-black text-[10px] uppercase tracking-widest"><i className="fas fa-clock mr-2"></i> {duration}</span>
           <span className="text-purple-600 font-black text-[10px] uppercase tracking-widest">{tl.start} <i className="fas fa-chevron-right ml-1"></i></span>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, user, currentStopIndex, onNext, onPrev, onBack, language = 'es' }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const handlePlayVocal = async () => {
        if (isPlaying) { audioSourceRef.current?.stop(); setIsPlaying(false); return; }
        setIsLoading(true);
        try {
            const base64 = await generateAudio(currentStop.description, language);
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            const ctx = audioContextRef.current;
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => setIsPlaying(false);
            source.start(0);
            audioSourceRef.current = source;
            setIsPlaying(true);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => { audioSourceRef.current?.stop(); setIsPlaying(false); }, [currentStopIndex]);

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             <div className="bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between pt-safe-iphone shadow-sm">
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950"><i className="fas fa-arrow-left"></i></button>
                <div className="text-center">
                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                    <h2 className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{currentStop.name}</h2>
                </div>
                <div className="w-12 h-12"></div>
             </div>
             <div className="flex-1 overflow-y-auto no-scrollbar bg-white p-8 space-y-10 pb-40">
                <div className="flex justify-end">
                    <button onClick={handlePlayVocal} disabled={isLoading} className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl ${isPlaying ? 'bg-red-600' : 'bg-slate-950'} text-white`}>
                        {isLoading ? <i className="fas fa-spinner fa-spin"></i> : isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-play ml-1"></i>}
                    </button>
                </div>
                <div className="space-y-10 text-slate-800 text-lg leading-relaxed font-medium">
                    {currentStop.description.split('\n\n').map((p, i) => <p key={i} className="first-letter:text-5xl first-letter:font-black first-letter:mr-2 first-letter:float-left">{p}</p>)}
                </div>
             </div>
             <div className="bg-white/80 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] pb-safe-iphone">
                <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[9px] disabled:opacity-0">{tl.prev}</button>
                <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[9px] shadow-2xl">{tl.next}</button>
             </div>
        </div>
    );
};
