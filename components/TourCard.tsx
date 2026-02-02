
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile, CapturedMoment } from '../types';
import { SchematicMap } from './SchematicMap';
import { generateAudio, generateSmartCaption } from '../services/geminiService';

const TEXTS: any = {
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Ángulo Técnico", capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Avanzar", meters: "m", itinerary: "Itinerario", syncing: "Sincronizando...", tooFar: "GPS Incierto", generateStory: "Verificar por Foto", checkIn: "Check-in GPS", checkedIn: "Verificada", shareInsta: "Copiar Caption", distance: "a", refreshGps: "Refrescar GPS", gpsOk: "GPS OK", gpsLow: "GPS Débil", photoHint: "Usa la cámara si el GPS falla" },
    en: { start: "Launch", stop: "Stop", of: "of", photoSpot: "Technical Angle", capture: "Log Data", rewardReceived: "Synced", prev: "Back", next: "Next", meters: "m", itinerary: "Itinerary", syncing: "Syncing...", tooFar: "GPS Uncertain", generateStory: "Verify by Photo", checkIn: "GPS Check-in", checkedIn: "Verified", shareInsta: "Copy Caption", distance: "at", refreshGps: "Refresh GPS", gpsOk: "GPS OK", gpsLow: "Low GPS", photoHint: "Use camera if GPS fails" },
    // Resto de traducciones simplificadas para brevedad...
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
    <div 
      onClick={() => onSelect(tour)} 
      className="group bg-slate-900 border-2 border-white/5 rounded-[2.5rem] overflow-hidden p-8 mb-6 cursor-pointer relative active:scale-[0.98] transition-all hover:border-purple-500/40 shadow-2xl"
    >
      <div className="flex flex-col">
          <div className="mb-4 flex justify-between items-center">
             <span className="px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest bg-purple-600 text-white shadow-lg">
               {tour.theme || "Tech Masterclass"}
             </span>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
               {tour.difficulty || "Moderate"}
             </span>
          </div>
          
          <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter leading-tight group-hover:text-purple-400 transition-colors">
            {tour.title}
          </h3>
          
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-6 font-medium">
            {tour.description}
          </p>
          
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
               <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Tiempo</span>
                    <span className="text-white font-black text-xs uppercase tracking-tighter">{tour.duration}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Distancia</span>
                    <span className="text-white font-black text-xs uppercase tracking-tighter">{tour.distance}</span>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                 <span className="text-purple-500 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                   {tl.start}
                 </span>
                 <div className="w-10 h-10 bg-white text-slate-950 rounded-2xl flex items-center justify-center shadow-xl group-hover:bg-purple-500 group-hover:text-white transition-all">
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
    
    if (!tour || !tour.stops || tour.stops.length === 0) {
        useEffect(() => { onBack(); }, []);
        return null;
    }

    const currentStop = tour.stops[currentStopIndex] as Stop;
    
    if (!currentStop) {
        useEffect(() => { onJumpTo(0); }, []);
        return null;
    }
    
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [photoClaimed, setPhotoClaimed] = useState(false);
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [storyMoment, setStoryMoment] = useState<CapturedMoment | null>(null);
    const [showItinerary, setShowItinerary] = useState(false);
    const [isRefreshingGps, setIsRefreshingGps] = useState(false);

    const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
    const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const distToTarget = useMemo(() => {
        if (!userLocation || !currentStop) return null;
        return Math.round(calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude));
    }, [userLocation, currentStop]);

    // RANGO 1: Check-in automático (100m)
    const IS_IN_RANGE = distToTarget !== null && distToTarget <= 100;
    
    // RANGO 2: Bypass por Foto habilitado (350m para compensar errores de GPS en ciudad)
    const CAN_PHOTO_BYPASS = distToTarget !== null && distToTarget <= 350;

    useEffect(() => {
        setRewardClaimed(false);
        setPhotoClaimed(false);
        setStoryMoment(null);
        stopAudio();
    }, [currentStop?.id]);

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch(e) {}
            sourceNodeRef.current = null;
        }
        setAudioPlayingId(null);
    };

    const handleRefreshGps = () => {
        setIsRefreshingGps(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(() => {
                setTimeout(() => setIsRefreshingGps(false), 1500);
            }, () => setIsRefreshingGps(false), { enableHighAccuracy: true });
        } else {
            setIsRefreshingGps(false);
        }
    };

    const handlePlayAudio = async (stopId: string, text: string) => {
        if (audioPlayingId === stopId) { stopAudio(); return; }
        stopAudio();
        setAudioLoadingId(stopId);
        try {
            const base64 = await generateAudio(text, user.language);
            if (!base64) throw new Error();
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
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
        } catch (e) { alert("Error audio"); } finally { setAudioLoadingId(null); }
    };

    const handleCheckIn = () => {
        if (!IS_IN_RANGE) { 
            alert(`GPS INEXACTO: Estás a ${distToTarget}m. El sistema requiere 100m para auto-verificación. Si realmente estás allí, usa el botón de FOTO para verificar visualmente.`); 
            return; 
        }
        setRewardClaimed(true);
        onUpdateUser({ ...user, miles: user.miles + 50 });
    };

    const handlePhotoReward = () => {
        if (!CAN_PHOTO_BYPASS && distToTarget !== null) {
            alert(`ESTÁS MUY LEJOS: El sistema detecta que estás a ${distToTarget}m. Acércate más a la entrada principal para poder usar la verificación por foto.`);
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsGeneratingStory(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            try {
                // La IA analiza la foto y las coordenadas para confirmar el "Bypass"
                const caption = await generateSmartCaption(base64, currentStop, language);
                const moment = { 
                    id: `m_${Date.now()}`, 
                    stopId: currentStop.id, 
                    stopName: currentStop.name, 
                    city: tour.city, 
                    imageUrl: base64, 
                    caption, 
                    timestamp: new Date().toISOString() 
                };
                setStoryMoment(moment);
                setShowStoryModal(true);
                setPhotoClaimed(true);
                setRewardClaimed(true);
                onUpdateUser({ 
                    ...user, 
                    miles: user.miles + 200, // Bono extra por verificar manualmente
                    capturedMoments: [...(user.capturedMoments || []), moment] 
                });
            } catch (err) { 
                alert("Verificación fallida. Asegúrate de capturar la entrada o el edificio claramente."); 
            } finally { 
                setIsGeneratingStory(false); 
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             {showStoryModal && storyMoment && (
                 <div className="fixed inset-0 z-[9000] bg-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in">
                     <div className="w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-slide-up">
                         <div className="aspect-[9/16] relative">
                            <img src={storyMoment.imageUrl} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 text-white">
                                <h4 className="text-xs font-black uppercase mb-2">{storyMoment.stopName}</h4>
                                <p className="text-xs italic opacity-90">"{storyMoment.caption}"</p>
                            </div>
                         </div>
                         <div className="p-8 space-y-3 bg-white">
                            <button onClick={() => { navigator.clipboard.writeText(storyMoment.caption); alert("Copiado!"); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">{tl.shareInsta}</button>
                            <button onClick={() => setShowStoryModal(false)} className="w-full py-3 text-slate-400 font-black uppercase text-[9px]">Cerrar</button>
                         </div>
                     </div>
                 </div>
             )}
             
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
             
             {showItinerary && (
                 <div className="fixed inset-0 z-[8000] flex flex-col">
                     <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowItinerary(false)}></div>
                     <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-10 max-h-[85vh] overflow-y-auto no-scrollbar animate-slide-up">
                         <h3 className="text-3xl font-black text-slate-950 uppercase mb-8">{tl.itinerary}</h3>
                         <div className="space-y-3">
                             {tour.stops.map((s: Stop, i: number) => (
                                 <button key={s.id} onClick={() => { onJumpTo(i); setShowItinerary(false); }} className={`w-full p-6 rounded-[2rem] flex items-center gap-5 ${currentStopIndex === i ? 'bg-purple-600 text-white shadow-xl' : 'bg-slate-50 text-slate-950 border border-slate-100'}`}>
                                     <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black ${currentStopIndex === i ? 'bg-white text-purple-600' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span>
                                     <div className="text-left flex-1 min-w-0">
                                         <p className="text-xs font-black uppercase truncate">{s.name}</p>
                                         <p className="text-[9px] font-bold uppercase opacity-60">{s.type}</p>
                                     </div>
                                 </button>
                             ))}
                         </div>
                         <button onClick={() => setShowItinerary(false)} className="w-full py-8 mt-10 text-slate-400 font-black uppercase text-[10px]">Cerrar</button>
                     </div>
                 </div>
             )}

             <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-[6000] shrink-0 pt-safe-iphone shadow-sm">
                <button onClick={onBack} className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950"><i className="fas fa-arrow-left text-xs"></i></button>
                
                <button onClick={() => setShowItinerary(true)} className="flex-1 mx-4 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-2xl flex items-center justify-between group active:bg-slate-100 transition-all overflow-hidden">
                    <div className={`flex flex-col text-left truncate ${language === 'ar' ? 'order-2 text-right' : ''}`}>
                        <p className="text-[7px] font-black text-purple-600 uppercase mb-0.5">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                        <h2 className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[140px] leading-tight">{currentStop.name}</h2>
                    </div>
                    <i className={`fas fa-list-ul text-[10px] text-slate-400 group-hover:text-purple-600 ${language === 'ar' ? 'order-1' : ''}`}></i>
                </button>

                <button onClick={() => handlePlayAudio(currentStop.id, currentStop.description)} className={`w-11 h-11 rounded-xl flex items-center justify-center ${audioPlayingId === currentStop.id ? 'bg-red-500 text-white' : 'bg-purple-600 text-white shadow-lg'}`}>{audioLoadingId === currentStop.id ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${audioPlayingId === currentStop.id ? 'fa-stop' : 'fa-play'} text-xs ml-0.5`}></i>}</button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col relative">
                <div className="h-[32vh] w-full relative z-[100] shrink-0 border-b border-slate-100 bg-slate-200">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={language} onStopSelect={(i: number) => { onJumpTo(i); stopAudio(); }} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} userLocation={userLocation} />
                    
                    <div className="absolute top-4 left-4 z-[500] flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
                        <div className={`w-2 h-2 rounded-full ${userLocation ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 animate-pulse'}`}></div>
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">{userLocation ? tl.gpsOk : tl.gpsLow}</span>
                    </div>

                    <button onClick={handleRefreshGps} className="absolute bottom-4 right-4 z-[500] w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-purple-600 border border-purple-100 active:scale-90 transition-all">
                        <i className={`fas fa-location-crosshairs ${isRefreshingGps ? 'animate-spin' : ''}`}></i>
                    </button>
                </div>

                <div className="px-8 pt-10 pb-44 space-y-10 bg-white rounded-t-[3.5rem] -mt-12 shadow-[0_-30px_60px_rgba(0,0,0,0.08)] z-[200]">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleCheckIn} disabled={rewardClaimed} className={`flex flex-col items-center justify-center gap-2 p-5 rounded-[2.5rem] font-black uppercase text-[9px] shadow-lg border transition-all ${rewardClaimed ? 'bg-green-100 text-green-600 border-green-200' : (IS_IN_RANGE ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20' : 'bg-slate-50 text-slate-400 border-slate-200')}`}>
                            <i className={`fas ${rewardClaimed ? 'fa-check-circle' : 'fa-location-dot'} text-lg`}></i>
                            <span className="text-center">{rewardClaimed ? tl.checkedIn : tl.checkIn}</span>
                            {!rewardClaimed && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${IS_IN_RANGE ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className="text-[7px] opacity-60 font-bold lowercase">{distToTarget ?? '?'}m</span>
                                </div>
                            )}
                        </button>
                        
                        <button onClick={handlePhotoReward} disabled={isGeneratingStory || photoClaimed} className={`flex flex-col items-center justify-center gap-2 p-5 rounded-[2.5rem] font-black uppercase text-[9px] shadow-xl border transition-all ${photoClaimed ? 'bg-slate-50 text-purple-600 border-purple-100' : 'bg-slate-950 text-white border-slate-800 shadow-slate-900/40'}`}>
                            {isGeneratingStory ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-camera text-lg"></i>}
                            <span className="text-center">{isGeneratingStory ? 'SYNC...' : photoClaimed ? tl.rewardReceived : tl.generateStory}</span>
                            {!photoClaimed && !isGeneratingStory && (
                                <span className="text-[7px] opacity-40 font-bold uppercase tracking-widest mt-1">{tl.photoHint}</span>
                            )}
                        </button>
                    </div>

                    <div className="relative group">
                        <div className="space-y-10 text-slate-800 text-lg leading-relaxed font-medium">
                            {currentStop.description.split('\n\n').map((paragraph, idx) => (
                                <p key={idx} className={`animate-fade-in first-letter:text-6xl first-letter:font-black first-letter:text-slate-950 first-letter:float-left opacity-90 ${language === 'ar' ? 'text-right first-letter:float-right first-letter:ml-3 first-letter:mr-0' : 'first-letter:mr-3'}`}>{paragraph}</p>
                            ))}
                        </div>
                        <div className={`absolute top-0 ${language === 'ar' ? 'left-0' : 'right-0'}`}>
                            <button onClick={() => handlePlayAudio(currentStop.id, currentStop.description)} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl ${audioPlayingId === currentStop.id ? 'bg-red-500 text-white' : 'bg-white text-purple-600 border border-purple-100'}`}>
                                {audioLoadingId === currentStop.id ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas ${audioPlayingId === currentStop.id ? 'fa-stop' : 'fa-headphones-simple'} text-xl`}></i>}
                            </button>
                        </div>
                    </div>
                </div>
             </div>

             <div className="bg-white/90 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] shrink-0 pb-safe-iphone shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <button onClick={() => { onPrev(); stopAudio(); }} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest disabled:opacity-0">{tl.prev}</button>
                <button onClick={() => { onNext(); stopAudio(); }} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl">{tl.next}</button>
             </div>
        </div>
    );
};
