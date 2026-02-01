
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile, CapturedMoment } from '../types';
import { SchematicMap } from './SchematicMap';
import { generateAudio, generateSmartCaption } from '../services/geminiService';

const TEXTS: any = {
    es: { start: "Lanzar", stop: "Parada", of: "de", photoSpot: "Ángulo Técnico", capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Avanzar", meters: "m", itinerary: "Itinerario", syncing: "Sincronizando...", tooFar: "GPS Incierto", generateStory: "Verificar por Foto", checkIn: "Check-in GPS", checkedIn: "Verificada", shareInsta: "Copiar Caption", distance: "a", refreshGps: "Refrescar GPS", gpsOk: "GPS OK", gpsLow: "GPS Débil" },
    en: { start: "Launch", stop: "Stop", of: "of", photoSpot: "Technical Angle", capture: "Log Data", rewardReceived: "Synced", prev: "Back", next: "Next", meters: "m", itinerary: "Itinerary", syncing: "Syncing...", tooFar: "GPS Uncertain", generateStory: "Verify by Photo", checkIn: "GPS Check-in", checkedIn: "Verified", shareInsta: "Copy Caption", distance: "at", refreshGps: "Refresh GPS", gpsOk: "GPS OK", gpsLow: "Low GPS" },
    it: { start: "Avvia", stop: "Tappa", of: "di", photoSpot: "Angolo Tecnico", capture: "Log Dati", rewardReceived: "Sincronizzato", prev: "Indietro", next: "Avanti", meters: "m", itinerary: "Itinerario", syncing: "Sincronizzazione...", tooFar: "GPS Incerto", generateStory: "Verifica con Foto", checkIn: "Check-in GPS", checkedIn: "Verificato", shareInsta: "Copia Didascalia", distance: "a", refreshGps: "Aggiorna GPS", gpsOk: "GPS OK", gpsLow: "GPS Debole" },
    pt: { start: "Iniciar", stop: "Parada", of: "de", photoSpot: "Ângulo Técnico", capture: "Log Dados", rewardReceived: "Sincronizado", prev: "Voltar", next: "Avançar", meters: "m", itinerary: "Itinerário", syncing: "Sincronizando...", tooFar: "GPS Incerto", generateStory: "Verificar por Foto", checkIn: "Check-in GPS", checkedIn: "Verificada", shareInsta: "Copiar Legenda", distance: "a", refreshGps: "Atualizar GPS", gpsOk: "GPS OK", gpsLow: "GPS Fraco" },
    fr: { start: "Lancer", stop: "Arrêt", of: "de", photoSpot: "Angle Technique", capture: "Log Données", rewardReceived: "Synchronisé", prev: "Retour", next: "Suivant", meters: "m", itinerary: "Itinéraire", syncing: "Sync...", tooFar: "GPS Incertain", generateStory: "Vérifier par Photo", checkIn: "Check-in GPS", checkedIn: "Vérifié", shareInsta: "Copier Légende", distance: "à", refreshGps: "Actualiser GPS", gpsOk: "GPS OK", gpsLow: "GPS Faible" },
    de: { start: "Starten", stop: "Stopp", of: "von", photoSpot: "Technischer Winkel", capture: "Daten Loggen", rewardReceived: "Synchronisiert", prev: "Zurück", next: "Weiter", meters: "m", itinerary: "Route", syncing: "Synchronisiere...", tooFar: "GPS Unsicher", generateStory: "Per Foto verifizieren", checkIn: "GPS Check-in", checkedIn: "Verifiziert", shareInsta: "Text kopieren", distance: "bei", refreshGps: "GPS erneuern", gpsOk: "GPS OK", gpsLow: "GPS Schwach" },
    ja: { start: "開始", stop: "停留所", of: "/", photoSpot: "テクニカルアングル", capture: "データをログ", rewardReceived: "同期済み", prev: "戻る", next: "次へ", meters: "m", itinerary: "旅程", syncing: "同期中...", tooFar: "GPS不安定", generateStory: "写真で確認", checkIn: "GPSチェックイン", checkedIn: "確認済み", shareInsta: "キャプションをコピー", distance: "まで", refreshGps: "GPS更新", gpsOk: "GPS良好", gpsLow: "GPS弱" },
    ru: { start: "Запуск", stop: "Остановка", of: "из", photoSpot: "Технический угол", capture: "Лог данных", rewardReceived: "Синхронизировано", prev: "Назад", next: "Вперед", meters: "м", itinerary: "Маршрут", syncing: "Синхронизация...", tooFar: "GPS неточен", generateStory: "Проверить по фото", checkIn: "GPS Регистрация", checkedIn: "Подтверждено", shareInsta: "Копировать текст", distance: "в", refreshGps: "Обновить GPS", gpsOk: "GPS OK", gpsLow: "Слабый GPS" },
    ar: { start: "إطلاق", stop: "محطة", of: "من", photoSpot: "زاوية تقنية", capture: "تسجيل البيانات", rewardReceived: "تمت المزامنة", prev: "رجوع", next: "التالي", meters: "م", itinerary: "المسار", syncing: "جاري المزامنة...", tooFar: "GPS غير دقيق", generateStory: "تأكيد بالصورة", checkIn: "تأكيد GPS", checkedIn: "تم التأكيد", shareInsta: "نسخ النص", distance: "على بعد", refreshGps: "تحديث GPS", gpsOk: "GPS جيد", gpsLow: "GPS ضعيف" },
    zh: { start: "启动", stop: "停留", of: "之", photoSpot: "技术角度", capture: "记录数据", rewardReceived: "已同步", prev: "返回", next: "下一步", meters: "米", itinerary: "行程", syncing: "同步中...", tooFar: "GPS 不确定", generateStory: "通过照片验证", checkIn: "GPS 签到", checkedIn: "已验证", shareInsta: "复制文案", distance: "于", refreshGps: "刷新 GPS", gpsOk: "GPS 正常", gpsLow: "GPS 信号弱" },
    ca: { start: "Llançar", stop: "Parada", of: "de", photoSpot: "Angle Tècnic", capture: "Log Dades", rewardReceived: "Sincronitzat", prev: "Enrere", next: "Avançar", meters: "m", itinerary: "Itinerari", syncing: "Sincronitzant...", tooFar: "GPS Incert", generateStory: "Verificar per Foto", checkIn: "Check-in GPS", checkedIn: "Verificada", shareInsta: "Copiar Caption", distance: "a", refreshGps: "Refrescar GPS", gpsOk: "GPS OK", gpsLow: "GPS Feble" },
    eu: { start: "Lauziratu", stop: "Geltokia", of: "-(e)tik", photoSpot: "Angelu Teknikoa", capture: "Datuak Erregistratu", rewardReceived: "Sinkronizatuta", prev: "Atzera", next: "Aurrera", meters: "m", itinerary: "Ibilbidea", syncing: "Sinkronizatzen...", tooFar: "GPS Ziurgabea", generateStory: "Argazki bidez Egiaztatu", checkIn: "GPS Check-in", checkedIn: "Egiaztatuta", shareInsta: "Caption Kopiatu", distance: "-(e)an", refreshGps: "GPS Freskatu", gpsOk: "GPS OK", gpsLow: "GPS Ahula" },
    hi: { start: "लॉन्च", stop: "स्टॉप", of: "का", photoSpot: "तकनीकी कोण", capture: "डेटा लॉग करें", rewardReceived: "सिंक किया गया", prev: "पीछे", next: "आगे", meters: "मी", itinerary: "यात्रा कार्यक्रम", syncing: "सिंक हो रहा है...", tooFar: "GPS अनिश्चित", generateStory: "फोटो द्वारा सत्यापित करें", checkIn: "GPS चेक-इन", checkedIn: "सत्यापित", shareInsta: "कैप्शन कॉपी करें", distance: "पर", refreshGps: "GPS रिफ्रेश करें", gpsOk: "GPS ठीक है", gpsLow: "कम GPS" },
    ko: { start: "시작", stop: "정지", of: "/", photoSpot: "기술적 각도", capture: "데이터 로그", rewardReceived: "동기화됨", prev: "이전", next: "다음", meters: "m", itinerary: "일정", syncing: "동기화 중...", tooFar: "GPS 불확실", generateStory: "사진으로 확인", checkIn: "GPS 체크인", checkedIn: "확인됨", shareInsta: "캡션 복사", distance: "위치", refreshGps: "GPS 새로고침", gpsOk: "GPS 양호", gpsLow: "GPS 약함" },
    tr: { start: "Başlat", stop: "Durak", of: "/", photoSpot: "Teknik Açı", capture: "Veri Günlüğü", rewardReceived: "Senkronize", prev: "Geri", next: "İleri", meters: "m", itinerary: "Güzergah", syncing: "Senkronize ediliyor...", tooFar: "GPS Belirsiz", generateStory: "Fotoğrafla Doğrula", checkIn: "GPS Check-in", checkedIn: "Doğrulandı", shareInsta: "Açıklamayı Kopyala", distance: "mesafede", refreshGps: "GPS Yenile", gpsOk: "GPS TAMAM", gpsLow: "GPS Zayıf" }
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
    <div 
      onClick={() => onSelect(tour)} 
      className="group bg-slate-900 border-2 border-white/5 rounded-[2.5rem] overflow-hidden p-8 mb-6 cursor-pointer relative active:scale-[0.98] transition-all hover:border-purple-500/40 shadow-2xl"
    >
      <div className="flex flex-col">
          <div className="mb-4 flex justify-between items-center">
             <span className="px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest bg-purple-600 text-white shadow-lg">
               {tour.theme || "Tech Masterclass"}
             </span>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
               {tour.difficulty || "Moderate"}
             </span>
          </div>
          
          <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter leading-tight group-hover:text-purple-400 transition-colors">
            {tour.title}
          </h3>
          
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-6 font-medium">
            {tour.description}
          </p>
          
          <div className="flex items-center justify-between pt-6 border-t border-white/5">
               <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Tiempo</span>
                    <span className="text-white font-black text-xs uppercase tracking-tighter">{tour.duration}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Distancia</span>
                    <span className="text-white font-black text-xs uppercase tracking-tighter">{tour.distance}</span>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                 <span className="text-purple-500 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                   {tl.start}
                 </span>
                 <div className="w-10 h-10 bg-white text-slate-950 rounded-2xl flex items-center justify-center shadow-xl group-hover:bg-purple-500 group-hover:text-white transition-all">
                   <i className="fas fa-play text-[10px] ml-0.5"></i>
                 </div>
               </div>
          </div>
      </div>
      
      {/* Escaneo Visual Decorativo */}
      <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/10 overflow-hidden">
          <div className="w-1/3 h-full bg-purple-500 animate-scan"></div>
      </div>
    </div>
  );
};

