
import React, { useMemo } from 'react';
import { Tour, Stop } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText } from '../services/geminiService';

const UI_TEXT: any = {
    en: { start: "Start", stopTag: "Stop", next: "Next", prev: "Back", backToList: "Back to List", shareSpot: "Share Intel", claim: "Check-in", claimed: "Verified", navigate: "Navigate", tooFar: "Too far", nearby: "Nearby" },
    es: { start: "Empezar", stopTag: "Parada", next: "Siguiente", prev: "Anterior", backToList: "Atrás", shareSpot: "Compartir Intel", claim: "Verificar", claimed: "Visitado", navigate: "Cómo llegar", tooFar: "Lejos", nearby: "Cerca" },
    ca: { start: "Començar", stopTag: "Parada", next: "Següent", prev: "Anterior", backToList: "Enrere", shareSpot: "Compartir Intel", claim: "Verificar", claimed: "Visitat", navigate: "Com arribar", tooFar: "Lluny", nearby: "A prop" },
    eu: { start: "Hasi", stopTag: "Geltokia", next: "Hurrengoa", prev: "Aurrekoa", backToList: "Atzera", shareSpot: "Intel Partekatu", claim: "Egiaztatu", claimed: "Bisitatua", navigate: "Nola iritsi", tooFar: "Urrun", nearby: "Gertu" },
    fr: { start: "Démarrer", stopTag: "Étape", next: "Suivant", prev: "Précédent", backToList: "Retour", shareSpot: "Partager Intel", claim: "Vérifier", claimed: "Visité", navigate: "Naviguer", tooFar: "Trop loin", nearby: "Proche" }
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
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-700 cursor-pointer h-full flex flex-col relative p-8">
      <div className="flex flex-col flex-1">
          <div className="mb-4">
             <span className="px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 border border-purple-200">{tour.theme}</span>
          </div>
          <h3 className="text-2xl font-heading font-black text-slate-900 mb-4 leading-tight group-hover:text-purple-700 uppercase tracking-tighter">{tour.title}</h3>
          <p className="text-slate-500 text-xs leading-relaxed mb-8 line-clamp-3 font-medium">{tour.description}</p>
          <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-slate-900 font-black text-[10px] uppercase tracking-[0.2em]">
               <span><i className="fas fa-clock mr-2"></i> {tour.duration}</span>
               <span>{t.start} <i className="fas fa-chevron-right ml-2"></i></span>
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

    // Real-time distance calculation
    const distanceToStop = useMemo(() => {
        if (!userLocation) return null;
        return getDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude);
    }, [userLocation, currentStop]);

    const isNearEnough = distanceToStop !== null && distanceToStop <= 150; // 150m margin for GPS

    const handleOpenInMaps = () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}&travelmode=walking`;
        window.open(url, '_blank');
    };

    const handleShareSpot = () => {
        if (navigator.share) {
            navigator.share({
                title: `Punto Instagrammable en ${currentStop.name}`,
                text: `He descubierto un Photo Spot de élite con la guía bdai. Ángulo: ${currentStop.photoSpot?.angle}`,
                url: window.location.href
            }).catch(() => {});
        } else {
            alert("Intel de foto copiado al portapapeles");
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#fcfcfc] overflow-hidden">
             {/* Map Area */}
             <div className="h-[35vh] w-full relative flex-shrink-0">
                <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} userLocation={userLocation} />
                <button onClick={onBack} className="absolute top-8 left-8 z-[500] w-12 h-12 rounded-2xl bg-white/90 backdrop-blur shadow-2xl flex items-center justify-center text-slate-900 transition-transform active:scale-90"><i className="fas fa-arrow-left"></i></button>
             </div>

             {/* Navigation Controls */}
             <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 relative z-[450] shadow-sm">
                 <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex items-center gap-3 text-slate-400 disabled:opacity-10 font-black uppercase text-[10px] tracking-widest transition-all active:scale-90">
                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center"><i className="fas fa-chevron-left"></i></div>
                    {t.prev}
                 </button>
                 
                 <div className="text-center">
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">{t.stopTag} {currentStopIndex + 1}</p>
                    <div className="flex gap-1 justify-center">
                        {tour.stops.map((s: Stop, i: number) => (
                            <div key={i} className={`h-1 rounded-full transition-all ${i === currentStopIndex ? 'w-4 bg-purple-600' : s.visited ? 'w-1.5 bg-green-500' : 'w-1 bg-slate-200'}`}></div>
                        ))}
                    </div>
                 </div>

                 <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="flex items-center gap-3 text-purple-600 disabled:opacity-10 font-black uppercase text-[10px] tracking-widest text-right transition-all active:scale-90">
                    {t.next}
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg"><i className="fas fa-chevron-right"></i></div>
                 </button>
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-y-auto no-scrollbar px-8 pt-8 pb-32">
                <div className="flex items-center justify-between gap-6 mb-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                             {currentStop.visited ? (
                                 <span className="bg-green-100 text-green-700 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-green-200 flex items-center gap-1">
                                     <i className="fas fa-check-circle"></i> {t.claimed}
                                 </span>
                             ) : (
                                 <button 
                                    onClick={() => onVisit(currentStop.id)}
                                    className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all
                                        ${isNearEnough 
                                            ? 'bg-yellow-400 text-slate-950 animate-pulse border-2 border-slate-900/10' 
                                            : 'bg-slate-200 text-slate-400 border border-slate-300 opacity-60 cursor-not-allowed'}`}
                                 >
                                     <i className={`fas ${isNearEnough ? 'fa-location-dot' : 'fa-lock'}`}></i> 
                                     {isNearEnough ? t.claim : t.tooFar}
                                 </button>
                             )}
                             
                             {!currentStop.visited && (
                                <div className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border flex items-center gap-2
                                    ${isNearEnough ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    <i className="fas fa-ruler"></i>
                                    {distanceToStop !== null ? `${Math.round(distanceToStop)}m` : 'Buscando...'}
                                </div>
                             )}
                        </div>
                        <h1 className="text-4xl font-heading font-black text-slate-900 tracking-tighter leading-tight uppercase">{currentStop.name}</h1>
                    </div>
                    <button onClick={() => onPlayAudio(currentStop.id, currentStop.description)} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 flex-shrink-0 ${isPlaying ? 'bg-red-600 text-white' : 'bg-slate-950 text-white'}`}>
                        {isLoading ? <i className="fas fa-spinner fa-spin"></i> : isPlaying ? <i className="fas fa-stop"></i> : <i className="fas fa-volume-up"></i>}
                    </button>
                </div>

                {/* Navigation CTA */}
                {!currentStop.visited && (
                    <button 
                        onClick={handleOpenInMaps}
                        className="w-full mb-8 py-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center gap-4 group active:scale-[0.98] transition-all"
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <i className="fas fa-route"></i>
                        </div>
                        <div className="text-left">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.nearby}</p>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{t.navigate}</p>
                        </div>
                        <i className="fas fa-external-link-alt text-[10px] text-slate-300 ml-auto mr-4"></i>
                    </button>
                )}

                <div className="space-y-6 mb-12 text-slate-800 text-lg font-medium leading-relaxed opacity-90">
                    {currentStop.description.split('\n').map((line, idx) => {
                        const clean = cleanDescriptionText(line);
                        return clean ? <p key={idx}>{clean}</p> : null;
                    })}
                </div>

                {currentStop.photoSpot && (
                    <div className="relative mb-12 animate-fade-in">
                        <div className="absolute -top-4 -right-2 z-20 bg-gradient-to-r from-yellow-400 to-amber-600 text-slate-950 px-5 py-2.5 rounded-full font-black text-[12px] shadow-[0_15px_40px_rgba(251,191,36,0.6)] flex items-center gap-2 border-2 border-white transform hover:scale-110 transition-transform cursor-help">
                            <i className="fas fa-award text-[14px]"></i>
                            +{currentStop.photoSpot.milesReward} <span className="text-[10px]">Mi</span>
                        </div>

                        <div className="bg-slate-950 rounded-[3rem] p-10 border border-white/10 text-white shadow-[0_30px_80px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-transparent opacity-40"></div>
                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                                <i className="fas fa-camera-retro text-[10rem]"></i>
                            </div>
                            
                            <div className="relative z-10">
                                <h4 className="text-[11px] font-black text-purple-400 uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
                                     <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.8)]"></div> 
                                     Intel Spot Verificado
                                </h4>
                                
                                <div className="space-y-8 mb-10">
                                    <div className="flex gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl text-purple-500 flex-shrink-0 border border-white/10 shadow-inner">
                                            <i className="fas fa-expand-arrows-alt"></i>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Ángulo de Captura</p>
                                            <p className="text-base font-bold text-slate-100 leading-tight">{currentStop.photoSpot.angle}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl text-amber-500 flex-shrink-0 border border-white/10 shadow-inner">
                                            <i className="fas fa-wand-magic-sparkles"></i>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Momento de Élite</p>
                                            <p className="text-base font-bold text-slate-100 leading-tight">{currentStop.photoSpot.bestTime}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-purple-600/10 rounded-[2rem] border border-purple-500/20 mb-10 backdrop-blur-md relative overflow-hidden group/hook">
                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover/hook:rotate-12 transition-transform">
                                        <i className="fab fa-instagram text-6xl"></i>
                                    </div>
                                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <i className="fas fa-quote-left text-[8px]"></i> Instagram Hook
                                    </p>
                                    <p className="text-sm font-medium italic text-slate-200 leading-relaxed">"{currentStop.photoSpot.instagramHook}"</p>
                                </div>

                                <button 
                                    onClick={handleShareSpot}
                                    className="w-full py-5 bg-white text-slate-950 rounded-3xl font-black text-[12px] uppercase tracking-[0.2em] shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex items-center justify-center gap-4 transition-all active:scale-95 hover:bg-slate-50 hover:shadow-white/10"
                                >
                                    <i className="fas fa-share-nodes text-lg"></i> {t.shareSpot}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
             </div>
        </div>
    );
};
