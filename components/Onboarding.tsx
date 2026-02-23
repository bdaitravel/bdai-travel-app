
import React, { useEffect, useState } from 'react';
import { BdaiLogo } from './BdaiLogo';
import { generateDaiWelcome } from '../services/geminiService';
import { UserProfile } from '../types';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
    user: UserProfile;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language, user }) => {
    const [welcomeMessage, setWelcomeMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "DAI PROTOCOL",
            subtitle: "Better Destinations by AI",
            content: welcomeMessage,
            icon: <BdaiLogo className="w-16 h-16 mb-6 animate-pulse-logo" />,
            tag: "DAI_VOICE"
        },
        {
            title: "EXPLORA EL MUNDO",
            subtitle: "Búsqueda Inteligente",
            content: "Busca cualquier ciudad del mundo. Si no tenemos el tour, DAI lo generará para ti en segundos con datos reales y curiosidades únicas.",
            icon: <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20"><i className="fas fa-search text-2xl text-white"></i></div>,
            tag: "SEARCH_ENGINE"
        },
        {
            title: "GANA MILLAS",
            subtitle: "Gamificación Real",
            content: "Acércate a las paradas (<100m) para hacer Check-in. Ganarás millas que te harán subir en el ranking global y desbloquearán insignias exclusivas.",
            icon: <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20"><i className="fas fa-location-dot text-2xl text-white"></i></div>,
            tag: "MILES_SYSTEM"
        },
        {
            title: "TU PASAPORTE",
            subtitle: "Tu Legado Viajero",
            content: "Cada tour completado te otorga un sello en tu pasaporte. Presume de tus viajes generando tu Visado Social para compartir en redes.",
            icon: <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20"><i className="fas fa-passport text-2xl text-slate-900"></i></div>,
            tag: "PASSPORT_ID"
        },
        {
            title: "SEGURIDAD",
            subtitle: "Tu Cuenta Protegida",
            content: "Usamos protocolos seguros de autenticación. Si pierdes tu dispositivo, puedes cerrar sesión remotamente desde nuestro soporte. Recuerda cerrar sesión si usas dispositivos públicos.",
            icon: <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/20"><i className="fas fa-shield-halved text-2xl text-white"></i></div>,
            tag: "SECURITY_FIRST"
        }
    ];

    useEffect(() => {
        const fetchWelcome = async () => {
            try {
                const msg = await generateDaiWelcome(user);
                setWelcomeMessage(msg);
            } catch (e) {
                setWelcomeMessage("Bienvenido a bdai. Empiezas como ZERO. Conquista el mundo para llegar a ser ZENITH.");
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
                        {step < steps.length - 1 ? 'SIGUIENTE' : 'ENTENDIDO, DAI'}
                    </button>
                </div>
            </div>
        </div>
    );
};

