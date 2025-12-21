
import React from 'react';
import { Tour, Stop } from '../types';

const THEME_MAP: Record<string, { color: string; bg: string; icon: string; label: any }> = {
    history: { color: 'text-amber-600', bg: 'bg-amber-50', icon: 'fa-landmark', label: { es: 'Historia', en: 'History', ca: 'Història', fr: 'Histoire', eu: 'Historia' } },
    food: { color: 'text-orange-600', bg: 'bg-orange-50', icon: 'fa-utensils', label: { es: 'Gastronomía', en: 'Food', ca: 'Gastronomia', fr: 'Gastronomie', eu: 'Gastronomia' } },
    art: { color: 'text-pink-600', bg: 'bg-pink-50', icon: 'fa-palette', label: { es: 'Arte', en: 'Art', ca: 'Art', fr: 'Art', eu: 'Artea' } },
    nature: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'fa-leaf', label: { es: 'Naturaleza', en: 'Nature', ca: 'Natura', fr: 'Nature', eu: 'Natura' } },
    secrets: { color: 'text-purple-600', bg: 'bg-purple-50', icon: 'fa-user-secret', label: { es: 'Secretos', en: 'Secrets', ca: 'Secrets', fr: 'Secrets', eu: 'Sekretuak' } },
    photo: { color: 'text-indigo-600', bg: 'bg-indigo-50', icon: 'fa-camera', label: { es: 'Fotografía', en: 'Photo', ca: 'Fotografia', fr: 'Photo', eu: 'Argazkia' } },
    culture: { color: 'text-blue-600', bg: 'bg-blue-50', icon: 'fa-university', label: { es: 'Cultura', en: 'Culture', ca: 'Cultura', fr: 'Culture', eu: 'Kultura' } }
};

const getThemeData = (themeStr: string) => {
    const key = Object.keys(THEME_MAP).find(k => themeStr.toLowerCase().includes(k)) || 'secrets';
    return THEME_MAP[key];
};

const UI_TEXT: any = {
    en: { next: "Next", prev: "Back", listen: "Audio Guide", stop: "Stop", start: "Start", preview: "Quick Preview", safety: "Safety", wifi: "Wifi", photo: "Photo Tip", food: "Local Gem", miles: "Miles" },
    es: { next: "Siguiente", prev: "Atrás", listen: "Audio Guía", stop: "Parada", start: "Empezar", preview: "Vista Previa", safety: "Seguridad", wifi: "Wifi", photo: "Tip de Foto", food: "Gema Local", miles: "Millas" },
    ca: { next: "Següent", prev: "Enrere", listen: "Àudio Guia", stop: "Parada", start: "Començar", preview: "Vista Prèvia", safety: "Seguretat", wifi: "Wifi", photo: "Tip de Foto", food: "Gemma Local", miles: "Milles" },
    eu: { next: "Hurrengoa", prev: "Atzera", listen: "Audio Gida", stop: "Geldialdia", start: "Hasi", preview: "Aurreikusi", safety: "Segurtasuna", wifi: "Wifi", photo: "Argazki Tip", food: "Tokiko Gema", miles: "Miliak" },
    fr: { next: "Suivant", prev: "Retour", listen: "Audio Guide", stop: "Arrêt", start: "Commencer", preview: "Aperçu", safety: "Sécurité", wifi: "Wifi", photo: "Conseil Photo", food: "Pépite Locale", miles: "Miles" }
};

