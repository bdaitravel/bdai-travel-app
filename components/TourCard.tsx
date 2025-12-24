
import React, { useState } from 'react';
import { Tour, Stop } from '../types';

const getThemeStyles = (themeStr: string) => {
  const theme = themeStr.toLowerCase();
  if (theme.includes('history')) return { badge: 'bg-amber-100 text-amber-900', icon: 'fa-landmark' };
  if (theme.includes('food')) return { badge: 'bg-orange-100 text-orange-900', icon: 'fa-utensils' };
  if (theme.includes('art')) return { badge: 'bg-pink-100 text-pink-900', icon: 'fa-palette' };
  if (theme.includes('nature')) return { badge: 'bg-emerald-100 text-emerald-900', icon: 'fa-leaf' };
  return { badge: 'bg-slate-100 text-slate-900', icon: 'fa-compass' };
};

const UI_TEXT: any = {
    en: { next: "Next", prev: "Back", listen: "Audio Guide", pause: "Pause", checkin: "Check In", collected: "Verified!", stop: "Stop", share: "Share trip", shareIg: "Post to Instagram", photoTitle: "Snapshot Mode", angle: "Angle", time: "Best Time", start: "Start", preview: "Preview", stopPreview: "Stop" },
    es: { next: "Siguiente", prev: "Atrás", listen: "Audio Guía", pause: "Pausar", checkin: "Check In", collected: "¡Verificado!", stop: "Parada", share: "Compartir enlace", shareIg: "Compartir en Instagram", photoTitle: "Modo Foto", angle: "Ángulo", time: "Mejor Hora", start: "Empezar", preview: "Escuchar", stopPreview: "Parar" },
    ca: { next: "Següent", prev: "Enrere", listen: "Àudio Guia", pause: "Aturar", checkin: "Check In", collected: "Verificat!", stop: "Parada", share: "Compartir enllaç", shareIg: "Compartir a Instagram", photoTitle: "Mode Foto", angle: "Angle", time: "Millor Hora", start: "Començar", preview: "Escuchar", stopPreview: "Parar" },
    eu: { next: "Hurrengoa", prev: "Atzera", listen: "Audio Gida", pause: "Gelditu", checkin: "Egiaztatu", collected: "Egiaztatuta!", stop: "Geltokia", share: "Lotura partekatu", shareIg: "Instagramen partekatu", photoTitle: "Argazki Modua", angle: "Angelua", time: "Ordu Onena", start: "Hasi", preview: "Entzun", stopPreview: "Gelditu" },
    fr: { next: "Suivant", prev: "Précédent", listen: "Audio Guide", pause: "Pause", checkin: "Valider", collected: "Vérifié !", stop: "Étape", share: "Partager lien", shareIg: "Partager sur Instagram", photoTitle: "Mode Photo", angle: "Angle", time: "Meilleur Moment", start: "Démarrer", preview: "Écouter", stopPreview: "Arrêter" }
};

