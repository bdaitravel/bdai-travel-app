
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

const UI_TEXT: any = {
    en: { next: "Next", prev: "Back", listen: "Audio Guide", pause: "Pause", checkin: "Check In", collected: "Verified!", stop: "Stop", deepDive: "AI Deep Dive", enriching: "Investigating...", photoSpotTitle: "Perfect Shot", angle: "Suggested Angle", bestTime: "Best Time", instaHook: "Instagram Hook", copyBtn: "Copy & Share" },
    es: { next: "Siguiente", prev: "Atrás", listen: "Audio Guía", pause: "Pausar", checkin: "Check In", collected: "¡Verificado!", stop: "Parada", deepDive: "Inmersión IA", enriching: "Investigando...", photoSpotTitle: "Foto Perfecta", angle: "Encuadre Sugerido", bestTime: "Mejor Momento", instaHook: "Hook Instagram", copyBtn: "Copiar y Compartir" },
    eu: { next: "Hurrengoa", prev: "Atzera", listen: "Audio Gida", pause: "Gelditu", checkin: "Check In", collected: "Egiaztatuta!", stop: "Geldialdia", deepDive: "AI Sakontzea", enriching: "Ikertzen...", photoSpotTitle: "Argazki Perfektua", angle: "Iradokitako enkoadraketa", bestTime: "Une onena", instaHook: "Instagramerako Hook-a", copyBtn: "Kopiatu eta Partekatu" },
    ca: { next: "Següent", prev: "Enrere", listen: "Audio Guia", pause: "Pausa", checkin: "Check In", collected: "Verificat!", stop: "Parada", deepDive: "Immersió IA", enriching: "Investigant...", photoSpotTitle: "Foto Perfecta", angle: "Enquadrament Suggerit", bestTime: "Millor Moment", instaHook: "Hook Instagram", copyBtn: "Copiar i Compartir" },
    fr: { next: "Suivant", prev: "Retour", listen: "Guide Audio", pause: "Pause", checkin: "S'enregistrer", collected: "Vérifié!", stop: "Arrêt", deepDive: "Immersion IA", enriching: "Recherche...", photoSpotTitle: "Photo Parfaite", angle: "Angle Suggéré", bestTime: "Meilleur Moment", instaHook: "Hook Instagram", copyBtn: "Copier et Partager" },
    de: { next: "Weiter", prev: "Zurück", listen: "Audioguide", pause: "Pause", checkin: "Einchecken", collected: "Verifiziert!", stop: "Halt", deepDive: "KI-Tiefgang", enriching: "Untersuchung...", photoSpotTitle: "Perfektes Foto", angle: "Empfohlener Winkel", bestTime: "Beste Zeit", instaHook: "Instagram-Hook", copyBtn: "Kopieren & Teilen" },
    pt: { next: "Próximo", prev: "Voltar", listen: "Guia de Áudio", pause: "Pausa", checkin: "Check In", collected: "Verificado!", stop: "Parada", deepDive: "Imersão IA", enriching: "Investigando...", photoSpotTitle: "Foto Perfeita", angle: "Ângulo Sugerido", bestTime: "Melhor Momento", instaHook: "Hook do Instagram", copyBtn: "Copiar e Compartilhar" },
    ar: { next: "التالي", prev: "السابق", listen: "دليل صوتي", pause: "إيقاف", checkin: "تسجيل الوصول", collected: "تم التحقق!", stop: "محطة", deepDive: "غوص عميق بالذكاء الاصطناعي", enriching: "جارٍ التحقيق...", photoSpotTitle: "لقطة مثالية", angle: "الزاوية المقترحة", bestTime: "أفضل وقت", instaHook: "جملة إنستغرام", copyBtn: "نسخ ومشاركة" },
    zh: { next: "下一步", prev: "返回", listen: "语音导览", pause: "暂停", checkin: "签到", collected: "已验证！", stop: "站点", deepDive: "AI 深度解析", enriching: "正在调查...", photoSpotTitle: "完美快照", angle: "建议角度", bestTime: "最佳时间", instaHook: "Instagram 钩子", copyBtn: "复制并分享" },
    ja: { next: "次へ", prev: "戻る", listen: "オーディオガイド", pause: "一時停止", checkin: "チェックイン", collected: "確認済み！", stop: "停留所", deepDive: "AIディープダイブ", enriching: "調査中...", photoSpotTitle: "パーフェクトショット", angle: "推奨アングル", bestTime: "ベストタイム", instaHook: "Instagramフック", copyBtn: "コピーして共有" }
};