interface TourCardProps {
  tour: Tour;
  onSelect: (tour: Tour) => void;
  onPlayAudio: (id: string, text: string) => void;
  language: string;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, onSelect, onPlayAudio, language }) => {
  const theme = getThemeData(tour.theme);
  const t = UI_TEXT[language] || UI_TEXT['en'];

  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col mb-6">
      <div className={`h-48 relative flex items-center justify-center ${theme.bg}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent"></div>
        <i className={`fas ${theme.icon} text-6xl ${theme.color} opacity-40 group-hover:scale-110 transition-transform duration-700`}></i>
        
        <div className="absolute top-5 left-5">
             <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white/90 shadow-sm border border-slate-50 ${theme.color}`}>
                 {theme.label[language] || theme.label['en']}
             </span>
        </div>
      </div>
      <div className="p-7 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight tracking-tight group-hover:text-purple-600 transition-colors lowercase">{tour.title}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6 line-clamp-2 font-medium">{tour.description}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  <i className="fas fa-clock text-slate-200"></i> {tour.duration}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  <i className="fas fa-walking text-slate-200"></i> {tour.distance}
              </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
               <button onClick={(e) => {e.stopPropagation(); onPlayAudio(tour.id, tour.description);}} className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 text-slate-300 hover:text-purple-600 transition-colors">
                   <i className="fas fa-headphones"></i> {t.preview}
               </button>
               <span className="text-slate-900 font-bold text-[10px] uppercase tracking-widest">{t.start} <i className="fas fa-arrow-right ml-1"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = (props) => {
    const { tour, currentStopIndex, onNext, onPrev, onPlayAudio, language, onCheckIn } = props;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const t = UI_TEXT[language] || UI_TEXT['en'];
    const theme = getThemeData(currentStop.type || 'secrets');

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar">
             <div className={`relative h-64 w-full flex-shrink-0 flex items-center justify-center ${theme.bg}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/10"></div>
                <i className={`fas ${theme.icon} text-7xl ${theme.color} opacity-30`}></i>
                <div className="absolute bottom-8 left-8 right-8 text-center">
                    <span className="inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white border border-slate-100 text-slate-400 mb-3 shadow-sm">
                        {t.stop} {currentStopIndex + 1} / {tour.stops.length}
                    </span>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight lowercase">{currentStop.name}</h1>
                </div>
             </div>
             
             <div className="px-8 pb-24 pt-4">
                 <div className="w-full h-1 bg-slate-50 rounded-full mb-8 overflow-hidden">
                    <div className="h-full bg-slate-900 transition-all duration-700 ease-out" style={{ width: `${((currentStopIndex + 1) / tour.stops.length) * 100}%` }}></div>
                 </div>
                 
                 <div className="text-slate-500 text-sm leading-relaxed font-medium mb-10">{currentStop.description}</div>

                 <div className="grid grid-cols-2 gap-3 mb-10">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{t.safety}</p>
                        <p className="text-[10px] font-bold text-slate-600 leading-tight">{currentStop.securityNote || '—'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{t.wifi}</p>
                        <p className="text-[10px] font-bold text-slate-600 leading-tight">{currentStop.wifiInfo || '—'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{t.photo}</p>
                        <p className="text-[10px] font-bold text-slate-600 leading-tight">{currentStop.photoTip || '—'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{t.food}</p>
                        <p className="text-[10px] font-bold text-slate-600 leading-tight">{currentStop.authenticFoodTip || '—'}</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                     <button onClick={() => onCheckIn(currentStop.id)} className={`w-full py-4.5 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${currentStop.visited ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-900 text-white shadow-xl shadow-slate-200'}`}>
                         {currentStop.visited ? <><i className="fas fa-check"></i> Success</> : <><i className="fas fa-map-pin text-[8px]"></i> Check-In (+50 {t.miles})</>}
                     </button>
                     <button onClick={() => onPlayAudio(currentStop.id, currentStop.description)} className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all border border-slate-100 bg-white text-slate-400 hover:text-slate-600 active:bg-slate-50">
                         <i className="fas fa-headphones"></i> {t.listen}
                     </button>
                     <div className="grid grid-cols-2 gap-3 pt-4">
                         <button onClick={onPrev} disabled={currentStopIndex === 0} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-[9px] disabled:opacity-20">{t.prev}</button>
                         <button onClick={onNext} className="py-4 bg-purple-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-purple-100 active:scale-95 transition-all">{currentStopIndex === tour.stops.length - 1 ? 'End' : t.next}</button>
                     </div>
                 </div>
            </div>
        </div>
    );
};
