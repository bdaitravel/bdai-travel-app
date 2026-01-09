
import React, { useMemo, useState } from 'react';
import { Tour, Stop } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText } from '../services/geminiService';

const STOP_TYPE_ICONS: Record<string, string> = {
    historical: 'fa-landmark',
    food: 'fa-utensils',
    art: 'fa-palette',
    nature: 'fa-leaf',
    photo: 'fa-camera',
    culture: 'fa-users',
    architecture: 'fa-archway'
};

const TEXTS: any = {
    en: { start: "Start", stop: "Stop", of: "of", photoSpot: "Epic Photo Spot", capture: "Capture and earn Miles", approach: "Get closer to redeem", rewardReceived: "Reward Received", prev: "Previous", next: "Next Stop", meters: "m" },
    es: { start: "Empezar", stop: "Parada", of: "de", photoSpot: "Epic Photo Spot", capture: "Capturar y ganar Millas", approach: "Acércate al punto para canjear", rewardReceived: "Recompensa Recibida", prev: "Anterior", next: "Siguiente Parada", meters: "m" },
    ca: { start: "Començar", stop: "Parada", of: "de", photoSpot: "Epic Photo Spot", capture: "Capturar i guanyar Milles", approach: "Apropa't al punt per bescanviar", rewardReceived: "Recompensa Rebuda", prev: "Anterior", next: "Següent Parada", meters: "m" },
    eu: { start: "Hasi", stop: "Geldialdia", of: "-(e)tik", photoSpot: "Epic Photo Spot", capture: "Miliak irabazi", approach: "Hurbildu puntura trukatzeko", rewardReceived: "Saria jasoa", prev: "Aurrekoa", next: "Hurrengo Geldialdia", meters: "m" },
    fr: { start: "Commencer", stop: "Arrêt", of: "sur", photoSpot: "Epic Photo Spot", capture: "Capturer et gagner des Miles", approach: "Rapprochez-vous pour échanger", rewardReceived: "Récompense Reçue", prev: "Précédent", next: "Prochain Arrêt", meters: "m" }
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

export const ActiveTourCard: React.FC<any> = ({ tour, currentStopIndex, onNext, onPrev, onPlayAudio, onSkipAudio, audioPlayingId, audioLoadingId, onBack, userLocation, onVisit, language = 'es' }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const isPlaying = audioPlayingId === currentStop.id;
    const isLoading = audioLoadingId === currentStop.id;
    const [isCapturing, setIsCapturing] = useState(false);
    
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

    const typeIcon = STOP_TYPE_ICONS[currentStop.type] || 'fa-location-dot';

    return (
        <div className="h-full flex flex-col bg-[#fcfcfc] overflow-hidden">
             {/* Mapa Activo */}
             <div className="h-[42vh] w-full relative flex-shrink-0 z-10 shadow-xl">
                <SchematicMap 
                    stops={tour.stops} 
                    currentStopIndex={currentStopIndex} 
                    userLocation={userLocation} 
                    onPlayAudio={onPlayAudio} 
                    onSkipAudio={onSkipAudio} 
                    audioPlayingId={audioPlayingId} 
                    audioLoadingId={audioLoadingId}
                    language={language}
                />
                <button onClick={onBack} className="absolute top-6 left-6 z-[500] w-12 h-12 rounded-2xl bg-white shadow-2xl flex items-center justify-center text-slate-950 active:scale-90 transition-transform border border-slate-100"><i className="fas fa-arrow-left"></i></button>
             </div>

             {/* Contenido Extenso */}
             <div className="flex-1 overflow-y-auto no-scrollbar px-8 pt-10 pb-44">
                <div className="flex justify-between items-start gap-4 mb-8">
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse"></span> {tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}
                        </p>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-inner">
                                <i className={`fas ${typeIcon}`}></i>
                            </div>
                            <h1 className="text-2xl font-black text-slate-950 tracking-tighter uppercase leading-tight">{currentStop.name}</h1>
                        </div>
                        {distanceToStop !== null && (
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full ${isNearEnough ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    <i className="fas fa-person-walking mr-2"></i> {distanceToStop} {tl.meters}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button onClick={() => onSkipAudio(-10)} disabled={!isPlaying} className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center active:bg-slate-200 disabled:opacity-20 transition-all"><i className="fas fa-rotate-left"></i></button>
                            <button onClick={() => onPlayAudio(currentStop.id, currentStop.description)} disabled={isLoading} className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center shadow-2xl transition-all active:scale-95 ${isPlaying ? 'bg-red-600 scale-105' : 'bg-slate-950'} text-white`}>
                                {isLoading ? <i className="fas fa-spinner fa-spin text-2xl"></i> : isPlaying ? <i className="fas fa-stop text-2xl"></i> : <i className="fas fa-play text-2xl translate-x-0.5"></i>}
                            </button>
                            <button onClick={() => onSkipAudio(10)} disabled={!isPlaying} className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center active:bg-slate-200 disabled:opacity-20 transition-all"><i className="fas fa-rotate-right"></i></button>
                        </div>
                    </div>
                </div>

                {/* Photo Spot Activo */}
                {currentStop.photoSpot && (
                    <div className={`mb-10 p-8 rounded-[2.8rem] border-2 transition-all ${isNearEnough ? 'bg-purple-600 border-purple-400 text-white shadow-[0_20px_40px_rgba(168,85,247,0.3)]' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                <i className="fas fa-camera-retro text-lg"></i> {tl.photoSpot}
                            </h4>
                            <span className="text-[10px] font-black bg-white/20 px-3 py-1.5 rounded-xl border border-white/10">+{currentStop.photoSpot.milesReward} MI</span>
                        </div>
                        <p className="text-sm font-bold leading-relaxed mb-6 italic opacity-90">"{currentStop.photoSpot.angle}"</p>
                        
                        {!currentStop.visited ? (
                            <button 
                                onClick={handlePhotoReward}
                                disabled={!isNearEnough || isCapturing}
                                className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl ${isNearEnough ? 'bg-white text-slate-950 hover:bg-slate-100 active:scale-95' : 'bg-slate-200 text-slate-400'}`}
                            >
                                {isCapturing ? <i className="fas fa-spinner fa-spin mr-2"></i> : isNearEnough ? tl.capture : tl.approach}
                            </button>
                        ) : (
                            <div className="bg-white/10 py-4 rounded-2xl text-center border border-white/20 flex items-center justify-center gap-3">
                                <i className="fas fa-check-circle text-green-300"></i>
                                <span className="text-[11px] font-black uppercase tracking-widest text-white">{tl.rewardReceived}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Narrativa Profunda */}
                <div className="space-y-8 text-slate-800 text-lg leading-[1.8] font-medium pb-24">
                    {currentStop.description.split('\n').map((line, idx) => {
                        const clean = cleanDescriptionText(line);
                        return clean ? (
                            <p key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                                {clean}
                            </p>
                        ) : null;
                    })}
                </div>

                {/* Footer Navegación */}
                <div className="flex gap-4 pt-12 border-t border-slate-100">
                    <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex-1 py-6 rounded-3xl border border-slate-200 text-slate-400 font-black uppercase text-[11px] tracking-widest disabled:opacity-0 active:scale-95 transition-all">{tl.prev}</button>
                    <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-6 bg-purple-600 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all">{tl.next}</button>
                </div>
             </div>
        </div>
    );
};
