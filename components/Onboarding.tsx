
import React, { useState } from 'react';
import { LANGUAGES } from '../types';
import { FlagIcon } from '../App';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
    onLanguageSelect: (lang: string) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language, onLanguageSelect }) => {
    const [step, setStep] = useState(0);

    const CONTENT: any = {
        en: {
            skip: "Skip", next: "Next", start: "Get Started", selectLang: "Choose your Language",
            steps: [
                { title: "Your Personal Guide", desc: "Discover unique walking tours tailored specifically to your interests and location. Explore the city your way." },
                { title: "Level Up Your Travels", desc: "Collect miles for every landmark you visit. Build your traveler passport, earn badges, and climb the rankings." },
                { title: "Uncover Secrets", desc: "Get insider curiosity facts and local stories that standard guidebooks won't tell you." }
            ]
        },
        es: {
            skip: "Saltar", next: "Siguiente", start: "Empezar", selectLang: "Elige tu Idioma",
            steps: [
                { title: "Tu Guía Personal", desc: "Descubre rutas únicas a pie adaptadas específicamente a tus intereses y ubicación. Explora la ciudad a tu manera." },
                { title: "Sube de Nivel", desc: "Colecciona millas por cada monumento que visites. Construye tu pasaporte de viajero, gana insignias y sube en el ranking." },
                { title: "Descubre Secretos", desc: "Accede a datos curiosos de expertos e historias locales que las guías estándar no te cuentan." }
            ]
        },
        ca: {
            skip: "Saltar", next: "Següent", start: "Començar", selectLang: "Tria el teu Idioma",
            steps: [
                { title: "La Teva Guia Personal", desc: "Descobreix rutes úniques a peu adaptades als teus interessos i ubicació. Explora la ciutat a la teva manera." },
                { title: "Puja de Nivell", desc: "Col·lecciona milles per cada monument que visitis. Construeix el teu passaport, guanya insígnies i puja al rànquing." },
                { title: "Descobreix Secrets", desc: "Accedeix a dades curioses d'experts i històries locales que les guies estàndard no t'expliquen." }
            ]
        },
        eu: {
            skip: "Saltatu", next: "Hurrengoa", start: "Hasi", selectLang: "Aukeratu hizkuntza",
            steps: [
                { title: "Zure gida pertsonala", desc: "Ezagutu oinezko ibilbide bereziak, zure interesetara eta kokapenera egokituak. Esploratu hiria zure erara." },
                { title: "Igo mailaz", desc: "Bildu miliak bisitatzen duzun monumentu bakoitzeko. Eraiki zure pasaportea, irabazi intsigniak eta igo sailkapenean." },
                { title: "Sekretuak aurkitu", desc: "Gida estandarrek kontatzen ez dizkizuten adituen datu bitxiak eta tokiko istorioak ezagutu." }
            ]
        },
        fr: {
            skip: "Passer", next: "Suivant", start: "Commencer", selectLang: "Choisissez votre langue",
            steps: [
                { title: "Votre guide personnel", desc: "Découvrez des itinéraires uniques adaptés à vos intérêts et à votre emplacement. Explorez la ville à votre façon." },
                { title: "Montez de niveau", desc: "Accumulez des miles pour chaque monument visité. Créer votre passeport, gagnez des badges et grimpez au classement." },
                { title: "Découvrez des secrets", desc: "Accédez à des faits insolites et des histoires locales que les guides classiques ne vous diront pas." }
            ]
        }
    };

    const currentText = CONTENT[language] || CONTENT['es'];
    const steps = currentText.steps;

    const ICONS = [
        { icon: "fa-globe", color: "text-blue-500", bg: "bg-blue-50" },
        { icon: "fa-map-marked-alt", color: "text-purple-600", bg: "bg-purple-50" },
        { icon: "fa-passport", color: "text-yellow-500", bg: "bg-yellow-50" },
        { icon: "fa-user-secret", color: "text-indigo-600", bg: "bg-indigo-50" }
    ];

    const handleNext = () => {
        if (step < steps.length) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in font-sans">
            <div 
                className="absolute top-0 left-0 w-full h-1/2 bg-slate-900 rounded-b-[3rem] z-0 overflow-hidden"
                style={{ 
                    backgroundImage: 'url("https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80"></div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto w-full -mt-20">
                <button 
                    onClick={onComplete}
                    className="absolute top-6 right-6 text-white/90 font-bold text-sm hover:text-white transition-colors z-20"
                >
                    {currentText.skip}
                </button>

                <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full text-center border border-slate-100 flex flex-col items-center min-h-[500px]">
                    <div className={`w-24 h-24 rounded-full ${ICONS[step].bg} ${ICONS[step].color} flex items-center justify-center text-4xl mb-8 shadow-inner transition-colors duration-500`}>
                        <i className={`fas ${ICONS[step].icon}`}></i>
                    </div>
                    
                    {step === 0 ? (
                        <div className="w-full flex-1 overflow-y-auto no-scrollbar max-h-[300px]">
                            <h2 className="text-2xl font-black text-slate-900 mb-6 leading-tight">
                                {currentText.selectLang}
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                {LANGUAGES.map(lang => (
                                    <button 
                                        key={lang.code}
                                        onClick={() => onLanguageSelect(lang.code)}
                                        className={`py-3 rounded-xl font-bold transition-all border-2 flex items-center justify-center gap-3 px-2 ${language === lang.code ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
                                    >
                                        <span className="text-sm">{lang.name}</span>
                                        <FlagIcon code={lang.code} className="w-5 h-auto" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex-1">
                            <h2 className="text-2xl font-black text-slate-900 mb-4 transition-all duration-300 leading-tight">
                                {steps[step - 1].title}
                            </h2>
                            <p className="text-slate-500 leading-relaxed text-sm mb-8 transition-all duration-300">
                                {steps[step - 1].desc}
                            </p>
                        </div>
                    )}

                    <div className="mt-8 w-full">
                        <div className="flex justify-center gap-2 mb-8">
                            {[0, 1, 2, 3].map((i) => (
                                <div 
                                    key={i} 
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-purple-600' : 'bg-slate-300'}`}
                                ></div>
                            ))}
                        </div>

                        <button 
                            onClick={handleNext}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg flex items-center justify-center gap-2"
                        >
                            {step === 3 ? currentText.start : currentText.next}
                            {step !== 3 && <i className="fas fa-arrow-right"></i>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