interface TourCardProps {
  tour: Tour;
  onSelect: (tour: Tour) => void;
  onPlayAudio: (id: string, text: string) => void;
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
                   {isPlayingAudio ? 'Stop' : 'Preview'}
               </button>
               <span className="text-slate-900 font-bold text-sm">Start <i className="fas fa-arrow-right ml-1"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = (props) => {
    const { tour, currentStopIndex, onNext, onPrev, onPlayAudio, audioPlayingId, audioLoadingId, onCheckIn, language, onEnrichStop } = props;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const t = (key: string) => UI_TEXT[language]?.[key] || UI_TEXT['en']?.[key] || key;
    const [isEnriching, setIsEnriching] = useState(false);

    const formatDescription = (text: string) => {
        if (!text) return null;
        return text.split('\n').filter(l => l.trim()).map((line, i) => {
            if (line.includes('[HOOK]')) return <p key={i} className="mb-6 text-xl font-heading font-black text-slate-900 leading-tight border-l-4 border-purple-500 pl-4">{line.replace('[HOOK]', '').trim()}</p>;
            if (line.includes('[STORY]')) return <div key={i} className="mb-6 text-slate-700 leading-relaxed font-medium">{line.replace('[STORY]', '').trim()}</div>;
            if (line.includes('[SECRET]')) return (
                <div key={i} className="mb-6 bg-slate-900 text-white p-5 rounded-2xl relative overflow-hidden group border border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-2">Secret</p>
                    <p className="text-sm font-medium leading-relaxed italic">{line.replace('[SECRET]', '').trim()}</p>
                </div>
            );
            if (line.includes('[SMART_TIP]')) return (
                <div key={i} className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm"><i className="fas fa-bolt"></i></div>
                    <div><p className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">Pro Tip</p><p className="text-xs text-blue-900 font-bold leading-tight">{line.replace('[SMART_TIP]', '').trim()}</p></div>
                </div>
            );
            return <p key={i} className="mb-4 text-slate-600 leading-relaxed font-medium">{line}</p>;
        });
    };

    const handleCopyHook = () => {
        if (currentStop.photoSpot?.instagramHook) {
            navigator.clipboard.writeText(currentStop.photoSpot.instagramHook);
            alert("Hook copiado! Abre Instagram y pégalo en tu publicación.");
        }
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar">
             <div className="relative h-72 w-full flex-shrink-0">
                <img src={currentStop.imageUrl || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80`} className="w-full h-full object-cover" alt={currentStop.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
                <div className="absolute bottom-6 left-6 right-6">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 bg-white/90 backdrop-blur shadow-sm border border-white text-slate-800">{t('stop')} {currentStopIndex + 1} / {tour.stops.length}</span>
                    <h1 className="text-3xl font-heading font-black text-white drop-shadow-lg leading-tight">{currentStop.name}</h1>
                </div>
             </div>
             <div className="px-6 pb-12 pt-8">
                 <div className="w-full h-1 bg-slate-100 rounded-full mb-8 overflow-hidden"><div className="h-full bg-purple-600 transition-all duration-500" style={{ width: `${((currentStopIndex + 1) / tour.stops.length) * 100}%` }}></div></div>
                 
                 {/* Main Content */}
                 <div className="prose prose-slate max-w-none mb-10">{formatDescription(currentStop.description)}</div>

                 {/* Photo Spot Section */}
                 {currentStop.photoSpot && (
                    <div className="mb-10 p-5 bg-gradient-to-br from-pink-50 to-rose-50 border border-rose-100 rounded-[2rem] shadow-sm animate-fade-in">
                        <div className="flex items-center gap-2 mb-4 text-rose-600">
                            <i className="fas fa-camera text-sm"></i>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('photoSpotTitle')}</span>
                            <span className="ml-auto bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">+{currentStop.photoSpot.milesReward} MILES</span>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[7px] font-black text-rose-300 uppercase mb-1 tracking-widest">{t('angle')}</p>
                                    <p className="text-[11px] font-bold text-slate-800 leading-tight">{currentStop.photoSpot.angle}</p>
                                </div>
                                <div>
                                    <p className="text-[7px] font-black text-rose-300 uppercase mb-1 tracking-widest">{t('bestTime')}</p>
                                    <p className="text-[11px] font-bold text-slate-800 leading-tight">{currentStop.photoSpot.bestTime}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-rose-100">
                                <p className="text-[7px] font-black text-slate-400 uppercase mb-2 tracking-widest">{t('instaHook')}</p>
                                <p className="text-xs font-medium text-slate-600 italic mb-3 leading-relaxed">"{currentStop.photoSpot.instagramHook}"</p>
                                <button 
                                    onClick={handleCopyHook}
                                    className="w-full py-2 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                                >
                                    <i className="fab fa-instagram"></i> {t('copyBtn')}
                                </button>
                            </div>
                        </div>
                    </div>
                 )}

                 {!currentStop.isRichInfo && (
                     <button onClick={async () => { setIsEnriching(true); await onEnrichStop(currentStop.id); setIsEnriching(false); }} disabled={isEnriching} className="w-full mb-10 py-5 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                        {isEnriching ? <><i className="fas fa-spinner fa-spin"></i> {t('enriching')}</> : <><i className="fas fa-brain"></i> {t('deepDive')}</>}
                     </button>
                 )}

                 <div className="space-y-4">
                     <button onClick={() => onCheckIn(currentStop.id, 50)} className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 ${currentStop.visited ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white hover:bg-black'}`}>
                         {currentStop.visited ? <><i className="fas fa-check-circle"></i> {t('collected')}</> : <><i className="fas fa-map-marker-alt"></i> {t('checkin')} (+50 Miles)</>}
                     </button>
                     <button onClick={() => onPlayAudio(currentStop.id, currentStop.description)} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm border border-slate-200 ${audioPlayingId === currentStop.id ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-slate-700'}`}>
                         {audioLoadingId === currentStop.id ? <i className="fas fa-spinner fa-spin"></i> : audioPlayingId === currentStop.id ? <i className="fas fa-stop"></i> : <i className="fas fa-headphones"></i>}
                         {audioPlayingId === currentStop.id ? t('pause') : t('listen')}
                     </button>
                     <div className="grid grid-cols-2 gap-4">
                         <button onClick={onPrev} disabled={currentStopIndex === 0} className="py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold opacity-50 disabled:opacity-30">{t('prev')}</button>
                         <button onClick={onNext} className="py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-xl">{t('next')}</button>
                     </div>
                 </div>
            </div>
        </div>
    );
};
