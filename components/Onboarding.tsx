
import React from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const ONBOARDING_TEXT: any = {
    es: {
        title: "¡Bienvenido a bdai!",
        subtitle: "Tu Nueva Guía Inteligente",
        mainDesc: "Descubre el mundo con una guía inteligente, divertida y gratuita que te acompaña a cada paso. ¡Es el futuro de los tours!",
        features: [
            { icon: "fa-globe", title: "Gratis y para todos", desc: "Busca cualquier ciudad. Es totalmente gratis y siempre en tu idioma." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Guía única", desc: "Dai te cuenta secretos fascinantes y te da el mejor ángulo para tus fotos." },
            { icon: "fa-headphones", title: "Lee o escucha", desc: "Tú eliges el ritmo. Dai puede narrarte la historia mientras caminas." },
            { icon: "fa-trophy", title: "Millas y Ranking", desc: "Gana millas que podrás canjear pronto y sube en el ranking mundial." },
            { icon: "fa-shopping-bag", title: "Tienda exclusiva", desc: "Equípate para tu próxima aventura en bdai.tech." }
        ],
        btnStart: "¡Empezar mi aventura!"
    },
    en: {
        title: "Welcome to bdai!",
        subtitle: "Your New Smart Guide",
        mainDesc: "Discover the world with a smart, fun, and free guide at every step. This is the future of touring!",
        features: [
            { icon: "fa-globe", title: "Free for everyone", desc: "Search any city globally. It's completely free and in your language." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Unique Guide", desc: "Dai shares fascinating secrets and tips for the perfect photo." },
            { icon: "fa-headphones", title: "Read or Listen", desc: "You choose. Dai can narrate the history as you walk." },
            { icon: "fa-trophy", title: "Miles & Ranking", desc: "Earn miles to redeem soon and climb the global leaderboard." },
            { icon: "fa-shopping-bag", title: "Exclusive Shop", desc: "Gear up for your next adventure at bdai.tech." }
        ],
        btnStart: "Start my adventure!"
    },
    zh: {
        title: "欢迎来到 bdai!",
        subtitle: "您的智能导游",
        mainDesc: "通过高科技免费导览探索世界。您的智能导游 Dai 随时为您提供服务。",
        features: [
            { icon: "fa-globe", title: "完全免费", desc: "搜索全球任何城市。完全免费，且支持您的语言。" },
            { icon: "fa-wand-magic-sparkles", title: "Dai: 唯一导游", desc: "Dai 会为您分享迷人的秘密和最佳拍摄角度。" },
            { icon: "fa-headphones", title: "阅读或听讲", desc: "由您选择。Dai 可以在您步行时为您讲解。" },
            { icon: "fa-trophy", title: "里程与排名", desc: "赚取里程，很快即可兑换，并在全球排行榜上竞争。" },
            { icon: "fa-shopping-bag", title: "专属商店", desc: "在 bdai.tech 为您的下一次探险做好准备。" }
        ],
        btnStart: "开始我的探险!"
    }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    const t = ONBOARDING_TEXT[language] || ONBOARDING_TEXT['en'] || ONBOARDING_TEXT['es'];

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617] flex flex-col items-center p-6 overflow-y-auto no-scrollbar animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-600/30 to-transparent"></div>
            
            <div className="w-full max-w-sm mt-12 flex flex-col items-center relative z-10">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[3.5rem] shadow-2xl backdrop-blur-xl w-full flex flex-col items-center border-t-purple-500/40">
                    <BdaiLogo className="w-16 h-16 mb-6 animate-pulse-logo" />
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center leading-tight">{t.title}</h2>
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.4em] mt-3 text-center">{t.subtitle}</p>
                    <p className="text-slate-400 text-center text-[11px] font-bold leading-relaxed mt-6 px-4 mb-8 opacity-80">{t.mainDesc}</p>

                    <div className="w-full space-y-5">
                        {t.features.map((f: any, i: number) => (
                            <div key={i} className="flex gap-4 items-center">
                                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                                    <i className={`fas ${f.icon} text-purple-500 text-sm`}></i>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-black uppercase text-[10px] tracking-widest leading-none mb-1">{f.title}</h4>
                                    <p className="text-slate-500 text-[9px] leading-snug font-bold italic">{f.desc}</p>
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
                
                <p className="text-[7px] font-black text-slate-700 text-center uppercase tracking-[0.3em] mt-8 mb-10">Powered by bdai Intelligence</p>
            </div>
        </div>
    );
};
