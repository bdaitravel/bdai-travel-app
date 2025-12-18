
import React, { useState, useEffect } from 'react';
import { Tour, Stop } from '../types';
import { generateImage } from '../services/geminiService';

const getThemeStyles = (themeStr: string) => {
  const theme = themeStr.toLowerCase();
  if (theme.includes('history')) return { badge: 'bg-amber-100 text-amber-900', icon: 'fa-landmark' };
  if (theme.includes('food')) return { badge: 'bg-orange-100 text-orange-900', icon: 'fa-utensils' };
  if (theme.includes('art')) return { badge: 'bg-pink-100 text-pink-900', icon: 'fa-palette' };
  if (theme.includes('nature')) return { badge: 'bg-emerald-100 text-emerald-900', icon: 'fa-leaf' };
  if (theme.includes('cinema') || theme.includes('film')) return { badge: 'bg-red-100 text-red-900', icon: 'fa-film' };
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
    en: { next: "Next Stop", prev: "Previous Stop", listen: "Listen Guide", pause: "Pause", checkin: "I'm Here!", collected: "Verified!", tooFar: "Too far", stop: "Stop", photoShot: "Photo Shot", angle: "The Angle", bestTime: "Best Light", copyHook: "Copy IG Caption", shared: "Copied!", photoMiles: "Photo Miles", enriching: "Generating Story..." },
    es: { next: "Siguiente Parada", prev: "Atrás", listen: "Escuchar Guía", pause: "Pausar", checkin: "¡Ya estoy aquí!", collected: "¡Verificado!", tooFar: "Lejos", stop: "Parada", photoShot: "Foto del Recuerdo", angle: "El Ángulo", bestTime: "Mejor Luz", copyHook: "Copiar Caption IG", shared: "¡Copiado!", photoMiles: "Millas de Foto", enriching: "Generando historia detallada..." },
    de: { next: "Nächster Stopp", prev: "Zurück", listen: "Guide anhören", pause: "Pause", checkin: "Ich bin hier!", collected: "Verifiziert!", tooFar: "Zu weit", stop: "Stopp", photoShot: "Foto-Spot", angle: "Der Winkel", bestTime: "Bestes Licht", copyHook: "IG-Unterschrift kopieren", shared: "Kopiert!", photoMiles: "Foto-Meilen", enriching: "Erstelle detaillierte Geschichte..." }
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
        const fetchAiImage = async () => {
            const prompt = `${tour.title} iconic landmark in ${tour.city}`;
            const url = await generateImage(prompt);
            if (isMounted && url) {
                setAiImage(url);
            }
        };
        fetchAiImage();
    }
    return () => { isMounted = false; };
  }, [tour.id, tour.imageUrl, tour.city, tour.theme, tour.title]);

  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer h-full flex flex-col">
      <div className="h-64 relative overflow-hidden bg-slate-200">
        {!imgLoaded && <div className="absolute inset-0 bg-slate-200 animate-pulse"></div>}
        <img 
            src={displayImage} 
            className={`w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            alt={tour.title}
        />
        <div className="absolute top-4 left-4">
             <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg ${styles.badge} backdrop-blur-md bg-opacity-90`}>
                 <i className={`fas ${styles.icon} mr-1`}></i> {tour.theme}
             </span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-red-500 transition-colors">
            <i className={`fas fa-heart ${isFavorite ? 'text-red-500' : ''}`}></i>
        </button>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
          <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <i className="fas fa-clock text-slate-400"></i> {tour.duration}
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <i className="fas fa-walking text-slate-400"></i> {tour.distance}
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <i className="fas fa-camera text-slate-400"></i> {tour.stops.length} Shots
              </span>
          </div>

          <h3 className="text-2xl font-heading font-bold text-slate-900 mb-3 leading-tight group-hover:text-purple-700 transition-colors">{tour.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">{tour.description}</p>
          
          <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
               <button onClick={(e) => {e.stopPropagation(); onPlayAudio(tour);}} className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isPlayingAudio ? 'text-red-500' : 'text-slate-400 hover:text-slate-800'}`}>
                   {isAudioLoading ? <i className="fas fa-spinner fa-spin"></i> : isPlayingAudio ? <i className="fas fa-stop"></i> : <i className="fas fa-play"></i>}
                   {isPlayingAudio ? 'Stop Preview' : 'Listen Intro'}
               </button>
               <span className="text-slate-900 font-bold text-sm group-hover:translate-x-1 transition-transform">Start Free Tour <i className="fas fa-arrow-right ml-1"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = (props) => {
    const { tour, currentStopIndex, onNext, onPrev, onPlayAudio, audioPlayingId, audioLoadingId, onCheckIn, userLocation, onEnrichStop, language } = props;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    
    const t = (key: string) => UI_TEXT[language]?.[key] || UI_TEXT['en']?.[key] || key;

    const [isCheckedIn, setIsCheckedIn] = useState(currentStop.visited);
    const [distance, setDistance] = useState<number | null>(null);
    const [copiedHook, setCopiedHook] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);

    useEffect(() => { 
        setIsCheckedIn(currentStop.visited);
        setCopiedHook(false);
        if (!currentStop.isRichInfo && onEnrichStop) {
            setIsEnriching(true);
            onEnrichStop(currentStop.id).finally(() => setIsEnriching(false));
        }
    }, [currentStopIndex, currentStop, onEnrichStop]);

    useEffect(() => {
        if (userLocation && currentStop.latitude && currentStop.longitude) {
            const dist = calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude);
            setDistance(Math.round(dist));
        }
    }, [userLocation, currentStop]);

    const handleCopyHook = () => {
        if (currentStop.photoShot?.instagramHook) {
            navigator.clipboard.writeText(currentStop.photoShot.instagramHook);
            setCopiedHook(true);
            setTimeout(() => setCopiedHook(false), 2000);
            onCheckIn(currentStop.id, 10, 'photo'); 
        }
    };

    const formatDescription = (text: string) => {
        if (!text) return "";
        return text.split('\n').filter(l => l.trim()).map((line, i) => {
            if (line.includes('[HOOK]')) return <p key={i} className="mb-6 text-xl font-heading font-black text-slate-900 leading-tight border-l-4 border-purple-500 pl-4">{line.replace('[HOOK]', '').trim()}</p>;
            if (line.includes('[STORY]')) {
                const storyContent = line.replace('[STORY]', '').trim();
                return <div key={i} className="mb-6 text-slate-700 leading-relaxed space-y-4 font-medium">{storyContent}</div>;
            }
            if (line.includes('[SECRET]')) return (
                <div key={i} className="mb-6 bg-slate-900 text-white p-5 rounded-2xl relative overflow-hidden group">
                    <i className="fas fa-mask absolute -right-2 -bottom-2 text-4xl text-white/10 rotate-12 transition-transform group-hover:scale-125"></i>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-2">Hidden Secret</p>
                    <p className="text-sm font-medium leading-relaxed italic">{line.replace('[SECRET]', '').trim()}</p>
                </div>
            );
            if (line.includes('[SMART_TIP]')) return (
                <div key={i} className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm"><i className="fas fa-bolt"></i></div>
                    <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Smart Traveler Tip</p>
                        <p className="text-xs text-blue-900 font-bold leading-tight">{line.replace('[SMART_TIP]', '').trim()}</p>
                    </div>
                </div>
            );
            return <p key={i} className="mb-4 text-slate-600 leading-relaxed font-medium">{line}</p>;
        });
    };
    
    const CHECKIN_RADIUS = 300; 
    const isWithinRange = distance !== null && distance <= CHECKIN_RADIUS;
    const canCheckIn = isWithinRange && !isCheckedIn;

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar">
             <div className="relative h-64 w-full flex-shrink-0 bg-slate-200">
                <img 
                    src={currentStop.imageUrl || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1080&q=80`} 
                    className="w-full h-full object-cover" 
                    alt={currentStop.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
                <div className="absolute bottom-6 left-6 right-6">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 bg-white/90 backdrop-blur shadow-sm border border-white text-slate-800`}>
                         {t('stop')} {currentStopIndex + 1} of {tour.stops.length}
                    </span>
                    <h1 className="text-3xl font-heading font-black text-white drop-shadow-lg">{currentStop.name}</h1>
                </div>
             </div>

             <div className="px-6 lg:px-12 pb-12 pt-6">
                 {/* Progress Bar */}
                 <div className="w-full h-1 bg-slate-100 rounded-full mb-8 overflow-hidden">
                     <div 
                        className="h-full bg-purple-600 transition-all duration-500" 
                        style={{ width: `${((currentStopIndex + 1) / tour.stops.length) * 100}%` }}
                     ></div>
                 </div>

                 {isEnriching && (
                     <div className="flex items-center gap-2 mb-6 text-purple-600 animate-pulse">
                         <i className="fas fa-magic"></i>
                         <span className="text-xs font-bold uppercase tracking-widest">{t('enriching')}</span>
                     </div>
                 )}

                 {distance !== null && (
                     <div className="flex items-center gap-2 mb-6">
                         <div className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-2 ${isWithinRange ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                             <i className={`fas ${isWithinRange ? 'fa-check-circle' : 'fa-location-arrow'}`}></i>
                             {distance < 1000 ? `${distance}m away` : `${(distance/1000).toFixed(1)}km away`}
                         </div>
                     </div>
                 )}

                 <div className="prose prose-slate max-w-none mb-10">
                     {formatDescription(currentStop.description)}
                 </div>

                 {/* Photo Shot Feature Section */}
                 {currentStop.photoShot && (
                     <div className="mb-10 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100 shadow-sm relative overflow-hidden group">
                         <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-2xl opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                         <div className="relative z-10">
                             <div className="flex items-center justify-between mb-6">
                                 <div className="flex items-center gap-2">
                                     <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg">
                                         <i className="fas fa-camera"></i>
                                     </div>
                                     <div>
                                         <h4 className="font-heading font-bold text-lg text-slate-800 leading-none">{t('photoShot')}</h4>
                                         <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mt-1">Instagram Ready</p>
                                     </div>
                                 </div>
                                 <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-purple-200 text-[10px] font-bold text-purple-700">
                                     +{currentStop.photoShot.milesReward} Miles
                                 </div>
                             </div>

                             <div className="space-y-4 mb-6">
                                 <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">{t('angle')}</p>
                                     <p className="text-sm text-slate-700 font-medium leading-relaxed">{currentStop.photoShot.angle}</p>
                                 </div>
                                 <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">{t('bestTime')}</p>
                                     <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                         <i className="far fa-clock mr-1.5 text-purple-400"></i>
                                         {currentStop.photoShot.bestTime}
                                     </p>
                                 </div>
                             </div>

                             <div className="bg-white/50 border border-purple-100 p-4 rounded-2xl mb-6 italic text-sm text-slate-500 text-center relative">
                                 <i className="fas fa-quote-left absolute top-2 left-2 opacity-10"></i>
                                 "{currentStop.photoShot.instagramHook}"
                             </div>

                             <button 
                                onClick={handleCopyHook}
                                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md
                                    ${copiedHook ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-black'}`}
                             >
                                 {copiedHook ? <i className="fas fa-check"></i> : <i className="fab fa-instagram"></i>}
                                 {copiedHook ? t('shared') : t('copyHook')}
                             </button>
                         </div>
                     </div>
                 )}
                 
                 {currentStop.curiosity && (
                     <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl mb-10">
                         <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">Cool Fact</p>
                         <p className="text-amber-900 font-bold leading-relaxed">{currentStop.curiosity}</p>
                     </div>
                 )}

                 <div className="space-y-4">
                     <button 
                        onClick={() => onCheckIn(currentStop.id, isWithinRange ? 50 : 0, currentStop.type)}
                        disabled={!canCheckIn}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95
                            ${isCheckedIn 
                                ? 'bg-green-100 text-green-700 shadow-none cursor-default' 
                                : !isWithinRange && distance !== null
                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed border-dashed border-2 border-slate-200 shadow-none'
                                    : 'bg-slate-900 text-white hover:bg-black hover:shadow-xl'
                            }`}
                     >
                         {isCheckedIn ? (
                             <><i className="fas fa-check-circle"></i> {t('collected')}</>
                         ) : !isWithinRange && distance !== null ? (
                             <><i className="fas fa-lock"></i> {t('tooFar')} ({distance}m)</>
                         ) : (
                             <><i className="fas fa-map-marker-alt"></i> {t('checkin')} (+50 Miles)</>
                         )}
                     </button>

                     <button 
                        onClick={() => onPlayAudio(currentStop.id, currentStop.description)} 
                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm border border-slate-200 ${audioPlayingId === currentStop.id ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-slate-700'}`}
                     >
                         {audioLoadingId === currentStop.id ? <i className="fas fa-spinner fa-spin"></i> : audioPlayingId === currentStop.id ? <i className="fas fa-pause"></i> : <i className="fas fa-headphones"></i>}
                         {audioPlayingId === currentStop.id ? t('pause') : t('listen')}
                     </button>

                     <div className="grid grid-cols-2 gap-4">
                         <button 
                            onClick={onPrev} 
                            disabled={currentStopIndex === 0}
                            className={`py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${currentStopIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                         >
                             <i className="fas fa-arrow-left"></i> {t('prev')}
                         </button>
                         <button onClick={onNext} className="py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-xl hover:shadow-purple-200 flex items-center justify-center gap-2 active:scale-95">
                             {t('next')} <i className="fas fa-arrow-right"></i>
                         </button>
                     </div>
                 </div>
            </div>
        </div>
    );
};
