
import React, { useState, useMemo } from 'react';
import { Tour, Stop } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText } from '../services/geminiService';

const getThemeStyles = (themeStr: string) => {
  const theme = themeStr.toLowerCase();
  if (theme.includes('history')) return { badge: 'bg-amber-100 text-amber-900', icon: 'fa-landmark', color: 'from-amber-400 to-orange-600' };
  if (theme.includes('food')) return { badge: 'bg-orange-100 text-orange-900', icon: 'fa-utensils', color: 'from-orange-400 to-red-600' };
  if (theme.includes('art')) return { badge: 'bg-pink-100 text-pink-900', icon: 'fa-palette', color: 'from-pink-400 to-purple-600' };
  if (theme.includes('nature')) return { badge: 'bg-emerald-100 text-emerald-900', icon: 'fa-leaf', color: 'from-emerald-400 to-teal-600' };
  return { badge: 'bg-slate-100 text-slate-900', icon: 'fa-compass', color: 'from-blue-400 to-indigo-600' };
};

const UI_TEXT: any = {
    en: { start: "Start", stop: "Stop", stopTag: "Stop", checkin: "Check-in (+150m)", visited: "Explored", next: "Next", prev: "Back", bestAngle: "Best Angle", bestTime: "Golden Hour", hook: "Social Hook", share: "Share Discovery" },
    es: { start: "Empezar", stop: "Parar", stopTag: "Parada", checkin: "Hacer Check-in (+150m)", visited: "Explorado", next: "Siguiente", prev: "Atrás", bestAngle: "Ángulo Perfecto", bestTime: "Momento Ideal", hook: "Hook Social", share: "Compartir Hallazgo" },
    ca: { start: "Començar", stop: "Parar", stopTag: "Parada", checkin: "Check-in (+150m)", visited: "Explorat", next: "Següent", prev: "Enrere", bestAngle: "Angle Perfecte", bestTime: "Moment Ideal", hook: "Hook Social", share: "Compartir" },
    eu: { start: "Hasi", stop: "Gelditu", stopTag: "Geltokia", checkin: "Check-in (+150m)", visited: "Arakatuta", next: "Hurrengoa", prev: "Atzera", bestAngle: "Angelu Ona", bestTime: "Ordurik Onena", hook: "Hook Soziala", share: "Partekatu" },
    fr: { start: "Démarrer", stop: "Arrêter", stopTag: "Étape", checkin: "Enregistrer (+150m)", visited: "Exploré", next: "Suivant", prev: "Retour", bestAngle: "Meilleur Angle", bestTime: "Heure Idéale", hook: "Hook Social", share: "Partager" }
};

