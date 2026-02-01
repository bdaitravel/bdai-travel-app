
import React from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const CONTENT: any = {
    es: {
        title: "Guía de Inicio", subtitle: "Masterclass de Viajes", btn: "Comenzar Experiencia",
        points: [
            { id: 1, title: "Tours de Alta Densidad", desc: "Dai analiza ingeniería, retos técnicos y salseo histórico real de cada parada.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Cualquier Ciudad", desc: "Genera tours instantáneos en cualquier rincón del planeta con IA de última generación.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Millas y GPS", desc: "Sincroniza tu posición en las paradas para ganar Millas y subir de rango.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Pasaporte Digital", desc: "Tu perfil registra sellos de visado, puntos por categorías y momentos capturados.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    en: {
        title: "Getting Started", subtitle: "Travel Masterclass", btn: "Start Experience",
        points: [
            { id: 1, title: "High-Density Tours", desc: "Dai analyzes engineering, technical challenges, and real historical gossip.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Any City Worldwide", desc: "Generate instant tours in any corner of the planet with cutting-edge AI.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Miles & GPS", desc: "Sync your position at stops to earn Miles and rank up.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Digital Passport", desc: "Your profile tracks visa stamps, category points, and captured moments.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    de: {
        title: "Einführung", subtitle: "Reise-Masterclass", btn: "Erlebnis Starten",
        points: [
            { id: 1, title: "High-Density Tours", desc: "Dai analysiert Technik, Architektur und echte historische Geheimnisse.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Jede Stadt Weltweit", desc: "Erstellen Sie sofortige Touren an jedem Ort mit modernster KI.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Meilen & GPS", desc: "Synchronisieren Sie Ihre Position, um Meilen zu sammeln.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Digitaler Pass", desc: "Ihr Profil speichert Visa-Stempel und Ihre Reisemomente.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    it: {
        title: "Guida Introduttiva", subtitle: "Masterclass di Viaggio", btn: "Inizia Esperienza",
        points: [
            { id: 1, title: "Tour ad Alta Densità", desc: "Dai analizza ingegneria, sfide tecniche e segreti storici reali.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Qualsiasi Città", desc: "Genera tour istantanei in ogni angolo del pianeta con l'IA.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Miglia & GPS", desc: "Sincronizza la tua posizione per guadagnare Miglia e salire di livello.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Passaporto Digitale", desc: "Il tuo profilo registra visti e i tuoi momenti migliori.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    fr: {
        title: "Guide de Départ", subtitle: "Masterclass de Voyage", btn: "Commencer",
        points: [
            { id: 1, title: "Tours Haute Densité", desc: "Dai analyse l'ingénierie et les anecdotes historiques réelles.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "N'importe quelle ville", desc: "Générez des tours instantanés partout dans le monde avec l'IA.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Miles & GPS", desc: "Synchronisez votre position pour gagner des Miles.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Passeport Numérique", desc: "Votre profil enregistre vos tampons et moments capturés.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    pt: {
        title: "Guia de Início", subtitle: "Masterclass de Viagem", btn: "Começar Experiência",
        points: [
            { id: 1, title: "Tours de Alta Densidade", desc: "Dai analisa engenharia, desafios técnicos e segredos históricos.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Qualquer Cidade", desc: "Gere tours instantâneos em qualquer lugar do mundo com IA.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Milhas & GPS", desc: "Sincronize sua posição para ganhar Milhas e subir de nível.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Passaporte Digital", desc: "Seu perfil registra carimbos de visto e momentos capturados.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    ca: {
        title: "Guia d'Inici", subtitle: "Masterclass de Viatges", btn: "Començar Experiència",
        points: [
            { id: 1, title: "Tours d'Alta Densitat", desc: "Dai analitza enginyeria, reptes tècnics i salseig històric real.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Qualsevol Ciutat", desc: "Genera tours instantanis a qualsevol lloc del món amb IA.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Milles i GPS", desc: "Sincronitza la teva posició per guanyar Milles i pujar de rang.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Passaport Digital", desc: "El teu perfil registra segells de visat i moments capturats.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    eu: {
        title: "Hasiera Gida", subtitle: "Bidaia Masterclass-a", btn: "Esperientzia Hasi",
        points: [
            { id: 1, title: "Dentsitate Handiko Tourrak", desc: "Daik ingeniaritza eta benetako sekretu historikoak aztertzen ditu.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Edozein Hiri", desc: "Sortu berehalako tourrak munduko edozein txokotan IArekin.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Miliak eta GPS", desc: "Sinkronizatu zure kokapena Miliak irabazteko.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Pasaporte Digitala", desc: "Zure profilak bisatu zigiluak eta uneak gordetzen ditu.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    zh: {
        title: "新手指南", subtitle: "旅行大师课", btn: "开始体验",
        points: [
            { id: 1, title: "高密度之旅", desc: "Dai 深度分析工程技术、挑战以及真实的底层历史轶事。", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "全球任何城市", desc: "利用尖端人工智能在世界任何角落即时生成旅行路线。", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "里程与 GPS", desc: "实地移动并在各个站点同步位置，以赢取里程并升级。", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "数字护照", desc: "您的个人资料会记录签证印章、类别积分及捕捉到的瞬间。", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    ja: {
        title: "スタートガイド", subtitle: "トラベル・マスタークラス", btn: "体験を始める",
        points: [
            { id: 1, title: "高密度ツアー", desc: "Daiが工学、技術的課題、そして真実の歴史的秘話を分析します。", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "世界中のあらゆる都市", desc: "最新AIを使用して、地球上のどこでも即座にツアーを生成。", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "マイルとGPS", desc: "スポットで位置を同期してマイルを獲得し、ランクアップ。", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "デジタルパスポート", desc: "ビザスタンプ、カテゴリーポイント、思い出を記録します。", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    ko: {
        title: "시작하기", subtitle: "트래블 마스터클래스", btn: "경험 시작하기",
        points: [
            { id: 1, title: "고밀도 투어", desc: "Dai는 공학, 기술적 과제 및 실제 역사적 뒷이야기를 분석합니다.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "전 세계 모든 도시", desc: "최첨단 AI로 지구 어디에서나 즉석 투어를 생성하세요.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "마일 및 GPS", desc: "각 지점에서 위치를 동기화하여 마일을 획득하고 승급하세요.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "디지털 여권", desc: "비자 스탬프, 카테고리 포인트 및 캡처된 순간을 기록합니다.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    ru: {
        title: "Начало работы", subtitle: "Мастер-класс по путешествиям", btn: "Начать",
        points: [
            { id: 1, title: "Насыщенные туры", desc: "Dai анализирует инженерию, технику и реальные исторические тайны.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Любой город мира", desc: "Создавайте мгновенные туры в любом уголке планеты с помощью ИИ.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Мили и GPS", desc: "Синхронизируйте положение, чтобы зарабатывать мили и повышать ранг.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Цифровой паспорт", desc: "Ваш профиль хранит визы, баллы и запечатленные моменты.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    tr: {
        title: "Başlangıç Rehberi", subtitle: "Seyahat Masterclass", btn: "Deneyimi Başlat",
        points: [
            { id: 1, title: "Yoğun Bilgi Turları", desc: "Dai, mühendisliği ve gerçek tarihi sırları derinlemesine analiz eder.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Dünyanın Her Şehri", desc: "Gelişmiş yapay zeka ile dünyanın her yerinde anında turlar oluşturun.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Miller ve GPS", desc: "Mil kazanmak ve rütbe atlamak için konumunuzu senkronize edin.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Dijital Pasaport", desc: "Profiliniz vize damgalarını ve yakalanan anları kaydeder.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    hi: {
        title: "शुरुआत करना", subtitle: "ट्रैवल मास्टरक्लास", btn: "अनुभव शुरू करें",
        points: [
            { id: 1, title: "उच्च घनत्व वाले टूर", desc: "दाई इंजीनियरिंग और वास्तविक ऐतिहासिक रहस्यों का विश्लेषण करता है।", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "दुनिया का कोई भी शहर", desc: "AI के साथ दुनिया के किसी भी कोने में तत्काल टूर उत्पन्न करें।", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "मील और GPS", desc: "मील कमाने और रैंक बढ़ाने के लिए अपनी स्थिति सिंक करें।", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "डिजिटल पासपोर्ट", desc: "आपका प्रोफाइल वीजा स्टैम्प और कैप्चर किए गए पलों को ट्रैक करता है।", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    ar: {
        title: "دليل البدء", subtitle: "ماستركلاس السفر", btn: "ابدأ التجربة",
        points: [
            { id: 1, title: "جولات عالية الكثافة", desc: "يحلل داي الهندسة والتحديات التقنية والأسرار التاريخية.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "أي مدينة في العالم", desc: "أنشئ جولات فورية في أي ركن من أركان الكوكب باستخدام الذكاء الاصطناعي.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "أميال ونظام GPS", desc: "قم بمزامنة موقعك لكسب الأميال ورفع رتبتك.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "جواز السفر الرقمي", desc: "يسجل ملفك الشخصي أختام التأشيرة واللحظات التي التقطتها.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    const t = CONTENT[language] || CONTENT['es'];

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617] flex flex-col font-sans overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-600/10 to-transparent pointer-events-none"></div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar pt-20 px-8 pb-40">
                <div className="flex flex-col items-center mb-12 text-center">
                    <BdaiLogo className="w-20 h-20 mb-4 animate-pulse-logo" />
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{t.title}</h2>
                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] mt-2">{t.subtitle}</p>
                </div>

                <div className="space-y-6 max-w-sm mx-auto">
                    {t.points.map((point: any) => (
                        <div key={point.id} className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex gap-5 items-start transition-all hover:bg-white/10 shadow-xl">
                            <div className={`w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center shrink-0 ${point.color} text-xl shadow-inner border border-white/5`}>
                                <i className={`fas ${point.icon}`}></i>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-black text-sm uppercase tracking-tight mb-1">{point.title}</h4>
                                <p className="text-slate-400 text-xs leading-relaxed font-medium opacity-80">{point.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent">
                <button 
                    onClick={onComplete}
                    className="w-full max-w-sm mx-auto block py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all"
                >
                    {t.btn}
                </button>
            </div>
        </div>
    );
};
