
import React, { useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile, CapturedMoment } from '../types';
import { SchematicMap } from './SchematicMap';
import { generateSmartCaption } from '../services/geminiService';

const TEXTS: any = {
    en: { start: "Launch", stop: "Hub", of: "of", capture: "Log Data", next: "Advance", meters: "m", itinerary: "Sequence", checkIn: "Confirm Visit", checkedIn: "Visit Verified", bonus: "Optional Bonus" },
    es: { start: "Lanzar", stop: "Parada", of: "de", capture: "Logear Datos", next: "Avanzar", meters: "m", itinerary: "Secuencia", checkIn: "Confirmar Visita", checkedIn: "Visita Verificada", bonus: "Bonus Opcional" },
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  const tl = TEXTS[language] || TEXTS.es;
  if (!tour) return null;
  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-md p-7 mb-4 cursor-pointer relative active:scale-[0.98] transition-all">
      <div className="flex flex-col">
          <div className="mb-4 flex justify-between items-center">
             <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white">{tour.theme}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter leading-tight">{tour.title}</h3>
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{tour.description}</p>
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-50">
               <span className="text-slate-900 font-black text-[10px] uppercase tracking-widest"><i className="fas fa-clock mr-2"></i> {tour.duration} • {tour.distance || '---'}</span>
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
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [showItinerary, setShowItinerary] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setRewardClaimed(false); }, [currentStop.id]);

    const handleCheckIn = () => {
        setRewardClaimed(true);
        onUpdateUser({ ...user, miles: user.miles + 50, culturePoints: (user.culturePoints || 0) + 1 });
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />

             <div className="bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between z-[6000] shrink-0 pt-safe-iphone shadow-sm">
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950"><i className="fas fa-arrow-left"></i></button>
                <div className="text-center">
                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                    <h2 className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{currentStop.name}</h2>
                </div>
                <button onClick={() => setShowItinerary(!showItinerary)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${showItinerary ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-950'}`}>
                    <i className="fas fa-list-ul"></i>
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col relative">
                <div className="h-[35vh] w-full relative z-[100] shrink-0 border-b border-slate-100 bg-slate-200">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={language} onStopSelect={onJumpTo} userLocation={userLocation} />
                </div>
                
                {/* Itinerario Desplegable */}
                {showItinerary && (
                    <div className="absolute top-[35vh] left-0 right-0 bg-white/95 backdrop-blur-xl z-[300] border-b border-slate-200 p-6 animate-fade-in shadow-xl">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{tl.itinerary}</h4>
                        <div className="space-y-3">
                            {tour.stops.map((stop: any, idx: number) => (
                                <button key={idx} onClick={() => { onJumpTo(idx); setShowItinerary(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${idx === currentStopIndex ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                    <span className="text-xs font-black">{idx + 1}</span>
                                    <span className="text-xs font-bold truncate flex-1 text-left">{stop.name}</span>
                                    {idx < currentStopIndex && <i className="fas fa-check-circle text-[10px]"></i>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="px-8 pt-10 pb-40 space-y-8 bg-white rounded-t-[3rem] -mt-10 shadow-[0_-30px_60px_rgba(0,0,0,0.05)] z-[200]">
                    <div className="space-y-4">
                        <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-5">
                            <button 
                                onClick={handleCheckIn}
                                disabled={rewardClaimed}
                                className={`w-full py-4 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${rewardClaimed ? 'bg-green-100 text-green-600' : 'bg-purple-600 text-white shadow-lg'}`}
                            >
                                {rewardClaimed ? tl.checkedIn : tl.checkIn}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-10 text-slate-800 text-lg leading-relaxed font-medium pb-20 pt-4">
                        {currentStop.description.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="animate-fade-in opacity-90">{paragraph}</p>
                        ))}
                    </div>
                </div>
             </div>
             <div className="bg-white/80 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] shrink-0 pb-safe-iphone">
                <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest disabled:opacity-0">Atrás</button>
                <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-2xl">{tl.next}</button>
             </div>
        </div>
    );
};