export const TourCard: React.FC<any> = ({ tour, onSelect, onPlayAudio, isPlayingAudio, isAudioLoading, language }) => {
  const styles = getThemeStyles(tour.theme);
  const t = UI_TEXT[language] || UI_TEXT['es'];
  const fallbackImg = `https://images.unsplash.com/photo-1543783232-261f9107558e?auto=format&fit=crop&w=800&q=80`;

  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 cursor-pointer h-full flex flex-col">
      <div className="h-48 relative overflow-hidden bg-slate-200">
        <img src={tour.imageUrl || fallbackImg} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={tour.title} />
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-6 left-6">
             <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl ${styles.badge} backdrop-blur-md bg-opacity-95`}>
                 <i className={`fas ${styles.icon} mr-2`}></i> {tour.theme}
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

export const ActiveTourCard: React.FC<any> = (props) => {
    const { tour, currentStopIndex, onNext, onPrev, onPlayAudio, audioPlayingId, audioLoadingId, userLocation, onCheckIn, onShare, language } = props;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const t = UI_TEXT[language] || UI_TEXT['es'];
    const isPlaying = audioPlayingId === currentStop.id;
    const isLoading = audioLoadingId === currentStop.id;

    const renderDescription = () => {
        const parts = currentStop.description.split('\n');

        return parts.map((line, idx) => {
            const cleanLine = cleanDescriptionText(line);
            if (!cleanLine) return null;

            // Tipografía Inter unificada para legibilidad superior
            return (
                <p key={idx} className="mb-6 text-slate-700 text-lg leading-relaxed font-sans font-medium text-left">
                    {cleanLine}
                </p>
            );
        });
    };

    return (
        <div id="tour-content-scroll" className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar pb-80 scroll-smooth">
             <div className="relative h-[45vh] w-full flex-shrink-0 bg-slate-100">
                <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} userLocation={userLocation} />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                
                <div className="absolute bottom-8 right-8 z-[400]">
                    <button onClick={() => onPlayAudio(currentStop.id, currentStop.description, currentStopIndex)} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isPlaying ? 'bg-red-600 text-white animate-pulse' : 'bg-purple-600 text-white'}`}>
                        {isLoading ? <i className="fas fa-spinner fa-spin"></i> : isPlaying ? <i className="fas fa-stop text-xl"></i> : <i className="fas fa-volume-up text-xl"></i>}
                    </button>
                </div>
             </div>
             
             <div className="px-8 pt-4">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-2 bg-slate-900 rounded-full text-[10px] font-black text-white uppercase tracking-widest">{t.stopTag} {currentStopIndex + 1}/{tour.stops.length}</span>
                </div>
                <h1 className="text-4xl font-heading font-black text-slate-900 tracking-tighter leading-tight uppercase mb-8">{currentStop.name}</h1>
                
                <div className="relative">
                    {renderDescription()}
                </div>

                {/* Photo Spot */}
                {currentStop.photoSpot && (
                    <div className="mt-16 mb-12 p-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-[3rem] border border-purple-100 shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 text-9xl text-purple-200/20 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <i className="fas fa-camera-retro"></i>
                        </div>
                        <div className="space-y-6 relative z-10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-purple-600 shadow-sm"><i className="fas fa-compress-arrows-alt"></i></div>
                                <div><p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-1">{t.bestAngle}</p><p className="text-lg font-bold text-slate-800">{currentStop.photoSpot.angle}</p></div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm"><i className="fas fa-sun"></i></div>
                                <div><p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">{t.bestTime}</p><p className="text-lg font-bold text-slate-800">{currentStop.photoSpot.bestTime}</p></div>
                            </div>
                            <div className="p-5 bg-white rounded-2xl border border-purple-100 shadow-inner italic text-slate-600 font-serif text-lg leading-relaxed">
                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-3 non-italic not-italic">{t.hook}</p>
                                "{currentStop.photoSpot.instagramHook}"
                            </div>
                        </div>
                    </div>
                )}

                {/* Redes Sociales */}
                <div className="mt-12 mb-16 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">{t.share}</p>
                    <div className="flex justify-center gap-6">
                        <button onClick={() => onShare('instagram')} className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"><i className="fab fa-instagram text-2xl"></i></button>
                        <button onClick={() => onShare('tiktok')} className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"><i className="fab fa-tiktok text-2xl"></i></button>
                        <button onClick={() => onShare('facebook')} className="w-14 h-14 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"><i className="fab fa-facebook-f text-2xl"></i></button>
                    </div>
                </div>
             </div>

             <div className="fixed bottom-12 left-8 right-8 z-[500] space-y-4">
                 <button 
                    disabled={currentStop.visited}
                    onClick={() => onCheckIn(currentStop.id, 150)} 
                    className={`w-full py-10 rounded-[3rem] font-black uppercase tracking-[0.4em] text-sm flex items-center justify-center gap-4 shadow-2xl border-4 transition-all active:scale-95 ${currentStop.visited ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-purple-600 border-purple-500 text-white'}`}
                 >
                    {currentStop.visited ? <i className="fas fa-check-double text-2xl"></i> : <i className="fas fa-map-pin text-2xl"></i>}
                    {currentStop.visited ? t.visited : t.checkin}
                 </button>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <button onClick={onPrev} disabled={currentStopIndex === 0} className="py-8 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs border border-white/10 active:scale-95 disabled:opacity-30">{t.prev}</button>
                     <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="py-8 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs border border-white/10 active:scale-95 disabled:opacity-30">{t.next}</button>
                 </div>
             </div>
        </div>
    );
};
