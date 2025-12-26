
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
    en: { start: "Start", preview: "Audio Preview", stop: "Stop", stopTag: "Stop", share: "Share to earn", checkin: "Check-in (+150m)", bestTime: "Best time", photoHook: "Instagram Hook", visited: "Place Visited", next: "Next", prev: "Back", secretTitle: "Secret Insider Spot", secretUnlock: "Tap to reveal hidden spot" },
    es: { start: "Empezar", preview: "Escuchar", stop: "Parar", stopTag: "Parada", share: "Compartir y ganar", checkin: "Hacer Check-in (+150m)", bestTime: "Mejor hora", photoHook: "Gancho Instagram", visited: "Lugar Visitado", next: "Siguiente", prev: "Atrás", secretTitle: "Spot Secreto Insider", secretUnlock: "Pulsa para revelar el sitio oculto" },
    ca: { start: "Començar", preview: "Escuchar", stop: "Parar", stopTag: "Parada", share: "Comparteix i guanya", checkin: "Fer Check-in (+150m)", bestTime: "Millor hora", photoHook: "Ganxo Instagram", visited: "Lloc Visitat", next: "Següent", prev: "Enrere", secretTitle: "Spot Secret Insider", secretUnlock: "Prem per revelar el lloc ocult" },
    eu: { start: "Hasi", preview: "Entzun", stop: "Gelditu", stopTag: "Geltokia", share: "Partekatu eta irabazi", checkin: "Check-in egin (+150m)", bestTime: "Ordu onena", photoHook: "Instagramerako kouka", visited: "Bisitatutako lekua", next: "Hurrengoa", prev: "Atzera", secretTitle: "Ezkutuko Spot-a", secretUnlock: "Sakatu ezkutuko tokia ikusteko" },
    fr: { start: "Démarrer", preview: "Écouter", stop: "Arrêter", stopTag: "Étape", share: "Partager et gagner", checkin: "Enregistrer (+150m)", bestTime: "Meilleur moment", photoHook: "Accroche Insta", visited: "Lieu Visité", next: "Suivant", prev: "Retour", secretTitle: "Spot Secret Insider", secretUnlock: "Appuyez para révéler le lieu caché" }
};

const ImageFallback = ({ city, icon, colorClass }: { city: string, icon: string, colorClass: string }) => (
    <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex flex-col items-center justify-center p-6 text-white/90`}>
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl mb-4 border border-white/30 shadow-2xl">
            <i className={`fas ${icon}`}></i>
        </div>
        <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-1">bdai Guide</span>
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
               <button onClick={(e) => {e.stopPropagation(); if (onPlayAudio) onPlayAudio(tour.id, tour.description);}} className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isPlayingAudio ? 'text-red-500' : 'text-slate-400'}`}>
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
    const [showSecret, setShowSecret] = useState(false);
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const styles = getThemeStyles(tour.theme);
    const t = UI_TEXT[language] || UI_TEXT['es'];

    const isPlaying = audioPlayingId === currentStop.id;
    const isLoading = audioLoadingId === currentStop.id;

    React.useEffect(() => { 
        setShowSecret(false); 
        const container = document.getElementById('tour-content-scroll');
        if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStopIndex]);

    return (
        <div id="tour-content-scroll" className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar scroll-smooth">
             <div className="relative h-[40vh] w-full flex-shrink-0 bg-slate-100">
                {!imgError && currentStop.imageUrl ? (
                    <img src={currentStop.imageUrl} onError={() => setImgError(true)} className="w-full h-full object-cover" alt={currentStop.name} />
                ) : (
                    <ImageFallback city={currentStop.name} icon={styles.icon} colorClass={styles.color} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
                <div className="absolute top-6 right-6">
                    <button onClick={() => onPlayAudio && onPlayAudio(currentStop.id, currentStop.description)} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all transform active:scale-90 ${isPlaying ? 'bg-red-500 text-white' : 'bg-white text-slate-900'}`}>
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
             
             <div className="px-8 pb-40 pt-10">
                 <div className="relative">
                    <article className="prose prose-slate max-w-none">
                        <div className="text-slate-800 leading-[2.1] font-serif text-xl mb-12 whitespace-pre-wrap selection:bg-amber-100 tracking-tight">
                            {currentStop.description.split('\n\n').map((para: string, i: number) => (
                                <p key={i} className="mb-8 drop-shadow-sm first-letter:text-4xl first-letter:font-black first-letter:mr-1 first-letter:text-purple-600">
                                    {para}
                                </p>
                            ))}
                        </div>
                    </article>
                    <div className="h-20 -mt-20 pointer-events-none bg-gradient-to-t from-white to-transparent opacity-40"></div>
                 </div>

                 {currentStop.photoSpot && (
                     <div className="mb-12 relative overflow-hidden">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border-2 border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-500 flex items-center justify-center text-slate-900 shadow-lg animate-pulse text-xl"><i className="fas fa-camera-retro"></i></div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest">{t.secretTitle}</h4>
                                </div>
                            </div>
                            
                            {!showSecret ? (
                                <button 
                                    onClick={() => setShowSecret(true)}
                                    className="w-full py-10 bg-white/5 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-3 group hover:bg-white/10 transition-all active:scale-[0.98]"
                                >
                                    <i className="fas fa-eye text-white/10 text-3xl group-hover:scale-110 transition-transform"></i>
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{t.secretUnlock}</span>
                                </button>
                            ) : (
                                <div className="animate-fade-in space-y-6">
                                    <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                        <p className="text-yellow-400 text-sm font-black italic leading-relaxed">
                                            "{currentStop.photoSpot.secretLocation}"
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.bestTime}</p>
                                            <p className="text-xs font-bold text-white flex items-center gap-2"><i className="far fa-clock text-yellow-500"></i> {currentStop.photoSpot.bestTime}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.photoHook}</p>
                                            <p className="text-xs font-bold text-purple-400 italic">#{currentStop.photoSpot.instagramHook}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => onShare && onShare('instagram')} className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                                        <i className="fab fa-instagram text-xl"></i>
                                        {t.share} (+150m)
                                    </button>
                                </div>
                            )}
                        </div>
                     </div>
                 )}
                 
                 <div className="space-y-4">
                     <button onClick={() => onCheckIn && onCheckIn(currentStop.id, 150)} className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 shadow-2xl transition-all transform active:scale-95 ${currentStop.visited ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white'}`}>
                         {currentStop.visited ? <i className="fas fa-check-circle text-xl"></i> : <i className="fas fa-map-marker-alt text-xl"></i>}
                         {currentStop.visited ? t.visited : t.checkin}
                     </button>
                     <div className="grid grid-cols-2 gap-4">
                         <button onClick={onPrev} disabled={currentStopIndex === 0} className="py-6 bg-slate-100 text-slate-400 rounded-[2.2rem] font-black uppercase tracking-widest text-[10px] disabled:opacity-30 transition-all active:bg-slate-200">{t.prev}</button>
                         <button onClick={onNext} className="py-6 bg-purple-600 text-white rounded-[2.2rem] font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 active:bg-purple-700">{t.next}</button>
                     </div>
                 </div>
            </div>
        </div>
    );
};
