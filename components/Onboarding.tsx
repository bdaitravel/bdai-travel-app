
import React, { useState, useEffect, useRef } from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const STORY_DATA: any = {
    en: [
        { title: "Welcome to bdai", subtitle: "Global Masterclass", desc: "Travel isn't just photos. It's decoding the secret engineering and history of our world.", icon: "fa-globe-americas", color: "from-blue-600/40" },
        { title: "Meet Dai", subtitle: "Your AI Core", desc: "I analyze power, engineering, and real human gossip that brochures don't mention.", icon: "fa-microchip", color: "from-purple-600/40" },
        { title: "Smart Intel", subtitle: "Deep Data", desc: "Access high-density technical info for any spot. From Roman relics to cyberpunk towers.", icon: "fa-brain", color: "from-emerald-600/40" },
        { title: "Earn Miles", subtitle: "Global Ranking", desc: "Move physically to spots, sync your GPS, and climb the elite travelers leaderboard.", icon: "fa-satellite-dish", color: "from-orange-600/40" }
    ],
    es: [
        { title: "Bienvenido a bdai", subtitle: "Masterclass Global", desc: "Viajar no es solo posar. Es decodificar la ingeniería y la historia oculta de nuestro mundo.", icon: "fa-globe-americas", color: "from-blue-600/40" },
        { title: "Conoce a Dai", subtitle: "Tu Motor IA", desc: "Analizo estructuras de poder, ingeniería y el salseo real que no sale en los folletos.", icon: "fa-microchip", color: "from-purple-600/40" },
        { title: "Intel Inteligente", subtitle: "Datos Profundos", desc: "Accede a información técnica de alta densidad. Del hormigón romano a torres cyberpunk.", icon: "fa-brain", color: "from-emerald-600/40" },
        { title: "Gana Millas", subtitle: "Ranking Global", desc: "Llega físicamente a los puntos, sincroniza tu GPS y escala en el ranking de élite.", icon: "fa-satellite-dish", color: "from-orange-600/40" }
    ],
    it: [
        { title: "Benvenuto in bdai", subtitle: "Masterclass Globale", desc: "Viaggiare non è solo foto. È decodificare l'ingegneria e la storia segreta del mondo.", icon: "fa-globe-americas", color: "from-blue-600/40" },
        { title: "Incontra Dai", subtitle: "Il tuo Core IA", desc: "Analizzo potere, ingegneria e i gossip reali che le brochure non menzionano mai.", icon: "fa-microchip", color: "from-purple-600/40" },
        { title: "Smart Intel", subtitle: "Dati Profondi", desc: "Accedi a info tecniche di alta densità. Dai resti romani alle torri cyberpunk.", icon: "fa-brain", color: "from-emerald-600/40" },
        { title: "Guadagna Miglia", subtitle: "Ranking Mondiale", desc: "Raggiungi i luoghi fisicamente, sincronizza il GPS e scala la classifica d'élite.", icon: "fa-satellite-dish", color: "from-orange-600/40" }
    ],
    zh: [
        { title: "欢迎来到 bdai", subtitle: "全球大师课", desc: "旅行不仅仅是拍照。它是解码我们世界的秘密工程和历史。", icon: "fa-globe-americas", color: "from-blue-600/40" },
        { title: "认识 Dai", subtitle: "您的 AI 核心", desc: "我分析权力、工程和宣传册中未提及的真实人类八卦。", icon: "fa-microchip", color: "from-purple-600/40" },
        { title: "智能情报", subtitle: "深度数据", desc: "访问任何地点的深度技术信息。从罗马遗迹到赛博朋克大楼。", icon: "fa-brain", color: "from-emerald-600/40" },
        { title: "赚取里程", subtitle: "全球排名", desc: "亲身前往景点，同步 GPS，并攀登精英旅行者排行榜。", icon: "fa-satellite-dish", color: "from-orange-600/40" }
    ],
    eu: [
        { title: "Ongi etorri bdai-ra", subtitle: "Masterclass Globala", desc: "Bidaiatzea ez da argazkiak ateratzea soilik. Gure munduko ingeniaritza eta historia sekretua deskodetzea da.", icon: "fa-globe-americas", color: "from-blue-600/40" },
        { title: "Ezagutu Dai", subtitle: "Zure AI Nukleoa", desc: "Botere-egiturak, ingeniaritza eta liburuxketan agertzen ez den benetako saltsa aztertzen dut.", icon: "fa-microchip", color: "from-purple-600/40" },
        { title: "Intel Adimentsua", subtitle: "Datu Sakonak", desc: "Sartu edozein lekutako informazio tekniko sakonean. Erromatar aztarnetatik dorre cyberpunketara.", icon: "fa-brain", color: "from-emerald-600/40" },
        { title: "Irabazi Miliak", subtitle: "Ranking Globala", desc: "Joan fisikoki lekuetara, sinkronizatu GPSa eta igo eliteko bidaiarien sailkapenean.", icon: "fa-satellite-dish", color: "from-orange-600/40" }
    ],
    ca: [
        { title: "Benvingut a bdai", subtitle: "Masterclass Global", desc: "Viatjar no és només fer fotos. És descodificar l'enginyeria i la història oculta del nostre món.", icon: "fa-globe-americas", color: "from-blue-600/40" },
        { title: "Coneix a Dai", subtitle: "El teu Motor IA", desc: "Analitzo estructures de poder, enginyeria i el salseig real que no surt als fullets.", icon: "fa-microchip", color: "from-purple-600/40" },
        { title: "Intel Intel·ligent", subtitle: "Dades Profundes", desc: "Accedeix a informació tècnica d'alta densitat. Des de restes romanes a torres cyberpunk.", icon: "fa-brain", color: "from-emerald-600/40" },
        { title: "Guanya Milles", subtitle: "Ranking Global", desc: "Arriba físicament als punts, sincronitza el teu GPS i escala en el rànquing d'elit.", icon: "fa-satellite-dish", color: "from-orange-600/40" }
    ]
};

