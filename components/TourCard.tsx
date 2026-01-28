
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText, generateAudio } from '../services/geminiService';

const TEXTS: any = {
    en: { start: "Launch", stop: "Hub", of: "of", photoSpot: "Technical Angle", capture: "Log Data", approach: "Verify proximity", rewardReceived: "Data Synced", prev: "Back", next: "Advance", meters: "m", share: "Transmit", itinerary: "Sequence", intro: "Bidaer Manifesto", syncing: "Dai is syncing voice..." },
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Ángulo Técnico", capture: "Logear Datos", approach: "Verifica proximidad", rewardReceived: "Datos Sincronizados", prev: "Atrás", next: "Avanzar", meters: "m", share: "Transmitir", itinerary: "Secuencia", intro: "Manifiesto Bidaer", syncing: "Dai sincronizando voz..." },
    ca: { start: "Llançar", stop: "Parada", of: "de", photoSpot: "Angle Tècnic", capture: "Loguejar Dades", approach: "Verifica proximitat", rewardReceived: "Dades Sincronitzades", prev: "Enrere", next: "Avançar", meters: "m", share: "Transmetre", itinerary: "Seqüència", intro: "Manifest Bidaer", syncing: "La Dai sincronitza veu..." },
    eu: { start: "Abiarazi", stop: "Geldialdia", of: "-(e)tik", photoSpot: "Angulu Teknikoa", capture: "Datuak Gorde", approach: "Hurbiltasuna egiaztatu", rewardReceived: "Datuak Sinkronizatuta", prev: "Atzera", next: "Aurrera", meters: "m", share: "Partekatu", itinerary: "Sekuentzia", intro: "Bidaer Manifestua", syncing: "Dai ahotsa sinkronizatzen..." },
    fr: { start: "Lancer", stop: "Arrêt", of: "sur", photoSpot: "Angle Technique", capture: "Loguer Données", approach: "Vérifier proximité", rewardReceived: "Données Sync", prev: "Retour", next: "Avancer", meters: "m", share: "Transmettre", itinerary: "Séquence", intro: "Manifeste Bidaer", syncing: "Dai synchronise sa voix..." },
    de: { start: "Starten", stop: "Stopp", of: "von", photoSpot: "Winkel", capture: "Daten loggen", approach: "Nähe prüfen", rewardReceived: "Daten synchronisiert", prev: "Zurück", next: "Weiter", meters: "m", share: "Teilen", itinerary: "Route", intro: "Manifest", syncing: "Dai synchronisiert..." },
    ja: { start: "開始", stop: "スポット", of: "中の", photoSpot: "アングル", capture: "ログ保存", approach: "接近を確認", rewardReceived: "同期完了", prev: "戻る", next: "進む", meters: "m", share: "共有", itinerary: "旅程", intro: "マニフェスト", syncing: "Daiが同期中..." },
    zh: { start: "启动", stop: "站点", of: "的", photoSpot: "角度", capture: "记录数据", approach: "检查距离", rewardReceived: "数据同步", prev: "返回", next: "下一步", meters: "米", share: "分享", itinerary: "路线", intro: "宣言", syncing: "Dai正在同步语音..." },
    ar: { start: "إطلاق", stop: "محطة", of: "من", photoSpot: "زاوية", capture: "تسجيل", approach: "تحقق من القرب", rewardReceived: "تمت المزامنة", prev: "السابق", next: "التالي", meters: "م", share: "مشاركة", itinerary: "المسار", intro: "بيان", syncing: "داي تقوم بالمزامنة..." }
};

const getCalculatedDuration = (stopsCount: number) => {
    const mins = stopsCount * 20;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) return `${hours}h${remainingMins > 0 ? ' ' + remainingMins + 'm' : ''}`;
    return `${mins}m`;
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  const tl = TEXTS[language] || TEXTS.es;
  const duration = getCalculatedDuration(tour.stops.length);
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

