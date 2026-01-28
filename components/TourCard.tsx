
import React, { useMemo, useState } from 'react';
import { Tour, Stop } from '../types';
import { SchematicMap } from './SchematicMap';
import { cleanDescriptionText } from '../services/geminiService';

const TEXTS: any = {
    en: { start: "Launch", stop: "Hub", of: "of", photoSpot: "Technical Angle", capture: "Log Data", approach: "Verify proximity", rewardReceived: "Data Synced", prev: "Back", next: "Advance", meters: "m", share: "Transmit", itinerary: "Sequence", intro: "Bidaer Manifesto" },
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Ángulo Técnico", capture: "Logear Datos", approach: "Verifica proximidad", rewardReceived: "Datos Sincronizados", prev: "Atrás", next: "Avanzar", meters: "m", share: "Transmitir", itinerary: "Secuencia", intro: "Manifiesto Bidaer" },
    ca: { start: "Llançar", stop: "Parada", of: "de", photoSpot: "Angle Tècnic", capture: "Loguejar Dades", approach: "Verifica proximitat", rewardReceived: "Dades Sincronitzades", prev: "Enrere", next: "Avançar", meters: "m", share: "Transmetre", itinerary: "Seqüència", intro: "Manifest Bidaer" },
    eu: { start: "Abiarazi", stop: "Geldialdia", of: "-(e)tik", photoSpot: "Angulu Teknikoa", capture: "Datuak Gorde", approach: "Hurbiltasuna egiaztatu", rewardReceived: "Datuak Sinkronizatuta", prev: "Atzera", next: "Aurrera", meters: "m", share: "Partekatu", itinerary: "Sekuentzia", intro: "Bidaer Manifestua" },
    fr: { start: "Lancer", stop: "Arrêt", of: "sur", photoSpot: "Angle Technique", capture: "Loguer Données", approach: "Vérifier proximité", rewardReceived: "Données Sync", prev: "Retour", next: "Avancer", meters: "m", share: "Transmettre", itinerary: "Séquence", intro: "Manifeste Bidaer" },
    de: { start: "Starten", stop: "Stopp", of: "von", photoSpot: "Winkel", capture: "Daten loggen", approach: "Nähe prüfen", rewardReceived: "Daten synchronisiert", prev: "Zurück", next: "Weiter", meters: "m", share: "Teilen", itinerary: "Route", intro: "Manifest" },
    ja: { start: "開始", stop: "スポット", of: "中の", photoSpot: "アングル", capture: "ログ保存", approach: "接近を確認", rewardReceived: "同期完了", prev: "戻る", next: "進む", meters: "m", share: "共有", itinerary: "旅程", intro: "マニフェスト" },
    zh: { start: "启动", stop: "站点", of: "的", photoSpot: "角度", capture: "记录数据", approach: "检查距离", rewardReceived: "数据同步", prev: "返回", next: "下一步", meters: "米", share: "分享", itinerary: "路线", intro: "宣言" },
    ar: { start: "إطلاق", stop: "محطة", of: "من", photoSpot: "زاوية", capture: "تسجيل", approach: "تحقق من القرب", rewardReceived: "تمت المزامنة", prev: "السابق", next: "التالي", meters: "م", share: "مشاركة", itinerary: "المسار", intro: "بيان" }
};

const getCalculatedDuration = (stopsCount: number) => {
    const mins = stopsCount * 20;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) return `${hours}h${remainingMins > 0 ? ' ' + remainingMins + 'm' : ''}`;
    return `${mins}m`;
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  const tl = TEXTS[language] || TEXTS.es;
  const duration = getCalculatedDuration(tour.stops.length);
  return (
    <div onClick={() => onSelect(tour)} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-md p-7 mb-4 cursor-pointer relative">
      <div className="flex flex-col">
          <div className="mb-4 flex justify-between items-center">
             <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white">{tour.theme}</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter leading-tight">{tour.title}</h3>
          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{tour.description}</p>
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-50">
               <span className="text-slate-900 font-black text-[10px] uppercase tracking-widest"><i className="fas fa-clock mr-2"></i> {duration} • {tour.distance}</span>
               <span className="text-purple-600 font-black text-[10px] uppercase tracking-widest">{tl.start} <i className="fas fa-chevron-right ml-1"></i></span>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, currentStopIndex, onNext, onPrev, onJumpTo, onPlayAudio, audioPlayingId, audioLoadingId, onBack, language = 'es' }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const isPlaying = audioPlayingId === currentStop.id;
    const isLoading = audioLoadingId === currentStop.id;
    const [showItinerary, setShowItinerary] = useState(false);

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             <div className="bg-white border-b border-slate-100 px-6 py-6 flex items-center justify-between z-[6000] shrink-0 pt-safe-iphone shadow-sm">
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950"><i className="fas fa-arrow-left"></i></button>
                <div className="text-center">
                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                    <h2 className="text-sm font-black text-slate-900 uppercase truncate max-w-[150px]">{currentStop.name}</h2>
                </div>
                <button onClick={() => setShowItinerary(!showItinerary)} className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${showItinerary ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-950'}`}><i className="fas fa-layer-group"></i></button>
             </div>
             {showItinerary && (
                 <div className="absolute inset-0 z-[7000] flex flex-col animate-fade-in">
                     <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowItinerary(false)}></div>
                     <div className="mt-auto bg-white rounded-t-[3rem] p-8 max-h-[70vh] overflow-y-auto relative z-10 pb-safe-iphone">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black uppercase text-slate-900">{tl.itinerary}</h3>
                            <button onClick={() => setShowItinerary(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="space-y-3">
                            {tour.stops.map((stop: Stop, idx: number) => (
                                <div key={stop.id} onClick={() => { onJumpTo(idx); setShowItinerary(false); }} className={`flex items-center gap-4 p-4 rounded-2xl border ${idx === currentStopIndex ? 'bg-slate-900 text-white shadow-xl' : 'bg-white border-slate-100'}`}>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${idx === currentStopIndex ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</div>
                                    <p className="text-[10px] font-black uppercase truncate flex-1">{stop.name}</p>
                                </div>
                            ))}
                        </div>
                     </div>
                 </div>
             )}
             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col relative">
                <div className="h-[35vh] w-full relative z-[100] shrink-0 border-b border-slate-100 bg-slate-200">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={language} onStopSelect={onJumpTo} onPlayAudio={onPlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} />
                </div>
                <div className="px-8 pt-10 pb-40 space-y-10 bg-white rounded-t-[3rem] -mt-10 shadow-[0_-30px_60px_rgba(0,0,0,0.05)] z-[200]">
                    <div className="flex justify-end">
                        <button onClick={() => onPlayAudio(currentStop.id, currentStop.description)} disabled={isLoading} className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all active:scale-95 shrink-0 ${isPlaying ? 'bg-red-600' : 'bg-slate-950'} text-white`}>
                            {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-play ml-1"></i>}
                        </button>
                    </div>
                    <div className="space-y-10 text-slate-800 text-lg leading-relaxed font-medium pb-20">
                        {currentStop.description.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="animate-fade-in first-letter:text-6xl first-letter:font-black first-letter:text-slate-950 first-letter:mr-3 first-letter:float-left first-letter:mt-1 opacity-90">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>
             </div>
             <div className="bg-white/80 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] shrink-0 pb-safe-iphone">
                <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest disabled:opacity-0">{tl.prev}</button>
                <button onClick={onNext} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-2xl">{tl.next}</button>
             </div>
        </div>
    );
};
