
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
        step1: { title: "Bienvenido a bdai", subtitle: "Tu Ecosistema de Viajes", content: "bdai es tu compañero de viajes inteligente. Aquí descubrirás los secretos mejor guardados de cualquier ciudad del mundo, guiado por inteligencia artificial." },
        step2: { title: "Conoce a DAI", subtitle: "Tu Guía Personal", content: "Soy DAI, tu guía de inteligencia artificial. Te acompañaré en cada paso, contándote la historia real y los secretos de cada lugar mediante audio. Solo tienes que subir el volumen y disfrutar del paseo." },
        step3: { title: "Tours Únicos", subtitle: "Generación Inteligente", content: "Busca cualquier ciudad y crearé 3 rutas temáticas al instante. Calculo el tiempo real de caminata y visita. ¡Cero paradas repetidas, 100% lugares increíbles y gemas ocultas!" },
        step4: { title: "Geolocalización", subtitle: "Check-in Real", content: "Para avanzar en el tour, debes estar físicamente a menos de 50 metros de la parada. El GPS validará tu posición para hacer 'Check-in' y desbloquear la historia." },
        step5: { title: "Millas y Ranking", subtitle: "Gamificación Real", content: "Cada 'Check-in' te otorga Millas. Acumula millas para subir de nivel en el Ranking Global (desde ZERO hasta ZENITH). ¡Compite contra otros viajeros para ser el mejor!" },
        step6: { title: "Insignias", subtitle: "Colecciona tus descubrimientos", content: "Gana puntos e insignias según el tipo de lugares que visites. Cada parada tiene una categoría especial. ¡Explora todas las facetas de la ciudad para completar tu colección!" },
        step7: { title: "Consejos y Visados", subtitle: "Comparte tu experiencia", content: "En cada parada te daré consejos exclusivos (DAI Shot) para tomar la mejor foto o encontrar un detalle oculto. Al terminar el tour, recibirás un Visado digital de la ciudad, ¡perfecto para presumir en tus redes sociales!" },
        step8: { title: "A Tener en Cuenta", subtitle: "Pequeños detalles", content: "1. El GPS puede ser menos preciso en calles muy estrechas.\n2. Necesito unos segundos para pensar y generar los mejores tours para ti.\n3. ¡Mantén los ojos abiertos y disfruta del viaje!" },
        btnNext: "SIGUIENTE",
        btnDone: "ENTENDIDO, DAI"
    },
    en: {
        step1: { title: "Welcome to bdai", subtitle: "Your Travel Ecosystem", content: "bdai is your smart travel companion. Here you will discover the best-kept secrets of any city in the world, guided by artificial intelligence." },
        step2: { title: "Meet DAI", subtitle: "Your Personal Guide", content: "I am DAI, your artificial intelligence guide. I will accompany you every step of the way, telling you the real history and secrets of each place through audio. Just turn up the volume and enjoy the ride." },
        step3: { title: "Unique Tours", subtitle: "Smart Generation", content: "Search for any city and I will create 3 thematic routes instantly. I calculate real walking and visiting times. Zero repeated stops, 100% amazing places and hidden gems!" },
        step4: { title: "Geolocation", subtitle: "Real Check-in", content: "To advance in the tour, you must be physically within 50 meters of the stop. The GPS will validate your position to 'Check-in' and unlock the story." },
        step5: { title: "Miles & Ranking", subtitle: "Real Gamification", content: "Every 'Check-in' grants you Miles. Accumulate miles to level up in the Global Ranking (from ZERO to ZENITH). Compete against other travelers to be the best!" },
        step6: { title: "Badges", subtitle: "Collect your discoveries", content: "Earn points and badges based on the type of places you visit. Each stop has a special category. Explore all facets of the city to complete your collection!" },
        step7: { title: "Tips & Visas", subtitle: "Share your experience", content: "At each stop I will give you exclusive tips (DAI Shot) to take the best photo or find a hidden detail. Upon finishing the tour, you will receive a digital Visa of the city, perfect for showing off on your social networks!" },
        step8: { title: "Keep in Mind", subtitle: "Small details", content: "1. GPS might be less accurate in very narrow streets.\n2. I need a few seconds to think and generate the best tours for you.\n3. Keep your eyes open and enjoy the trip!" },
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
            icon: <BdaiLogo className="w-20 h-20 mb-6 animate-pulse-logo" />
        },
        {
            title: t.step2.title,
            subtitle: t.step2.subtitle,
            content: welcomeMessage || t.step2.content,
            icon: <div className="w-20 h-20 bg-purple-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/40 border border-purple-400/30"><i className="fas fa-brain text-4xl text-white"></i></div>
        },
        {
            title: t.step3.title,
            subtitle: t.step3.subtitle,
            content: t.step3.content,
            icon: <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/40 border border-blue-400/30"><i className="fas fa-route text-4xl text-white"></i></div>
        },
        {
            title: t.step4.title,
            subtitle: t.step4.subtitle,
            content: t.step4.content,
            icon: <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/40 border border-emerald-400/30"><i className="fas fa-location-crosshairs text-4xl text-white"></i></div>
        },
        {
            title: t.step5.title,
            subtitle: t.step5.subtitle,
            content: t.step5.content,
            icon: <div className="w-20 h-20 bg-yellow-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-yellow-500/40 border border-yellow-400/30"><i className="fas fa-ranking-star text-4xl text-slate-900"></i></div>
        },
        {
            title: t.step6.title,
            subtitle: t.step6.subtitle,
            content: t.step6.content,
            icon: <div className="w-20 h-20 bg-rose-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-rose-500/40 border border-rose-400/30"><i className="fas fa-medal text-4xl text-white"></i></div>,
            customContent: (
                <div className="grid grid-cols-4 gap-3 mt-6">
                    <div className="flex flex-col items-center"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-amber-500 mb-1.5 shadow-lg"><i className="fas fa-landmark"></i></div><span className="text-[7px] font-black uppercase text-slate-400">{language === 'es' ? 'Historia' : 'History'}</span></div>
                    <div className="flex flex-col items-center"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-pink-500 mb-1.5 shadow-lg"><i className="fas fa-palette"></i></div><span className="text-[7px] font-black uppercase text-slate-400">{language === 'es' ? 'Arte' : 'Art'}</span></div>
                    <div className="flex flex-col items-center"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-orange-500 mb-1.5 shadow-lg"><i className="fas fa-utensils"></i></div><span className="text-[7px] font-black uppercase text-slate-400">{language === 'es' ? 'Comida' : 'Food'}</span></div>
                    <div className="flex flex-col items-center"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-green-500 mb-1.5 shadow-lg"><i className="fas fa-leaf"></i></div><span className="text-[7px] font-black uppercase text-slate-400">{language === 'es' ? 'Naturaleza' : 'Nature'}</span></div>
                    <div className="flex flex-col items-center"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-blue-500 mb-1.5 shadow-lg"><i className="fas fa-camera"></i></div><span className="text-[7px] font-black uppercase text-slate-400">{language === 'es' ? 'Foto' : 'Photo'}</span></div>
                    <div className="flex flex-col items-center"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-purple-500 mb-1.5 shadow-lg"><i className="fas fa-masks-theater"></i></div><span className="text-[7px] font-black uppercase text-slate-400">{language === 'es' ? 'Cultura' : 'Culture'}</span></div>
                    <div className="flex flex-col items-center"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-cyan-500 mb-1.5 shadow-lg"><i className="fas fa-building"></i></div><span className="text-[7px] font-black uppercase text-slate-400">{language === 'es' ? 'Arqui' : 'Archi'}</span></div>
                    <div className="flex flex-col items-center"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-yellow-500 mb-1.5 shadow-lg"><i className="fas fa-star"></i></div><span className="text-[7px] font-black uppercase text-slate-400">{language === 'es' ? 'Especial' : 'Special'}</span></div>
                </div>
            )
        },
        {
            title: t.step7.title,
            subtitle: t.step7.subtitle,
            content: t.step7.content,
            icon: <div className="w-20 h-20 bg-indigo-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/40 border border-indigo-400/30"><i className="fas fa-share-nodes text-4xl text-white"></i></div>,
            customContent: (
                <div className="flex justify-center gap-4 mt-6">
                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl flex items-center gap-3 shadow-lg">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center"><i className="fas fa-camera text-purple-400"></i></div>
                        <span className="text-[10px] font-black uppercase text-white">DAI Shot</span>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl flex items-center gap-3 shadow-lg">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center"><i className="fas fa-passport text-emerald-400"></i></div>
                        <span className="text-[10px] font-black uppercase text-white">{language === 'es' ? 'Visado' : 'Visa'}</span>
                    </div>
                </div>
            )
        },
        {
            title: t.step8.title,
            subtitle: t.step8.subtitle,
            content: t.step8.content,
            icon: <div className="w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/40 border border-orange-400/30"><i className="fas fa-triangle-exclamation text-4xl text-white"></i></div>
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
        <div className="fixed inset-0 z-[10000] bg-[#020617]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#020617] to-[#020617]"></div>
            
            <div className="w-full max-w-md flex flex-col items-center relative z-10 h-full max-h-[850px] justify-center">
                <div className="bg-slate-900/80 border border-white/10 p-8 rounded-[3rem] shadow-2xl backdrop-blur-2xl w-full flex flex-col items-center relative overflow-hidden">
                    
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                        ></div>
                    </div>

                    <div className="mt-4 mb-2 animate-slide-up" key={`icon-${step}`}>
                        {currentStep.icon}
                    </div>
                    
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center leading-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        {currentStep.title}
                    </h2>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mt-3 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        {currentStep.subtitle}
                    </p>
                    
                    <div className="w-full mt-8 p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] relative flex-1 min-h-[180px] flex flex-col justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        {isLoading && step === 1 ? (
                            <div className="space-y-3 w-full flex flex-col items-center">
                                <div className="h-2 bg-purple-500/20 rounded-full animate-pulse w-full"></div>
                                <div className="h-2 bg-purple-500/20 rounded-full animate-pulse w-5/6"></div>
                                <div className="h-2 bg-purple-500/20 rounded-full animate-pulse w-4/6"></div>
                                <p className="text-[8px] text-purple-400/50 uppercase tracking-widest mt-4 animate-pulse">DAI is typing...</p>
                            </div>
                        ) : (
                            <div className="text-slate-300 text-sm font-medium leading-relaxed text-center space-y-3">
                                {currentStep.content.split('\n').map((paragraph: string, idx: number) => (
                                    <p key={idx} className={step === 1 ? 'italic text-purple-100' : ''}>
                                        {step === 1 ? `"${paragraph}"` : paragraph}
                                    </p>
                                ))}
                            </div>
                        )}

                        {currentStep.customContent && (
                            <div className="w-full animate-slide-up" style={{ animationDelay: '0.4s' }}>
                                {currentStep.customContent}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mt-8 mb-8">
                        {steps.map((_, i) => (
                            <button 
                                key={i} 
                                onClick={() => setStep(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-purple-500' : 'w-2 bg-white/10 hover:bg-white/20'}`}
                                aria-label={`Go to step ${i + 1}`}
                            ></button>
                        ))}
                    </div>

                    <div className="w-full flex gap-3">
                        {step > 0 && (
                            <button 
                                onClick={() => setStep(step - 1)} 
                                className="w-14 h-14 bg-white/5 text-slate-300 rounded-2xl flex items-center justify-center active:scale-95 transition-all border border-white/10 hover:bg-white/10 shrink-0"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                        )}
                        <button 
                            onClick={() => {
                                if (step < steps.length - 1) setStep(step + 1);
                                else onComplete();
                            }} 
                            className="flex-1 h-14 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-white/10 active:scale-95 transition-all hover:bg-slate-100 flex items-center justify-center gap-2"
                        >
                            {step < steps.length - 1 ? (
                                <>
                                    {t.btnNext} <i className="fas fa-arrow-right ml-1"></i>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check text-green-600 mr-1 text-sm"></i> {t.btnDone}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

