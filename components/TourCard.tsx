import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile, CapturedMoment, APP_BADGES, VisaStamp } from '../types';
import { SchematicMap } from './SchematicMap';
import { toast } from './Toast';
import { generateAudio } from '../services/geminiService';
import { syncUserProfile, completeTourBonus, updateTourStopLocation, normalizeKey, checkBadges } from '../services/supabaseClient';
import { VisaShare } from './VisaShare';
import { audioManager } from '../services/audioManager';

const TEXTS: any = {
    es: { 
        start: "Lanzar", stop: "Parada", of: "de", daiShot: "Consejo Dai", angleLabel: "Ángulo Dai:", 
        photoTipFallback: "Busca una perspectiva lateral para captar la profundidad de la estructura.", 
        capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Siguiente", 
        meters: "m", itinerary: "Itinerario", finish: "Finalizar Tour", congrats: "¡Tour Completado!", 
        stampDesc: "Has ganado un nuevo sello", shareIg: "Generar Visado Social (+100)", close: "Cerrar", 
        tooFar: "GPS Incierto", checkIn: "Check-in GPS", checkedIn: "Verificada", distance: "Distancia", 
        duration: "Duración", nearbyAlert: "Parada Cercana", jumpTo: "Saltar aquí", rewardMiles: "+50 MILLAS", 
        visaId: "VISADO", boardingPass: "TARJETA DE EMBARQUE", approved: "APROBADO", rewardTotal: "Recompensa total", 
        rankUp: "Rango actualizado", fixLocation: "Corregir GPS (Admin)", locationFixed: "GPS Actualizado",
        shareText: "¡He completado la Masterclass de {city} en bdai! +250 millas acumuladas. 🌍✈️" 
    },
    en: { 
        start: "Launch", stop: "Stop", of: "of", daiShot: "Dai Tip", angleLabel: "Dai Angle:", 
        photoTipFallback: "Look for a side perspective to capture the depth of the structure.", 
        capture: "Log Data", rewardReceived: "Synced", prev: "Back", next: "Next", 
        meters: "m", itinerary: "Itinerary", finish: "Finish Tour", congrats: "Tour Completed!", 
        stampDesc: "You earned a new stamp", shareIg: "Generate Social Visa (+100)", close: "Close", 
        tooFar: "GPS Uncertain", checkIn: "GPS Check-in", checkedIn: "Verified", distance: "Distance", 
        duration: "Duration", nearbyAlert: "Nearby Stop", jumpTo: "Jump here", rewardMiles: "+50 MILES", 
        visaId: "VISA", boardingPass: "BOARDING PASS", approved: "APPROVED", rewardTotal: "Total reward", 
        rankUp: "Rank updated", fixLocation: "Fix GPS (Admin)", locationFixed: "GPS Updated",
        shareText: "I just finished the {city} Masterclass on bdai! +250 miles earned. 🌍✈️" 
    },
    fr: { start: "Lancer", stop: "Arrêt", of: "sur", daiShot: "Conseil Dai", angleLabel: "Angle Dai :", photoTipFallback: "Cherchez une perspective latérale pour capturer la profondeur de la structure.", capture: "Log Données", rewardReceived: "Synchronisé", prev: "Précédent", next: "Suivant", meters: "m", itinerary: "Itinéraire", finish: "Terminer le Tour", congrats: "Tour Terminé!", stampDesc: "Nouveau tampon gagné", shareIg: "Générer Visa Social (+100)", close: "Fermer", tooFar: "GPS Incertain", checkIn: "Check-in GPS", checkedIn: "Vérifié", distance: "Distance", duration: "Durée", nearbyAlert: "Arrêt Proche", jumpTo: "Aller ici", rewardMiles: "+50 MILES", visaId: "VISA", boardingPass: "CARTE D'EMBARQUEMENT", approved: "APPROUVÉ", rewardTotal: "Récompense totale", rankUp: "Rang mis à jour", shareText: "Je viens de terminer la Masterclass {city} sur bdai ! +250 miles gagnés. 🌍✈️" },
    it: { start: "Lancia", stop: "Fermata", of: "di", daiShot: "Consiglio Dai", angleLabel: "Angolo Dai:", photoTipFallback: "Cerca una prospettiva laterale per catturare la profondità.", capture: "Log Dati", rewardReceived: "Sincronizzato", prev: "Indietro", next: "Avanti", meters: "m", itinerary: "Itinerario", finish: "Finire Tour", congrats: "Tour Completato!", stampDesc: "Nuovo timbro guadagnato", shareIg: "Genera Visto Social (+100)", close: "Chiudi", tooFar: "GPS Incerto", checkIn: "Check-in GPS", checkedIn: "Verificato", distance: "Distanza", duration: "Durata", nearbyAlert: "Fermata Vicina", jumpTo: "Salta qui", rewardMiles: "+50 MIGLIA", visaId: "VISTO", boardingPass: "CARTA D'IMBARCO", approved: "APPROVATO", rewardTotal: "Ricompensa totale", rankUp: "Rango aggiornato", shareText: "Ho appena finito la Masterclass {city} su bdai! +250 miglia guadagnate. 🌍✈️" },
    pt: { start: "Lançar", stop: "Parada", of: "de", daiShot: "Dica Dai", angleLabel: "Ângulo Dai:", photoTipFallback: "Procure uma perspectiva lateral para captar a profundidade.", capture: "Log Dados", rewardReceived: "Sincronizado", prev: "Voltar", next: "Próximo", meters: "m", itinerary: "Itinerário", finish: "Finalizar Tour", congrats: "Tour Completado!", stampDesc: "Novo selo ganho", shareIg: "Gerar Visto Social (+100)", close: "Fechar", tooFar: "GPS Incerto", checkIn: "Check-in GPS", checkedIn: "Verificado", distance: "Distância", duration: "Duração", nearbyAlert: "Parada Próxima", jumpTo: "Pular para aqui", rewardMiles: "+50 MILHAS", visaId: "VISTO", boardingPass: "CARTÃO DE EMBARQUE", approved: "APROVADO", rewardTotal: "Recompensa total", rankUp: "Ranking atualizado", shareText: "Acabei de completar a Masterclass de {city} no bdai! +250 milhas acumuladas. 🌍✈️" },
    de: { start: "Start", stop: "Halt", of: "von", daiShot: "Dai-Tipp", angleLabel: "Dai-Winkel:", photoTipFallback: "Suchen Sie nach einer Seitenperspektive, um die Tiefe einzufangen.", capture: "Log Daten", rewardReceived: "Synchronisiert", prev: "Zurück", next: "Weiter", meters: "m", itinerary: "Route", finish: "Tour beenden", congrats: "Tour abgeschlossen!", stampDesc: "Neuer Stempel erhalten", shareIg: "Social Visa generieren (+100)", close: "Schließen", tooFar: "GPS Unsicher", checkIn: "GPS Check-in", checkedIn: "Verifiziert", distance: "Distanz", duration: "Dauer", nearbyAlert: "Halt in der Nähe", jumpTo: "Hierher springen", rewardMiles: "+50 MEILEN", visaId: "VISUM", boardingPass: "BORDKARTE", approved: "GENEHMIGT", rewardTotal: "Gesamtbelohnung", rankUp: "Rang aktualisiert", shareText: "Ich habe gerade die {city} Masterclass auf bdai abgeschlossen! +250 Meilen gesammelt. 🌍✈️" },
    zh: { start: "开始", stop: "站点", of: "/", daiShot: "戴的提示", angleLabel: "拍摄角度:", photoTipFallback: "寻找侧面视角以捕捉结构的深度。", capture: "记录数据", rewardReceived: "已同步", prev: "返回", next: "下一步", meters: "米", itinerary: "行程", finish: "结束之旅", congrats: "之旅已完成！", stampDesc: "获得新印章", shareIg: "生成社交签证 (+100)", close: "关闭", tooFar: "GPS 不确定", checkIn: "GPS 签到", checkedIn: "已验证", distance: "距离", duration: "时长", nearbyAlert: "附近站点", jumpTo: "跳到这里", rewardMiles: "+50 里程", visaId: "签证", boardingPass: "登机牌", approved: "已批准", rewardTotal: "总奖励", rankUp: "等级已更新", shareText: "我刚刚在 bdai 完成了 {city} 大师课！赚取了 250 里程。🌍✈️" },
    ja: { start: "開始", stop: "スポット", of: "/", daiShot: "Daiのヒント", angleLabel: "Daiアングル:", photoTipFallback: "奥行きを捉えるために、側面からの視点を探してください。", capture: "ログ保存", rewardReceived: "同期済み", prev: "戻る", next: "次へ", meters: "m", itinerary: "行程", finish: "ツアー終了", congrats: "ツアー完了！", stampDesc: "新しいスタンプを獲得", shareIg: "ソーシャルビザ生成 (+100)", close: "閉じる", tooFar: "GPS 不安定", checkIn: "GPS チェックイン", checkedIn: "確認済み", distance: "距離", duration: "時間", nearbyAlert: "近くのスポット", jumpTo: "ここへ移動", rewardMiles: "+50 マイル", visaId: "ビザ", boardingPass: "搭乗券", approved: "承認済み", rewardTotal: "合計報酬", rankUp: "ランク更新", shareText: "bdai で {city} のマスタークラスを完了しました！250 マイル獲得。🌍✈️" },
    ru: { start: "Начать", stop: "Остановка", of: "из", daiShot: "Совет Dai", angleLabel: "Ракурс Dai:", photoTipFallback: "Ищите боковую перспективу, чтобы передать глубину.", capture: "Записать данные", rewardReceived: "Синхронизировано", prev: "Назад", next: "Далее", meters: "м", itinerary: "Маршрут", finish: "Завершить тур", congrats: "Тур завершен!", stampDesc: "Новая марка получена", shareIg: "Создать визу (+100)", close: "Закрыть", tooFar: "GPS неточен", checkIn: "GPS регистрация", checkedIn: "Проверено", distance: "Расстояние", duration: "Длительность", nearbyAlert: "Рядом", jumpTo: "Перейти сюда", rewardMiles: "+50 МИЛЬ", visaId: "ВИЗА", boardingPass: "ПОСАДОЧНЫЙ ТАЛОН", approved: "ОДОБРЕНО", rewardTotal: "Итог", rankUp: "Ранг обновлен", shareText: "Я завершил мастер-класс в {city} на bdai! +250 миль. 🌍✈️" },
    ar: { start: "إطلاق", stop: "محطة", of: "من", daiShot: "نصيحة داي", angleLabel: "زاوية داي:", photoTipFallback: "ابحث عن منظور جانبي لالتقاط عمق الهيكل.", capture: "تسجيل البيانات", rewardReceived: "تمت المزامنة", prev: "السابق", next: "التالي", meters: "م", itinerary: "المسار", finish: "إنهاء الجولة", congrats: "اكتملت الجولة!", stampDesc: "لقد حصلت على ختم جديد", shareIg: "إنشاء تأشيرة اجتماعية (+100)", close: "إغلاق", tooFar: "GPS غير مؤكد", checkIn: "تسجيل GPS", checkedIn: "متحقق", distance: "المسافة", duration: "المدة", nearbyAlert: "محطة قريبة", jumpTo: "قفز إلى هنا", rewardMiles: "+50 ميل", visaId: "تأشيرة", boardingPass: "بطاقة صعود", approved: "معتمد", rewardTotal: "إجمالي المكافأة", rankUp: "تم تحديث الرتبة", shareText: "لقد أنهيت للتو ماستركلاس {city} على bdai! تم جمع 250 ميلاً. 🌍✈️" }
};

