
import React, { useState } from 'react';
import { Tour, Stop } from '../types';

const getThemeStyles = (themeStr: string) => {
  const theme = themeStr.toLowerCase();
  if (theme.includes('history')) return { badge: 'bg-amber-100 text-amber-900', icon: 'fa-landmark', color: 'from-amber-400 to-orange-600' };
  if (theme.includes('food')) return { badge: 'bg-orange-100 text-orange-900', icon: 'fa-utensils', color: 'from-orange-400 to-red-600' };
  if (theme.includes('art')) return { badge: 'bg-pink-100 text-pink-900', icon: 'fa-palette', color: 'from-pink-400 to-purple-600' };
  if (theme.includes('nature')) return { badge: 'bg-emerald-100 text-emerald-900', icon: 'fa-leaf', color: 'from-emerald-400 to-teal-600' };
  return { badge: 'bg-slate-100 text-slate-900', icon: 'fa-compass', color: 'from-blue-400 to-indigo-600' };
};

const UI_TEXT: any = {
    en: { start: "Start", preview: "Audio Preview", stop: "Stop", stopTag: "Stop", share: "Share to earn", checkin: "Check-in (+150m)", bestTime: "Best time", photoHook: "Instagram Hook", visited: "Place Visited", next: "Next", prev: "Back" },
    es: { start: "Empezar", preview: "Escuchar", stop: "Parar", stopTag: "Parada", share: "Compartir y ganar", checkin: "Hacer Check-in (+150m)", bestTime: "Mejor hora", photoHook: "Gancho Instagram", visited: "Lugar Visitado", next: "Siguiente", prev: "Atrás" },
    ca: { start: "Començar", preview: "Escuchar", stop: "Parar", stopTag: "Parada", share: "Comparteix i guanya", checkin: "Fer Check-in (+150m)", bestTime: "Millor hora", photoHook: "Ganxo Instagram", visited: "Lloc Visitat", next: "Següent", prev: "Enrere" },
    eu: { start: "Hasi", preview: "Entzun", stop: "Gelditu", stopTag: "Geltokia", share: "Partekatu eta irabazi", checkin: "Check-in egin (+150m)", bestTime: "Ordu onena", photoHook: "Instagramerako kouka", visited: "Bisitatutako lekua", next: "Hurrengoa", prev: "Atzera" },
    fr: { start: "Démarrer", preview: "Écouter", stop: "Arrêter", stopTag: "Étape", share: "Partager et gagner", checkin: "Enregistrer (+150m)", bestTime: "Meilleur moment", photoHook: "Accroche Insta", visited: "Lieu Visité", next: "Suivant", prev: "Retour" }
};

