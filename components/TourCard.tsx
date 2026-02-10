
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile, CapturedMoment, APP_BADGES, VisaStamp } from '../types';
import { SchematicMap } from './SchematicMap';
import { generateAudio } from '../services/geminiService';

const TEXTS: any = {
    es: { start: "Lanzar", stop: "Parada", of: "de", daiShot: "Consejo Dai", rewardReceived: "Sincronizado", prev: "Atrás", next: "Siguiente", finish: "Finalizar", congrats: "¡Tour Completado!", shareIg: "Compartir", close: "Cerrar", checkIn: "Check-in GPS", checkedIn: "Verificada", distance: "Distancia", duration: "Duración", nearbyAlert: "Parada Cercana", rewardMiles: "+50 MILLAS" },
    en: { start: "Launch", stop: "Stop", of: "of", daiShot: "Dai Tip", rewardReceived: "Synced", prev: "Back", next: "Next", finish: "Finish", congrats: "Tour Completed!", shareIg: "Share", close: "Close", checkIn: "GPS Check-in", checkedIn: "Verified", distance: "Distance", duration: "Duration", nearbyAlert: "Nearby Stop", rewardMiles: "+50 MILES" },
    zh: { start: "开始", stop: "站点", of: "/", daiShot: "Dai 建议", rewardReceived: "已同步", prev: "返回", next: "下一步", finish: "完成", congrats: "旅程已完成！", shareIg: "分享", close: "关闭", checkIn: "GPS 签到", checkedIn: "已验证", distance: "距离", duration: "持续时间", nearbyAlert: "检测到附近站点", rewardMiles: "+50 里程" },
    ca: { start: "Llançar", stop: "Parada", of: "de", daiShot: "Consell Dai", rewardReceived: "Sincronitzat", prev: "Enrere", next: "Següent", finish: "Finalitzar", congrats: "Tour Completat!", shareIg: "Compartir", close: "Tancar", checkIn: "Check-in GPS", checkedIn: "Verificada", distance: "Distància", duration: "Durada", nearbyAlert: "Parada Propera", rewardMiles: "+50 MILLES" },
    eu: { start: "Abiarazi", stop: "Geldialdia", of: "/", daiShot: "Dai Aholkua", rewardReceived: "Sinkronizatuta", prev: "Atzera", next: "Hurrengoa", finish: "Amaitu", congrats: "Tourra Amaituta!", shareIg: "Partekatu", close: "Itxi", checkIn: "GPS Check-in", checkedIn: "Egiaztatuta", distance: "Distantzia", duration: "Iraupena", nearbyAlert: "Geldialdia Hurbil", rewardMiles: "+50 MILIA" },
    ar: { start: "إطلاق", stop: "محطة", of: "من", daiShot: "نصيحة Dai", rewardReceived: "تمت المزامنة", prev: "السابق", next: "التالي", finish: "إنهاء", congrats: "اكتملت الجولة!", shareIg: "مشاركة", close: "إغلاق", checkIn: "تسجيل الدخول", checkedIn: "تم التحقق", distance: "المسافة", duration: "المدة", nearbyAlert: "محطة قريبة", rewardMiles: "+50 ميل" },
    pt: { start: "Lançar", stop: "Parada", of: "de", daiShot: "Dica Dai", rewardReceived: "Sincronizado", prev: "Anterior", next: "Próximo", finish: "Finalizar", congrats: "Tour Concluído!", shareIg: "Compartilhar", close: "Fechar", checkIn: "Check-in GPS", checkedIn: "Verificada", distance: "Distância", duration: "Duração", nearbyAlert: "Parada Próxima", rewardMiles: "+50 MILHAS" },
    fr: { start: "Lancer", stop: "Arrêt", of: "sur", daiShot: "Conseil Dai", rewardReceived: "Synchronisé", prev: "Précédent", next: "Suivant", finish: "Terminer", congrats: "Tour Terminé!", shareIg: "Partager", close: "Fermer", checkIn: "Check-in GPS", checkedIn: "Vérifié", distance: "Distance", duration: "Durée", nearbyAlert: "Arrêt Proche", rewardMiles: "+50 MILES" },
    de: { start: "Starten", stop: "Halt", of: "von", daiShot: "Dai-Tipp", rewardReceived: "Synchronisiert", prev: "Zurück", next: "Weiter", finish: "Beenden", congrats: "Tour Abgeschlossen!", shareIg: "Teilen", close: "Schließen", checkIn: "GPS Check-in", checkedIn: "Verifiziert", distance: "Entfernung", duration: "Dauer", nearbyAlert: "Halt in der Nähe", rewardMiles: "+50 MEILEN" },
    it: { start: "Lancia", stop: "Fermata", of: "di", daiShot: "Consiglio Dai", rewardReceived: "Sincronizzato", prev: "Indietro", next: "Avanti", finish: "Termina", congrats: "Tour Completato!", shareIg: "Condividi", close: "Chiudi", checkIn: "Check-in GPS", checkedIn: "Verificato", distance: "Distanza", duration: "Durata", nearbyAlert: "Fermata Vicina", rewardMiles: "+50 MIGLIA" },
    ja: { start: "開始", stop: "停止", of: "/", daiShot: "Daiのヒント", rewardReceived: "同期済み", prev: "戻る", next: "次へ", finish: "終了", congrats: "ツアー完了！", shareIg: "共有", close: "閉じる", checkIn: "GPSチェックイン", checkedIn: "確認済み", distance: "距離", duration: "期間", nearbyAlert: "近くの停留所", rewardMiles: "+50 マイル" },
    ru: { start: "Запуск", stop: "Остановка", of: "из", daiShot: "Совет Dai", rewardReceived: "Синхронизировано", prev: "Назад", next: "Далее", finish: "Завершить", congrats: "Тур завершен!", shareIg: "Поделиться", close: "Закрыть", checkIn: "GPS Чекин", checkedIn: "Проверено", distance: "Расстояние", duration: "Длительность", nearbyAlert: "Остановка рядом", rewardMiles: "+50 МИЛЬ" },
    hi: { start: "शुरू", stop: "पड़ाव", of: "का", daiShot: "Dai टिप", rewardReceived: "सिंक", prev: "पीछे", next: "अगला", finish: "समाप्त", congrats: "पूरा हुआ!", shareIg: "साझा", close: "बंद", checkIn: "चेक-इन", checkedIn: "सत्यापित", distance: "दूरी", duration: "अवधि", nearbyAlert: "निकटतम", rewardMiles: "+50 मील" },
    ko: { start: "시작", stop: "정류장", of: "/", daiShot: "Dai 팁", rewardReceived: "동기화됨", prev: "이전", next: "다음", finish: "종료", congrats: "완료!", shareIg: "공유", close: "닫기", checkIn: "GPS 체크인", checkedIn: "확인됨", distance: "거리", duration: "기간", nearbyAlert: "가까운 정류장", rewardMiles: "+50 마일" },
    tr: { start: "Başlat", stop: "Durak", of: "/", daiShot: "Dai İpucu", rewardReceived: "Senkronize", prev: "Geri", next: "İleri", finish: "Bitir", congrats: "Tamamlandı!", shareIg: "Paylaş", close: "Kapat", checkIn: "Check-in", checkedIn: "Doğrulandı", distance: "Mesafe", duration: "Süre", nearbyAlert: "Yakın Durak", rewardMiles: "+50 MİL" }
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  const tl = TEXTS[language] || TEXTS.es;
  if (!tour) return null;
  return (
    <div onClick={() => onSelect(tour)} className="group bg-slate-900 border-2 border-white/5 rounded-[2.5rem] overflow-hidden p-8 mb-6 cursor-pointer relative active:scale-[0.98] transition-all hover:border-purple-500/40 shadow-2xl">
      <div className="flex flex-col">
          <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter leading-tight group-hover:text-purple-400 transition-colors">{tour.title}</h3>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-6 font-medium">{tour.description}</p>
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
               <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{tl.duration}</span>
                    <span className="text-white font-black text-xs uppercase tracking-tighter">{tour.duration}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{tl.distance}</span>
                    <span className="text-white font-black text-xs uppercase tracking-tighter">{tour.distance}</span>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-purple-500 font-black text-[10px] uppercase tracking-widest">{tl.start}</span>
                 <div className="w-11 h-11 aspect-square bg-white text-slate-950 rounded-2xl flex items-center justify-center shadow-xl group-hover:bg-purple-500 group-hover:text-white transition-all shrink-0">
                   <i className="fas fa-play text-[10px] ml-0.5"></i>
                 </div>
               </div>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, user, currentStopIndex, onNext, onPrev, onJumpTo, onUpdateUser, onBack, language = 'es', userLocation }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [showPhotoTip, setShowPhotoTip] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             {showCompletion && (
                 <div className="fixed inset-0 z-[9000] flex items-center justify-center p-6 animate-fade-in">
                     <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"></div>
                     <div className="bg-[#f3f0e6] w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative z-10 flex flex-col items-center text-center">
                         <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">{tl.congrats}</h3>
                         <button onClick={onBack} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">{tl.close}</button>
                     </div>
                 </div>
             )}

             <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-[6000] pt-safe-iphone">
                <button onClick={onBack} className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 flex items-center justify-center"><i className="fas fa-arrow-left text-xs"></i></button>
                <div className="flex flex-col text-center">
                    <p className="text-[7px] font-black text-purple-600 uppercase">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                    <h2 className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[150px]">{currentStop.name}</h2>
                </div>
                <button onClick={async () => {
                    if (audioPlayingId === currentStop.id) { setAudioPlayingId(null); return; }
                    setAudioPlayingId(currentStop.id);
                    await generateAudio(currentStop.description, language, tour.city);
                }} className={`w-11 h-11 rounded-xl flex items-center justify-center ${audioPlayingId === currentStop.id ? 'bg-red-500' : 'bg-purple-600'} text-white shadow-lg`}>
                    <i className={`fas ${audioPlayingId === currentStop.id ? 'fa-stop' : 'fa-play'} text-xs`}></i>
                </button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col relative">
                <div className="h-[40vh] w-full">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={language} userLocation={userLocation} onStopSelect={onJumpTo} />
                </div>
                <div className="px-8 pt-10 pb-44 space-y-8 bg-white rounded-t-[3.5rem] -mt-12 shadow-2xl z-20">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setRewardClaimed(true)} className={`p-5 rounded-[2rem] font-black uppercase text-[9px] border transition-all ${rewardClaimed ? 'bg-green-100 text-green-600 border-green-200' : 'bg-purple-600 text-white border-purple-500 shadow-xl'}`}>
                            <i className="fas fa-location-dot mb-1 block text-lg"></i>
                            {rewardClaimed ? tl.checkedIn : tl.checkIn}
                        </button>
                        <button onClick={() => setShowPhotoTip(!showPhotoTip)} className="p-5 rounded-[2rem] font-black uppercase text-[9px] bg-slate-900 text-white shadow-xl">
                            <i className="fas fa-camera mb-1 block text-lg"></i>
                            {tl.daiShot}
                        </button>
                    </div>

                    <div className="space-y-6 text-slate-800 text-lg leading-relaxed font-medium">
                        {currentStop.description.split('\n\n').map((p, i) => (
                            <p key={i} className="animate-fade-in first-letter:text-5xl first-letter:font-black first-letter:text-slate-950 first-letter:mr-3 first-letter:float-left">{p}</p>
                        ))}
                    </div>
                </div>
             </div>

             <div className="bg-white/90 backdrop-blur-xl border-t border-slate-100 p-6 flex gap-3 z-[6000] pb-safe-iphone">
                <button onClick={onPrev} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest disabled:opacity-0">{tl.prev}</button>
                {currentStopIndex === tour.stops.length - 1 ? (
                    <button onClick={() => setShowCompletion(true)} className="flex-[2] py-5 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">{tl.finish}</button>
                ) : (
                    <button onClick={onNext} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">{tl.next}</button>
                )}
             </div>
        </div>
    );
};
