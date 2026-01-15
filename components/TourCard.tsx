
import React, { useMemo, useState } from 'react';
import { Tour, Stop } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText } from '../services/geminiService';

const TEXTS: any = {
    en: { start: "Launch", stop: "Hub", of: "of", photoSpot: "Technical Angle", capture: "Log Data", approach: "Verify proximity", rewardReceived: "Data Synced", prev: "Back", next: "Advance", meters: "m", share: "Transmit", itinerary: "Sequence", intro: "Bidaer Manifesto" },
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Ángulo Técnico", capture: "Logear Datos", approach: "Verifica proximidad", rewardReceived: "Datos Sincronizados", prev: "Atrás", next: "Avanzar", meters: "m", share: "Transmitir", itinerary: "Secuencia", intro: "Manifiesto Bidaer" },
    ca: { start: "Llançar", stop: "Parada", of: "de", photoSpot: "Angle Tècnic", capture: "Loguejar Dades", approach: "Verifica proximitat", rewardReceived: "Dades Sincronitzades", prev: "Enrere", next: "Avançar", meters: "m", share: "Transmetre", itinerary: "Seqüència", intro: "Manifest Bidaer" },
    eu: { start: "Abiarazi", stop: "Geldialdia", of: "-(e)tik", photoSpot: "Angulu Teknikoa", capture: "Datuak Gorde", approach: "Hurbiltasuna egiaztatu", rewardReceived: "Datuak Sinkronizatuta", prev: "Atzera", next: "Aurrera", meters: "m", share: "Partekatu", itinerary: "Sekuentzia", intro: "Bidaer Manifestua" },
    fr: { start: "Lancer", stop: "Arrêt", of: "sur", photoSpot: "Angle Technique", capture: "Loguer Données", approach: "Vérifier proximité", rewardReceived: "Données Sync", prev: "Retour", next: "Avancer", meters: "m", share: "Transmettre", itinerary: "Séquence", intro: "Manifeste Bidaer" }
};

