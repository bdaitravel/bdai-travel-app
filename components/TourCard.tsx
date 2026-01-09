
import React, { useMemo, useState, useEffect } from 'react';
import { Tour, Stop } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText } from '../services/geminiService';

const UI_TEXT: any = {
    en: { start: "Start", stopTag: "Stop", next: "Next", prev: "Back", nearby: "Nearby", navigate: "Navigate", claim: "Claim", tooFar: "Too far", claimed: "Verified", photoSpot: "Epic Photo Spot", capture: "Snap & Earn", bestAngle: "Best Angle", instagram: "Insta Hook", distance: "Distance", secretTitle: "Dai's Secret" },
    es: { start: "Empezar", stopTag: "Parada", next: "Sig.", prev: "Ant.", nearby: "Cerca", navigate: "Cómo llegar", claim: "Verificar", tooFar: "Fuera de rango", claimed: "Visitado", photoSpot: "Punto Instagrameable", capture: "Capturar Foto", bestAngle: "Ángulo Pro", instagram: "Texto Post", distance: "Distancia", secretTitle: "Secreto de Dai" },
    ca: { start: "Començar", stopTag: "Parada", next: "Seg.", prev: "Ant.", nearby: "A prop", navigate: "Com arribar", claim: "Verificar", tooFar: "Fora de rang", claimed: "Visitat", photoSpot: "Punt Instagram", capture: "Capturar Foto", bestAngle: "Angle Pro", instagram: "Text Post", distance: "Distància", secretTitle: "Secreto de Dai" },
    eu: { start: "Hasi", stopTag: "Geltokia", next: "Hur.", prev: "Aur.", nearby: "Gertu", navigate: "Nola iritsi", claim: "Egiaztatu", claimed: "Bisitatua", photoSpot: "Instagram Gunea", capture: "Argazkia Atera", bestAngle: "Angelu Pro", instagram: "Post Testua", distance: "Distantzia", secretTitle: "Secreto de Dai" },
    fr: { start: "Démarrer", stopTag: "Étape", next: "Suiv.", prev: "Préc.", nearby: "Proche", navigate: "Naviguer", claim: "Vérifier", tooFar: "Trop loin", claimed: "Visité", photoSpot: "Spot Instagram", capture: "Capturer", bestAngle: "Meilleur Angle", instagram: "Post Hook", distance: "Distance", secretTitle: "Secret de Dai" }
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language }) => {
  const t = UI_TEXT[language] || UI_TEXT['es'];
  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all p-6 mb-4 cursor-pointer relative">
      <div className="absolute top-4 right-6 flex flex-col items-end">
          <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase">{tour.stops.length} STOPS</span>
      </div>
      <div className="flex flex-col pr-12">
          <div className="mb-3">
             <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-purple-100 text-purple-700">{tour.theme}</span>
          </div>
          <h3 className="text-xl font-heading font-black text-slate-900 mb-2 uppercase tracking-tighter">{tour.title}</h3>
          <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">{tour.description}</p>
          <div className="flex items-center justify-between text-slate-900 font-black text-[9px] uppercase tracking-widest border-t border-slate-50 pt-4">
               <span><i className="fas fa-person-walking mr-2"></i> {tour.duration} • {tour.distance}</span>
               <span className="text-purple-600 font-black">{t.start} <i className="fas fa-chevron-right ml-1"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, currentStopIndex, onNext, onPrev, onPlayAudio, audioPlayingId, audioLoadingId, language, onBack, userLocation, onVisit }) => {
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const t = UI_TEXT[language] || UI_TEXT['es'];
    const isPlaying = audioPlayingId === currentStop.id;
    const isLoading = audioLoadingId === currentStop.id;
    const [capturing, setCapturing] = useState(false);

    const distanceToStop = useMemo(() => {
        if (!userLocation) return null;
        return getDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude);
    }, [userLocation, currentStop]);

    const isNearEnough = distanceToStop !== null && distanceToStop <= 150;

    const handlePhotoCapture = () => {
        if (!isNearEnough) return;
        setCapturing(true);
        setTimeout(() => {
            onVisit(currentStop.id, currentStop.photoSpot?.milesReward || 100);
            setCapturing(false);
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col bg-[#fcfcfc] overflow-hidden">
             <div className="h-[32vh] w-full relative flex-shrink-0">
                <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} userLocation={userLocation} onPlayAudio={onPlayAudio} />
                <button onClick={onBack} className="absolute top-6 left-6 z-[500] w-10 h-10 rounded-xl bg-white shadow-xl flex items-center justify-center text-slate-900 active:scale-90 transition-transform"><i className="fas fa-arrow-left"></i></button>
             </div>

             <div className="flex items-center px-4 py-4 bg-white border-b border-slate-100 shadow-sm z-[450] shrink-0">
                 <div className="flex-1 flex justify-start">
                    <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex items-center gap-2 text-slate-400 disabled:opacity-5 font-black uppercase text-[9px] tracking-widest active:scale-90 transition-transform">
                        <div className="w-10 h-10 min-w-[40px] rounded-full border border-slate-200 flex items-center justify-center bg-slate-50"><i className="fas fa-chevron-left text-[8px]"></i></div>
                        <span className="hidden xs:inline">{t.prev}</span>
                    </button>
                 </div>
                 
                 <div className="flex-[2] flex flex-col items-center justify-center text-center px-2 min-w-0">
                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1.5 truncate w-full">
                        {t.stopTag} {currentStopIndex + 1}/{tour.stops.length}
                    </p>
                    <div className="flex gap-1 justify-center max-w-full overflow-hidden">
                        {tour.stops.map((s: any, i: number) => (
                            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentStopIndex ? 'w-5 bg-purple-600' : s.visited ? 'w-1 bg-green-500' : 'w-1 bg-slate-200'}`}></div>
                        ))}
                    </div>
                 </div>

                 <div className="flex-1 flex justify-end">
                    <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="flex items-center gap-2 text-purple-600 disabled:opacity-5 font-black uppercase text-[9px] tracking-widest active:scale-90 transition-transform">
                        <span className="hidden xs:inline">{t.next}</span>
                        <div className="w-10 h-10 min-w-[40px] rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg"><i className="fas fa-chevron-right text-[8px]"></i></div>
                    </button>
                 </div>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 pb-48">
                <div className="flex items-start justify-between gap-4 mb-8">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1 mb-2">
                             {currentStop.visited ? (
                                 <span className="bg-green-100 text-green-700 text-[8px] font-black px-3 py-1 rounded-full border border-green-200 uppercase tracking-widest w-fit">{t.claimed}</span>
                             ) : (
                                 <button 
                                    onClick={() => isNearEnough && onVisit(currentStop.id, 50)}
                                    className={`text-[8px] font-black px-4 py-2 rounded-full uppercase tracking-widest border transition-all w-fit ${isNearEnough ? 'bg-yellow-400 text-slate-900 border-yellow-500 shadow-md scale-105' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`}
                                 >
                                     <i className={`fas ${isNearEnough ? 'fa-check' : 'fa-lock'} mr-1.5`}></i>
                                     {isNearEnough ? t.claim : t.tooFar}
                                 </button>
                             )}
                        </div>
                        <h1 className="text-2xl font-heading font-black text-slate-900 tracking-tighter uppercase leading-tight truncate">{currentStop.name}</h1>
                    </div>
                    
                    <button 
                        onClick={() => onPlayAudio(currentStop.id, currentStop.description)} 
                        disabled={isLoading}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0 transition-all active:scale-90 ${isPlaying ? 'bg-red-600 scale-105' : 'bg-slate-900'} text-white`}
                    >
                        {isLoading ? (
                            <i className="fas fa-spinner fa-spin text-lg"></i>
                        ) : isPlaying ? (
                            <i className="fas fa-stop text-lg"></i>
                        ) : (
                            <i className="fas fa-play text-lg translate-x-0.5"></i>
                        )}
                    </button>
                </div>

                {currentStop.photoSpot && (
                    <div className={`mb-8 rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden group border transition-all ${isNearEnough ? 'bg-gradient-to-br from-purple-700 to-indigo-900 border-white/10' : 'bg-slate-200 border-slate-300 opacity-80'}`}>
                        {!isNearEnough && !currentStop.visited && <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] z-20 flex items-center justify-center">
                            <span className="bg-white/90 text-slate-900 px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl">{t.tooFar}</span>
                        </div>}
                        <div className="relative z-10">
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 ${isNearEnough ? 'text-white/50' : 'text-slate-500'}`}>{t.photoSpot}</h4>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <p className={`text-[8px] font-black uppercase mb-1 ${isNearEnough ? 'text-purple-200/60' : 'text-slate-400'}`}>{t.secretTitle}</p>
                                    <p className={`text-xs font-bold leading-tight ${isNearEnough ? 'text-white' : 'text-slate-600'}`}>{currentStop.photoSpot.secretLocation}</p>
                                </div>
                                <div>
                                    <p className={`text-[8px] font-black uppercase mb-1 ${isNearEnough ? 'text-purple-200/60' : 'text-slate-400'}`}>{t.bestAngle}</p>
                                    <p className={`text-xs font-bold leading-tight ${isNearEnough ? 'text-white' : 'text-slate-600'}`}>{currentStop.photoSpot.angle}</p>
                                </div>
                            </div>
                            {!currentStop.visited && (
                                <button 
                                    onClick={handlePhotoCapture}
                                    disabled={capturing || !isNearEnough}
                                    className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all ${isNearEnough ? 'bg-white text-slate-950' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                                >
                                    {capturing ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-camera-retro"></i> {t.capture} (+{currentStop.photoSpot.milesReward} MI)</>}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-6 text-slate-700 text-base leading-relaxed font-medium pb-12">
                    {currentStop.description.split('\n').map((line, idx) => {
                        const clean = cleanDescriptionText(line);
                        return clean ? <p key={idx} className="animate-fade-in">{clean}</p> : null;
                    })}
                </div>
             </div>
        </div>
    );
};