const ImageFallback = ({ city, icon, colorClass }: { city: string, icon: string, colorClass: string }) => (
    <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex flex-col items-center justify-center p-6 text-white/90`}>
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl mb-4 border border-white/30 shadow-2xl">
            <i className={`fas ${icon}`}></i>
        </div>
        <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-1">TechTravel Guide</span>
        <h4 className="text-2xl font-black text-center leading-tight tracking-tighter drop-shadow-md">{city}</h4>
    </div>
);

export const TourCard: React.FC<any> = ({ tour, onSelect, onPlayAudio, isPlayingAudio, isAudioLoading, language }) => {
  const [imgError, setImgError] = useState(false);
  const styles = getThemeStyles(tour.theme);
  const t = UI_TEXT[language] || UI_TEXT['es'];

  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer h-full flex flex-col">
      <div className="h-56 relative overflow-hidden bg-slate-200">
        {!imgError && tour.imageUrl ? (
            <img src={tour.imageUrl} onError={() => setImgError(true)} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" alt={tour.title} />
        ) : (
            <ImageFallback city={tour.city} icon={styles.icon} colorClass={styles.color} />
        )}
        <div className="absolute top-4 left-4">
             <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg ${styles.badge} backdrop-blur-md bg-opacity-90`}>
                 <i className={`fas ${styles.icon} mr-1`}></i> {tour.theme}
             </span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
          <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-lg bg-slate-50 text-xs font-bold text-slate-500 flex items-center gap-1.5"><i className="fas fa-clock text-slate-400"></i> {tour.duration}</span>
              <span className="px-3 py-1 rounded-lg bg-slate-50 text-xs font-bold text-slate-500 flex items-center gap-1.5"><i className="fas fa-walking text-slate-400"></i> {tour.distance}</span>
          </div>
          <h3 className="text-xl font-heading font-black text-slate-900 mb-3 leading-tight group-hover:text-purple-700 transition-colors">{tour.title}</h3>
          <p className="text-slate-500 text-[11px] leading-relaxed mb-6 line-clamp-3 font-medium">{tour.description}</p>
          <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
               <button onClick={(e) => {e.stopPropagation(); onPlayAudio(tour.id, tour.description);}} className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isPlayingAudio ? 'text-red-500' : 'text-slate-400'}`}>
                   {isAudioLoading ? <i className="fas fa-spinner fa-spin"></i> : isPlayingAudio ? <i className="fas fa-stop"></i> : <i className="fas fa-play"></i>}
                   {isPlayingAudio ? t.stop : t.preview}
               </button>
               <span className="text-slate-900 font-black text-[10px] uppercase tracking-widest">{t.start} <i className="fas fa-arrow-right ml-1"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = (props) => {
    const { tour, currentStopIndex, onNext, onPrev, onPlayAudio, audioPlayingId, audioLoadingId, onCheckIn, onShare, language } = props;
    const [imgError, setImgError] = useState(false);
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const styles = getThemeStyles(tour.theme);
    const t = UI_TEXT[language] || UI_TEXT['es'];

    const isPlaying = audioPlayingId === currentStop.id;
    const isLoading = audioLoadingId === currentStop.id;

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar">
             <div className="relative h-[40vh] w-full flex-shrink-0 bg-slate-100">
                {!imgError && currentStop.imageUrl ? (
                    <img src={currentStop.imageUrl} onError={() => setImgError(true)} className="w-full h-full object-cover" alt={currentStop.name} />
                ) : (
                    <ImageFallback city={currentStop.name} icon={styles.icon} colorClass={styles.color} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
                <div className="absolute top-6 right-6">
                    <button onClick={() => onPlayAudio(currentStop.id, currentStop.description)} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all transform active:scale-90 ${isPlaying ? 'bg-red-500 text-white' : 'bg-white text-slate-900'}`}>
                        {isLoading ? <i className="fas fa-spinner fa-spin"></i> : isPlaying ? <i className="fas fa-stop"></i> : <i className="fas fa-play text-xl pl-1"></i>}
                    </button>
                </div>
                <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-[8px] font-black text-white uppercase tracking-widest border border-white/20">{t.stopTag} {currentStopIndex + 1}/{tour.stops.length}</span>
                    </div>
                    <h1 className="text-3xl font-heading font-black text-white drop-shadow-xl leading-tight">{currentStop.name}</h1>
                </div>
             </div>
             
             <div className="px-8 pb-32 pt-8">
                 <article className="text-slate-800 leading-relaxed font-medium text-lg mb-10">
                    {currentStop.description}
                 </article>

                 {currentStop.photoSpot && (
                     <div className="mb-10 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-[2.5rem] p-6 shadow-sm overflow-hidden relative">
                         <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
                         <div className="flex items-center gap-3 mb-4">
                             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-sm"><i className="fas fa-camera"></i></div>
                             <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Spot de Foto Ideal</h4>
                         </div>
                         <div className="grid grid-cols-2 gap-4 mb-6">
                             <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.bestTime}</p>
                                 <p className="text-xs font-bold text-slate-800">{currentStop.photoSpot.bestTime}</p>
                             </div>
                             <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.photoHook}</p>
                                 <p className="text-xs font-bold text-slate-800 italic">#{currentStop.photoSpot.instagramHook}</p>
                             </div>
                         </div>
                         <button onClick={() => onShare('instagram')} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                             <i className="fab fa-instagram text-lg"></i>
                             {t.share} (+150m)
                         </button>
                     </div>
                 )}
                 
                 <div className="space-y-4">
                     <button onClick={() => onCheckIn(currentStop.id, 150)} className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl transition-all transform active:scale-95 ${currentStop.visited ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white'}`}>
                         {currentStop.visited ? <i className="fas fa-check-circle text-lg"></i> : <i className="fas fa-map-marker-alt text-lg"></i>}
                         {currentStop.visited ? t.visited : t.checkin}
                     </button>
                     
                     <div className="grid grid-cols-2 gap-4">
                         <button onClick={onPrev} disabled={currentStopIndex === 0} className="py-5 bg-slate-100 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px] disabled:opacity-30">{t.prev}</button>
                         <button onClick={onNext} className="py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl">{t.next}</button>
                     </div>
                 </div>
            </div>
        </div>
    );
};
