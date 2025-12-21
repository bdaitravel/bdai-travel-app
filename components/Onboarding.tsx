
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
        en: { skip: "Skip", next: "Next", start: "Get Started", selectLang: "Select Language" },
        es: { skip: "Saltar", next: "Siguiente", start: "Empezar", selectLang: "Elige tu Idioma" },
        ca: { skip: "Saltar", next: "Següent", start: "Començar", selectLang: "Tria el teu Idioma" },
        eu: { skip: "Saltatu", next: "Hurrengoa", start: "Hasi", selectLang: "Aukeratu zure Hizkuntza" },
        fr: { skip: "Passer", next: "Suivant", start: "Commencer", selectLang: "Choisissez votre langue" },
    };

    const STEPS_CONTENT: any = {
        en: [
            { title: "Your Personal Guide", desc: "Walking tours tailored to your location and interests." },
            { title: "Travel Passport", desc: "Earn miles and digital stamps for every new city you visit." },
            { title: "Smart Translation", desc: "Every secret and story, translated instantly into your language." }
        ],
        es: [
            { title: "Tu Guía Personal", desc: "Rutas a pie adaptadas a tu ubicación e intereses." },
            { title: "Pasaporte Viajero", desc: "Gana millas y sellos digitales por cada nueva ciudad." },
            { title: "Traducción Inteligente", desc: "Cada secreto e historia, traducido al instante a tu idioma." }
        ],
        ca: [
            { title: "La Teva Guia", desc: "Rutes a peu adaptades a la teva ubicació i interessos." },
            { title: "Passaport Viatger", desc: "Guanya milles i segells per cada nova ciutat que visitis." },
            { title: "Traducció Local", desc: "Cada secret i història, traduït a l'instant al teu idioma." }
        ],
        eu: [
            { title: "Zure Gida", desc: "Zure kokapenera eta interesetara egokitutako oinezko ibilbideak." },
            { title: "Bidaiari Pasaportea", desc: "Miliak eta seiluak irabazi bisitatzen duzun hiri bakoitzeko." },
            { title: "Berehalako Itzulpena", desc: "Sekretu eta istorio bakoitza zure hizkuntzara itzulita." }
        ],
        fr: [
            { title: "Votre Guide", desc: "Des circuits à pied adaptés à vos intérêts." },
            { title: "Passeport Voyageur", desc: "Gagnez des miles et des timbres pour chaque ville visitée." },
            { title: "Traduction Instantanée", desc: "Chaque secret et histoire traduit instantanément." }
        ]
    };

    const currentText = CONTENT[language] || CONTENT['es'];
    const steps = STEPS_CONTENT[language] || STEPS_CONTENT['es'];

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    const prioritizedLangs = ['es', 'en', 'ca', 'eu', 'fr'];
    const otherLangs = LANGUAGES.filter(l => !prioritizedLangs.includes(l.code));
    const allLangs = [...LANGUAGES.filter(l => prioritizedLangs.includes(l.code)), ...otherLangs];

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-fade-in font-sans">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900 z-0 overflow-hidden rounded-b-[3rem]">
                <img src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1000" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950"></div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full -mt-12">
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full text-center flex flex-col items-center min-h-[500px] border border-slate-100">
                    
                    {step === 0 ? (
                        <div className="w-full flex-1 overflow-y-auto no-scrollbar pt-2">
                            <h2 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight lowercase">
                                {currentText.selectLang}
                            </h2>
                            <div className="grid grid-cols-1 gap-3">
                                {allLangs.map(lang => (
                                    <button 
                                        key={lang.code}
                                        onClick={() => onLanguageSelect(lang.code)}
                                        className={`py-4.5 rounded-2xl font-bold transition-all border flex items-center justify-between px-6 ${language === lang.code ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-purple-200 hover:bg-white'}`}
                                    >
                                        <span className="text-[11px] tracking-[0.2em] uppercase">{lang.name}</span>
                                        <FlagIcon code={lang.code} className="w-10 h-7" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex-1 flex flex-col items-center justify-center pt-4">
                            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 text-3xl mb-8 shadow-inner">
                                <i className={`fas ${step === 1 ? 'fa-map-marked-alt' : step === 2 ? 'fa-passport' : 'fa-language'}`}></i>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight lowercase">
                                {steps[step - 1].title}
                            </h2>
                            <p className="text-slate-500 font-medium leading-relaxed px-4 text-sm">
                                {steps[step - 1].desc}
                            </p>
                        </div>
                    )}

                    <div className="mt-10 w-full space-y-6">
                        <div className="flex justify-center gap-2">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-purple-600' : 'w-2 bg-slate-100'}`}></div>
                            ))}
                        </div>

                        <button 
                            onClick={handleNext}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.4em] shadow-2xl active:scale-[0.98] transition-all"
                        >
                            {step === 3 ? currentText.start : currentText.next}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
