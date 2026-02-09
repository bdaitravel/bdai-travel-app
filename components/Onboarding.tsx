import React from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const CONTENT: any = {
    es: { 
        title: "Guía del Bidaer", 
        subtitle: "Masterclass de Viajes IA", 
        btnStart: "¡Entendido, vamos!", 
        intro: "Bienvenido a la red de inteligencia de viajes más avanzada. Aquí tienes tu manual de usuario simplificado:",
        steps: [
            { title: "1. Tours Gratis e Ilimitados", desc: "Busca cualquier ciudad. Los tours son 100% gratuitos y generados por IA con alta densidad histórica y técnica. No pagas nada por explorar.", icon: "fa-globe", color: "bg-blue-600" },
            { title: "2. Gana Millas Explorando", desc: "Cada parada que visitas físicamente (GPS) te otorga 50 Millas. Al completar un tour, recibes 200 Millas extras.", icon: "fa-location-dot", color: "bg-purple-600" },
            { title: "3. Tu Pasaporte y Visados", desc: "Al terminar una ciudad, ganas un Visado oficial que se guarda en tu Pasaporte. Tu rango sube de Turista a Leyenda mundial.", icon: "fa-passport", color: "bg-orange-600" },
            { title: "4. Millas = Descuentos Reales", desc: "¡Lo más importante! Las millas acumuladas se canjean por descuentos directos en nuestra tienda de guías y productos de partners exclusivos.", icon: "fa-shopping-bag", color: "bg-emerald-600" }
        ],
        footer: "Sistema Inteligente bdai v1.2 • Datos Cifrados"
    },
    en: { 
        title: "Bidaer Manual", 
        subtitle: "AI Travel Masterclass", 
        btnStart: "Got it, let's go!", 
        intro: "Welcome to the advanced travel intelligence network. Here is your simplified user manual:",
        steps: [
            { title: "1. Free & Unlimited Tours", desc: "Search any city. Tours are 100% free, AI-generated with high history and technical density. No cost to explore.", icon: "fa-globe", color: "bg-blue-600" },
            { title: "2. Earn Miles While Exploring", desc: "Every physical stop you visit (GPS) earns you 50 Miles. Complete a tour for an extra 200 Miles.", icon: "fa-location-dot", color: "bg-purple-600" },
            { title: "3. Your Passport & Visas", desc: "Finish a city to earn an official Visa in your Passport. Your rank grows from Tourist to Global Legend.", icon: "fa-passport", color: "bg-orange-600" },
            { title: "4. Miles = Real Discounts", desc: "Most important! Your miles are redeemable for direct discounts in our store and exclusive partner goods.", icon: "fa-shopping-bag", color: "bg-emerald-600" }
        ],
        footer: "bdai Intelligent System v1.2 • Encrypted Data"
    }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    const data = CONTENT[language] || CONTENT['es'];

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617] flex flex-col font-sans overflow-y-auto no-scrollbar animate-fade-in text-white p-6">
            <div className="max-w-md mx-auto w-full space-y-8 pt-10 pb-20">
                
                <header className="text-center space-y-3">
                    <BdaiLogo className="w-16 h-16 mx-auto animate-pulse-logo" />
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter leading-tight">{data.title}</h2>
                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] mt-1">{data.subtitle}</p>
                    </div>
                    <p className="text-slate-400 text-[11px] font-bold leading-relaxed px-4 opacity-80">{data.intro}</p>
                </header>

                <div className="space-y-3">
                    {data.steps.map((step: any, i: number) => (
                        <div key={i} className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-7 flex gap-6 items-start group active:scale-[0.98] transition-all">
                            <div className={`w-12 h-12 shrink-0 rounded-[1.2rem] ${step.color} flex items-center justify-center text-lg shadow-lg border border-white/20`}>
                                <i className={`fas ${step.icon}`}></i>
                            </div>
                            <div className="space-y-1.5">
                                <h4 className="font-black text-xs uppercase tracking-tight text-white">{step.title}</h4>
                                <p className="text-slate-400 text-[10px] leading-relaxed font-bold">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 space-y-6">
                    <button onClick={onComplete} className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                        {data.btnStart}
                    </button>
                    <p className="text-[8px] text-center text-slate-700 font-black uppercase tracking-[0.3em] leading-relaxed">
                        {data.footer}
                    </p>
                </div>

            </div>
        </div>
    );
};