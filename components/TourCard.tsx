
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText, generateAudio } from '../services/geminiService';

const TEXTS: any = {
    en: { start: "Launch", stop: "Hub", of: "of", photoSpot: "Technical Angle", capture: "Log Data", rewardReceived: "Sync Successful", prev: "Back", next: "Advance", meters: "m", itinerary: "Sequence", syncing: "Syncing voice...", tooFar: "Too far! Move closer to the spot." },
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Ángulo Técnico", capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Avanzar", meters: "m", itinerary: "Secuencia", syncing: "Sincronizando voz...", tooFar: "¡Demasiado lejos! Acércate al punto real." },
    pt: { start: "Iniciar", stop: "Parada", of: "de", photoSpot: "Ângulo Técnico", capture: "Registrar", rewardReceived: "Sincronizado", prev: "Voltar", next: "Avançar", meters: "m", itinerary: "Sequência", syncing: "Sincronizando voz...", tooFar: "Muito longe! Aproxime-se do local." },
    it: { start: "Avvia", stop: "Tappa", of: "di", photoSpot: "Angolo Tecnico", capture: "Registra", rewardReceived: "Sincronizzato", prev: "Indietro", next: "Avanti", meters: "m", itinerary: "Sequenza", syncing: "Sincronizzazione...", tooFar: "Troppo lontano! Avvicinati al punto." },
    ru: { start: "Начать", stop: "Остановка", of: "из", photoSpot: "Угол съемки", capture: "Лог", rewardReceived: "Успешно", prev: "Назад", next: "Далее", meters: "м", itinerary: "Маршрут", syncing: "Синхронизация...", tooFar: "Слишком далеко!" },
    hi: { start: "लॉन्च", stop: "स्टॉप", of: "का", photoSpot: "तकनीकी कोण", capture: "डेटा लॉग करें", rewardReceived: "सफल", prev: "पीछे", next: "आगे", meters: "मीटर", itinerary: "अनुक्रम", syncing: "आवाज़ सिंक हो रही है...", tooFar: "बहुत दूर! पास आएँ।" },
    fr: { start: "Lancer", stop: "Arrêt", of: "de", photoSpot: "Angle Technique", capture: "Enregistrer", rewardReceived: "Synchronisé", prev: "Retour", next: "Avancer", meters: "m", itinerary: "Séquence", syncing: "Synchronisation...", tooFar: "Trop loin !" },
    de: { start: "Start", stop: "Stopp", of: "von", photoSpot: "Winkel", capture: "Log", rewardReceived: "Erfolgreich", prev: "Zurück", next: "Weiter", meters: "m", itinerary: "Route", syncing: "Stimme wird synchronisiert...", tooFar: "Zu weit weg !" },
    ja: { start: "開始", stop: "目的地", of: "/", photoSpot: "撮影角度", capture: "ログ", rewardReceived: "同期完了", prev: "戻る", next: "進む", meters: "m", itinerary: "シーケンス", syncing: "音声同期中...", tooFar: "遠すぎます！もっと近づいてください。" },
    zh: { start: "启动", stop: "站点", of: "/", photoSpot: "技术角度", capture: "记录", rewardReceived: "同步成功", prev: "返回", next: "前进", meters: "米", itinerary: "顺序", syncing: "语音同步中...", tooFar: "太远了！请靠近一点。" },
    ca: { start: "Llançar", stop: "Parada", of: "de", photoSpot: "Angle Tècnic", capture: "Registrar", rewardReceived: "Sincronitzat", prev: "Enrere", next: "Avançar", meters: "m", itinerary: "Seqüència", syncing: "Sincronitzant veu...", tooFar: "Massa lluny !" },
    eu: { start: "Abiarazi", stop: "Geldialdia", of: "/", photoSpot: "Angelu Teknikoa", capture: "Erregistratu", rewardReceived: "Sinkronizatuta", prev: "Atzera", next: "Aurrera", meters: "m", itinerary: "Sekuentzia", syncing: "Ahotsa sinkronizatzen...", tooFar: "Urrunegi !" }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
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

