
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile, CapturedMoment, APP_BADGES, VisaStamp } from '../types';
import { SchematicMap } from './SchematicMap';
import { generateAudio } from '../services/geminiService';

const TEXTS: any = {
    es: { start: "Lanzar", stop: "Parada", of: "de", daiShot: "Consejo Dai", angleLabel: "Ángulo Dai:", photoTipFallback: "Busca una perspectiva lateral para captar la profundidad de la estructura.", capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Siguiente", meters: "m", itinerary: "Itinerario", finish: "Finalizar Tour", congrats: "¡Tour Completado!", stampDesc: "Has ganado un nuevo sello", shareIg: "Compartir (+100 Millas)", close: "Cerrar", tooFar: "GPS Incierto", checkIn: "Check-in GPS", checkedIn: "Verificada", distance: "Distancia", duration: "Duración", nearbyAlert: "Parada Cercana", jumpTo: "Saltar aquí", rewardMiles: "+50 MILLAS" },
    en: { start: "Launch", stop: "Stop", of: "of", daiShot: "Dai Tip", angleLabel: "Dai Angle:", photoTipFallback: "Look for a side perspective to capture the depth of the structure.", capture: "Log Data", rewardReceived: "Synced", prev: "Back", next: "Next", meters: "m", itinerary: "Itinerary", finish: "Finish Tour", congrats: "Tour Completed!", stampDesc: "You earned a new stamp", shareIg: "Share (+100 Miles)", close: "Close", tooFar: "GPS Uncertain", checkIn: "GPS Check-in", checkedIn: "Verified", distance: "Distance", duration: "Duration", nearbyAlert: "Nearby Stop", jumpTo: "Jump here", rewardMiles: "+50 MILES" },
    zh: { start: "开始", stop: "站点", of: "/", daiShot: "Dai 建议", angleLabel: "Dai 角度：", photoTipFallback: "寻找侧面视角以捕捉结构的深度。", capture: "记录数据", rewardReceived: "已同步", prev: "返回", next: "下一步", meters: "米", itinerary: "行程计划", finish: "完成之旅", congrats: "旅程已完成！", stampDesc: "您获得了一枚新印章", shareIg: "分享 (+100 里程)", close: "关闭", tooFar: "GPS 不确定", checkIn: "GPS 签到", checkedIn: "已验证", distance: "距离", duration: "持续时间", nearbyAlert: "检测到附近站点", jumpTo: "跳转到此处", rewardMiles: "+50 里程" },
    ca: { start: "Llançar", stop: "Parada", of: "de", daiShot: "Consell Dai", angleLabel: "Angle Dai:", photoTipFallback: "Busca una perspectiva lateral per captar la profunditat de l'estructura.", capture: "Loguejar Dades", rewardReceived: "Sincronitzat", prev: "Enrere", next: "Següent", meters: "m", itinerary: "Itinerari", finish: "Finalitzar Tour", congrats: "Tour Completat!", stampDesc: "Has guanyat un nou segell", shareIg: "Compartir (+100 Milles)", close: "Tancar", tooFar: "GPS Incerte", checkIn: "Check-in GPS", checkedIn: "Verificada", distance: "Distància", duration: "Durada", nearbyAlert: "Parada Propera", jumpTo: "Saltar aquí", rewardMiles: "+50 MILLES" },
    eu: { start: "Abiarazi", stop: "Geldialdia", of: "/", daiShot: "Dai Aholkua", angleLabel: "Dai Kulua:", photoTipFallback: "Bilatu alboko perspektiba bat egituraren sakonera jasotzeko.", capture: "Datuak Gorde", rewardReceived: "Sinkronizatuta", prev: "Atzera", next: "Hurrengoa", meters: "m", itinerary: "Ibilbidea", finish: "Tourra Amaitu", congrats: "Tourra Amaituta!", stampDesc: "Zigilua lortu duzu", shareIg: "Partekatu (+100 Milia)", close: "Itxi", tooFar: "GPS Ziurgabea", checkIn: "GPS Check-in", checkedIn: "Egiaztatuta", distance: "Distantzia", duration: "Iraupena", nearbyAlert: "Geldialdia Hurbil", jumpTo: "Saltatu hona", rewardMiles: "+50 MILIA" },
    ar: { start: "إطلاق", stop: "محطة", of: "من", daiShot: "نصيحة Dai", angleLabel: "زاوية Dai:", photoTipFallback: "ابحث عن منظور جانبي لالتقاط عمق الهيكل.", capture: "تسجيل البيانات", rewardReceived: "تمت المزامنة", prev: "السابق", next: "التالي", meters: "م", itinerary: "مسار الرحلة", finish: "إنهاء الجولة", congrats: "اكتملت الجولة!", stampDesc: "لقد حصلت على ختم جديد", shareIg: "مشاركة (+100 ميل)", close: "إغلاق", tooFar: "GPS غير مؤكد", checkIn: "تسجيل الدخول", checkedIn: "تم التحقق", distance: "المسافة", duration: "المدة", nearbyAlert: "تم اكتشاف محطة قريبة", jumpTo: "انتقل هنا", rewardMiles: "+50 ميل" },
    pt: { start: "Lançar", stop: "Parada", of: "de", daiShot: "Dica Dai", angleLabel: "Ângulo Dai:", photoTipFallback: "Procure uma perspectiva lateral para capturar a profundidade da estrutura.", capture: "Logar Dados", rewardReceived: "Sincronizado", prev: "Anterior", next: "Próximo", meters: "m", itinerary: "Itinerário", finish: "Finalizar Tour", congrats: "Tour Concluído!", stampDesc: "Você ganhou um novo selo", shareIg: "Compartilhar (+100 Milhas)", close: "Fechar", tooFar: "GPS Incerto", checkIn: "Check-in GPS", checkedIn: "Verificada", distance: "Distância", duration: "Duração", nearbyAlert: "Parada Próxima", jumpTo: "Pular aqui", rewardMiles: "+50 MILHAS" },
    fr: { start: "Lancer", stop: "Arrêt", of: "sur", daiShot: "Conseil Dai", angleLabel: "Angle Dai :", photoTipFallback: "Cherchez une perspective latérale pour capturer la profondeur de la structure.", capture: "Log Données", rewardReceived: "Synchronisé", prev: "Précédent", next: "Suivant", meters: "m", itinerary: "Itinéraire", finish: "Terminer le Tour", congrats: "Tour Terminé!", stampDesc: "Nouveau tampon gagné", shareIg: "Partager (+100 Miles)", close: "Fermer", tooFar: "GPS Incertain", checkIn: "Check-in GPS", checkedIn: "Vérifié", distance: "Distance", duration: "Durée", nearbyAlert: "Arrêt Proche", jumpTo: "Aller ici", rewardMiles: "+50 MILES" },
    de: { start: "Starten", stop: "Halt", of: "von", daiShot: "Dai-Tipp", angleLabel: "Dai-Winkel:", photoTipFallback: "Suchen Sie nach einer Seitenperspektive, um die Tiefe der Struktur einzufangen.", capture: "Daten Loggen", rewardReceived: "Synchronisiert", prev: "Zurück", next: "Weiter", meters: "m", itinerary: "Reiseroute", finish: "Tour Beenden", congrats: "Tour Abgeschlossen!", stampDesc: "Neuer Stempel erhalten", shareIg: "Teilen (+100 Meilen)", close: "Schließen", tooFar: "GPS Unsicher", checkIn: "GPS Check-in", checkedIn: "Verifiziert", distance: "Entfernung", duration: "Dauer", nearbyAlert: "Halt in der Nähe", jumpTo: "Hierher springen", rewardMiles: "+50 MEILEN" },
    it: { start: "Lancia", stop: "Fermata", of: "di", daiShot: "Consiglio Dai", angleLabel: "Angolo Dai:", photoTipFallback: "Cerca una prospettiva laterale per catturare la profondità della struttura.", capture: "Log Dati", rewardReceived: "Sincronizzato", prev: "Indietro", next: "Avanti", meters: "m", itinerary: "Itinerario", finish: "Termina Tour", congrats: "Tour Completato!", stampDesc: "Hai vinto un nuovo timbro", shareIg: "Condividi (+100 Miglia)", close: "Chiudi", tooFar: "GPS Incerto", checkIn: "Check-in GPS", checkedIn: "Verificato", distance: "Distanza", duration: "Durata", nearbyAlert: "Fermata Vicina", jumpTo: "Salta qui", rewardMiles: "+50 MIGLIA" },
    ja: { start: "開始", stop: "停止", of: "/", daiShot: "Daiのヒント", angleLabel: "Daiアングル:", photoTipFallback: "構造物の奥行きを捉えるために、横からの視点を探してください。", capture: "データ記録", rewardReceived: "同期済み", prev: "戻る", next: "次へ", meters: "m", itinerary: "旅程", finish: "ツアーを終了", congrats: "ツアー完了！", stampDesc: "新しいスタンプを獲得しました", shareIg: "共有 (+100マイル)", close: "閉じる", tooFar: "GPSが不安定", checkIn: "GPSチェックイン", checkedIn: "確認済み", distance: "距離", duration: "期間", nearbyAlert: "近くの停留所", jumpTo: "ここへ移動", rewardMiles: "+50 マイル" },
    ru: { start: "Запуск", stop: "Остановка", of: "из", daiShot: "Совет Dai", angleLabel: "Угол Dai:", photoTipFallback: "Ищите боковую перспективу, чтобы запечатлеть глубину строения.", capture: "Данные", rewardReceived: "Синхронизировано", prev: "Назад", next: "Далее", meters: "м", itinerary: "Маршрут", finish: "Завершить тур", congrats: "Тур завершен!", stampDesc: "Вы получили новый штамп", shareIg: "Поделиться (+100 миль)", close: "Закрыть", tooFar: "GPS неточен", checkIn: "GPS Чекин", checkedIn: "Проверено", distance: "Расстояние", duration: "Длительность", nearbyAlert: "Остановка рядом", jumpTo: "Перейти сюда", rewardMiles: "+50 МИЛЬ" },
    hi: { start: "शुरू करें", stop: "पड़ाव", of: "का", daiShot: "Dai टिप", angleLabel: "Dai कोण:", photoTipFallback: "संरचना की गहराई को पकड़ने के लिए पार्श्व परिप्रेक्ष्य की तलाश करें।", capture: "डेटा लॉग करें", rewardReceived: "सिंक किया गया", prev: "पीछे", next: "अगला", meters: "मी", itinerary: "यात्रा कार्यक्रम", finish: "दौरा समाप्त करें", congrats: "दौरा पूरा हुआ!", stampDesc: "आपने एक नया स्टैम्प जीता", shareIg: "साझा करें (+100 मील)", close: "बंद करें", tooFar: "GPS अनिश्चित", checkIn: "GPS चेक-इन", checkedIn: "सत्यापित", distance: "दूरी", duration: "अवधि", nearbyAlert: "निकटतम पड़ाव", jumpTo: "यहाँ जाएँ", rewardMiles: "+50 मील" },
    ko: { start: "시작", stop: "정류장", of: "/", daiShot: "Dai 팁", angleLabel: "Dai 각도:", photoTipFallback: "구조물의 깊이를 포착하기 위해 측면 원근감을 찾으십시오.", capture: "데이터 로깅", rewardReceived: "동기화됨", prev: "이전", next: "다음", meters: "m", itinerary: "일정", finish: "투어 종료", congrats: "투어 완료!", stampDesc: "새 스탬프를 획득했습니다", shareIg: "공유 (+100 마일)", close: "닫기", tooFar: "GPS 불확실", checkIn: "GPS 체크인", checkedIn: "확인됨", distance: "거리", duration: "기간", nearbyAlert: "가까운 정류장", jumpTo: "여기로 이동", rewardMiles: "+50 마일" },
    tr: { start: "Başlat", stop: "Durak", of: "/", daiShot: "Dai İpucu", angleLabel: "Dai Açısı:", photoTipFallback: "Yapının derinliğini yakalamak için yan bir perspektif arayın.", capture: "Veri Kaydet", rewardReceived: "Senkronize", prev: "Geri", next: "İleri", meters: "m", itinerary: "Rota", finish: "Turu Bitir", congrats: "Tur Tamamlandı!", stampDesc: "Yeni bir damga kazandınız", shareIg: "Paylaş (+100 Mil)", close: "Kapat", tooFar: "GPS Belirsiz", checkIn: "GPS Check-in", checkedIn: "Doğrulandı", distance: "Mesafe", duration: "Süre", nearbyAlert: "Yakın Durak", jumpTo: "Buraya atla", rewardMiles: "+50 MİL" }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
      <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/10 overflow-hidden">
          <div className="w-1/3 h-full bg-purple-500 animate-scan"></div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, user, currentStopIndex, onNext, onPrev, onJumpTo, onUpdateUser, onBack, language = 'es', userLocation }) => {
    const tl = TEXTS[language] || TEXTS.es;
    const currentStop = tour.stops[currentStopIndex] as Stop;
    
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [showPhotoTip, setShowPhotoTip] = useState(false);
    const [showItinerary, setShowItinerary] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const [nearbyStopHint, setNearbyStopHint] = useState<number | null>(null);

    const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
    const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        if (!userLocation || !tour.stops) return;
        const NEARBY_THRESHOLD = 35; 
        let bestCandidate: number | null = null;
        let minDistance = Infinity;

        tour.stops.forEach((s: Stop, idx: number) => {
            if (idx === currentStopIndex) return;
            const dist = calculateDistance(userLocation.lat, userLocation.lng, s.latitude, s.longitude);
            if (dist < NEARBY_THRESHOLD && dist < minDistance) {
                minDistance = dist;
                bestCandidate = idx;
            }
        });
        if (bestCandidate !== nearbyStopHint) {
            setNearbyStopHint(bestCandidate);
            if (bestCandidate !== null && 'vibrate' in navigator) navigator.vibrate(40);
        }
    }, [userLocation, currentStopIndex, tour.stops, nearbyStopHint]);

    const distToTarget = useMemo(() => {
        if (!userLocation || !currentStop) return null;
        return Math.round(calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude));
    }, [userLocation, currentStop]);

    const IS_IN_RANGE = distToTarget !== null && distToTarget <= 100;

    useEffect(() => { 
        setRewardClaimed(false);
        setShowPhotoTip(false);
        stopAudio(); 
    }, [currentStopIndex]);

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch(e) {}
            sourceNodeRef.current = null;
        }
        setAudioPlayingId(null);
    };

    const handlePlayAudio = async (stopId: string, text: string) => {
        if (audioPlayingId === stopId) { stopAudio(); return; }
        stopAudio();
        setAudioLoadingId(stopId);
        try {
            const base64 = await generateAudio(text, user.language, tour.city);
            if (!base64) throw new Error("No audio data");
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => setAudioPlayingId(null);
            sourceNodeRef.current = source;
            source.start(0);
            setAudioPlayingId(stopId);
        } catch (e) { console.error("Audio error:", e); } finally { setAudioLoadingId(null); }
    };

    const handleCheckIn = () => {
        if (!IS_IN_RANGE) { 
            alert(`${tl.tooFar}: Estás a ${distToTarget}m. Debes estar a menos de 100m para las millas.`); 
            return; 
        }
        setRewardClaimed(true);
        onUpdateUser({ ...user, miles: user.miles + 50 });
    };

    const handleFinishTour = () => {
        const now = new Date();
        const hour = now.getHours();
        const newStamps = [...(user.stamps || [])];
        const newBadges = [...(user.badges || [])];
        const newCompleted = [...(user.completedTours || []), tour.id];
        
        const stamp: VisaStamp = {
            city: tour.city,
            country: tour.country || 'España',
            date: now.toLocaleDateString(),
            color: '#8b2b2b'
        };
        newStamps.push(stamp);

        if (hour >= 20 || hour < 6) {
            if (!newBadges.find(b => b.id === 'owl')) {
                const owl = APP_BADGES.find(b => b.id === 'owl');
                if (owl) newBadges.push({ ...owl, earnedAt: now.toISOString() });
            }
        }
        if (user.miles > 5000 && !newBadges.find(b => b.id === 'mayor')) {
            const mayor = APP_BADGES.find(b => b.id === 'mayor');
            if (mayor) newBadges.push({ ...mayor, earnedAt: now.toISOString() });
        }
        if (newCompleted.length >= 3 && !newBadges.find(b => b.id === 'local')) {
            const local = APP_BADGES.find(b => b.id === 'local');
            if (local) newBadges.push({ ...local, earnedAt: now.toISOString() });
        }

        onUpdateUser({ 
            ...user, 
            stamps: newStamps, 
            badges: newBadges, 
            completedTours: newCompleted,
            miles: user.miles + 200 
        });
        
        setShowCompletion(true);
    };

    const handleShareInstagram = () => {
        onUpdateUser({ ...user, miles: user.miles + 100 });
        const text = `Acabo de completar el tour de ${tour.city} con BDAI! 🌍✨`;
        if (navigator.share) {
            navigator.share({ title: 'BDAI', text, url: window.location.href }).catch(() => {});
        } else {
            alert("¡Millas otorgadas! Compartiendo en Stories...");
            window.open(`https://www.instagram.com/`, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             {showCompletion && (
                 <div className="fixed inset-0 z-[9000] flex items-center justify-center p-6 animate-fade-in">
                     <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"></div>
                     <div className="bg-[#f3f0e6] w-full max-w-sm rounded-[3rem] border-[3px] border-[#d7d2c3] p-10 shadow-2xl relative z-10 flex flex-col items-center text-center text-slate-900">
                         <div className="w-24 h-24 rounded-full border-[3px] border-[#8b2b2b]/40 bg-white flex flex-col items-center justify-center shadow-xl rotate-[-12deg] mb-8 animate-bounce">
                             <span className="text-[7px] font-black uppercase leading-none text-[#8b2b2b]">{tour.country || 'ESPAÑA'}</span>
                             <span className="text-[10px] font-black uppercase text-slate-900 my-1 tracking-tight border-y border-[#8b2b2b]/20 py-0.5 w-full">{tour.city}</span>
                             <span className="text-[6px] font-bold text-slate-400 uppercase">{new Date().toLocaleDateString()}</span>
                         </div>
                         <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">{tl.congrats}</h3>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">{tl.stampDesc}</p>
                         
                         <div className="w-full space-y-3">
                             <button onClick={handleShareInstagram} className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">
                                 <i className="fab fa-instagram mr-2"></i> {tl.shareIg}
                             </button>
                             <button onClick={onBack} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                                 {tl.close}
                             </button>
                         </div>
                     </div>
                 </div>
             )}

             {showItinerary && (
                 <div className="fixed inset-0 z-[8000] flex flex-col">
                     <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowItinerary(false)}></div>
                     <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-10 max-h-[85vh] overflow-y-auto no-scrollbar animate-slide-up">
                         <h3 className="text-3xl font-black text-slate-950 uppercase mb-8">{tl.itinerary}</h3>
                         <div className="space-y-3">
                             {tour.stops.map((s: Stop, i: number) => (
                                 <button key={s.id} onClick={() => { onJumpTo(i); setShowItinerary(false); }} className={`w-full p-6 rounded-[2rem] flex items-center gap-5 ${currentStopIndex === i ? 'bg-purple-600 text-white shadow-xl' : 'bg-slate-50 text-slate-950 border border-slate-100'}`}>
                                     <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black ${currentStopIndex === i ? 'bg-white text-purple-600' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span>
                                     <div className="text-left flex-1 truncate">
                                         <p className="text-xs font-black uppercase truncate">{s.name}</p>
                                     </div>
                                 </button>
                             ))}
                         </div>
                         <button onClick={() => setShowItinerary(false)} className="w-full py-8 mt-6 text-slate-400 font-black uppercase text-[10px]">{tl.close}</button>
                     </div>
                 </div>
             )}

             {nearbyStopHint !== null && (
                <div className="fixed top-24 left-4 right-4 z-[7000] animate-bounce">
                    <button 
                        onClick={() => { onJumpTo(nearbyStopHint); setNearbyStopHint(null); }}
                        className="w-full bg-purple-600 text-white p-5 rounded-[2.5rem] shadow-2xl border-2 border-white/20 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                                <i className="fas fa-location-crosshairs"></i>
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">{tl.nearbyAlert}</p>
                                <p className="text-[11px] font-black uppercase truncate max-w-[150px]">{tour.stops[nearbyStopHint].name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                            {tl.jumpTo}
                        </div>
                    </button>
                </div>
             )}

             <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-[6000] pt-safe-iphone shrink-0 shadow-sm">
                <button onClick={onBack} className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 flex items-center justify-center shrink-0"><i className="fas fa-arrow-left text-xs"></i></button>
                <button onClick={() => setShowItinerary(true)} className="flex-1 mx-4 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-2xl flex items-center justify-between group overflow-hidden">
                    <div className="flex flex-col text-left truncate">
                        <p className="text-[7px] font-black text-purple-600 uppercase leading-none mb-1">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                        <h2 className="text-[10px] font-black text-slate-900 uppercase truncate leading-tight">{currentStop.name}</h2>
                    </div>
                    <i className="fas fa-list-ul text-[10px] text-slate-400 group-hover:text-purple-600 shrink-0 ml-2"></i>
                </button>
                <button onClick={() => handlePlayAudio(currentStop.id, currentStop.description)} className={`w-11 h-11 aspect-square rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90 shrink-0 ${audioPlayingId === currentStop.id ? 'bg-red-500 text-white' : 'bg-purple-600 text-white'}`}>
                    {audioLoadingId === currentStop.id ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${audioPlayingId === currentStop.id ? 'fa-stop' : 'fa-play'} text-xs ml-0.5`}></i>}
                </button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col">
                <div className="h-[45vh] w-full relative shrink-0">
                    <div className="w-full h-full">
                        <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={language} onStopSelect={(i: number) => onJumpTo(i)} userLocation={userLocation} />
                    </div>
                </div>
                <div className="px-8 pt-10 pb-44 space-y-8 bg-white rounded-t-[3.5rem] -mt-12 shadow-[0_-30px_60px_rgba(0,0,0,0.08)] z-[200] relative">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleCheckIn} disabled={rewardClaimed} className={`flex flex-col items-center justify-center gap-1 p-5 rounded-[2.5rem] font-black uppercase shadow-lg border transition-all ${rewardClaimed ? 'bg-green-100 text-green-600 border-green-200' : (IS_IN_RANGE ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20' : 'bg-slate-50 text-slate-400 border-slate-200')}`}>
                            <i className={`fas ${rewardClaimed ? 'fa-check-circle' : 'fa-location-dot'} text-lg mb-1`}></i>
                            <span className="text-[9px]">{rewardClaimed ? tl.checkedIn : tl.checkIn}</span>
                            {!rewardClaimed && <span className="text-[7px] text-purple-300 font-bold tracking-widest">{tl.rewardMiles}</span>}
                        </button>
                        <button onClick={() => setShowPhotoTip(!showPhotoTip)} className={`flex flex-col items-center justify-center gap-1 p-5 rounded-[2.5rem] font-black uppercase border transition-all ${showPhotoTip ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-900 text-white border-slate-800 shadow-xl shadow-slate-950/20'}`}>
                            <i className="fas fa-camera text-lg mb-1"></i>
                            <span className="text-[9px]">{tl.daiShot}</span>
                        </button>
                    </div>

                    {showPhotoTip && (
                        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><i className="fas fa-hashtag text-4xl text-amber-600"></i></div>
                            <p className="text-[7px] font-black text-amber-600 uppercase tracking-widest mb-2">{tl.angleLabel}</p>
                            <p className="text-xs font-bold text-amber-900 italic leading-relaxed">"{currentStop.photoSpot?.angle || tl.photoTipFallback}"</p>
                            <p className="text-[8px] font-black text-amber-400 mt-3 uppercase tracking-widest">#DaiShot #BetterDestinations</p>
                        </div>
                    )}

                    <div className="space-y-6 text-slate-800 text-lg leading-relaxed font-medium">
                        {currentStop.description.split('\n\n').map((p, i) => (
                            <p key={i} className="animate-fade-in first-letter:text-5xl first-letter:font-black first-letter:text-slate-950 first-letter:mr-3 first-letter:float-left">{p}</p>
                        ))}
                    </div>
                </div>
             </div>

             <div className="bg-white/90 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] pb-safe-iphone shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <button onClick={() => { onPrev(); stopAudio(); }} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest disabled:opacity-0 transition-opacity">{tl.prev}</button>
                {currentStopIndex === tour.stops.length - 1 ? (
                    <button onClick={handleFinishTour} className="flex-[2] py-5 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-[0.98] transition-all">
                        {tl.finish}
                    </button>
                ) : (
                    <button onClick={() => { onNext(); stopAudio(); }} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-[0.98] transition-all">
                        {tl.next}
                    </button>
                )}
             </div>
        </div>
    );
};