interface TourCardProps {
  tour: Tour;
  onSelect: (tour: Tour) => void;
  onPlayAudio: (id: string, text: string) => void;
  isPlayingAudio: boolean;
  isAudioLoading: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  language: string;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, onSelect, onPlayAudio, isPlayingAudio, isAudioLoading, language }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const styles = getThemeStyles(tour.theme);
  const displayImage = tour.imageUrl || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80';
  const t = UI_TEXT[language] || UI_TEXT['es'];

  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer h-full flex flex-col">
      <div className="h-64 relative overflow-hidden bg-slate-200">
        <img src={displayImage} className={`w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setImgLoaded(true)} alt={tour.title} />
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
          <h3 className="text-2xl font-heading font-bold text-slate-900 mb-3 leading-tight group-hover:text-purple-700 transition-colors">{tour.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">{tour.description}</p>
          <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
               <button onClick={(e) => {e.stopPropagation(); onPlayAudio(tour.id, tour.description);}} className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isPlayingAudio ? 'text-red-500' : 'text-slate-400'}`}>
                   {isAudioLoading ? <i className="fas fa-spinner fa-spin"></i> : isPlayingAudio ? <i className="fas fa-stop"></i> : <i className="fas fa-play"></i>}
                   {isPlayingAudio ? t.stopPreview : t.preview}
               </button>
               <span className="text-slate-900 font-bold text-sm">{t.start} <i className="fas fa-arrow-right ml-1"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = (props) => {
    const { tour, currentStopIndex, onNext, onPrev, onPlayAudio, audioPlayingId, audioLoadingId, onCheckIn, language, onShare } = props;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const t = (key: string) => UI_TEXT[language]?.[key] || UI_TEXT['es']?.[key] || key;

    const formatDescription = (text: string) => {
        if (!text) return null;
        const cleanText = text.replace(/\[HISTORIA\]|\[CURIOSIDAD\]|\[CONSEJO\]|Historia:|Curiosidad:|Consejo:|Nota:|Tip:/gi, '').trim();
        
        return cleanText.split('\n\n').map((para, i) => (
            <p key={i} className="mb-6 text-slate-800 leading-relaxed font-medium text-lg first-letter:text-5xl first-letter:font-black first-letter:text-purple-600 first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                {para}
            </p>
        ));
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar">
             <div className="relative h-[40vh] w-full flex-shrink-0">
                <img src={currentStop.imageUrl || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80`} className="w-full h-full object-cover" alt={currentStop.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/40"></div>
                <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-600 text-white shadow-lg">{t('stop')} {currentStopIndex + 1} / {tour.stops.length}</span>
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md text-white border border-white/30">150 points</span>
                    </div>
                    <h1 className="text-4xl font-heading font-black text-white drop-shadow-2xl leading-tight">{currentStop.name}</h1>
                </div>
             </div>
             
             <div className="px-8 pb-32 pt-10">
                 <div className="w-full h-1.5 bg-slate-100 rounded-full mb-10 overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-700 ease-out" style={{ width: `${((currentStopIndex + 1) / tour.stops.length) * 100}%` }}></div>
                 </div>
                 
                 <article className="prose prose-slate max-w-none mb-12">
                    {formatDescription(currentStop.description)}
                 </article>

                 {currentStop.photoSpot && (
                     <div className="mb-12 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-6 text-indigo-200/50 text-6xl transform rotate-12 transition-transform group-hover:scale-110">
                             <i className="fas fa-camera"></i>
                         </div>
                         <div className="flex items-center gap-3 mb-6 relative z-10">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                 <i className="fas fa-camera-retro"></i>
                             </div>
                             <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">{t('photoTitle')}</h4>
                         </div>
                         <div className="grid grid-cols-2 gap-6 relative z-10">
                             <div>
                                 <p className="text-[10px] font-black text-indigo-600 uppercase mb-1 opacity-60">{t('angle')}</p>
                                 <p className="text-sm font-bold text-slate-800 leading-snug">{currentStop.photoSpot.angle}</p>
                             </div>
                             <div>
                                 <p className="text-[10px] font-black text-indigo-600 uppercase mb-1 opacity-60">{t('time')}</p>
                                 <p className="text-sm font-bold text-slate-800 leading-snug">{currentStop.photoSpot.bestTime}</p>
                             </div>
                         </div>
                     </div>
                 )}

                 <div className="grid grid-cols-2 gap-4 mb-12">
                    <button onClick={() => onShare('instagram')} className="flex items-center justify-center gap-3 py-5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                        <i className="fab fa-instagram text-xl"></i>
                        {t('shareIg')}
                    </button>
                    <button onClick={() => onShare('generic')} className="flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                        <i className="fas fa-link text-xl"></i>
                        {t('share')}
                    </button>
                 </div>

                 <div className="space-y-4">
                     <button onClick={() => onCheckIn(currentStop.id, 150)} className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-3 shadow-2xl transition-all transform active:scale-95 ${currentStop.visited ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-600 text-white'}`}>
                         {currentStop.visited ? <><i className="fas fa-check-circle text-lg"></i> {t('collected')}</> : <><i className="fas fa-map-marker-alt text-lg"></i> {t('checkin')} (+150 m)</>}
                     </button>
                     
                     <div className="flex gap-3">
                         <button onClick={() => onPlayAudio(currentStop.id, currentStop.description)} className={`flex-1 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-md border border-slate-200 ${audioPlayingId === currentStop.id ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-slate-700'}`}>
                             {audioLoadingId === currentStop.id ? <i className="fas fa-spinner fa-spin"></i> : audioPlayingId === currentStop.id ? <i className="fas fa-stop"></i> : <i className="fas fa-headphones"></i>}
                             {audioPlayingId === currentStop.id ? t('pause') : t('listen')}
                         </button>
                     </div>

                     <div className="grid grid-cols-2 gap-4 pt-4">
                         <button onClick={onPrev} disabled={currentStopIndex === 0} className="py-5 bg-slate-100 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px] disabled:opacity-30 border border-slate-200">{t('prev')}</button>
                         <button onClick={onNext} className="py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl">{t('next')}</button>
                     </div>
                 </div>
            </div>
        </div>
    );
};