export const ActiveTourCard: React.FC<any> = ({ tour, user, currentStopIndex, onNext, onPrev, onJumpTo, onUpdateUser, onBack, language = 'es', userLocation }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [photoClaimed, setPhotoClaimed] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const phrases = useMemo(() => {
        return currentStop.description.split(/[.!?]+\s/).filter(p => p.trim().length > 3);
    }, [currentStop.id]);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const preloadedBuffers = useRef<Map<number, AudioBuffer>>(new Map());
    const isPreloading = useRef(false);

    useEffect(() => {
        stopAudio();
        setIsPlaying(false);
        setIsLoading(false);
        setCurrentPhraseIndex(0);
        preloadedBuffers.current.clear();
        setRewardClaimed(false);
        setPhotoClaimed(false);
        preloadSpecificPhrase(0);
    }, [currentStop.id]);

    const preloadSpecificPhrase = async (idx: number) => {
        if (preloadedBuffers.current.has(idx)) return;
        try {
            // Fix: generateAudio takes max 2 arguments
            const base64 = await generateAudio(phrases[idx], language);
            if (base64) {
                const buffer = await decodeBase64ToBuffer(base64);
                if (buffer) preloadedBuffers.current.set(idx, buffer);
            }
        } catch (e) { console.error(e); }
    };

    const preloadNextPhrases = async (startIndex: number) => {
        if (isPreloading.current) return;
        isPreloading.current = true;
        for (let i = startIndex; i < Math.min(startIndex + 2, phrases.length); i++) {
            await preloadSpecificPhrase(i);
        }
        isPreloading.current = false;
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
            handleVisitReward();
            return;
        }
        setCurrentPhraseIndex(index);
        let buffer = preloadedBuffers.current.get(index);
        
        if (!buffer) {
            setIsLoading(true);
            // Fix: generateAudio takes max 2 arguments
            const base64 = await generateAudio(phrases[index], language);
            if (base64) buffer = await decodeBase64ToBuffer(base64);
            setIsLoading(false);
        }

        if (buffer) {
            const ctx = audioContextRef.current!;
            if (ctx.state === 'suspended') await ctx.resume();
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => {
                const nextIdx = index + 1;
                playPhrase(nextIdx);
                preloadNextPhrases(nextIdx + 1);
            };
            source.start(0);
            audioSourceRef.current = source;
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    };

    const handleVisitReward = () => {
        if (rewardClaimed || !userLocation) return;
        const dist = calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude);
        if (dist > 50) return;
        const updatedUser = { ...user, miles: user.miles + 25 };
        onUpdateUser(updatedUser);
        setRewardClaimed(true);
    };

    const handlePhotoReward = () => {
        if (photoClaimed) return;
        if (!userLocation) { alert(tl.tooFar); return; }
        const dist = calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude);
        if (dist > 50) { alert(`${tl.tooFar} (${Math.round(dist)}m)`); return; }
        const updatedUser = { 
            ...user, 
            photoPoints: (user.photoPoints || 0) + 1,
            miles: user.miles + 50,
            stats: { ...user.stats, photosTaken: user.stats.photosTaken + 1 }
        };
        onUpdateUser(updatedUser);
        setPhotoClaimed(true);
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             <div className="bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between z-[6000] shrink-0 pt-safe-iphone shadow-sm">
                <button onClick={() => { stopAudio(); onBack(); }} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950"><i className="fas fa-arrow-left"></i></button>
                <div className="text-center">
                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                    <h2 className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{currentStop.name}</h2>
                </div>
                <div className="w-12 h-12"></div>
             </div>
             
             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col relative">
                <div className="h-[35vh] w-full relative z-[100] shrink-0 border-b border-slate-100 bg-slate-200">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={language} onStopSelect={onJumpTo} onPlayAudio={() => { if (isPlaying) { stopAudio(); setIsPlaying(false); } else { playPhrase(currentPhraseIndex); } }} audioPlayingId={isPlaying ? currentStop.id : null} audioLoadingId={isLoading ? currentStop.id : null} userLocation={userLocation} />
                </div>
                <div className="px-8 pt-10 pb-40 space-y-10 bg-white rounded-t-[3rem] -mt-10 shadow-[0_-30px_60px_rgba(0,0,0,0.05)] z-[200]">
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                             {isLoading && <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest animate-pulse">{tl.syncing}</p>}
                        </div>
                        <button onClick={() => { if (isPlaying) { stopAudio(); setIsPlaying(false); } else { playPhrase(currentPhraseIndex); } }} disabled={isLoading} className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all active:scale-95 shrink-0 ${isPlaying ? 'bg-red-600' : 'bg-slate-950'} text-white`}>
                            {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-play ml-1"></i>}
                        </button>
                    </div>

                    <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-sm shadow-lg"><i className="fas fa-camera"></i></div>
                                <div>
                                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{tl.photoSpot}</p>
                                    <h4 className="text-[10px] font-black uppercase text-slate-900">{currentStop.photoSpot?.angle || tl.capture}</h4>
                                </div>
                            </div>
                            <span className="text-sm font-black text-slate-900">+{currentStop.photoSpot?.milesReward || 50}m</span>
                        </div>
                        <button onClick={handlePhotoReward} disabled={photoClaimed} className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${photoClaimed ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-slate-900 text-white shadow-xl'}`}>
                            {photoClaimed ? <><i className="fas fa-check-circle mr-2"></i> {tl.rewardReceived}</> : tl.capture}
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
