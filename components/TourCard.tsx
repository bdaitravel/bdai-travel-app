
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile, CapturedMoment } from '../types';
import { SchematicMap } from './SchematicMap';
import { generateAudio } from '../services/geminiService';

const TEXTS: any = {
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Dai Shot", capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Avanzar", meters: "m", itinerary: "Itinerario", syncing: "Sincronizando...", tooFar: "GPS Incierto", generateStory: "Dai Shot", checkIn: "Check-in GPS", checkedIn: "Verificada", shareInsta: "Copiar Caption", distance: "a", refreshGps: "Refrescar GPS", gpsOk: "GPS OK", gpsLow: "GPS Débil", photoHint: "Tip de foto", nearbyAlert: "Parada Cercana Detectada", jumpTo: "Saltar aquí" },
    en: { start: "Launch", stop: "Stop", of: "of", photoSpot: "Dai Shot", capture: "Log Data", rewardReceived: "Synced", prev: "Back", next: "Next", meters: "m", itinerary: "Itinerary", syncing: "Syncing...", tooFar: "GPS Uncertain", generateStory: "Dai Shot", checkIn: "GPS Check-in", checkedIn: "Verified", shareInsta: "Copy Caption", distance: "at", refreshGps: "Refresh GPS", gpsOk: "GPS OK", gpsLow: "Low GPS", photoHint: "Photo Tip", nearbyAlert: "Nearby Stop Detected", jumpTo: "Jump here" }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  const tl = TEXTS[language] || TEXTS.es;
  if (!tour) return null;
  return (
    <div onClick={() => onSelect(tour)} className="group bg-slate-900 border-2 border-white/5 rounded-[2.5rem] overflow-hidden p-8 mb-6 cursor-pointer relative active:scale-[0.98] transition-all hover:border-purple-500/40 shadow-2xl">
      <div className="flex flex-col">
          <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter leading-tight group-hover:text-purple-400 transition-colors">{tour.title}</h3>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-6 font-medium">{tour.description}</p>
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
               <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Duración</span>
                    <span className="text-white font-black text-xs uppercase tracking-tighter">{tour.duration}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Distancia</span>
                    <span className="text-white font-black text-xs uppercase tracking-tighter">{tour.distance}</span>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-purple-500 font-black text-[10px] uppercase tracking-widest">{tl.start}</span>
                 <div className="w-11 h-11 aspect-square bg-white text-slate-950 rounded-2xl flex items-center justify-center shadow-xl group-hover:bg-purple-500 group-hover:text-white transition-all shrink-0">
                   <i className="fas fa-play text-[10px] ml-0.5"></i>
                 </div>
               </div>
          </div>
      </div>
      <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/10 overflow-hidden">
          <div className="w-1/3 h-full bg-purple-500 animate-scan"></div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, user, currentStopIndex, onNext, onPrev, onJumpTo, onUpdateUser, onBack, language = 'es', userLocation }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [showPhotoTip, setShowPhotoTip] = useState(false);
    const [showItinerary, setShowItinerary] = useState(false);
    const [nearbyStopHint, setNearbyStopHint] = useState<number | null>(null);

    const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
    const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        if (!userLocation || !tour.stops) return;
        
        const NEARBY_THRESHOLD = 35; 
        let bestCandidate: number | null = null;
        let minDistance = Infinity;

        tour.stops.forEach((s: Stop, idx: number) => {
            if (idx === currentStopIndex) return;
            
            const dist = calculateDistance(userLocation.lat, userLocation.lng, s.latitude, s.longitude);
            if (dist < NEARBY_THRESHOLD && dist < minDistance) {
                minDistance = dist;
                bestCandidate = idx;
            }
        });

        if (bestCandidate !== nearbyStopHint) {
            setNearbyStopHint(bestCandidate);
            if (bestCandidate !== null && 'vibrate' in navigator) {
                navigator.vibrate(40);
            }
        }
    }, [userLocation, currentStopIndex, tour.stops, nearbyStopHint]);

    const distToTarget = useMemo(() => {
        if (!userLocation || !currentStop) return null;
        return Math.round(calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude));
    }, [userLocation, currentStop]);

    const IS_IN_RANGE = distToTarget !== null && distToTarget <= 100;

    useEffect(() => { 
        setRewardClaimed(false);
        setShowPhotoTip(false);
        stopAudio(); 
    }, [currentStopIndex]);

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
            const base64 = await generateAudio(text, user.language, tour.city);
            if (!base64) throw new Error("No audio data");
            
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => setAudioPlayingId(null);
            sourceNodeRef.current = source;
            source.start(0);
            
            setAudioPlayingId(stopId);
        } catch (e) { 
            console.error("Audio error:", e);
        } finally { 
            setAudioLoadingId(null); 
        }
    };

    const handleCheckIn = () => {
        if (!IS_IN_RANGE) { 
            alert(`GPS INEXACTO: Estás a ${distToTarget}m. Debes estar a menos de 100m para las millas.`); 
            return; 
        }
        setRewardClaimed(true);
        onUpdateUser({ ...user, miles: user.miles + 50 });
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             {showItinerary && (
                 <div className="fixed inset-0 z-[8000] flex flex-col">
                     <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowItinerary(false)}></div>
                     <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-10 max-h-[85vh] overflow-y-auto no-scrollbar animate-slide-up">
                         <h3 className="text-3xl font-black text-slate-950 uppercase mb-8">{tl.itinerary}</h3>
                         <div className="space-y-3">
                             {tour.stops.map((s: Stop, i: number) => (
                                 <button key={s.id} onClick={() => { onJumpTo(i); setShowItinerary(false); }} className={`w-full p-6 rounded-[2rem] flex items-center gap-5 ${currentStopIndex === i ? 'bg-purple-600 text-white shadow-xl' : 'bg-slate-50 text-slate-950 border border-slate-100'}`}>
                                     <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black ${currentStopIndex === i ? 'bg-white text-purple-600' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span>
                                     <div className="text-left flex-1 truncate">
                                         <p className="text-xs font-black uppercase truncate">{s.name}</p>
                                     </div>
                                 </button>
                             ))}
                         </div>
                         <button onClick={() => setShowItinerary(false)} className="w-full py-8 mt-6 text-slate-400 font-black uppercase text-[10px]">Cerrar</button>
                     </div>
                 </div>
             )}

             {nearbyStopHint !== null && (
                <div className="fixed top-24 left-4 right-4 z-[7000] animate-bounce">
                    <button 
                        onClick={() => { onJumpTo(nearbyStopHint); setNearbyStopHint(null); }}
                        className="w-full bg-purple-600 text-white p-5 rounded-[2.5rem] shadow-2xl border-2 border-white/20 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                                <i className="fas fa-location-crosshairs"></i>
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">{tl.nearbyAlert}</p>
                                <p className="text-[11px] font-black uppercase truncate max-w-[150px]">{tour.stops[nearbyStopHint].name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                            {tl.jumpTo}
                        </div>
                    </button>
                </div>
             )}

             <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-[6000] pt-safe-iphone shrink-0 shadow-sm">
                <button onClick={onBack} className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 flex items-center justify-center shrink-0"><i className="fas fa-arrow-left text-xs"></i></button>
                <button onClick={() => setShowItinerary(true)} className="flex-1 mx-4 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-2xl flex items-center justify-between group overflow-hidden">
                    <div className="flex flex-col text-left truncate">
                        <p className="text-[7px] font-black text-purple-600 uppercase leading-none mb-1">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                        <h2 className="text-[10px] font-black text-slate-900 uppercase truncate leading-tight">{currentStop.name}</h2>
                    </div>
                    <i className="fas fa-list-ul text-[10px] text-slate-400 group-hover:text-purple-600 shrink-0 ml-2"></i>
                </button>
                <button onClick={() => handlePlayAudio(currentStop.id, currentStop.description)} className={`w-11 h-11 aspect-square rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90 shrink-0 ${audioPlayingId === currentStop.id ? 'bg-red-500 text-white' : 'bg-purple-600 text-white'}`}>
                    {audioLoadingId === currentStop.id ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${audioPlayingId === currentStop.id ? 'fa-stop' : 'fa-play'} text-xs ml-0.5`}></i>}
                </button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col">
                <div className="h-[45vh] w-full relative shrink-0">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={language} onStopSelect={(i: number) => onJumpTo(i)} userLocation={userLocation} />
                </div>
                <div className="px-8 pt-10 pb-44 space-y-8 bg-white rounded-t-[3.5rem] -mt-12 shadow-[0_-30px_60px_rgba(0,0,0,0.08)] z-[200] relative">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleCheckIn} disabled={rewardClaimed} className={`flex flex-col items-center justify-center gap-1 p-5 rounded-[2.5rem] font-black uppercase shadow-lg border transition-all ${rewardClaimed ? 'bg-green-100 text-green-600 border-green-200' : (IS_IN_RANGE ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20' : 'bg-slate-50 text-slate-400 border-slate-200')}`}>
                            <i className={`fas ${rewardClaimed ? 'fa-check-circle' : 'fa-location-dot'} text-lg mb-1`}></i>
                            <span className="text-[9px]">{rewardClaimed ? tl.checkedIn : tl.checkIn}</span>
                            {!rewardClaimed && <span className="text-[7px] text-purple-300 font-bold tracking-widest">+50 MILLAS</span>}
                        </button>
                        <button onClick={() => setShowPhotoTip(!showPhotoTip)} className={`flex flex-col items-center justify-center gap-1 p-5 rounded-[2.5rem] font-black uppercase border transition-all ${showPhotoTip ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-900 text-white border-slate-800 shadow-xl shadow-slate-950/20'}`}>
                            <i className="fas fa-camera text-lg mb-1"></i>
                            <span className="text-[9px]">DAI SHOT</span>
                            <span className="text-[7px] text-slate-500/60 font-black tracking-[0.2em]">TIP</span>
                        </button>
                    </div>

                    {showPhotoTip && (
                        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><i className="fas fa-hashtag text-4xl text-amber-600"></i></div>
                            <p className="text-[7px] font-black text-amber-600 uppercase tracking-widest mb-2">Ángulo Recomendado por Dai:</p>
                            <p className="text-xs font-bold text-amber-900 italic leading-relaxed">"{currentStop.photoSpot?.angle || 'Busca una perspectiva lateral para captar la profundidad de la estructura.'}"</p>
                            <p className="text-[8px] font-black text-amber-400 mt-3 uppercase tracking-widest">#DaiShot #BetterDestinations</p>
                        </div>
                    )}

                    <div className="space-y-6 text-slate-800 text-lg leading-relaxed font-medium">
                        {currentStop.description.split('\n\n').map((p, i) => (
                            <p key={i} className="animate-fade-in first-letter:text-5xl first-letter:font-black first-letter:text-slate-950 first-letter:mr-3 first-letter:float-left">{p}</p>
                        ))}
                    </div>
                </div>
             </div>

             <div className="bg-white/90 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] pb-safe-iphone shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <button onClick={() => { onPrev(); stopAudio(); }} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest disabled:opacity-0 transition-opacity">Atrás</button>
                <button onClick={() => { onNext(); stopAudio(); }} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-[0.98] transition-all">Siguiente</button>
             </div>
        </div>
    );
};
