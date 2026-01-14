
import React, { useMemo, useState } from 'react';
import { Tour, Stop } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText } from '../services/geminiService';

const TEXTS: any = {
    en: { start: "Start", stop: "Stop", of: "of", photoSpot: "Epic Photo Spot", capture: "Capture and earn Miles", approach: "Get closer to redeem", rewardReceived: "Reward Received", prev: "Previous", next: "Next Stop", meters: "m", share: "Share Stop", itinerary: "Itinerary" },
    es: { start: "Empezar", stop: "Parada", of: "de", photoSpot: "Epic Photo Spot", capture: "Capturar y ganar Millas", approach: "Acércate al punto para canjear", rewardReceived: "Recompensa Recibida", prev: "Anterior", next: "Siguiente Parada", meters: "m", share: "Compartir Parada", itinerary: "Itinerario" },
    ca: { start: "Començar", stop: "Parada", of: "de", photoSpot: "Epic Photo Spot", capture: "Capturar i guanyar Milles", approach: "Apropa't al punt per bescanviar", rewardReceived: "Recompensa Rebuda", prev: "Anterior", next: "Següent Parada", meters: "m", share: "Compartir Parada", itinerary: "Itinerari" },
    eu: { start: "Hasi", stop: "Geldialdia", of: "-(e)tik", photoSpot: "Epic Photo Spot", capture: "Miliak irabazi", approach: "Hurbildu puntura trukatzeko", rewardReceived: "Saria jasoa", prev: "Aurrekoa", next: "Hurrengo Geldialdia", meters: "m", share: "Partekatu", itinerary: "Ibilbidea" },
    fr: { start: "Commencer", stop: "Arrêt", of: "sur", photoSpot: "Epic Photo Spot", capture: "Capturer et gagner des Miles", approach: "Rapprochez-vous pour échanger", rewardReceived: "Récompense Reçue", prev: "Précédent", next: "Prochain Arrêt", meters: "m", share: "Partager", itinerary: "Itinéraire" }
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  const tl = TEXTS[language] || TEXTS.es;
  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all p-7 mb-4 cursor-pointer relative">
      <div className="flex flex-col">
          <div className="mb-4">
             <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-100 text-purple-700">{tour.theme}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter leading-tight">{tour.title}</h3>
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{cleanDescriptionText(tour.description)}</p>
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-50">
               <span className="text-slate-900 font-black text-[10px] uppercase tracking-widest"><i className="fas fa-person-walking mr-2"></i> {tour.duration} • {tour.distance}</span>
               <span className="text-purple-600 font-black text-[10px] uppercase tracking-widest">{tl.start} <i className="fas fa-chevron-right ml-1"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, currentStopIndex, onNext, onPrev, onJumpTo, onPlayAudio, audioPlayingId, audioLoadingId, onBack, userLocation, onVisit, language = 'es' }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const isPlaying = audioPlayingId === currentStop.id;
    const isLoading = audioLoadingId === currentStop.id;
    const [isCapturing, setIsCapturing] = useState(false);
    const [showItinerary, setShowItinerary] = useState(false);
    
    const distanceToStop = useMemo(() => {
        if (!userLocation) return null;
        return getDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude);
    }, [userLocation, currentStop]);

    const isNearEnough = distanceToStop !== null && distanceToStop <= 100;

    const handlePhotoReward = async () => {
        setIsCapturing(true);
        await new Promise(r => setTimeout(r, 1500)); 
        onVisit(currentStop.id, currentStop.photoSpot?.milesReward || 100);
        setIsCapturing(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             {/* Header Super-Adaptativo */}
             <div className="bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between z-[6000] shrink-0 pt-safe-iphone shadow-sm">
                <button 
                    onClick={(e) => { e.stopPropagation(); onBack(); }} 
                    className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950 active:scale-90 transition-transform"
                >
                    <i className="fas fa-arrow-left"></i>
                </button>
                <div className="text-center">
                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                    <h2 className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{currentStop.name}</h2>
                </div>
                <button 
                    onClick={() => setShowItinerary(!showItinerary)}
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${showItinerary ? 'bg-purple-600 border-purple-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`}
                >
                    <i className="fas fa-list-ul"></i>
                </button>
             </div>

             {/* Modal Itinerario */}
             {showItinerary && (
                 <div className="absolute inset-0 z-[7000] flex flex-col animate-fade-in">
                     <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowItinerary(false)}></div>
                     <div className="mt-auto bg-white rounded-t-[3rem] p-8 max-h-[70vh] overflow-y-auto no-scrollbar relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] animate-slide-up pb-safe-iphone">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">{tl.itinerary}</h3>
                            <button onClick={() => setShowItinerary(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="space-y-4">
                            {tour.stops.map((stop: Stop, idx: number) => (
                                <div 
                                    key={stop.id} 
                                    onClick={() => { onJumpTo(idx); setShowItinerary(false); }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${idx === currentStopIndex ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-600/20' : 'bg-white border-slate-100'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === currentStopIndex ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <p className={`text-[11px] font-black uppercase truncate flex-1 ${idx === currentStopIndex ? 'text-purple-700' : 'text-slate-900'}`}>{stop.name}</p>
                                    {stop.visited && <i className="fas fa-check-circle text-green-500 text-sm"></i>}
                                </div>
                            ))}
                        </div>
                     </div>
                 </div>
             )}

             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col relative">
                <div className="h-[40vh] w-full relative z-[100] shrink-0 border-b border-slate-100">
                    <SchematicMap 
                        stops={tour.stops} 
                        currentStopIndex={currentStopIndex} 
                        userLocation={userLocation} 
                        language={language}
                        onStopSelect={(idx) => onJumpTo(idx)}
                        onPlayAudio={onPlayAudio}
                        audioPlayingId={audioPlayingId}
                        audioLoadingId={audioLoadingId}
                    />
                </div>

                <div className="px-8 pt-8 pb-40 space-y-8 bg-white rounded-t-[3rem] -mt-6 shadow-[0_-20px_40px_rgba(0,0,0,0.03)] z-[200]">
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex-1">
                            {distanceToStop !== null && (
                                <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full inline-block ${isNearEnough ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    <i className="fas fa-person-walking mr-2"></i> {distanceToStop} {tl.meters}
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={() => onPlayAudio(currentStop.id, currentStop.description)} 
                            disabled={isLoading} 
                            className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all active:scale-95 shrink-0 ${isPlaying ? 'bg-red-600' : 'bg-slate-950'} text-white`}
                        >
                            {isLoading ? <i className="fas fa-spinner fa-spin text-xl"></i> : isPlaying ? <i className="fas fa-stop text-xl"></i> : <i className="fas fa-play text-xl ml-1"></i>}
                        </button>
                    </div>

                    {currentStop.photoSpot && (
                        <div className={`p-6 rounded-3xl border-2 transition-all ${isNearEnough ? 'bg-purple-600 border-purple-400 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-80'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <i className="fas fa-camera-retro"></i> {tl.photoSpot}
                                </h4>
                                <span className="text-[9px] font-black bg-white/20 px-3 py-1 rounded-lg">+{currentStop.photoSpot.milesReward} MI</span>
                            </div>
                            <p className="text-xs font-bold italic mb-4 opacity-95">"{currentStop.photoSpot.angle}"</p>
                            {!currentStop.visited ? (
                                <button 
                                    onClick={handlePhotoReward} 
                                    disabled={!isNearEnough || isCapturing} 
                                    className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${isNearEnough ? 'bg-white text-slate-950 shadow-lg' : 'bg-slate-200 text-slate-400'}`}
                                >
                                    {isCapturing ? <i className="fas fa-spinner fa-spin"></i> : isNearEnough ? tl.capture : tl.approach}
                                </button>
                            ) : (
                                <div className="bg-white/20 py-3 rounded-xl text-center border border-white/30 text-[10px] font-black uppercase tracking-widest text-white">
                                    <i className="fas fa-check-circle mr-2"></i> {tl.rewardReceived}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-8 text-slate-700 text-lg leading-relaxed font-medium pb-12">
                        {currentStop.description.split('\n\n').map((paragraph, idx) => {
                            const clean = cleanDescriptionText(paragraph);
                            return clean ? (
                                <p key={idx} className="animate-fade-in first-letter:text-6xl first-letter:font-black first-letter:text-purple-600 first-letter:mr-3 first-letter:float-left first-letter:mt-1">
                                    {clean}
                                </p>
                            ) : null;
                        })}
                    </div>
                </div>
             </div>

             <div className="bg-white/80 backdrop-blur-xl border-t border-slate-100 p-6 flex gap-3 z-[6000] shrink-0 pb-safe-iphone">
                <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest disabled:opacity-0 active:scale-95 transition-all">{tl.prev}</button>
                <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">{tl.next}</button>
             </div>
        </div>
    );
};
