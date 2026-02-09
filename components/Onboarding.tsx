
import React from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const ONBOARDING_TEXT: any = {
    es: {
        title: "¡Bienvenido a bdai!",
        subtitle: "Tu Nueva Forma de Viajar",
        mainDesc: "Descubre el mundo con una guía inteligente, divertida y gratuita que te acompaña a cada paso.",
        features: [
            { icon: "fa-globe", title: "Tours Gratis e Ilimitados", desc: "Busca cualquier ciudad. Es totalmente gratis y en tu idioma." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Tu Guía Única", desc: "Dai te cuenta secretos fascinantes y te da el mejor ángulo para tus fotos." },
            { icon: "fa-headphones", title: "Lee o Escucha", desc: "Elige como prefieras. Dai puede narrarte la historia mientras caminas." },
            { icon: "fa-trophy", title: "Gana Millas y Ranking", desc: "Sube de nivel, gana insignias y compite en el ranking mundial." },
            { icon: "fa-shopping-bag", title: "Tienda y Más", desc: "Canjea tus logros o equípate para la aventura en bdai.tech." }
        ],
        btnStart: "¡Empezar ahora!"
    },
    en: {
        title: "Welcome to bdai!",
        subtitle: "A New Way to Travel",
        mainDesc: "Discover the world with a smart, fun, and free guide that stays by your side.",
        features: [
            { icon: "fa-globe", title: "Free & Unlimited Tours", desc: "Search any city. It's completely free and in your language." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Your Unique Guide", desc: "Dai reveals fascinating secrets and tips for the perfect photo." },
            { icon: "fa-headphones", title: "Read or Listen", desc: "You choose. Dai can narrate the history as you walk." },
            { icon: "fa-trophy", title: "Earn Miles & Ranking", desc: "Level up, earn badges, and compete in the global leaderboard." },
            { icon: "fa-shopping-bag", title: "Shop & More", desc: "Redeem achievements or gear up for your adventure at bdai.tech." }
        ],
        btnStart: "Start Now!"
    },
    ca: {
        title: "Benvingut a bdai!",
        subtitle: "La Teva Nova Forma de Viatjar",
        mainDesc: "Descobreix el món amb una guia intel·ligent, divertida i gratuïta que t'acompanya.",
        features: [
            { icon: "fa-globe", title: "Tours Gratuïts", desc: "Cerca qualsevol ciutat. És de balde i en el teu idioma." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Guia Única", desc: "El millor angle per a les teves fotos i secrets fascinants." },
            { icon: "fa-headphones", title: "Llegeix o Escolta", desc: "Tria el teu ritme. La Dai et narra la història mentre camines." },
            { icon: "fa-trophy", title: "Milles i Rànquing", desc: "Guanya insígnies i competeix en el rànquing mundial." },
            { icon: "fa-shopping-bag", title: "Botiga i Més", desc: "Equipa't a bdai.tech per a la teva aventura." }
        ],
        btnStart: "Començar!"
    },
    eu: {
        title: "Ongi etorri bdai-ra!",
        subtitle: "Bidaiatzeko Modu Berria",
        mainDesc: "Ezagutu mundua doako gida adimentsu eta dibertigarri batekin.",
        features: [
            { icon: "fa-globe", title: "Doako Tourrak", desc: "Bilatu edozein hiri. Doakoa da eta zure hizkuntzan." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Gida Bakarra", desc: "Sekretu liluragarriak eta argazkietarako aholku onenak." },
            { icon: "fa-headphones", title: "Irakurri edo Entzun", desc: "Zuk erabaki. Daik istorioa kontatzen dizu ibili ahala." },
            { icon: "fa-trophy", title: "Miliak eta Sailkapena", desc: "Irabazi ikurrak eta lehiatu munduko sailkapenean." },
            { icon: "fa-shopping-bag", title: "Denda eta Gehiago", desc: "Presta zaitez bdai.tech-en zure abenturarako." }
        ],
        btnStart: "Hasi orain!"
    }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    const t = ONBOARDING_TEXT[language] || ONBOARDING_TEXT['es'];

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617] flex flex-col items-center p-6 overflow-y-auto no-scrollbar animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-purple-600/20 to-transparent"></div>
            
            <div className="w-full max-w-sm mt-12 flex flex-col items-center relative z-10">
                <BdaiLogo className="w-20 h-20 mb-6 animate-pulse-logo" />
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter text-center leading-none">{t.title}</h2>
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mt-3 text-center">{t.subtitle}</p>
                <p className="text-slate-400 text-center text-sm font-medium leading-relaxed mt-6 px-4">{t.mainDesc}</p>

                <div className="mt-10 w-full space-y-4">
                    {t.features.map((f: any, i: number) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-[2.2rem] flex items-center gap-5 shadow-xl transition-all hover:bg-white/10">
                            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                                <i className={`fas ${f.icon} text-purple-500 text-lg`}></i>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-black uppercase text-[10px] tracking-widest mb-1">{f.title}</h4>
                                <p className="text-slate-500 text-[10px] leading-snug font-medium">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="w-full mt-10 pb-12">
                    <button 
                        onClick={onComplete}
                        className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 transition-all"
                    >
                        {t.btnStart}
                    </button>
                    <p className="text-[8px] font-black text-slate-600 text-center uppercase tracking-[0.3em] mt-6">Powered by Google Gemini</p>
                </div>
            </div>
        </div>
    );
};
