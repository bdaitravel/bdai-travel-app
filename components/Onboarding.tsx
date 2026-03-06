
import React, { useEffect, useState } from 'react';
import { BdaiLogo } from './BdaiLogo';
import { generateDaiWelcome } from '../services/geminiService';
import { UserProfile } from '../types';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
    user: UserProfile;
}

const ONBOARDING_TEXTS: Record<string, any> = {
    es: {
        step1: { title: "¿Qué es bdai?", subtitle: "Tu Ecosistema de Viajes", content: "bdai no es una simple audioguía. Es tu compañero de viajes inteligente. Aquí descubrirás los secretos mejor guardados de cualquier ciudad del mundo, guiado por inteligencia artificial.", tag: "BETA_ACCESS" },
        step2: { title: "Conoce a DAI", subtitle: "Tu Guía Personal", content: "Soy DAI, la inteligencia artificial detrás de bdai. Soy elegante, directa y odio las descripciones aburridas. Te contaré la verdadera historia y los secretos de cada lugar.", tag: "DAI_VOICE" },
        step3: { title: "Tours Únicos", subtitle: "Explora a tu ritmo", content: "Busca cualquier ciudad y crearé rutas temáticas al instante. Sigue el mapa, llega a cada parada y descubre historias fascinantes. ¡Cero rutas aburridas, 100% lugares increíbles!", tag: "SMART_ROUTES" },
        step4: { title: "Millas y Ranking", subtitle: "Gamificación Real", content: "Acércate a menos de 50 metros de una parada para hacer 'Check-in'. Ganarás millas reales que te harán subir en el Ranking Global. ¡Compite para ser el mejor viajero!", tag: "MILES_SYSTEM" },
        step5: { title: "Tu Pasaporte", subtitle: "Colecciona Insignias", content: "Al completar tours, ganarás sellos en tu pasaporte virtual y desbloquearás insignias exclusivas según tu estilo de viaje. ¡Genera tu Visado y presúmelo en tus redes sociales!", tag: "PASSPORT_ID" },
        step6: { title: "Marketplace", subtitle: "Próximamente", content: "Muy pronto abriremos nuestra tienda oficial, donde podrás encontrar los mejores productos y accesorios para tus viajes, seleccionados especialmente por DAI.", tag: "SHOP_HUB" },
        btnNext: "SIGUIENTE",
        btnDone: "ENTENDIDO, DAI"
    },
    en: {
        step1: { title: "What is bdai?", subtitle: "Your Travel Ecosystem", content: "bdai is not just an audio guide. It's your smart travel companion. Here you will discover the best-kept secrets of any city in the world, guided by artificial intelligence.", tag: "BETA_ACCESS" },
        step2: { title: "Meet DAI", subtitle: "Your Personal Guide", content: "I am DAI, the AI behind bdai. I am elegant, direct, and I hate boring descriptions. I will tell you the true history and secrets of every place.", tag: "DAI_VOICE" },
        step3: { title: "Unique Tours", subtitle: "Explore at your pace", content: "Search for any city and I will create thematic routes instantly. Follow the map, reach each stop, and discover fascinating stories. Zero boring routes, 100% amazing places!", tag: "SMART_ROUTES" },
        step4: { title: "Miles & Ranking", subtitle: "Real Gamification", content: "Get within 50 meters of a stop to 'Check-in'. You will earn real miles that will make you climb the Global Ranking. Compete to be the best traveler!", tag: "MILES_SYSTEM" },
        step5: { title: "Your Passport", subtitle: "Collect Badges", content: "By completing tours, you will earn stamps in your virtual passport and unlock exclusive badges based on your travel style. Generate your Visa and show it off on social media!", tag: "PASSPORT_ID" },
        step6: { title: "Marketplace", subtitle: "Coming Soon", content: "Very soon we will open our official store, where you can find the best products and accessories for your travels, specially selected by DAI.", tag: "SHOP_HUB" },
        btnNext: "NEXT",
        btnDone: "GOT IT, DAI"
    }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language, user }) => {
    const [welcomeMessage, setWelcomeMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(0);

    const t = ONBOARDING_TEXTS[language] || ONBOARDING_TEXTS.en;

    const steps = [
        {
            title: t.step1.title,
            subtitle: t.step1.subtitle,
            content: t.step1.content,
            icon: <BdaiLogo className="w-16 h-16 mb-6 animate-pulse-logo" />,
            tag: t.step1.tag
        },
        {
            title: t.step2.title,
            subtitle: t.step2.subtitle,
            content: welcomeMessage || t.step2.content,
            icon: <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20"><i className="fas fa-brain text-3xl text-white"></i></div>,
            tag: t.step2.tag
        },
        {
            title: t.step3.title,
            subtitle: t.step3.subtitle,
            content: t.step3.content,
            icon: <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20"><i className="fas fa-map-location-dot text-3xl text-white"></i></div>,
            tag: t.step3.tag
        },
        {
            title: t.step4.title,
            subtitle: t.step4.subtitle,
            content: t.step4.content,
            icon: <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/20"><i className="fas fa-trophy text-3xl text-slate-900"></i></div>,
            tag: t.step4.tag
        },
        {
            title: t.step5.title,
            subtitle: t.step5.subtitle,
            content: t.step5.content,
            icon: <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20"><i className="fas fa-passport text-3xl text-white"></i></div>,
            tag: t.step5.tag
        },
        {
            title: t.step6.title,
            subtitle: t.step6.subtitle,
            content: t.step6.content,
            icon: <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/20"><i className="fas fa-shopping-bag text-3xl text-white"></i></div>,
            tag: t.step6.tag
        }
    ];

    useEffect(() => {
        const fetchWelcome = async () => {
            try {
                const msg = await generateDaiWelcome(user);
                setWelcomeMessage(msg);
            } catch (e) {
                setWelcomeMessage(t.step2.content);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWelcome();
    }, [user, language]);

    const currentStep = steps[step];

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617] flex flex-col items-center p-6 overflow-y-auto no-scrollbar animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-600/30 to-transparent"></div>
            
            <div className="w-full max-w-sm mt-12 flex flex-col items-center relative z-10">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[3.5rem] shadow-2xl backdrop-blur-xl w-full flex flex-col items-center min-h-[500px]">
                    {currentStep.icon}
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center leading-tight">{currentStep.title}</h2>
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.4em] mt-3 text-center">{currentStep.subtitle}</p>
                    
                    <div className="w-full mt-10 p-6 bg-white/[0.03] border border-white/10 rounded-3xl relative flex-1">
                        <div className="absolute -top-3 left-6 bg-purple-600 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest text-white">{currentStep.tag}</div>
                        {isLoading && step === 0 ? (
                            <div className="space-y-2">
                                <div className="h-2 bg-white/10 rounded animate-pulse w-full"></div>
                                <div className="h-2 bg-white/10 rounded animate-pulse w-3/4"></div>
                                <div className="h-2 bg-white/10 rounded animate-pulse w-1/2"></div>
                            </div>
                        ) : (
                            <p className="text-slate-300 text-sm font-medium italic leading-relaxed">
                                "{currentStep.content}"
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2 mt-8">
                        {steps.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'w-6 bg-purple-500' : 'bg-white/10'}`}></div>
                        ))}
                    </div>

                    <button 
                        onClick={() => {
                            if (step < steps.length - 1) setStep(step + 1);
                            else onComplete();
                        }} 
                        className="w-full mt-8 py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
                    >
                        {step < steps.length - 1 ? t.btnNext : t.btnDone}
                    </button>
                </div>
            </div>
        </div>
    );
};

