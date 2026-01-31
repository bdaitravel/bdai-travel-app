
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile, CapturedMoment } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText, generateAudio, generateSmartCaption } from '../services/geminiService';

const TEXTS: any = {
    en: { start: "Launch", stop: "Hub", of: "of", photoSpot: "Technical Angle", capture: "Log Data", rewardReceived: "Sync Successful", prev: "Back", next: "Advance", meters: "m", itinerary: "Sequence", syncing: "Syncing voice...", tooFar: "Too far! Move closer to the spot.", generateStory: "Generate AI Story", storyTitle: "Smart Moment", shareInsta: "Copy Caption", momentsSaved: "Moment Synchronized" },
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Ángulo Técnico", capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Avanzar", meters: "m", itinerary: "Secuencia", syncing: "Sincronizando voz...", tooFar: "¡Demasiado lejos! Acércate al punto real.", generateStory: "Generar Story IA", storyTitle: "Momento Inteligente", shareInsta: "Copiar Caption", momentsSaved: "Momento Sincronizado" },
    pt: { start: "Iniciar", stop: "Parada", of: "de", photoSpot: "Ângulo Técnico", capture: "Registrar", rewardReceived: "Sincronizado", prev: "Voltar", next: "Avançar", meters: "m", itinerary: "Sequência", syncing: "Sincronizando voz...", tooFar: "Muito longe!", generateStory: "Gerar Story IA", storyTitle: "Momento Inteligente", shareInsta: "Copiar Legenda", momentsSaved: "Momento Sincronizado" },
    it: { start: "Avvia", stop: "Tappa", of: "di", photoSpot: "Angolo Tecnico", capture: "Registra", rewardReceived: "Sincronizzato", prev: "Indietro", next: "Avanti", meters: "m", itinerary: "Sequenza", syncing: "Sincronizzazione...", tooFar: "Troppo lontano!", generateStory: "Genera Story IA", storyTitle: "Momento Inteligente", shareInsta: "Copia Didascalia", momentsSaved: "Momento Sincronizzato" }
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
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [storyMoment, setStoryMoment] = useState<CapturedMoment | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const preloadedBuffers = useRef<Map<number, AudioBuffer>>(new Map());

    const phrases = useMemo(() => {
        const raw = currentStop.description.split(/([.!?。।？！؟])\s*/);
        const result = [];
        for (let i = 0; i < raw.length; i += 2) {
            const text = raw[i];
            const punct = raw[i + 1] || "";
            if (text && text.trim().length > 2) {
                const combined = (text + punct).trim();
                if (combined.length > 180) {
                    const subParts = combined.match(/.{1,180}(\s|$)|.{1,180}/g) || [combined];
                    result.push(...subParts.map(s => s.trim()).filter(s => s.length > 2));
                } else result.push(combined);
            }
        }
        return result;
    }, [currentStop.id]);

    useEffect(() => {
        stopAudio();
        setIsPlaying(false);
        setIsLoading(false);
        setCurrentPhraseIndex(0);
        preloadedBuffers.current.clear();
        setRewardClaimed(false);
        setPhotoClaimed(false);
        setStoryMoment(null);
    }, [currentStop.id]);

    const stopAudio = () => {
        if (audioSourceRef.current) {
            audioSourceRef.current.onended = null;
            try { audioSourceRef.current.stop(); } catch(e) {}
            audioSourceRef.current = null;
        }
    };

    const handlePhotoReward = () => {
        if (!userLocation) { alert(tl.tooFar); return; }
        const dist = calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude);
        if (dist > 100) { alert(`${tl.tooFar} (${Math.round(dist)}m)`); return; }
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
                const caption = await generateSmartCaption(base64, currentStop, language);
                const moment: CapturedMoment = {
                    id: `moment_${Date.now()}`,
                    stopId: currentStop.id,
                    stopName: currentStop.name,
                    city: tour.city,
                    imageUrl: base64,
                    caption: caption,
                    timestamp: new Date().toISOString()
                };
                
                setStoryMoment(moment);
                setShowStoryModal(true);
                setPhotoClaimed(true);

                // Update User Profile
                const updatedMoments = [...(user.capturedMoments || []), moment];
                onUpdateUser({
                    ...user,
                    miles: user.miles + 100,
                    photoPoints: (user.photoPoints || 0) + 1,
                    capturedMoments: updatedMoments,
                    stats: { ...user.stats, photosTaken: user.stats.photosTaken + 1 }
                });
            } catch (err) {
                console.error(err);
                alert("Error generating story analysis.");
            } finally {
                setIsGeneratingStory(false);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             {/* Story Generator Modal */}
             {showStoryModal && storyMoment && (
                 <div className="fixed inset-0 z-[9000] bg-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in">
                     <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-transparent pointer-events-none"></div>
                     <div className="w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-slide-up">
                         <div className="aspect-[9/16] relative">
                             <img src={storyMoment.imageUrl} className="w-full h-full object-cover" />
                             <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white">
                                 <div className="flex items-center gap-3 mb-4">
                                     <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center border border-white/20"><i className="fas fa-microchip text-xs"></i></div>
                                     <div className="flex-1">
                                         <p className="text-[7px] font-black uppercase tracking-[0.3em] opacity-60">{tl.storyTitle}</p>
                                         <h4 className="text-xs font-black uppercase tracking-tighter">{storyMoment.stopName}</h4>
                                     </div>
                                 </div>
                                 <p className="text-xs leading-relaxed font-medium italic opacity-90">"{storyMoment.caption}"</p>
                             </div>
                             <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest text-white">+100 MILES</div>
                         </div>
                         <div className="p-8 space-y-3 bg-white">
                             <button onClick={() => { navigator.clipboard.writeText(storyMoment.caption); alert("Caption copied!"); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                                 <i className="fas fa-copy mr-2"></i> {tl.shareInsta}
                             </button>
                             <button onClick={() => setShowStoryModal(false)} className="w-full py-3 text-slate-400 font-black uppercase text-[9px] tracking-widest">{tl.momentsSaved}</button>
                         </div>
                     </div>
                 </div>
             )}

             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

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
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={language} onStopSelect={onJumpTo} onPlayAudio={() => {}} audioPlayingId={isPlaying ? currentStop.id : null} audioLoadingId={isLoading ? currentStop.id : null} userLocation={userLocation} />
                </div>
                <div className="px-8 pt-10 pb-40 space-y-10 bg-white rounded-t-[3rem] -mt-10 shadow-[0_-30px_60px_rgba(0,0,0,0.05)] z-[200]">
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                             {isGeneratingStory && <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest animate-pulse">Analizando visión IA...</p>}
                        </div>
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
                            <span className="text-sm font-black text-slate-900">+100m</span>
                        </div>
                        <button 
                            onClick={handlePhotoReward} 
                            disabled={isGeneratingStory}
                            className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${photoClaimed ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-slate-900 text-white shadow-xl'}`}
                        >
                            {isGeneratingStory ? <i className="fas fa-spinner fa-spin mr-2"></i> : photoClaimed ? <><i className="fas fa-check-circle mr-2"></i> {tl.rewardReceived}</> : tl.generateStory}
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