const STOP_ICONS: Record<string, string> = { 
    historical: 'fa-fingerprint', 
    food: 'fa-utensils', 
    art: 'fa-palette', 
    nature: 'fa-leaf', 
    photo: 'fa-camera', 
    culture: 'fa-landmark', 
    architecture: 'fa-archway' 
};

const calculateDistance = (lat1: number | string, lon1: number | string, lat2: number | string, lon2: number | string) => {
    const R = 6371000;
    const l1 = typeof lat1 === 'string' ? parseFloat(lat1) : lat1;
    const ln1 = typeof lon1 === 'string' ? parseFloat(lon1) : lon1;
    const l2 = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
    const ln2 = typeof lon2 === 'string' ? parseFloat(lon2) : lon2;
    if (isNaN(l1) || isNaN(ln1) || isNaN(l2) || isNaN(ln2)) return Infinity;
    const dLat = (l2 - l1) * Math.PI / 180;
    const dLon = (ln2 - ln1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(l1 * Math.PI / 180) * Math.cos(l2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const TourCard: React.FC<any> = ({ tour, onSelect, language = 'es' }) => {
  const tl = TEXTS[language] || TEXTS['en'] || TEXTS.es;
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsLaunching(true);
      setTimeout(() => {
          onSelect(tour);
          setIsLaunching(false);
      }, 600);
  };

  if (!tour) return null;

  return (
    <div onClick={handleLaunch} className="group bg-slate-900 border-2 border-white/5 rounded-[2.5rem] overflow-hidden p-8 mb-6 cursor-pointer relative active:scale-[0.98] transition-all hover:border-purple-500/40 shadow-2xl">
      {isLaunching && (
          <div className="absolute inset-0 bg-purple-600/20 backdrop-blur-[2px] z-10 flex items-center justify-center animate-fade-in">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
      )}
      <div className="flex flex-col">
          {tour.theme && (
              <div className="inline-block bg-purple-600/20 border border-purple-500/30 text-purple-400 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 self-start">
                  {tour.theme}
              </div>
          )}
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
                 <span className={`${isLaunching ? 'text-purple-400 animate-pulse' : 'text-purple-500'} font-black text-[10px] uppercase tracking-widest`}>
                    {isLaunching ? 'Syncing...' : tl.start}
                 </span>
                 <div className={`w-11 h-11 aspect-square rounded-2xl flex items-center justify-center shadow-xl transition-all shrink-0 ${isLaunching ? 'bg-purple-600 text-white animate-spin' : 'bg-white text-slate-950 group-hover:bg-purple-500 group-hover:text-white'}`}>
                   <i className={`fas ${isLaunching ? 'fa-spinner' : 'fa-play'} text-[10px] ${!isLaunching && 'ml-0.5'}`}></i>
                 </div>
               </div>
          </div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, user, currentStopIndex, onNext, onPrev, onJumpTo, onUpdateUser, onBack, language = 'es', userLocation }) => {
    const tl = TEXTS[language] || TEXTS['en'] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    
    const [claimedStops, setClaimedStops] = useState<Set<string>>(new Set());
    const rewardClaimed = claimedStops.has(currentStop.id);

    const handleCheckIn = async () => {
        if (IS_IN_RANGE) {
            setClaimedStops(prev => new Set(prev).add(currentStop.id));
            const updatedUser = { ...user };
            const type = currentStop.type?.toLowerCase();
            const earnedMiles = currentStop.photoSpot?.milesReward || 10;
            updatedUser.miles = (updatedUser.miles || 0) + earnedMiles;
            if (type === 'historical') updatedUser.historyPoints = (updatedUser.historyPoints || 0) + 1;
            else if (type === 'food') updatedUser.foodPoints = (updatedUser.foodPoints || 0) + 1;
            else if (type === 'art') updatedUser.artPoints = (updatedUser.artPoints || 0) + 1;
            else if (type === 'nature') updatedUser.naturePoints = (updatedUser.naturePoints || 0) + 1;
            else if (type === 'photo') updatedUser.photoPoints = (updatedUser.photoPoints || 0) + 1;
            else if (type === 'culture') updatedUser.culturePoints = (updatedUser.culturePoints || 0) + 1;
            else if (type === 'architecture') updatedUser.archPoints = (updatedUser.archPoints || 0) + 1;
            updatedUser.badges = checkBadges(updatedUser);
            onUpdateUser(updatedUser);
        } else {
            toast(`${tl.tooFar}: ${distToTarget}m`, "error");
        }
    };

    const [showPhotoTip, setShowPhotoTip] = useState(false);
    const [showItinerary, setShowItinerary] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const [showSocialVisa, setShowSocialVisa] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const isAdmin = user.email === 'travelbdai@gmail.com' || user.isAdmin;

    const handleFixLocation = async () => {
        if (!userLocation || isFixing) return;
        setIsFixing(true);
        const citySlug = normalizeKey(tour.city, tour.country);
        const success = await updateTourStopLocation(citySlug, language, currentStop.id, userLocation.lat, userLocation.lng);
        if (success) {
            toast(tl.locationFixed, "success");
            currentStop.latitude = userLocation.lat;
            currentStop.longitude = userLocation.lng;
        } else {
            toast("Error updating location.", "error");
        }
        setIsFixing(false);
    };

    const totalMiles = useMemo(() => {
        return tour.stops.reduce((acc: number, s: Stop) => acc + (s.photoSpot?.milesReward || 0), 0);
    }, [tour]);

    const [audioState, setAudioState] = useState(audioManager.getState());

    useEffect(() => {
        audioManager.setOnStateChange(setAudioState);
        return () => audioManager.setOnStateChange(() => {});
    }, []);

    const isAudioLoading = audioState.isLoading && audioState.stopName === currentStop?.name;
    const audioPlayingId = audioState.isPlaying ? audioState.stopName : null;

    const distToTarget = useMemo(() => {
        if (!userLocation || !currentStop) return null;
        return Math.round(calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude));
    }, [userLocation, currentStop]);

    const IS_IN_RANGE = distToTarget !== null && distToTarget <= 50;

    const stopAudio = () => audioManager.stop();

    useEffect(() => {
        const handleGlobalStop = () => audioManager.stop();
        window.addEventListener('bdai-stop-audio', handleGlobalStop);
        return () => {
            window.removeEventListener('bdai-stop-audio', handleGlobalStop);
        };
    }, []);

    const handleFinishTour = async () => {
        const newStamp: VisaStamp = {
            city: tour.city,
            country: tour.country || "",
            date: new Date().toLocaleDateString(),
            color: ['#9333ea', '#ef4444', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)]
        };
        let updatedUser = completeTourBonus(user, tour.city.toLowerCase());
        updatedUser = {
            ...updatedUser,
            stamps: [...(user.stamps || []), newStamp],
            completedTours: [...(user.completedTours || []), tour.id]
        };
        onUpdateUser(updatedUser);
        if (user.isLoggedIn) await syncUserProfile(updatedUser);
        setShowCompletion(true);
    };

    const handleShare = async () => {
        const shareText = tl.shareText.replace('{city}', tour.city);
        if (navigator.share) {
            try { await navigator.share({ title: `bdai Passport - ${tour.city}`, text: shareText, url: window.location.href }); }
            catch (e) { console.error("Error sharing", e); }
        } else {
            navigator.clipboard.writeText(shareText);
            toast("Copied.", "success");
        }
    };

    const handlePlayAudio = async (stopName: string, text: string) => {
        if (audioState.isLoading) return;
        if (audioState.isPlaying && audioState.stopName === stopName) {
            audioManager.stop();
            return;
        }
        audioManager.setLoading(stopName);
        try {
            const audioResult = await generateAudio(text, user.language, tour.city);
            if (!audioResult) { audioManager.stop(); return; }
            await audioManager.play(audioResult, stopName);
        } catch (e) {
            console.error("Audio error:", e);
            audioManager.stop();
        }
    };

    // ✅ FIX 2: handleBack para el audio antes de salir
    const handleBack = () => {
        stopAudio();
        onBack();
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             {showPhotoTip && (
                 <div className="fixed inset-0 z-[9500] flex items-center justify-center p-6 animate-fade-in">
                     <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowPhotoTip(false)}></div>
                     <div className="bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-purple-500/30">
                         <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                            <i className="fas fa-camera text-2xl text-white"></i>
                         </div>
                         <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{tl.daiShot}</h3>
                         <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-6">{tl.angleLabel} {currentStop.photoSpot?.angle || tl.photoTipFallback}</p>
                         <p className="text-slate-400 text-sm leading-relaxed mb-8 italic">"{currentStop.photoSpot?.secretLocation || tl.photoTipFallback}"</p>
                         <button onClick={() => setShowPhotoTip(false)} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest">{tl.close}</button>
                     </div>
                 </div>
             )}

             {showItinerary && (
                 <div className="fixed inset-0 z-[9500] flex flex-col items-center justify-end animate-fade-in">
                     <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowItinerary(false)}></div>
                     <div className="bg-white w-full max-w-md rounded-t-[3rem] p-8 shadow-2xl relative z-10 max-h-[80vh] flex flex-col">
                         <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">{tl.itinerary}</h3>
                         <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                             {tour.stops.map((s: Stop, idx: number) => (
                                 <button key={s.id} onClick={() => { onJumpTo(idx); setShowItinerary(false); stopAudio(); }} className={`w-full p-5 rounded-2xl flex items-center gap-4 border transition-all ${idx === currentStopIndex ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-100'}`}>
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === currentStopIndex ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                         <i className={`fas ${STOP_ICONS[s.type?.toLowerCase()] || 'fa-location-dot'}`}></i>
                                     </div>
                                     <span className={`text-left font-bold text-sm flex-1 ${idx === currentStopIndex ? 'text-purple-600' : 'text-slate-700'}`}>{s.name}</span>
                                     {idx === currentStopIndex && <i className="fas fa-location-dot text-purple-500"></i>}
                                 </button>
                             ))}
                         </div>
                         <button onClick={() => setShowItinerary(false)} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">{tl.close}</button>
                     </div>
                 </div>
             )}

             {showCompletion && (
                 <div className="fixed inset-0 z-[9900] flex items-center justify-center p-6 animate-fade-in">
                     <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl"></div>
                     <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col overflow-hidden text-slate-900 border-4 border-slate-900 animate-slide-up">
                         <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                             <div className="flex flex-col">
                                 <span className="text-[7px] font-black uppercase tracking-[0.3em] opacity-50">{tl.boardingPass}</span>
                                 <span className="text-xl font-black italic tracking-tighter">bdai_intel</span>
                             </div>
                             <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-yellow-500 text-lg"><i className="fas fa-plane-arrival"></i></div>
                         </div>
                         <div className="p-8 space-y-6">
                             <div className="flex justify-between border-b-2 border-dashed border-slate-200 pb-4">
                                 <div className="text-left"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">Passanger</p><p className="text-xs font-black uppercase">{user.username}</p></div>
                                 <div className="text-right"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">Status</p><p className="text-xs font-black uppercase text-purple-600">{user.rank}</p></div>
                             </div>
                             <div className="flex items-center justify-between gap-4">
                                 <div className="flex-1 text-left"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Origin</p><p className="text-2xl font-black uppercase tracking-tighter leading-none">BDI</p></div>
                                 <div className="flex flex-col items-center gap-1"><i className="fas fa-arrow-right text-slate-300"></i></div>
                                 <div className="flex-1 text-right"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Destination</p><p className="text-2xl font-black uppercase tracking-tighter leading-none text-purple-600">{tour.city.substring(0,3).toUpperCase()}</p></div>
                             </div>
                             <div className="grid grid-cols-2 gap-4 pt-4 relative">
                                 <div className="text-left"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">{tl.rewardTotal}</p><p className="text-xl font-black text-slate-900">+{totalMiles} mi</p></div>
                                 <div className="text-right"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">{tl.approved}</p><i className="fas fa-check-circle text-green-500 text-xl"></i></div>
                                 <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform rotate-12 -translate-y-4">
                                     <i className="fas fa-stamp text-8xl"></i>
                                 </div>
                             </div>
                         </div>
                         <div className="p-6 bg-slate-50 border-t-2 border-slate-100 space-y-3">
                             <button onClick={() => setShowSocialVisa(true)} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"><i className="fas fa-share-nodes text-sm"></i> {tl.shareIg}</button>
                             <button onClick={handleBack} className="w-full py-4 bg-slate-200 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">{tl.close}</button>
                         </div>
                     </div>
                 </div>
             )}

             {showSocialVisa && (
                 <VisaShare user={user} cityName={tour.city} milesEarned={totalMiles} onClose={() => setShowSocialVisa(false)} />
             )}

             <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-[6000] pt-safe-iphone shrink-0 gap-3">
                {/* ✅ FIX 2: stop audio antes de salir */}
                <button onClick={handleBack} className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 flex items-center justify-center shrink-0"><i className="fas fa-arrow-left text-xs"></i></button>
                <button onClick={() => setShowItinerary(true)} className="flex-1 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-2xl flex items-center justify-between min-w-0">
                    <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                            <i className={`fas ${STOP_ICONS[currentStop.type?.toLowerCase()] || 'fa-location-dot'} text-xs`}></i>
                        </div>
                        <div className="flex flex-col text-left truncate">
                            <p className="text-[7px] font-black text-purple-600 uppercase leading-none mb-1">
                                {tl.stop} {currentStopIndex + 1}
                            </p>
                            <h2 className="text-[10px] font-black text-slate-900 uppercase truncate leading-tight">{currentStop.name}</h2>
                        </div>
                    </div>
                    <i className="fas fa-list-ul text-[10px] text-slate-400 ml-2 shrink-0"></i>
                </button>
                <button 
                    onClick={() => handlePlayAudio(currentStop.name, (currentStop.description || ""))} 
                    disabled={isAudioLoading}
                    className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center shadow-lg transition-all ${audioPlayingId === currentStop.name ? 'bg-red-500 text-white' : 'bg-purple-600 text-white'} disabled:opacity-70`}
                >
                    {isAudioLoading ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${audioPlayingId === currentStop.name ? 'fa-stop' : 'fa-play'} text-xs`}></i>}
                </button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50">
                <div className="h-[45vh] w-full">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={user.language} onStopSelect={(i: number) => onJumpTo(i)} userLocation={userLocation} />
                </div>
                <div className="px-8 pt-10 pb-44 space-y-8 bg-white rounded-t-[3.5rem] -mt-12 shadow-xl z-[200] relative min-h-[55vh]">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleCheckIn} disabled={rewardClaimed} className={`flex flex-col items-center justify-center p-5 rounded-[2rem] font-black uppercase border transition-all ${rewardClaimed ? 'bg-green-100 text-green-600 border-green-200' : (IS_IN_RANGE ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-50 text-slate-400 border-slate-200')}`}>
                            <i className={`fas ${rewardClaimed ? 'fa-check-circle' : 'fa-location-dot'} text-lg mb-1`}></i>
                            <span className="text-[9px]">{rewardClaimed ? tl.checkedIn : tl.checkIn}</span>
                            {distToTarget !== null && !rewardClaimed && (
                                <span className="text-[7px] mt-1 opacity-60">{distToTarget}{tl.meters}</span>
                            )}
                        </button>
                        <button onClick={() => setShowPhotoTip(true)} className="flex flex-col items-center justify-center p-5 rounded-[2rem] font-black uppercase border bg-slate-900 text-white border-slate-800">
                            <i className="fas fa-camera text-lg mb-1"></i>
                            <span className="text-[9px]">{tl.daiShot}</span>
                        </button>
                    </div>

                    {isAdmin && (
                        <button onClick={handleFixLocation} disabled={isFixing || !userLocation} className="w-full py-4 bg-red-600/10 border border-red-500/30 text-red-500 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <i className={`fas ${isFixing ? 'fa-spinner fa-spin' : 'fa-map-marker-alt'}`}></i>
                            {isFixing ? 'Fixing...' : tl.fixLocation}
                        </button>
                    )}

                    <div className="space-y-6 text-slate-800 text-lg leading-relaxed font-medium">
                        {(currentStop.description || "").split('\n\n').map((p, i) => <p key={i} className="animate-fade-in">{p}</p>)}
                    </div>
                </div>
             </div>

             <div className="bg-white/90 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] pb-safe-iphone">
                <button onClick={() => { onPrev(); stopAudio(); }} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest disabled:opacity-0">{tl.prev}</button>
                {currentStopIndex === tour.stops.length - 1 ? (
                    <button onClick={handleFinishTour} className="flex-[2] py-5 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-[0.98]">{tl.finish}</button>
                ) : (
                    <button onClick={() => { onNext(); stopAudio(); }} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-[0.98]">{tl.next}</button>
                )}
             </div>
        </div>
    );
};

