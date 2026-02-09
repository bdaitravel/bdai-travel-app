
import React from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const ONBOARDING_TEXT: any = {
    es: {
        title: "¡Bienvenido a bdai!",
        subtitle: "La Super App de Viajes",
        mainDesc: "Descubre el mundo con tours gratuitos de alta tecnología. Tu guía inteligente Dai te acompaña en cada paso.",
        features: [
            { icon: "fa-earth-americas", title: "Cualquier Ciudad", desc: "Tours gratis e ilimitados en todo el mundo, siempre en tu idioma." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Tu Guía Única", desc: "Secretos técnicos fascinantes y el mejor ángulo para tus fotos." },
            { icon: "fa-headphones", title: "Lee o Escucha", desc: "Elige tu ritmo: lee la masterclass o escucha la narración de Dai." },
            { icon: "fa-trophy", title: "Millas y Ranking", desc: "Gana millas, desbloquea insignias y compite en el ranking global." },
            { icon: "fa-shopping-bag", title: "Tienda y Más", desc: "Canjea tus millas y encuentra equipo exclusivo en bdai.tech." }
        ],
        btnStart: "¡Comenzar mi aventura!"
    },
    en: {
        title: "Welcome to bdai!",
        subtitle: "The Travel Super App",
        mainDesc: "Explore the world with free, high-tech tours. Your smart guide Dai accompanies you at every step.",
        features: [
            { icon: "fa-earth-americas", title: "Any City Worldwide", desc: "Free, unlimited tours everywhere, always in your language." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Your Unique Guide", desc: "Fascinating technical secrets and perfect photo angles." },
            { icon: "fa-headphones", title: "Read or Listen", desc: "Your choice: read the masterclass or listen to Dai's narration." },
            { icon: "fa-trophy", title: "Miles & Ranking", desc: "Earn miles, unlock badges, and climb the global leaderboard." },
            { icon: "fa-shopping-bag", title: "Shop & More", desc: "Redeem miles and find exclusive gear at bdai.tech." }
        ],
        btnStart: "Start my adventure!"
    },
    zh: {
        title: "欢迎来到 bdai!",
        subtitle: "旅游超级应用",
        mainDesc: "通过高科技免费导览探索世界。您的智能导游 Dai 随时为您提供服务。",
        features: [
            { icon: "fa-earth-americas", title: "全球城市", desc: "全球范围内免费、无限次的导览，始终支持您的语言。" },
            { icon: "fa-wand-magic-sparkles", title: "Dai: 您的唯一导游", desc: "迷人的技术秘密和完美的拍摄角度。" },
            { icon: "fa-headphones", title: "阅读或听讲", desc: "您的选择：阅读大师课或聆听 Dai 的讲解。" },
            { icon: "fa-trophy", title: "里程与排名", desc: "赚取里程，解锁勋章，并在全球排行榜上竞争。" },
            { icon: "fa-shopping-bag", title: "商店及更多", desc: "在 bdai.tech 兑换里程并寻找专属装备。" }
        ],
        btnStart: "开始我的冒险!"
    }
    // Fallback logic in component handles other codes by defaulting to 'es' or 'en'
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    const t = ONBOARDING_TEXT[language] || ONBOARDING_TEXT['en'] || ONBOARDING_TEXT['es'];

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617] flex flex-col items-center p-6 overflow-y-auto no-scrollbar animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-600/30 to-transparent"></div>
            
            <div className="w-full max-w-sm mt-12 flex flex-col items-center relative z-10">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] shadow-2xl backdrop-blur-xl w-full flex flex-col items-center border-t-purple-500/40">
                    <BdaiLogo className="w-16 h-16 mb-6 animate-pulse-logo" />
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center leading-tight">{t.title}</h2>
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.4em] mt-3 text-center">{t.subtitle}</p>
                    <p className="text-slate-400 text-center text-xs font-bold leading-relaxed mt-6 px-4 mb-8 opacity-80">{t.mainDesc}</p>

                    <div className="w-full space-y-5">
                        {t.features.map((f: any, i: number) => (
                            <div key={i} className="flex gap-4 items-start">
                                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                                    <i className={`fas ${f.icon} text-purple-500 text-sm`}></i>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-black uppercase text-[9px] tracking-widest mb-0.5">{f.title}</h4>
                                    <p className="text-slate-500 text-[9px] leading-snug font-bold">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="w-full mt-10">
                        <button 
                            onClick={onComplete}
                            className="w-full py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
                        >
                            {t.btnStart}
                        </button>
                    </div>
                </div>
                
                <p className="text-[7px] font-black text-slate-700 text-center uppercase tracking-[0.3em] mt-8 mb-10">Unique Intelligence powered by bdai</p>
            </div>
        </div>
    );
};