export const ActiveTourCard: React.FC<any> = ({ tour, user, currentStopIndex, onNext, onPrev, onJumpTo, onUpdateUser, onBack, language = 'es', userLocation }) => {
    const tl = TEXTS[language] || TEXTS.es;
    
    if (!tour || !tour.stops || tour.stops.length === 0) {
        useEffect(() => { onBack(); }, []);
        return null;
    }

    const currentStop = tour.stops[currentStopIndex] as Stop;
    
    if (!currentStop) {
        useEffect(() => { onJumpTo(0); }, []);
        return null;
    }
    
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [photoClaimed, setPhotoClaimed] = useState(false);
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [storyMoment, setStoryMoment] = useState<CapturedMoment | null>(null);
    const [showItinerary, setShowItinerary] = useState(false);
    const [isRefreshingGps, setIsRefreshingGps] = useState(false);

    const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
    const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const distToTarget = useMemo(() => {
        if (!userLocation || !currentStop) return null;
        return Math.round(calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude));
    }, [userLocation, currentStop]);

    const IS_IN_RANGE = distToTarget !== null && distToTarget <= 1000;

    useEffect(() => {
        setRewardClaimed(false);
        setPhotoClaimed(false);
        setStoryMoment(null);
        stopAudio();
    }, [currentStop?.id]);

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch(e) {}
            sourceNodeRef.current = null;
        }
        setAudioPlayingId(null);
    };

    const handleRefreshGps = () => {
        setIsRefreshingGps(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(() => {
                setTimeout(() => setIsRefreshingGps(false), 1500);
            }, () => setIsRefreshingGps(false), { enableHighAccuracy: true });
        } else {
            setIsRefreshingGps(false);
        }
    };

    const handlePlayAudio = async (stopId: string, text: string) => {
        if (audioPlayingId === stopId) { stopAudio(); return; }
        stopAudio();
        setAudioLoadingId(stopId);
        try {
            const base64 = await generateAudio(text, user.language);
            if (!base64) throw new Error();
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
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
        } catch (e) { alert("Error audio"); } finally { setAudioLoadingId(null); }
    };

    const handleCheckIn = () => {
        if (!IS_IN_RANGE) { 
            alert(`${tl.tooFar}: Estás a ${distToTarget}m. Acércate más o usa "Verificar por Foto" si el GPS no es exacto.`); 
            return; 
        }
        setRewardClaimed(true);
        onUpdateUser({ ...user, miles: user.miles + 50 });
    };

    const handlePhotoReward = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsGeneratingStory(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            try {
                const caption = await generateSmartCaption(base64, currentStop, language);
                const moment = { 
                    id: `m_${Date.now()}`, 
                    stopId: currentStop.id, 
                    stopName: currentStop.name, 
                    city: tour.city, 
                    imageUrl: base64, 
                    caption, 
                    timestamp: new Date().toISOString() 
                };
                setStoryMoment(moment);
                setShowStoryModal(true);
                setPhotoClaimed(true);
                const milesBonus = rewardClaimed ? 100 : 150;
                setRewardClaimed(true);
                onUpdateUser({ 
                    ...user, 
                    miles: user.miles + milesBonus, 
                    capturedMoments: [...(user.capturedMoments || []), moment] 
                });
            } catch (err) { 
                alert("La IA no pudo verificar el lugar con esta foto. Prueba otro ángulo."); 
            } finally { 
                setIsGeneratingStory(false); 
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col z-[5000] overflow-hidden">
             {showStoryModal && storyMoment && (
                 <div className="fixed inset-0 z-[9000] bg-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in">
                     <div className="w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-slide-up">
                         <div className="aspect-[9/16] relative">
                            <img src={storyMoment.imageUrl} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 text-white">
                                <h4 className="text-xs font-black uppercase mb-2">{storyMoment.stopName}</h4>
                                <p className="text-xs italic opacity-90">"{storyMoment.caption}"</p>
                            </div>
                         </div>
                         <div className="p-8 space-y-3 bg-white">
                            <button onClick={() => { navigator.clipboard.writeText(storyMoment.caption); alert("Copiado!"); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">{tl.shareInsta}</button>
                            <button onClick={() => setShowStoryModal(false)} className="w-full py-3 text-slate-400 font-black uppercase text-[9px]">Cerrar</button>
                         </div>
                     </div>
                 </div>
             )}
             
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
             
             {showItinerary && (
                 <div className="fixed inset-0 z-[8000] flex flex-col">
                     <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowItinerary(false)}></div>
                     <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-10 max-h-[85vh] overflow-y-auto no-scrollbar animate-slide-up">
                         <h3 className="text-3xl font-black text-slate-950 uppercase mb-8">{tl.itinerary}</h3>
                         <div className="space-y-3">
                             {tour.stops.map((s: Stop, i: number) => (
                                 <button key={s.id} onClick={() => { onJumpTo(i); setShowItinerary(false); }} className={`w-full p-6 rounded-[2rem] flex items-center gap-5 ${currentStopIndex === i ? 'bg-purple-600 text-white shadow-xl' : 'bg-slate-50 text-slate-950 border border-slate-100'}`}>
                                     <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black ${currentStopIndex === i ? 'bg-white text-purple-600' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span>
                                     <div className="text-left flex-1 min-w-0">
                                         <p className="text-xs font-black uppercase truncate">{s.name}</p>
                                         <p className="text-[9px] font-bold uppercase opacity-60">{s.type}</p>
                                     </div>
                                 </button>
                             ))}
                         </div>
                         <button onClick={() => setShowItinerary(false)} className="w-full py-8 mt-10 text-slate-400 font-black uppercase text-[10px]">Cerrar</button>
                     </div>
                 </div>
             )}

             <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-[6000] shrink-0 pt-safe-iphone shadow-sm">
                <button onClick={onBack} className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-950"><i className="fas fa-arrow-left text-xs"></i></button>
                
                <button onClick={() => setShowItinerary(true)} className="flex-1 mx-4 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-2xl flex items-center justify-between group active:bg-slate-100 transition-all overflow-hidden">
                    <div className={`flex flex-col text-left truncate ${language === 'ar' ? 'order-2 text-right' : ''}`}>
                        <p className="text-[7px] font-black text-purple-600 uppercase mb-0.5">{tl.stop} {currentStopIndex + 1} {tl.of} {tour.stops.length}</p>
                        <h2 className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[140px] leading-tight">{currentStop.name}</h2>
                    </div>
                    <i className={`fas fa-list-ul text-[10px] text-slate-400 group-hover:text-purple-600 ${language === 'ar' ? 'order-1' : ''}`}></i>
                </button>

                <button onClick={() => handlePlayAudio(currentStop.id, currentStop.description)} className={`w-11 h-11 rounded-xl flex items-center justify-center ${audioPlayingId === currentStop.id ? 'bg-red-500 text-white' : 'bg-purple-600 text-white shadow-lg'}`}>{audioLoadingId === currentStop.id ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${audioPlayingId === currentStop.id ? 'fa-stop' : 'fa-play'} text-xs ml-0.5`}></i>}</button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col relative">
                <div className="h-[32vh] w-full relative z-[100] shrink-0 border-b border-slate-100 bg-slate-200">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={language} onStopSelect={(i: number) => { onJumpTo(i); stopAudio(); }} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} userLocation={userLocation} />
                    <button onClick={handleRefreshGps} className="absolute bottom-4 right-4 z-[500] w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-purple-600 border border-purple-100 active:scale-90 transition-all">
                        <i className={`fas fa-location-crosshairs ${isRefreshingGps ? 'animate-spin' : ''}`}></i>
                    </button>
                </div>

                <div className="px-8 pt-10 pb-44 space-y-10 bg-white rounded-t-[3.5rem] -mt-12 shadow-[0_-30px_60px_rgba(0,0,0,0.08)] z-[200]">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleCheckIn} disabled={rewardClaimed} className={`flex flex-col items-center justify-center gap-2 p-5 rounded-[2.5rem] font-black uppercase text-[9px] shadow-lg border transition-all ${rewardClaimed ? 'bg-green-100 text-green-600 border-green-200' : (IS_IN_RANGE ? 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20' : 'bg-slate-50 text-slate-400 border-slate-200')}`}>
                            <i className={`fas ${rewardClaimed ? 'fa-check-circle' : 'fa-location-dot'} text-lg`}></i>
                            <span className="text-center">{rewardClaimed ? tl.checkedIn : tl.checkIn}</span>
                            {!rewardClaimed && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${IS_IN_RANGE ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className="text-[7px] opacity-60 font-bold lowercase">{distToTarget ?? '?'}m</span>
                                </div>
                            )}
                        </button>
                        
                        <button onClick={handlePhotoReward} disabled={isGeneratingStory || photoClaimed} className={`flex flex-col items-center justify-center gap-2 p-5 rounded-[2.5rem] font-black uppercase text-[9px] shadow-xl border transition-all ${photoClaimed ? 'bg-slate-50 text-purple-600 border-purple-100' : 'bg-slate-950 text-white border-slate-800 shadow-slate-900/40'}`}>
                            {isGeneratingStory ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-camera text-lg"></i>}
                            <span className="text-center">{isGeneratingStory ? 'SYNC...' : photoClaimed ? tl.rewardReceived : tl.generateStory}</span>
                            {!photoClaimed && !isGeneratingStory && (
                                <span className="text-[7px] opacity-40 font-bold uppercase tracking-widest mt-1">Manual Bypass</span>
                            )}
                        </button>
                    </div>

                    <div className="relative group">
                        <div className="space-y-10 text-slate-800 text-lg leading-relaxed font-medium">
                            {currentStop.description.split('\n\n').map((paragraph, idx) => (
                                <p key={idx} className={`animate-fade-in first-letter:text-6xl first-letter:font-black first-letter:text-slate-950 first-letter:float-left opacity-90 ${language === 'ar' ? 'text-right first-letter:float-right first-letter:ml-3 first-letter:mr-0' : 'first-letter:mr-3'}`}>{paragraph}</p>
                            ))}
                        </div>
                        <div className={`absolute top-0 ${language === 'ar' ? 'left-0' : 'right-0'}`}>
                            <button onClick={() => handlePlayAudio(currentStop.id, currentStop.description)} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl ${audioPlayingId === currentStop.id ? 'bg-red-500 text-white' : 'bg-white text-purple-600 border border-purple-100'}`}>
                                {audioLoadingId === currentStop.id ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas ${audioPlayingId === currentStop.id ? 'fa-stop' : 'fa-headphones-simple'} text-xl`}></i>}
                            </button>
                        </div>
                    </div>
                </div>
             </div>

             <div className="bg-white/90 backdrop-blur-2xl border-t border-slate-100 p-6 flex gap-3 z-[6000] shrink-0 pb-safe-iphone shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <button onClick={() => { onPrev(); stopAudio(); }} disabled={currentStopIndex === 0} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest disabled:opacity-0">{tl.prev}</button>
                <button onClick={() => { onNext(); stopAudio(); }} disabled={currentStopIndex === tour.stops.length - 1} className="flex-[2] py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl">{tl.next}</button>
             </div>
        </div>
    );
};
