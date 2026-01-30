
import React, { useState, useEffect } from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const STORY_DATA: any = {
    en: [
        { 
            title: "Welcome to bdai", 
            subtitle: "The Global Masterclass",
            desc: "Travel is more than photos. It's understanding the invisible architecture and history of our world.",
            icon: "fa-globe-americas",
            color: "from-blue-600/40"
        },
        { 
            title: "I am Dai", 
            subtitle: "Your Analytical Core",
            desc: "I am your AI guide. I don't read brochures; I analyze engineering, power structures, and hidden salseo.",
            icon: "fa-microchip",
            color: "from-purple-600/40"
        },
        { 
            title: "High Density Info", 
            subtitle: "Expert Intelligence",
            desc: "Get deep technical insights about any spot. From Roman concrete to modern cyberpunk skyscrapers.",
            icon: "fa-brain",
            color: "from-emerald-600/40"
        },
        { 
            title: "Verified Exploration", 
            subtitle: "Miles for your GPS",
            desc: "Your movement has value. Reach the spots physically and earn miles to climb the global elite ranking.",
            icon: "fa-satellite-dish",
            color: "from-orange-600/40"
        }
    ],
    es: [
        { 
            title: "Bienvenido a bdai", 
            subtitle: "La Masterclass Global",
            desc: "Viajar es más que fotos. Es entender la arquitectura invisible y la historia real de nuestro mundo.",
            icon: "fa-globe-americas",
            color: "from-blue-600/40"
        },
        { 
            title: "Soy Dai", 
            subtitle: "Tu Motor Analítico",
            desc: "Soy tu guía IA. No leo folletos; analizo ingeniería, estructuras de poder y salseo histórico.",
            icon: "fa-microchip",
            color: "from-purple-600/40"
        },
        { 
            title: "Alta Densidad", 
            subtitle: "Inteligencia Experta",
            desc: "Accede a datos técnicos profundos. Desde el hormigón romano hasta los rascacielos cyberpunk.",
            icon: "fa-brain",
            color: "from-emerald-600/40"
        },
        { 
            title: "Exploración Real", 
            subtitle: "Millas por tu GPS",
            desc: "Tu movimiento tiene valor. Llega físicamente a los puntos y gana millas para el ranking de élite.",
            icon: "fa-satellite-dish",
            color: "from-orange-600/40"
        }
    ]
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const stories = STORY_DATA[language] || STORY_DATA['es'];
    const current = stories[currentIndex];

    // Auto-advance logic like Instagram stories
    useEffect(() => {
        setProgress(0);
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    if (currentIndex < stories.length - 1) {
                        setCurrentIndex(prevIdx => prevIdx + 1);
                        return 0;
                    } else {
                        clearInterval(timer);
                        return 100;
                    }
                }
                return prev + 1;
            });
        }, 50); // 5 seconds per slide (50ms * 100)

        return () => clearInterval(timer);
    }, [currentIndex]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col font-sans overflow-hidden">
            {/* Background gradients */}
            <div className={`absolute inset-0 bg-gradient-to-b ${current.color} to-slate-950 transition-colors duration-1000`}></div>
            
            {/* Progress Bars */}
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

            {/* Content Card */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                <div className="w-full max-w-sm flex flex-col items-center text-center animate-fade-in" key={currentIndex}>
                    <div className="w-24 h-24 mb-10 relative">
                        <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] blur-2xl animate-pulse"></div>
                        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 w-full h-full rounded-[2.5rem] flex items-center justify-center text-white text-4xl shadow-2xl">
                            <i className={`fas ${current.icon}`}></i>
                        </div>
                    </div>

                    <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.5em] mb-4">{current.subtitle}</p>
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-8">{current.title}</h2>
                    <p className="text-slate-300 text-lg font-medium leading-relaxed px-4 opacity-80">{current.desc}</p>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-10 pb-16 relative z-10 flex flex-col gap-6">
                <button 
                    onClick={handleNext} 
                    className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all"
                >
                    {currentIndex === stories.length - 1 ? (language === 'es' ? 'Comenzar' : 'Start') : (language === 'es' ? 'Siguiente' : 'Next')}
                </button>
                
                <button 
                    onClick={onComplete}
                    className="text-white/30 text-[9px] font-black uppercase tracking-widest text-center"
                >
                    {language === 'es' ? 'Saltar Introducción' : 'Skip Intro'}
                </button>
            </div>
        </div>
    );
};