const UI_BTNS: any = {
    es: { ok: "Entendido", tip: "Toca los lados para navegar • Mantén para pausar" },
    en: { ok: "Got it", tip: "Tap sides to navigate • Hold to pause" },
    it: { ok: "Capito", tip: "Tocca i lati per navigare • Tieni premuto per mettere in pausa" },
    zh: { ok: "明白", tip: "点击侧边导航 • 长按暂停" },
    eu: { ok: "Ulertuta", tip: "Ukitu aldeak nabigatzeko • Mantendu sakatuta pausatzeko" },
    ca: { ok: "Entès", tip: "Toca els costats per navegar • Mantén per pausar" },
    pt: { ok: "Entendido", tip: "Toque nos lados para navegar • Segure para pausar" },
    fr: { ok: "Compris", tip: "Appuyez sur los côtés • Maintenez pour mettre en pause" },
    de: { ok: "Verstanden", tip: "Seiten tippen zum Navigieren • Halten zum Pausieren" },
    ja: { ok: "了解", tip: "サイドをタップして移動 • 長押しで一時停止" },
    ru: { ok: "Понятно", tip: "Нажимайте по бокам для навигации • Удерживайте для паузы" },
    ar: { ok: "مفهوم", tip: "اضغط على الجوانب للتنقل • اضغط مطولاً للإيقاف" }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const stories = STORY_DATA[language] || STORY_DATA['en'];
    const btns = UI_BTNS[language] || UI_BTNS['en'];
    const current = stories[currentIndex];
    
    const SLIDE_DURATION = 8000;
    const PROGRESS_INCREMENT = 100 / (SLIDE_DURATION / 50);

    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    if (currentIndex < stories.length - 1) {
                        setCurrentIndex(prevIdx => prevIdx + 1);
                        return 0;
                    } else {
                        onComplete();
                        return 100;
                    }
                }
                return prev + PROGRESS_INCREMENT;
            });
        }, 50);

        return () => clearInterval(timer);
    }, [currentIndex, isPaused, stories.length]);

    const handleScreenClick = (e: React.MouseEvent | React.TouchEvent) => {
        const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const width = window.innerWidth;
        
        if (x < width / 3) {
            if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
                setProgress(0);
            }
        } else {
            if (currentIndex < stories.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setProgress(0);
            } else {
                onComplete();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col font-sans overflow-hidden select-none touch-none">
            <div className={`absolute inset-0 bg-gradient-to-b ${current.color} to-slate-950 transition-colors duration-1000`}></div>
            
            <div className="absolute top-12 left-6 right-6 flex gap-2 z-20">
                {stories.map((_: any, idx: number) => (
                    <div key={idx} className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-100 ease-linear"
                            style={{ 
                                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                            }}
                        ></div>
                    </div>
                ))}
            </div>

            <div 
                className="flex-1 flex flex-col items-center justify-center p-8 relative z-10"
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={(e) => { setIsPaused(false); handleScreenClick(e); }}
                onClick={handleScreenClick}
            >
                <div className="w-full max-w-sm flex flex-col items-center text-center animate-fade-in pointer-events-none" key={currentIndex}>
                    <div className="w-28 h-28 mb-10 relative">
                        <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] blur-2xl animate-pulse"></div>
                        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 w-full h-full rounded-[3rem] flex items-center justify-center text-white text-5xl shadow-2xl">
                            <i className={`fas ${current.icon}`}></i>
                        </div>
                    </div>

                    <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.5em] mb-4">{current.subtitle}</p>
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-8">{current.title}</h2>
                    <p className="text-slate-300 text-lg font-medium leading-relaxed px-4 opacity-80">{current.desc}</p>
                </div>
                
                {isPaused && (
                    <div className="absolute bottom-32 bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 animate-fade-in">
                        <p className="text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                           <i className="fas fa-pause text-[6px]"></i> {language === 'es' ? 'Lectura Pausada' : 'Paused'}
                        </p>
                    </div>
                )}
            </div>

            <div className="p-10 pb-16 relative z-10 flex flex-col gap-6">
                <button 
                    onClick={onComplete}
                    className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all"
                >
                    {btns.ok}
                </button>
                
                <p className="text-white/20 text-[7px] font-black uppercase tracking-[0.3em] text-center">
                    {btns.tip}
                </p>
            </div>
        </div>
    );
};