export const ActiveTourCard: React.FC<any> = ({ tour, currentStopIndex, onNext, onPrev, onJumpTo, onPlayAudio, audioPlayingId, audioLoadingId, onBack, language = 'es' }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const [showItinerary, setShowItinerary] = useState(false);

    // Audio Chaining State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const phrases = useMemo(() => {
        return currentStop.description.split(/[.!?]+\s/).filter(p => p.trim().length > 3);
    }, [currentStop.id]);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const preloadedBuffers = useRef<Record<number, AudioBuffer>>({});

    // Pre-carga automática al cambiar de parada
    useEffect(() => {
        stopAudio();
        setIsPlaying(false);
        setIsLoading(false);
        setCurrentPhraseIndex(0);
        preloadedBuffers.current = {};
        preloadSentence(0);
    }, [currentStop.id]);

    const preloadSentence = async (index: number) => {
        if (index >= phrases.length || preloadedBuffers.current[index]) return;
        try {
            const base64 = await generateAudio(phrases[index], language, tour.city);
            if (base64) {
                const buffer = await decodeBase64ToBuffer(base64);
                if (buffer) preloadedBuffers.current[index] = buffer;
            }
        } catch (e) { console.warn("Preload failed", e); }
    };

    const decodeBase64ToBuffer = async (base64: string): Promise<AudioBuffer | null> => {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer, 0, Math.floor(bytes.byteLength / 2));
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        return buffer;
    };

    const stopAudio = () => {
        if (audioSourceRef.current) {
            audioSourceRef.current.onended = null;
            audioSourceRef.current.stop();
        }
    };

    const playPhrase = async (index: number) => {
        if (index >= phrases.length) {
            setIsPlaying(false);
            return;
        }

        setCurrentPhraseIndex(index);
        
        let buffer = preloadedBuffers.current[index];
        if (!buffer) {
            setIsLoading(true);
            const base64 = await generateAudio(phrases[index], language, tour.city);
            if (base64) {
                buffer = await decodeBase64ToBuffer(base64);
            }
        }

        if (buffer) {
            setIsLoading(false);
            const ctx = audioContextRef.current!;
            if (ctx.state === 'suspended') await ctx.resume();
            
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => playPhrase(index + 1);
            source.start(0);
            audioSourceRef.current = source;
            
            // Pre-cargar la siguiente mientras suena esta
            preloadSentence(index + 1);
        } else {
            // Fallback selectivo para no arruinar el Euskera
            const criticalLangs = ['eu', 'ca', 'ja', 'ar'];
            if (!criticalLangs.includes(language)) {
                const synth = window.speechSynthesis;
                const utterance = new SpeechSynthesisUtterance(phrases[index]);
                utterance.lang = language;
                utterance.onend = () => playPhrase(index + 1);
                synth.speak(utterance);
            } else {
                // Si es euskera y falla el buffer, esperamos un poco y reintentamos
                setTimeout(() => playPhrase(index), 2000);
            }
        }
    };

    const handleToggleAudio = () => {
        if (isPlaying) {
            stopAudio();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            playPhrase(currentPhraseIndex);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             <div className="bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between z-[6000] shrink-0 pt-safe-iphone shadow-sm">
                <button onClick={() => { stopAudio(); onBack(); }} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950"><i className="fas fa-arrow-left"></i></button>
                <div className="text-center">
                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                    <h2 className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{currentStop.name}</h2>
                </div>
                <button onClick={() => setShowItinerary(!showItinerary)} className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${showItinerary ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-950'}`}><i className="fas fa-layer-group"></i></button>
             </div>
             {showItinerary && (
                 <div className="absolute inset-0 z-[7000] flex flex-col animate-fade-in">
                     <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowItinerary(false)}></div>
                     <div className="mt-auto bg-white rounded-t-[3rem] p-8 max-h-[70vh] overflow-y-auto relative z-10 pb-safe-iphone">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black uppercase text-slate-900">{tl.itinerary}</h3>
                            <button onClick={() => setShowItinerary(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="space-y-3">
                            {tour.stops.map((stop: Stop, idx: number) => (
                                <div key={stop.id} onClick={() => { onJumpTo(idx); setShowItinerary(false); }} className={`flex items-center gap-4 p-4 rounded-2xl border ${idx === currentStopIndex ? 'bg-slate-900 text-white shadow-xl' : 'bg-white border-slate-100'}`}>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === currentStopIndex ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</div>
                                    <p className="text-[10px] font-black uppercase truncate flex-1">{stop.name}</p>
                                </div>
                            ))}
                        </div>
                     </div>
                 </div>
             )}
             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col relative">
                <div className="h-[35vh] w-full relative z-[100] shrink-0 border-b border-slate-100 bg-slate-200">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={language} onStopSelect={onJumpTo} onPlayAudio={handleToggleAudio} audioPlayingId={isPlaying ? currentStop.id : null} audioLoadingId={isLoading ? currentStop.id : null} />
                </div>
                <div className="px-8 pt-10 pb-40 space-y-10 bg-white rounded-t-[3rem] -mt-10 shadow-[0_-30px_60px_rgba(0,0,0,0.05)] z-[200]">
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                             {isLoading && <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest animate-pulse">{tl.syncing}</p>}
                        </div>
                        <button onClick={handleToggleAudio} disabled={isLoading} className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all active:scale-95 shrink-0 ${isPlaying ? 'bg-red-600' : 'bg-slate-950'} text-white`}>
                            {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-play ml-1"></i>}
                        </button>
                    </div>
                    <div className="space-y-10 text-slate-800 text-lg leading-relaxed font-medium pb-20">
                        {currentStop.description.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="animate-fade-in first-letter:text-6xl first-letter:font-black first-letter:text-slate-950 first-letter:mr-3 first-letter:float-left first-letter:mt-1 opacity-90">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>
             </div>
             <div className="bg-white/80 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] shrink-0 pb-safe-iphone">
                <button onClick={() => { stopAudio(); onPrev(); }} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest disabled:opacity-0">{tl.prev}</button>
                <button onClick={() => { stopAudio(); onNext(); }} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-2xl">{tl.next}</button>
             </div>
        </div>
    );
};
