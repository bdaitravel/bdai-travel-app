
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Tour, Stop, UserProfile, VisaStamp } from '../types';
import { SchematicMap } from './SchematicMap';
import { generateAudio } from '../services/geminiService';
import { syncUserProfile } from '../services/supabaseClient';

const TEXTS: any = {
    es: { start: "Lanzar", stop: "Parada", of: "de", daiShot: "Consejo Dai", angleLabel: "Ángulo Dai:", photoTipFallback: "Busca una perspectiva lateral.", capture: "Logear Datos", rewardReceived: "Sincronizado", prev: "Atrás", next: "Siguiente", meters: "m", itinerary: "Itinerario", finish: "Finalizar Tour", congrats: "¡Tour Completado!", stampDesc: "Nuevo sello ganado", shareIg: "Compartir (+100 Millas)", close: "Cerrar", tooFar: "GPS Incierto", checkIn: "Check-in GPS", checkedIn: "Verificada", distance: "Distancia", duration: "Duración", nearbyAlert: "Parada Cercana", jumpTo: "Saltar aquí", rewardMiles: "+50 MILLAS", visaId: "VISADO", boardingPass: "TARJETA DE EMBARQUE", approved: "APROBADO", rewardTotal: "Recompensa total", rankUp: "Rango actualizado", shareText: "¡He completado la Masterclass de {city} en bdai! +250 millas acumuladas. 🌍✈️" },
    en: { start: "Launch", stop: "Stop", of: "of", daiShot: "Dai Tip", angleLabel: "Dai Angle:", photoTipFallback: "Look for a side perspective.", capture: "Log Data", rewardReceived: "Synced", prev: "Back", next: "Next", meters: "m", itinerary: "Itinerary", finish: "Finish Tour", congrats: "Tour Completed!", stampDesc: "You earned a new stamp", shareIg: "Share (+100 Miles)", close: "Close", tooFar: "GPS Uncertain", checkIn: "GPS Check-in", checkedIn: "Verified", distance: "Distance", duration: "Duration", nearbyAlert: "Nearby Stop", jumpTo: "Jump here", rewardMiles: "+50 MILES", visaId: "VISA", boardingPass: "BOARDING PASS", approved: "APPROVED", rewardTotal: "Total reward", rankUp: "Rank updated", shareText: "I just finished the {city} Masterclass on bdai! +250 miles earned. 🌍✈️" },
    fr: { start: "Lancer", stop: "Arrêt", of: "sur", daiShot: "Conseil Dai", angleLabel: "Angle Dai :", photoTipFallback: "Cherchez une perspective latérale.", capture: "Log Données", rewardReceived: "Synchronisé", prev: "Précédent", next: "Suivant", meters: "m", itinerary: "Itinéraire", finish: "Terminer le Tour", congrats: "Tour Terminé!", stampDesc: "Nouveau tampon gagné", shareIg: "Partager (+100 Miles)", close: "Fermer", tooFar: "GPS Incertain", checkIn: "Check-in GPS", checkedIn: "Vérifié", distance: "Distance", duration: "Durée", nearbyAlert: "Arrêt Proche", jumpTo: "Aller ici", rewardMiles: "+50 MILES", visaId: "VISA", boardingPass: "CARTE D'EMBARQUEMENT", approved: "APPROUVÉ", rewardTotal: "Récompense totale", rankUp: "Rang mis à jour", shareText: "Je viens de terminer la Masterclass {city} sur bdai ! +250 miles gagnés. 🌍✈️" },
    de: { start: "Starten", stop: "Halt", of: "von", daiShot: "Dai Tipp", angleLabel: "Dai Winkel:", photoTipFallback: "Suchen Sie nach einer Seitenperspektive.", capture: "Daten protokollieren", rewardReceived: "Synchronisiert", prev: "Zurück", next: "Weiter", meters: "m", itinerary: "Route", finish: "Tour beenden", congrats: "Tour abgeschlossen!", stampDesc: "Neuer Stempel erhalten", shareIg: "Teilen (+100 Meilen)", close: "Schließen", tooFar: "GPS unsicher", checkIn: "GPS Check-in", checkedIn: "Verifiziert", distance: "Entfernung", duration: "Dauer", nearbyAlert: "Halt in der Nähe", jumpTo: "Hierher springen", rewardMiles: "+50 MEILEN", visaId: "VISA", boardingPass: "BORDKARTE", approved: "GENEHMIGT", rewardTotal: "Gesamtbelohnung", rankUp: "Rang aktualisiert", shareText: "Ich habe gerade die {city} Masterclass auf bdai beendet! +250 Meilen verdient. 🌍✈️" },
    it: { start: "Avvia", stop: "Tappa", of: "di", daiShot: "Consiglio Dai", angleLabel: "Angolo Dai:", photoTipFallback: "Cerca una prospettiva laterale.", capture: "Log Dati", rewardReceived: "Sincronizzato", prev: "Indietro", next: "Avanti", meters: "m", itinerary: "Itinerario", finish: "Termina Tour", congrats: "Tour Completato!", stampDesc: "Nuovo timbro guadagnato", shareIg: "Condividi (+100 Miglia)", close: "Chiudi", tooFar: "GPS Incerto", checkIn: "Check-in GPS", checkedIn: "Verificato", distance: "Distanza", duration: "Durata", nearbyAlert: "Tappa Vicina", jumpTo: "Salta qui", rewardMiles: "+50 MIGLIA", visaId: "VISA", boardingPass: "CARTA D'IMBARCO", approved: "APPROVATO", rewardTotal: "Premio totale", rankUp: "Rango aggiornato", shareText: "Ho appena finito la Masterclass di {city} su bdai! +250 miglia guadagnate. 🌍✈️" },
    pt: { start: "Iniciar", stop: "Paragem", of: "de", daiShot: "Dica Dai", angleLabel: "Ângulo Dai:", photoTipFallback: "Procure uma perspectiva lateral.", capture: "Log de Dados", rewardReceived: "Sincronizado", prev: "Voltar", next: "Seguinte", meters: "m", itinerary: "Itinerário", finish: "Finalizar Tour", congrats: "Tour Concluído!", stampDesc: "Novo carimbo ganho", shareIg: "Partilhar (+100 Milhas)", close: "Fechar", tooFar: "GPS Incerto", checkIn: "Check-in GPS", checkedIn: "Verificado", distance: "Distância", duration: "Duração", nearbyAlert: "Paragem Próxima", jumpTo: "Ir para aqui", rewardMiles: "+50 MILHAS", visaId: "VISTO", boardingPass: "CARTÃO DE EMBARQUE", approved: "APROVADO", rewardTotal: "Recompensa total", rankUp: "Rank atualizado", shareText: "Acabei de terminar a Masterclass de {city} no bdai! +250 milhas ganhas. 🌍✈️" },
    ro: { start: "Lansează", stop: "Oprire", of: "din", daiShot: "Sfat Dai", angleLabel: "Unghi Dai:", photoTipFallback: "Caută o perspectivă laterală.", capture: "Înregistrare date", rewardReceived: "Sincronizat", prev: "Înapoi", next: "Înainte", meters: "m", itinerary: "Itinerariu", finish: "Finalizare tur", congrats: "Tur completat!", stampDesc: "Stampilă nouă câștigată", shareIg: "Partajează (+100 Mile)", close: "Închide", tooFar: "GPS Incert", checkIn: "Check-in GPS", checkedIn: "Verificat", distance: "Distanță", duration: "Durată", nearbyAlert: "Oprire apropiată", jumpTo: "Sari aici", rewardMiles: "+50 MILE", visaId: "VIZĂ", boardingPass: "CARTE DE ÎMBARCARE", approved: "APROBAT", rewardTotal: "Recompensă totală", rankUp: "Rang actualizat", shareText: "Tocmai am terminat Masterclass-ul {city} pe bdai! +250 mile câștigate. 🌍✈️" },
    zh: { start: "开始", stop: "站点", of: "属于", daiShot: "Dai 建议", angleLabel: "Dai 角度:", photoTipFallback: "寻找侧视图。", capture: "记录数据", rewardReceived: "已同步", prev: "上一步", next: "下一步", meters: "米", itinerary: "行程", finish: "结束行程", congrats: "行程完成！", stampDesc: "获得新印章", shareIg: "分享 (+100 里程)", close: "关闭", tooFar: "GPS 不稳定", checkIn: "GPS 签到", checkedIn: "已验证", distance: "距离", duration: "用时", nearbyAlert: "附近站点", jumpTo: "跳转至此", rewardMiles: "+50 里程", visaId: "签证", boardingPass: "登机牌", approved: "已批准", rewardTotal: "总奖励", rankUp: "等级已更新", shareText: "我刚刚在 bdai 完成了 {city} 的大师课！获得了 +250 里程。🌍✈️" },
    ja: { start: "開始", stop: "スポット", of: "の", daiShot: "Dai チップ", angleLabel: "Dai 角度:", photoTipFallback: "横からの視点を探してください。", capture: "データを記録", rewardReceived: "同期済み", prev: "戻る", next: "次へ", meters: "m", itinerary: "行程", finish: "ツアーを終了", congrats: "ツアー完了！", stampDesc: "新しいスタンプを獲得", shareIg: "シェア (+100 マイル)", close: "閉じる", tooFar: "GPS 不安定", checkIn: "GPS チェックイン", checkedIn: "確認済み", distance: "距離", duration: "時間", nearbyAlert: "近くのスポット", jumpTo: "ここへ移動", rewardMiles: "+50 マイル", visaId: "ビザ", boardingPass: "搭乗券", approved: "承認済み", rewardTotal: "合計報酬", rankUp: "ランク更新", shareText: "bdai で {city} のマスタークラスを完了しました！+250 マイル獲得。🌍✈️" },
    ru: { start: "Запуск", stop: "Остановка", of: "из", daiShot: "Совет Dai", angleLabel: "Угол Dai:", photoTipFallback: "Ищите боковую перспективу.", capture: "Записать данные", rewardReceived: "Синхронизировано", prev: "Назад", next: "Далее", meters: "м", itinerary: "Маршрут", finish: "Завершить тур", congrats: "Тур завершен!", stampDesc: "Получен новый штамп", shareIg: "Поделиться (+100 миль)", close: "Закрыть", tooFar: "GPS неточен", checkIn: "GPS-регистрация", checkedIn: "Проверено", distance: "Расстояние", duration: "Длительность", nearbyAlert: "Остановка рядом", jumpTo: "Перейти сюда", rewardMiles: "+50 МИЛЬ", visaId: "ВИЗА", boardingPass: "ПОСАДОЧНЫЙ ТАЛОН", approved: "ОДОБРЕНО", rewardTotal: "Итоговая награда", rankUp: "Ранг обновлен", shareText: "Я только что закончил мастер-класс по {city} на bdai! Заработано +250 миль. 🌍✈️" },
    ar: { start: "بدء", stop: "محطة", of: "من", daiShot: "نصيحة Dai", angleLabel: "زاوية Dai:", photoTipFallback: "ابحث عن منظور جانبي.", capture: "تسجيل البيانات", rewardReceived: "تمت المزامنة", prev: "السابق", next: "التالي", meters: "م", itinerary: "المسار", finish: "إنهاء الجولة", congrats: "تمت الجولة!", stampDesc: "حصلت على ختم جديد", shareIg: "مشاركة (+100 ميل)", close: "إغلاق", tooFar: "GPS غير مؤكد", checkIn: "تسجيل GPS", checkedIn: "تم التحقق", distance: "المسافة", duration: "المدة", nearbyAlert: "محطة قريبة", jumpTo: "انتقل هنا", rewardMiles: "+50 ميل", visaId: "تأشيرة", boardingPass: "بطاقة صعود", approved: "تمت الموافقة", rewardTotal: "إجمالي المكافأة", rankUp: "تم تحديث الرتبة", shareText: "لقد انتهيت للتو من دروس {city} على bdai! ربحت +250 ميل. 🌍✈️" },
    hi: { start: "शुरू करें", stop: "पड़ाव", of: "का", daiShot: "दाई टिप", angleLabel: "दाई कोण:", photoTipFallback: "साइड परिप्रेक्ष्य की तलाश करें।", capture: "डेटा लॉग करें", rewardReceived: "सिंक किया गया", prev: "पीछे", next: "अगला", meters: "मी", itinerary: "यात्रा कार्यक्रम", finish: "टूर समाप्त करें", congrats: "टूर पूरा हुआ!", stampDesc: "आपको एक नया स्टैम्प मिला", shareIg: "साझा करें (+100 मील)", close: "बंद करें", tooFar: "GPS अनिश्चित", checkIn: "GPS चेक-इन", checkedIn: "सत्यापित", distance: "दूरी", duration: "अवधि", nearbyAlert: "पास का पड़ाव", jumpTo: "यहाँ जाएँ", rewardMiles: "+50 मील", visaId: "वीजा", boardingPass: "बोर्डिंग पास", approved: "अनुमोदित", rewardTotal: "कुल इनाम", rankUp: "रैंक अपडेट किया गया", shareText: "मैंने अभी bdai पर {city} मास्टरक्लास पूरा किया है! +250 मील अर्जित किए। 🌍✈️" },
    ko: { start: "시작", stop: "정류장", of: "의", daiShot: "Dai 팁", angleLabel: "Dai 각도:", photoTipFallback: "측면 원근법을 찾아보세요.", capture: "데이터 기록", rewardReceived: "동기화됨", prev: "이전", next: "다음", meters: "m", itinerary: "일정", finish: "투어 종료", congrats: "투어 완료!", stampDesc: "새 스탬프를 획득했습니다", shareIg: "공유 (+100 마일)", close: "닫기", tooFar: "GPS 불확실", checkIn: "GPS 체크인", checkedIn: "확인됨", distance: "거리", duration: "소요시간", nearbyAlert: "근처 정류장", jumpTo: "여기로 이동", rewardMiles: "+50 마일", visaId: "비자", boardingPass: "탑승권", approved: "승인됨", rewardTotal: "총 보상", rankUp: "순위 업데이트됨", shareText: "방금 bdai에서 {city} 마스터클래스를 마쳤습니다! +250 마일을 획득했습니다. 🌍✈️" },
    tr: { start: "Başlat", stop: "Durak", of: "/", daiShot: "Dai İpucu", angleLabel: "Dai Açısı:", photoTipFallback: "Yan bir perspektif arayın.", capture: "Veri Kaydet", rewardReceived: "Senkronize", prev: "Geri", next: "İleri", meters: "m", itinerary: "Güzergah", finish: "Turu Bitir", congrats: "Tur Tamamlandı!", stampDesc: "Yeni bir damga kazandınız", shareIg: "Paylaş (+100 Mil)", close: "Kapat", tooFar: "GPS Belirsiz", checkIn: "GPS Check-in", checkedIn: "Doğrulandı", distance: "Mesafe", duration: "Süre", nearbyAlert: "Yakın Durak", jumpTo: "Buraya atla", rewardMiles: "+50 MİL", visaId: "VİZE", boardingPass: "BORD KARTI", approved: "ONAYLANDI", rewardTotal: "Toplam ödül", rankUp: "Rütbe güncellendi", shareText: "{city} Masterclass'ını bdai'de bitirdim! +250 mil kazandım. 🌍✈️" },
    pl: { start: "Uruchom", stop: "Przystanek", of: "z", daiShot: "Wskazówka Dai", angleLabel: "Kąt Dai:", photoTipFallback: "Poszukaj perspektywy bocznej.", capture: "Zaloguj dane", rewardReceived: "Zsynchronizowano", prev: "Wstecz", next: "Dalej", meters: "m", itinerary: "Plan podróży", finish: "Zakończ Tour", congrats: "Tour ukończony!", stampDesc: "Zdobyłeś nowy stempel", shareIg: "Udostępnij (+100 mil)", close: "Zamknij", tooFar: "Niepewny GPS", checkIn: "Check-in GPS", checkedIn: "Zweryfikowano", distance: "Dystans", duration: "Czas trwania", nearbyAlert: "Przystanek obok", jumpTo: "Skocz tutaj", rewardMiles: "+50 MIL", visaId: "WIZA", boardingPass: "KARTA POKŁADOWA", approved: "ZATWIERDZONO", rewardTotal: "Suma nagród", rankUp: "Ranga zaktualizowana", shareText: "Właśnie ukończyłem Masterclass {city} na bdai! +250 mil zdobytych. 🌍✈️" },
    nl: { start: "Starten", stop: "Stop", of: "van", daiShot: "Dai Tip", angleLabel: "Dai Hoek:", photoTipFallback: "Zoek een zijperspectief.", capture: "Gegevens loggen", rewardReceived: "Gesynchroniseerd", prev: "Vorige", next: "Volgende", meters: "m", itinerary: "Route", finish: "Tour beëindigen", congrats: "Tour voltooid!", stampDesc: "Nieuwe stempel verdiend", shareIg: "Delen (+100 Miles)", close: "Sluiten", tooFar: "GPS onzeker", checkIn: "GPS inchecken", checkedIn: "Geverifieerd", distance: "Afstand", duration: "Duur", nearbyAlert: "Stop dichtbij", jumpTo: "Spring hierheen", rewardMiles: "+50 MILES", visaId: "VISUM", boardingPass: "INSTAPKAART", approved: "GOEDGEKEURD", rewardTotal: "Totale beloning", rankUp: "Rang bijgewerkt", shareText: "Ik heb zojuist de {city} Masterclass op bdai voltooid! +250 miles verdiend. 🌍✈️" },
    ca: { start: "Llançar", stop: "Parada", of: "de", daiShot: "Consell Dai", angleLabel: "Angle Dai:", photoTipFallback: "Busca una perspectiva lateral.", capture: "Loguejar dades", rewardReceived: "Sincronitzat", prev: "Enrere", next: "Següent", meters: "m", itinerary: "Itinerari", finish: "Finalitzar Tour", congrats: "Tour Completat!", stampDesc: "Nou segell guanyat", shareIg: "Compartir (+100 Milles)", close: "Tancar", tooFar: "GPS Incert", checkIn: "Check-in GPS", checkedIn: "Verificada", distance: "Distància", duration: "Durada", nearbyAlert: "Parada propera", jumpTo: "Salta aquí", rewardMiles: "+50 MILLES", visaId: "VISAT", boardingPass: "TARGETA D'EMBARCAMENT", approved: "APROVAT", rewardTotal: "Recompensa total", rankUp: "Rang actualitzat", shareText: "He completat la Masterclass de {city} a bdai! +250 milles acumulades. 🌍✈️" },
    eu: { start: "Abiarazi", stop: "Geldialdia", of: "rena", daiShot: "Dai Aholkua", angleLabel: "Dai Angelua:", photoTipFallback: "Bilatu alboko perspektiba bat.", capture: "Datuak erregistratu", rewardReceived: "Sinkronizatuta", prev: "Atzera", next: "Hurrengoa", meters: "m", itinerary: "Ibilbidea", finish: "Tourra amaitu", congrats: "Tourra osatuta!", stampDesc: "Zigilu berria irabazi duzu", shareIg: "Partekatu (+100 Milia)", close: "Itxi", tooFar: "GPS zalantzazkoa", checkIn: "GPS Check-in", checkedIn: "Egiaztatuta", distance: "Distantzia", duration: "Iraupena", nearbyAlert: "Geldialdia hurbil", jumpTo: "Salto egin hona", rewardMiles: "+50 MILIA", visaId: "BISA", boardingPass: "HEGALDI-TXARTELA", approved: "ONARTUTA", rewardTotal: "Guztizko saria", rankUp: "Maila eguneratuta", shareText: "{city} Masterclass-a osatu dut bdai-n! +250 milia irabazi ditut. 🌍✈️" },
    vi: { start: "Bắt đầu", stop: "Điểm dừng", of: "của", daiShot: "Mẹo Dai", angleLabel: "Góc Dai:", photoTipFallback: "Tìm một góc nhìn từ bên cạnh.", capture: "Ghi dữ liệu", rewardReceived: "Đã đồng bộ", prev: "Trước", next: "Sau", meters: "m", itinerary: "Lịch trình", finish: "Kết thúc tour", congrats: "Hoàn thành tour!", stampDesc: "Đã nhận được tem mới", shareIg: "Chia sẻ (+100 Dặm)", close: "Đóng", tooFar: "GPS không chính xác", checkIn: "Check-in GPS", checkedIn: "Đã xác minh", distance: "Khoảng cách", duration: "Thời gian", nearbyAlert: "Điểm dừng gần đây", jumpTo: "Nhảy đến đây", rewardMiles: "+50 DẶM", visaId: "THỊ THỰC", boardingPass: "THẺ LÊN MÁY BAY", approved: "ĐÃ PHÊ DUYỆT", rewardTotal: "Tổng thưởng", rankUp: "Cấp bậc đã cập nhật", shareText: "Tôi vừa hoàn thành Masterclass {city} trên bdai! Đã nhận được +250 dặm. 🌍✈️" },
    th: { start: "เริ่ม", stop: "จุดจอด", of: "จาก", daiShot: "คำแนะนำ Dai", angleLabel: "มุม Dai:", photoTipFallback: "มองหามุมมองจากด้านข้าง", capture: "บันทึกข้อมูล", rewardReceived: "ซิงค์แล้ว", prev: "ย้อนกลับ", next: "ถัดไป", meters: "ม.", itinerary: "กำหนดการ", finish: "จบการทัวร์", congrats: "ทัวร์เสร็จสิ้น!", stampDesc: "คุณได้รับตราประทับใหม่", shareIg: "แชร์ (+100 ไมล์)", close: "ปิด", tooFar: "GPS ไม่แน่นอน", checkIn: "เช็คอิน GPS", checkedIn: "ยืนยันแล้ว", distance: "ระยะทาง", duration: "ระยะเวลา", nearbyAlert: "จุดจอดใกล้เคียง", jumpTo: "ข้ามมาที่นี่", rewardMiles: "+50 ไมล์", visaId: "วีซ่า", boardingPass: "บัตรขึ้นเครื่อง", approved: "อนุมัติแล้ว", rewardTotal: "รางวัลรวม", rankUp: "เลื่อนอันดับ", shareText: "ฉันเพิ่งจบ Masterclass เมือง {city} ใน bdai! ได้รับ +250 ไมล์ 🌍✈️" }
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
  const tl = TEXTS[language] || TEXTS['en'] || TEXTS.es;
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = () => {
      setIsLaunching(true);
      setTimeout(() => {
          onSelect(tour);
          setIsLaunching(false);
      }, 900);
  };

  if (!tour) return null;

  return (
    <div onClick={handleLaunch} className="group bg-slate-900 border-2 border-white/5 rounded-[2.5rem] overflow-hidden p-8 mb-6 cursor-pointer relative active:scale-[0.98] transition-all hover:border-purple-500/40 shadow-2xl">
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
    
    const [rewardClaimed, setRewardClaimed] = useState(false);
    const [showPhotoTip, setShowPhotoTip] = useState(false);
    const [showItinerary, setShowItinerary] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);

    const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    const distToTarget = useMemo(() => {
        if (!userLocation || !currentStop) return null;
        return Math.round(calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude));
    }, [userLocation, currentStop]);

    const IS_IN_RANGE = distToTarget !== null && distToTarget <= 100;

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch(e) {}
            sourceNodeRef.current = null;
        }
        setAudioPlayingId(null);
        setIsAudioLoading(false);
    };

    const handleFinishTour = async () => {
        const newStamp: VisaStamp = {
            city: tour.city,
            country: tour.country || "",
            date: new Date().toLocaleDateString(),
            color: ['#9333ea', '#ef4444', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)]
        };

        const updatedUser = {
            ...user,
            miles: user.miles + 250,
            stamps: [...(user.stamps || []), newStamp],
            completedTours: [...(user.completedTours || []), tour.id]
        };

        onUpdateUser(updatedUser);
        if (user.isLoggedIn) {
            await syncUserProfile(updatedUser);
        }
        setShowCompletion(true);
    };

    const handleShare = async () => {
        const shareText = tl.shareText.replace('{city}', tour.city);
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `bdai Passport - ${tour.city}`,
                    text: shareText,
                    url: window.location.href
                });
            } catch (e) { console.error("Error sharing", e); }
        } else {
            navigator.clipboard.writeText(shareText);
            alert("Enlace copiado al portapapeles.");
        }
    };

    const handlePlayAudio = async (stopId: string, text: string) => {
        if (audioPlayingId === stopId) { stopAudio(); return; }
        stopAudio();
        setIsAudioLoading(true);
        try {
            const base64 = await generateAudio(text, user.language, tour.city);
            if (!base64) {
                setIsAudioLoading(false);
                return;
            }
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const ctx = audioContextRef.current;
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
        } catch (e) { 
            console.error(e); 
        } finally {
            setIsAudioLoading(false);
        }
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
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === currentStopIndex ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</div>
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
                                 <div className="text-left"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">{tl.rewardTotal}</p><p className="text-xl font-black text-slate-900">+250 mi</p></div>
                                 <div className="text-right"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">{tl.approved}</p><i className="fas fa-check-circle text-green-500 text-xl"></i></div>
                                 <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform rotate-12 -translate-y-4">
                                     <i className="fas fa-stamp text-8xl"></i>
                                 </div>
                             </div>
                         </div>
                         <div className="p-6 bg-slate-50 border-t-2 border-slate-100 space-y-3">
                             <button onClick={handleShare} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"><i className="fab fa-instagram text-sm"></i> {tl.shareIg}</button>
                             <button onClick={onBack} className="w-full py-4 bg-slate-200 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">{tl.close}</button>
                         </div>
                     </div>
                 </div>
             )}

             <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-[6000] pt-safe-iphone shrink-0 gap-3">
                <button onClick={onBack} className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 flex items-center justify-center shrink-0"><i className="fas fa-arrow-left text-xs"></i></button>
                <button onClick={() => setShowItinerary(true)} className="flex-1 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-2xl flex items-center justify-between min-w-0">
                    <div className="flex flex-col text-left truncate">
                        <p className="text-[7px] font-black text-purple-600 uppercase leading-none mb-1">{tl.stop} {currentStopIndex + 1}</p>
                        <h2 className="text-[10px] font-black text-slate-900 uppercase truncate leading-tight">{currentStop.name}</h2>
                    </div>
                    <i className="fas fa-list-ul text-[10px] text-slate-400 ml-2 shrink-0"></i>
                </button>
                <button 
                    onClick={() => handlePlayAudio(currentStop.id, (currentStop.description || ""))} 
                    disabled={isAudioLoading}
                    className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center shadow-lg transition-all ${audioPlayingId === currentStop.id ? 'bg-red-500 text-white' : 'bg-purple-600 text-white'} disabled:opacity-70`}
                >
                    {isAudioLoading ? (
                        <i className="fas fa-spinner fa-spin text-xs"></i>
                    ) : (
                        <i className={`fas ${audioPlayingId === currentStop.id ? 'fa-stop' : 'fa-play'} text-xs`}></i>
                    )}
                </button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50">
                <div className="h-[45vh] w-full">
                    <SchematicMap stops={tour.stops} currentStopIndex={currentStopIndex} language={user.language} onStopSelect={(i: number) => onJumpTo(i)} userLocation={userLocation} />
                </div>
                <div className="px-8 pt-10 pb-44 space-y-8 bg-white rounded-t-[3.5rem] -mt-12 shadow-xl z-[200] relative min-h-[55vh]">
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => { if(IS_IN_RANGE) setRewardClaimed(true); else alert(`${tl.tooFar}: ${distToTarget}m`); }} disabled={rewardClaimed} className={`flex flex-col items-center justify-center p-5 rounded-[2rem] font-black uppercase border transition-all ${rewardClaimed ? 'bg-green-100 text-green-600 border-green-200' : (IS_IN_RANGE ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-50 text-slate-400 border-slate-200')}`}>
                            <i className={`fas ${rewardClaimed ? 'fa-check-circle' : 'fa-location-dot'} text-lg mb-1`}></i>
                            <span className="text-[9px]">{rewardClaimed ? tl.checkedIn : tl.checkIn}</span>
                        </button>
                        <button onClick={() => setShowPhotoTip(true)} className="flex flex-col items-center justify-center p-5 rounded-[2rem] font-black uppercase border bg-slate-900 text-white border-slate-800">
                            <i className="fas fa-camera text-lg mb-1"></i>
                            <span className="text-[9px]">{tl.daiShot}</span>
                        </button>
                    </div>
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
