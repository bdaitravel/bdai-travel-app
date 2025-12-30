
import React from 'react';
import { Tour, Stop } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText } from '../services/geminiService';

const UI_TEXT: any = {
    en: { start: "Start", stop: "Stop", stopTag: "Stop", checkin: "Check-in (+150m)", visited: "Explored", next: "Next", prev: "Back", bestAngle: "Best Angle", bestTime: "Golden Hour", hook: "Social Hook", share: "Share Discovery", listen: "Listen to Dai" },
    es: { start: "Empezar", stop: "Parar", stopTag: "Parada", checkin: "Hacer Check-in (+150m)", visited: "Explorado", next: "Siguiente", prev: "Atrás", bestAngle: "Ángulo Perfecto", bestTime: "Momento Ideal", hook: "Hook Social", share: "Compartir Hallazgo", listen: "Escuchar a Dai" },
    ca: { start: "Començar", stop: "Parar", stopTag: "Parada", checkin: "Check-in (+150m)", visited: "Explorat", next: "Següent", prev: "Enrere", bestAngle: "Angle Perfecte", bestTime: "Moment Ideal", hook: "Hook Social", share: "Compartir", listen: "Escolta la Dai" },
    eu: { start: "Hasi", stop: "Gelditu", stopTag: "Geltokia", checkin: "Check-in (+150m)", visited: "Arakatuta", next: "Hurrengoa", prev: "Atzera", bestAngle: "Angelu Ona", bestTime: "Ordurik Onena", hook: "Hook Soziala", share: "Partekatu", listen: "Dai entzun" },
    fr: { start: "Démarrer", stop: "Arrêter", stopTag: "Étape", checkin: "Enregistrer (+150m)", visited: "Exploré", next: "Suivant", prev: "Retour", bestAngle: "Meilleur Angle", bestTime: "Heure Idéale", hook: "Hook Social", share: "Partager", listen: "Écouter Dai" }
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language }) => {
  const t = UI_TEXT[language] || UI_TEXT['es'];
  const fallbackImg = `https://images.unsplash.com/photo-1543783232-261f9107558e?auto=format&fit=crop&w=800&q=80`;

  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 cursor-pointer h-full flex flex-col">
      <div className="h-48 relative overflow-hidden bg-slate-200">
        <img src={tour.imageUrl || fallbackImg} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={tour.title} />
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-6 left-6">
             <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl bg-white text-slate-900 backdrop-blur-md bg-opacity-95">
                 <i className="fas fa-robot mr-2"></i> {tour.theme}
             </span>
        </div>
      </div>
      <div className="p-8 flex flex-col flex-1">
          <h3 className="text-2xl font-heading font-black text-slate-900 mb-4 leading-tight group-hover:text-purple-700 uppercase tracking-tighter">{tour.title}</h3>
          <p className="text-slate-500 text-xs leading-relaxed mb-8 line-clamp-3 font-medium opacity-80">{tour.description}</p>
          <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><i className="fas fa-clock mr-2"></i> {tour.duration}</span>
               <span className="text-slate-900 font-black text-[10px] uppercase tracking-[0.2em]">{t.start} <i className="fas fa-chevron-right ml-2"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, currentStopIndex, onNext, onPrev, onPlayAudio, audioPlayingId, audioLoadingId, userLocation, onCheckIn, language }) => {
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const t = UI_TEXT[language] || UI_TEXT['es'];
    const isPlaying = audioPlayingId === currentStop.id;
    const isLoading = audioLoadingId === currentStop.id;

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar pb-80">
             <div className="relative h-[45vh] w-full flex-shrink-0 bg-slate-100">
                <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} userLocation={userLocation} />
                <div className="absolute bottom-8 right-8 z-[400] flex flex-col items-center gap-3">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-900 bg-white/90 px-3 py-1 rounded-full shadow-sm">{t.listen}</span>
                    <button onClick={() => onPlayAudio(currentStop.id, currentStop.description)} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isPlaying ? 'bg-red-600 text-white animate-pulse' : 'bg-purple-600 text-white'}`}>
                        {isLoading ? <i className="fas fa-spinner fa-spin"></i> : isPlaying ? <i className="fas fa-stop text-xl"></i> : <i className="fas fa-volume-up text-xl"></i>}
                    </button>
                </div>
             </div>
             <div className="px-8 pt-8">
                <span className="px-4 py-2 bg-slate-900 rounded-full text-[10px] font-black text-white uppercase tracking-widest">{t.stopTag} {currentStopIndex + 1}/{tour.stops.length}</span>
                <h1 className="text-4xl font-heading font-black text-slate-900 tracking-tighter leading-tight uppercase my-6">{currentStop.name}</h1>
                <div className="space-y-6">
                    {currentStop.description.split('\n').map((line, idx) => {
                        const clean = cleanDescriptionText(line);
                        return clean ? <p key={idx} className="text-slate-700 text-lg leading-relaxed font-medium">{clean}</p> : null;
                    })}
                </div>
             </div>
             <div className="fixed bottom-12 left-8 right-8 z-[500] space-y-4">
                 <button onClick={() => onCheckIn(currentStop.id, 150)} className={`w-full py-10 rounded-[3rem] font-black uppercase tracking-[0.4em] text-sm flex items-center justify-center gap-4 shadow-2xl border-4 transition-all ${currentStop.visited ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-purple-600 border-purple-500 text-white'}`}>
                    {currentStop.visited ? t.visited : t.checkin}
                 </button>
                 <div className="grid grid-cols-2 gap-4">
                     <button onClick={onPrev} disabled={currentStopIndex === 0} className="py-8 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs disabled:opacity-30">{t.prev}</button>
                     <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="py-8 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs disabled:opacity-30">{t.next}</button>
                 </div>
             </div>
        </div>
    );
};
