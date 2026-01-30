
import React, { useState } from 'react';
import { LANGUAGES, INTEREST_OPTIONS } from '../types';
import { FlagIcon } from './FlagIcon';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: (interests: string[]) => void;
    language: string;
}

const ONBOARDING_TEXT: any = {
    en: { 
        step1Title: "Welcome to bdai", step1Desc: "Travel is more than photos. It's understanding the invisible. Welcome to High Density Information.", 
        step2Title: "I am Dai", step2Desc: "Your analytical core. I'm not a brochure; I'm an expert in engineering, history, and secrets. I'll be your voice.",
        step3Title: "Global Translation", step3Desc: "Any city in the world. Any detail. Translated instantly to your cultural profile.",
        step4Title: "Verified Miles", step4Desc: "Earn miles by physically reaching spots. Your GPS is your proof of exploration.",
        step5Title: "Your Interests", step5Desc: "Select what fascinates you so I can calibrate your experience.",
        next: "Next", start: "Explore Now"
    },
    es: { 
        step1Title: "Bienvenido a bdai", step1Desc: "Viajar es más que fotos. Es entender lo invisible. Bienvenido a la Alta Densidad Informativa.", 
        step2Title: "Soy Dai", step2Desc: "Tu motor analítico. No soy un folleto; soy experta en ingeniería, historia y secretos. Seré tu voz.",
        step3Title: "Traducción Global", step3Desc: "Cualquier ciudad del mundo. Cualquier detalle. Traducido al instante para tu perfil cultural.",
        step4Title: "Millas Verificadas", step4Desc: "Gana millas llegando físicamente a los puntos. Tu GPS es tu prueba de exploración.",
        step5Title: "Tus Intereses", step5Desc: "Selecciona qué te fascina para que pueda calibrar tu experiencia.",
        next: "Siguiente", start: "Empezar a Explorar"
    }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    const [step, setStep] = useState(1);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const t = ONBOARDING_TEXT[language] || ONBOARDING_TEXT['es'];

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleNext = () => {
        if (step < 5) setStep(step + 1);
        else onComplete(selectedInterests);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in font-sans overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-slate-950 to-slate-950 pointer-events-none"></div>
            
            {/* Animación de fondo circular */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-sm flex flex-col items-center relative z-10">
                
                <div className="mb-12 transition-all duration-700 transform">
                    {step === 1 && (
                        <div className="flex flex-col items-center animate-slide-up">
                            <div className="w-24 h-24 mb-8"><BdaiLogo className="w-full h-full animate-pulse-logo" /></div>
                            <h2 className="text-4xl font-black text-white text-center uppercase tracking-tighter leading-none">{t.step1Title}</h2>
                            <p className="mt-6 text-slate-400 text-sm text-center leading-relaxed font-medium px-4">{t.step1Desc}</p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col items-center animate-slide-up">
                            <div className="w-20 h-20 bg-purple-600 rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-[0_0_40px_rgba(147,51,234,0.4)] mb-8 border border-white/20">
                                <i className="fas fa-microchip"></i>
                            </div>
                            <h2 className="text-4xl font-black text-white text-center uppercase tracking-tighter">{t.step2Title}</h2>
                            <p className="mt-6 text-slate-300 text-sm text-center leading-relaxed font-medium italic px-4">"{t.step2Desc}"</p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center animate-slide-up">
                            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-[0_0_40px_rgba(37,99,235,0.4)] mb-8 border border-white/20">
                                <i className="fas fa-globe-americas"></i>
                            </div>
                            <h2 className="text-4xl font-black text-white text-center uppercase tracking-tighter">{t.step3Title}</h2>
                            <p className="mt-6 text-slate-400 text-sm text-center leading-relaxed font-medium px-4">{t.step3Desc}</p>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="flex flex-col items-center animate-slide-up">
                            <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-[0_0_40px_rgba(16,185,129,0.4)] mb-8 border border-white/20">
                                <i className="fas fa-satellite"></i>
                            </div>
                            <h2 className="text-4xl font-black text-white text-center uppercase tracking-tighter">{t.step4Title}</h2>
                            <p className="mt-6 text-slate-400 text-sm text-center leading-relaxed font-medium px-4">{t.step4Desc}</p>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="flex flex-col items-center animate-slide-up w-full">
                            <h2 className="text-3xl font-black text-white text-center uppercase tracking-tighter mb-4">{t.step5Title}</h2>
                            <p className="text-slate-500 text-[10px] text-center font-bold uppercase tracking-widest mb-8">{t.step5Desc}</p>
                            
                            <div className="grid grid-cols-2 gap-3 w-full">
                                {INTEREST_OPTIONS.map(opt => (
                                    <button 
                                        key={opt.id} 
                                        onClick={() => toggleInterest(opt.id)} 
                                        className={`p-5 rounded-[2rem] flex flex-col items-center gap-2 border-2 transition-all ${selectedInterests.includes(opt.id) ? 'bg-purple-600 border-purple-500 text-white shadow-xl scale-[1.02]' : 'bg-white/5 border-white/10 text-white/40'}`}
                                    >
                                        <span className="text-2xl">{opt.icon}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{(opt.label as any)[language] || (opt.label as any)['es']}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full space-y-6">
                    <button 
                        onClick={handleNext} 
                        className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
                    >
                        {step === 5 ? t.start : t.next}
                    </button>
                    
                    <div className="flex justify-center gap-2">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-purple-500' : 'w-2 bg-white/10'}`}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
