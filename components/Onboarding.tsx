
import React from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const CONTENT: any = {
    es: {
        title: "Guía de Inicio",
        subtitle: "Masterclass de Viajes",
        btn: "Comenzar Experiencia",
        points: [
            { id: 1, title: "Tours de Alta Densidad", desc: "No es una guía básica. Dai analiza ingeniería, retos técnicos y salseo histórico real de cada parada.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Cualquier Ciudad del Mundo", desc: "Usa el buscador para generar tours instantáneos en cualquier rincón del planeta con IA de última generación.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Millas y GPS", desc: "Muévete físicamente. Sincroniza tu posición en las paradas para ganar Millas y subir de rango.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Pasaporte Digital", desc: "Tu perfil registra sellos de visado, puntos por categorías (Arte, Historia, Gastro) y tus momentos capturados.", icon: "fa-id-card", color: "text-emerald-500" },
            { id: 5, title: "Ranking y Mercado", desc: "Compite en la élite global de viajeros y accede a productos exclusivos en nuestra tienda oficial.", icon: "fa-trophy", color: "text-yellow-500" }
        ]
    },
    en: {
        title: "Getting Started",
        subtitle: "Travel Masterclass",
        btn: "Start Experience",
        points: [
            { id: 1, title: "High-Density Tours", desc: "Not a basic guide. Dai analyzes engineering, technical challenges, and real historical gossip.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Any City Worldwide", desc: "Use the search to generate instant tours in any corner of the planet with cutting-edge AI.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Miles & GPS", desc: "Move physically. Sync your position at stops to earn Miles and rank up.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Digital Passport", desc: "Your profile tracks visa stamps, category points, and your captured moments.", icon: "fa-id-card", color: "text-emerald-500" },
            { id: 5, title: "Ranking & Market", desc: "Compete in the global traveler elite and access exclusive gear in our official shop.", icon: "fa-trophy", color: "text-yellow-500" }
        ]
    },
    hi: {
        title: "शुरुआत करना",
        subtitle: "ट्रैवल मास्टरक्लास",
        btn: "अनुभव शुरू करें",
        points: [
            { id: 1, title: "उच्च घनत्व वाले टूर", desc: "कोई बुनियादी गाइड नहीं। दाई हर पड़ाव की इंजीनियरिंग और वास्तविक ऐतिहासिक गपशप का विश्लेषण करता है।", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "दुनिया का कोई भी शहर", desc: "अत्याधुनिक AI के साथ दुनिया के किसी भी कोने में तत्काल टूर उत्पन्न करने के लिए खोज का उपयोग करें।", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "मील और GPS", desc: "शारीरिक रूप से घूमें। मील कमाने और रैंक बढ़ाने के लिए स्टॉप पर अपनी स्थिति सिंक करें।", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "डिजिटल पासपोर्ट", desc: "आपका प्रोफाइल वीजा स्टैम्प, श्रेणी अंक और आपके कैप्चर किए गए क्षणों को ट्रैक करता है।", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    ko: {
        title: "시작하기",
        subtitle: "트래블 마스터클래스",
        btn: "경험 시작하기",
        points: [
            { id: 1, title: "고밀도 투어", desc: "기본 가이드가 아닙니다. Dai는 각 정류장의 엔지니어링, 기술적 과제 및 실제 역사적 뒷이야기를 분석합니다.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "전 세계 모든 도시", desc: "최첨단 AI를 사용하여 지구 구석구석에서 즉석 투어를 생성하려면 검색을 사용하세요.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "마일 및 GPS", desc: "실제로 이동하십시오. 마일을 획득하고 순위를 올리려면 정류장에서 위치를 동기화하세요.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "디지털 여권", desc: "프로필은 비자 스탬프, 카테고리 포인트 및 캡처된 순간을 추적합니다.", icon: "fa-id-card", color: "text-emerald-500" }
        ]
    },
    tr: {
        title: "Başlarken",
        subtitle: "Seyahat Masterclass",
        btn: "Deneyimi Başlat",
        points: [
            { id: 1, title: "Yüksek Yoğunluklu Turlar", desc: "Temel bir rehber değil. Dai her durağın mühendisliğini ve gerçek tarihi sırlar analiz eder.", icon: "fa-microchip", color: "text-purple-500" },
            { id: 2, title: "Dünyanın Herhangi Bir Şehri", desc: "Son teknoloji yapay zeka ile dünyanın her köşesinde anında turlar oluşturmak için aramayı kullanın.", icon: "fa-earth-americas", color: "text-blue-500" },
            { id: 3, title: "Miller ve GPS", desc: "Fiziksel olarak hareket edin. Mil kazanmak ve rütbe atlamak için duraklarda konumunuzu eşitleyin.", icon: "fa-satellite-dish", color: "text-orange-500" },
            { id: 4, title: "Dijital Pasaport", desc: "Profiliniz vize damgalarını, kategori puanlarını ve yakalanan anlarınızı takip eder.", icon: "fa-id-card", color: "text-emerald-500" }
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