const getCalculatedDuration = (stopsCount: number) => {
    // Lógica bidaer real: 12 minutos por parada (trayecto + masterclass)
    // 15 paradas = 180 min = 3 horas.
    const mins = stopsCount * 12;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (hours > 0) {
        return `${hours}h${remainingMins > 0 ? ' ' + remainingMins + 'm' : ''}`;
    }
    return `${mins}m`;
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
  // SOBRESCRIBIMOS DURACIÓN CON CÁLCULO REAL BASADO EN PARADAS
  const duration = getCalculatedDuration(tour.stops.length);
  
  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all p-7 mb-4 cursor-pointer relative">
      <div className="flex flex-col">
          <div className="mb-4 flex justify-between items-center">
             <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white">{tour.theme}</span>
             {tour.isEssential && <span className="text-purple-600 font-black text-[8px] uppercase tracking-widest"><i className="fas fa-bolt mr-1"></i> Essential</span>}
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter leading-tight">{tour.title}</h3>
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{cleanDescriptionText(tour.description)}</p>
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-50">
               <span className="text-slate-900 font-black text-[10px] uppercase tracking-widest"><i className="fas fa-clock mr-2"></i> {duration} • {tour.distance}</span>
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
             {/* Header */}
             <div className="bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between z-[6000] shrink-0 pt-safe-iphone shadow-sm">
                <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950 active:scale-90 transition-transform"><i className="fas fa-arrow-left"></i></button>
                <div className="text-center">
                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                    <h2 className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{currentStop.name}</h2>
                </div>
                <button onClick={() => setShowItinerary(!showItinerary)} className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${showItinerary ? 'bg-slate-950 border-slate-950 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'}`}><i className="fas fa-layer-group"></i></button>
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
                        <div className="space-y-3">
                            {tour.stops.map((stop: Stop, idx: number) => (
                                <div key={stop.id} onClick={() => { onJumpTo(idx); setShowItinerary(false); }} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${idx === currentStopIndex ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100'}`}>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === currentStopIndex ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</div>
                                    <p className="text-[10px] font-black uppercase truncate flex-1">{stop.name}</p>
                                    {stop.visited && <i className="fas fa-check-circle text-green-500 text-sm"></i>}
                                </div>
                            ))}
                        </div>
                     </div>
                 </div>
             )}

             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col relative">
                <div className="h-[35vh] w-full relative z-[100] shrink-0 border-b border-slate-100">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} userLocation={userLocation} language={language} onStopSelect={(idx) => onJumpTo(idx)} onPlayAudio={onPlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} />
                </div>

                <div className="px-8 pt-10 pb-40 space-y-10 bg-white rounded-t-[3rem] -mt-10 shadow-[0_-30px_60px_rgba(0,0,0,0.05)] z-[200]">
                    
                    {/* MANIFIESTO BIDAER - Visible al inicio */}
                    {currentStopIndex === 0 && (
                        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 mb-6 animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5"><i className="fas fa-quote-right text-6xl"></i></div>
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                                <i className="fas fa-terminal text-purple-600"></i> {tl.intro}
                            </h4>
                            <p className="text-slate-600 text-sm font-bold leading-relaxed italic border-l-4 border-purple-500 pl-4">
                                {cleanDescriptionText(tour.description)}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-between items-center gap-4">
                        <div className="flex-1">
                            {distanceToStop !== null && (
                                <span className={`text-[9px] font-black uppercase px-4 py-2.5 rounded-xl inline-block ${isNearEnough ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-slate-100 text-slate-400'}`}>
                                    <i className="fas fa-location-crosshairs mr-2"></i> {distanceToStop} {tl.meters}
                                </span>
                            )}
                        </div>
                        <button onClick={() => onPlayAudio(currentStop.id, currentStop.description)} disabled={isLoading} className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all active:scale-95 shrink-0 ${isPlaying ? 'bg-red-600 shadow-red-600/20' : 'bg-slate-950 shadow-slate-950/20'} text-white`}>
                            {isLoading ? <i className="fas fa-circle-notch fa-spin text-xl"></i> : isPlaying ? <i className="fas fa-pause text-xl"></i> : <i className="fas fa-play text-xl ml-1"></i>}
                        </button>
                    </div>

                    {currentStop.photoSpot && (
                        <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${isNearEnough ? 'bg-slate-900 border-slate-800 text-white shadow-2xl' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                    <i className="fas fa-camera"></i> {tl.photoSpot}
                                </h4>
                                <span className="text-[8px] font-black bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">+{currentStop.photoSpot.milesReward} MI</span>
                            </div>
                            <p className="text-xs font-black italic mb-6 leading-tight opacity-80">"{currentStop.photoSpot.angle}"</p>
                            {!currentStop.visited ? (
                                <button onClick={handlePhotoReward} disabled={!isNearEnough || isCapturing} className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${isNearEnough ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/30' : 'bg-slate-200 text-slate-400'}`}>
                                    {isCapturing ? <i className="fas fa-sync fa-spin"></i> : isNearEnough ? tl.capture : tl.approach}
                                </button>
                            ) : (
                                <div className="bg-green-600/20 py-4 rounded-2xl text-center border border-green-500/30 text-[9px] font-black uppercase tracking-widest text-green-400">
                                    <i className="fas fa-check-double mr-2"></i> {tl.rewardReceived}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-10 text-slate-800 text-lg leading-relaxed font-medium pb-20">
                        {currentStop.description.split('\n\n').map((paragraph, idx) => {
                            const clean = cleanDescriptionText(paragraph);
                            return clean ? (
                                <p key={idx} className="animate-fade-in first-letter:text-6xl first-letter:font-black first-letter:text-slate-950 first-letter:mr-3 first-letter:float-left first-letter:mt-1 opacity-90">
                                    {clean}
                                </p>
                            ) : null;
                        })}
                    </div>
                </div>
             </div>

             <div className="bg-white/80 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] shrink-0 pb-safe-iphone">
                <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest disabled:opacity-0 active:scale-95 transition-all">{tl.prev}</button>
                <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-2xl active:scale-95 transition-all">{tl.next}</button>
             </div>
        </div>
    );
};
