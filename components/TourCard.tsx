
import React, { useState, useEffect } from 'react';
import { Tour, Stop } from '../types';
import { generateImage } from '../services/geminiService';

const getThemeStyles = (themeStr: string) => {
  const theme = themeStr.toLowerCase();
  if (theme.includes('history')) return { badge: 'bg-amber-100 text-amber-900', icon: 'fa-landmark' };
  if (theme.includes('food')) return { badge: 'bg-orange-100 text-orange-900', icon: 'fa-utensils' };
  if (theme.includes('art')) return { badge: 'bg-pink-100 text-pink-900', icon: 'fa-palette' };
  if (theme.includes('nature')) return { badge: 'bg-emerald-100 text-emerald-900', icon: 'fa-leaf' };
  return { badge: 'bg-slate-100 text-slate-900', icon: 'fa-compass' };
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI/180; 
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const UI_TEXT: any = {
    en: { next: "Next", prev: "Back", listen: "Audio Guide", pause: "Pause", checkin: "Check In", collected: "Verified!", tooFar: "Too far", stop: "Stop", deepDive: "AI Deep Dive", enriching: "Investigating with AI...", tips: "Tour Prep", safety: "Safety Tip", wifi: "WiFi Tip", photoMission: "Perfect Photo Spot", bestAngle: "Ideal Angle", bestTime: "Prime Timing", hashtag: "Hashtag", copyTags: "Copy Tags", photoMissions: "Photo Missions available" },
    es: { next: "Siguiente", prev: "Atrás", listen: "Guía de Audio", pause: "Pausar", checkin: "Check In", collected: "Verificado!", tooFar: "Lejos", stop: "Parada", deepDive: "Inmersión IA", enriching: "Investigando con IA...", tips: "Preparación", safety: "Seguridad", wifi: "Consejo WiFi", photoMission: "Punto Fotográfico Perfecto", bestAngle: "Ángulo Ideal", bestTime: "Mejor Momento", hashtag: "Hashtag", copyTags: "Copiar Etiquetas", photoMissions: "Misiones fotográficas disponibles" }
};

interface TourCardProps {
  tour: Tour;
  onSelect: (tour: Tour) => void;
  onPlayAudio: (tour: Tour) => void;
  isPlayingAudio: boolean;
  isAudioLoading: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, onSelect, onPlayAudio, isPlayingAudio, isAudioLoading, isFavorite, onToggleFavorite }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const styles = getThemeStyles(tour.theme);
  
  const displayImage = tour.imageUrl || aiImage || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80';

  useEffect(() => {
    let isMounted = true;
    if (!tour.imageUrl && !aiImage) {
        generateImage(`${tour.title} landmark in ${tour.city}`).then(url => {
            if (isMounted && url) setAiImage(url);
        });
    }
    return () => { isMounted = false; };
  }, [tour.id, tour.city, tour.title]);

  const hasPhotoSpots = tour.stops.some(s => !!s.photoSpot);

  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer h-full flex flex-col">
      <div className="h-64 relative overflow-hidden bg-slate-200">
        <img 
            src={displayImage} 
            className={`w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            alt={tour.title}
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
             <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg ${styles.badge} backdrop-blur-md bg-opacity-90`}>
                 <i className={`fas ${styles.icon} mr-1`}></i> {tour.theme}
             </span>
             {hasPhotoSpots && (
                 <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg bg-pink-500 text-white backdrop-blur-md bg-opacity-90">
                     <i className="fas fa-camera mr-1"></i> Photo Missions
                 </span>
             )}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
          <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <i className="fas fa-clock text-slate-400"></i> {tour.duration}
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <i className="fas fa-walking text-slate-400"></i> {tour.distance}
              </span>
          </div>
          <h3 className="text-2xl font-heading font-bold text-slate-900 mb-3 leading-tight group-hover:text-purple-700 transition-colors">{tour.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">{tour.description}</p>
          <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
               <button onClick={(e) => {e.stopPropagation(); onPlayAudio(tour);}} className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isPlayingAudio ? 'text-red-500' : 'text-slate-400'}`}>
                   {isAudioLoading ? <i className="fas fa-spinner fa-spin"></i> : isPlayingAudio ? <i className="fas fa-stop"></i> : <i className="fas fa-play"></i>}
                   {isPlayingAudio ? 'Stop' : 'Preview'}
               </button>
               <span className="text-slate-900 font-bold text-sm">Start <i className="fas fa-arrow-right ml-1"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = (props) => {
    const { tour, currentStopIndex, onNext, onPrev, onPlayAudio, audioPlayingId, audioLoadingId, onCheckIn, userLocation, onEnrichStop, language } = props;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const t = (key: string) => UI_TEXT[language]?.[key] || UI_TEXT['en']?.[key] || key;

    const [distance, setDistance] = useState<number | null>(null);
    const [isEnriching, setIsEnriching] = useState(false);

    useEffect(() => {
        if (userLocation && currentStop.latitude && currentStop.longitude) {
            const dist = calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude);
            setDistance(Math.round(dist));
        }
    }, [userLocation, currentStop]);

    const handleDeepDive = async () => {
        setIsEnriching(true);
        await onEnrichStop(currentStop.id);
        setIsEnriching(false);
    };

    const formatDescription = (text: string) => {
        if (!text) return null;
        return text.split('\n').filter(l => l.trim()).map((line, i) => {
            if (line.includes('[HOOK]')) return <p key={i} className="mb-6 text-xl font-heading font-black text-slate-900 leading-tight border-l-4 border-purple-500 pl-4">{line.replace('[HOOK]', '').trim()}</p>;
            if (line.includes('[STORY]')) return <div key={i} className="mb-6 text-slate-700 leading-relaxed font-medium">{line.replace('[STORY]', '').trim()}</div>;
            if (line.includes('[SECRET]')) return (
                <div key={i} className="mb-6 bg-slate-900 text-white p-5 rounded-2xl relative overflow-hidden group border border-slate-800">
                    <i className="fas fa-mask absolute -right-2 -bottom-2 text-5xl text-white/5 rotate-12"></i>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-2">Secret</p>
                    <p className="text-sm font-medium leading-relaxed italic">{line.replace('[SECRET]', '').trim()}</p>
                </div>
            );
            if (line.includes('[SMART_TIP]')) return (
                <div key={i} className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm"><i className="fas fa-bolt"></i></div>
                    <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Pro Tip</p>
                        <p className="text-xs text-blue-900 font-bold leading-tight">{line.replace('[SMART_TIP]', '').trim()}</p>
                    </div>
                </div>
            );
            return <p key={i} className="mb-4 text-slate-600 leading-relaxed font-medium">{line}</p>;
        });
    };

    const handleCopyHashtag = (tag: string) => {
        navigator.clipboard.writeText(`#${tag.replace(/\s+/g, '')}`);
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar">
             <div className="relative h-72 w-full flex-shrink-0">
                <img 
                    src={currentStop.imageUrl || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80`} 
                    className="w-full h-full object-cover" 
                    alt={currentStop.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
                <div className="absolute bottom-6 left-6 right-6">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 bg-white/90 backdrop-blur shadow-sm border border-white text-slate-800">
                         {t('stop')} {currentStopIndex + 1} / {tour.stops.length}
                    </span>
                    <h1 className="text-3xl font-heading font-black text-white drop-shadow-lg leading-tight">{currentStop.name}</h1>
                </div>
             </div>

             <div className="px-6 pb-12 pt-8">
                 {/* Progress Bar */}
                 <div className="w-full h-1 bg-slate-100 rounded-full mb-8 overflow-hidden">
                     <div className="h-full bg-purple-600 transition-all duration-500" style={{ width: `${((currentStopIndex + 1) / tour.stops.length) * 100}%` }}></div>
                 </div>

                 {/* Tour Prep Info */}
                 {(tour.safetyTip || tour.wifiTip) && currentStopIndex === 0 && (
                     <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('tips')}</h4>
                         {tour.safetyTip && (
                             <div className="flex items-start gap-2 text-xs">
                                 <i className="fas fa-shield-alt text-red-400 mt-0.5"></i>
                                 <p><span className="font-bold">{t('safety')}:</span> {tour.safetyTip}</p>
                             </div>
                         )}
                         {tour.wifiTip && (
                             <div className="flex items-start gap-2 text-xs">
                                 <i className="fas fa-wifi text-blue-400 mt-0.5"></i>
                                 <p><span className="font-bold">{t('wifi')}:</span> {tour.wifiTip}</p>
                             </div>
                         )}
                     </div>
                 )}

                 {distance !== null && (
                     <div className="flex items-center gap-2 mb-6">
                         <div className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-2 ${distance < 300 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                             <i className="fas fa-location-arrow"></i>
                             {distance}m away
                         </div>
                     </div>
                 )}

                 <div className="prose prose-slate max-w-none mb-10">
                     {formatDescription(currentStop.description)}
                 </div>

                 {!currentStop.isRichInfo && (
                     <button 
                        onClick={handleDeepDive}
                        disabled={isEnriching}
                        className="w-full mb-10 py-5 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                     >
                        {isEnriching ? <><i className="fas fa-spinner fa-spin"></i> {t('enriching')}</> : <><i className="fas fa-brain"></i> {t('deepDive')}</>}
                     </button>
                 )}

                 {/* Photo Spot Feature */}
                 {currentStop.photoSpot && (
                     <div className="mb-10 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 p-[1px] rounded-[2.5rem] shadow-2xl overflow-hidden">
                        <div className="bg-white rounded-[2.45rem] p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-lg font-heading font-black text-slate-900 lowercase tracking-tighter">
                                    <i className="fas fa-camera-retro text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mr-2"></i>
                                    {t('photoMission')}
                                </h4>
                                <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    +{currentStop.photoSpot.milesReward} Milas
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4 mb-6">
                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                                        <i className="fas fa-vector-square"></i>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t('bestAngle')}</p>
                                        <p className="text-xs font-bold text-slate-800">{currentStop.photoSpot.angle}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400">
                                        <i className="fas fa-sun"></i>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t('bestTime')}</p>
                                        <p className="text-xs font-bold text-slate-800">{currentStop.photoSpot.bestTime}</p>
                                    </div>
                                </div>
                            </div>

                            {currentStop.photoSpot.instagramHook && (
                                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white">
                                    <div className="flex items-center gap-3">
                                        <i className="fab fa-instagram text-xl text-pink-400"></i>
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">{t('hashtag')}</p>
                                            <p className="text-sm font-black tracking-tight">#{currentStop.photoSpot.instagramHook.replace(/\s+/g, '')}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleCopyHashtag(currentStop.photoSpot!.instagramHook)}
                                        className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                    >
                                        <i className="fas fa-copy text-xs"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                     </div>
                 )}

                 {currentStop.curiosity && (
                     <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl mb-10">
                         <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">Did you know?</p>
                         <p className="text-amber-900 font-bold leading-relaxed italic">"{currentStop.curiosity}"</p>
                     </div>
                 )}

                 <div className="space-y-4">
                     <button 
                        onClick={() => onCheckIn(currentStop.id, 50)}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 ${currentStop.visited ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white hover:bg-black'}`}
                     >
                         {currentStop.visited ? <><i className="fas fa-check-circle"></i> {t('collected')}</> : <><i className="fas fa-map-marker-alt"></i> {t('checkin')} (+50 Miles)</>}
                     </button>
                     <button 
                        onClick={() => onPlayAudio(currentStop.id, currentStop.description)} 
                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm border border-slate-200 ${audioPlayingId === currentStop.id ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-slate-700'}`}
                     >
                         {audioLoadingId === currentStop.id ? <i className="fas fa-spinner fa-spin"></i> : audioPlayingId === currentStop.id ? <i className="fas fa-stop"></i> : <i className="fas fa-headphones"></i>}
                         {audioPlayingId === currentStop.id ? t('pause') : t('listen')}
                     </button>
                     <div className="grid grid-cols-2 gap-4">
                         <button onClick={onPrev} disabled={currentStopIndex === 0} className="py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold opacity-50 disabled:opacity-30">
                             {t('prev')}
                         </button>
                         <button onClick={onNext} className="py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-xl">
                             {t('next')}
                         </button>
                     </div>
                 </div>
            </div>
        </div>
    );
};
