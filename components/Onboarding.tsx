
import React, { useState } from 'react';
import { LANGUAGES } from '../types';
import { FlagIcon } from './FlagIcon';

interface OnboardingProps {
    onComplete: (interests: string[]) => void;
    language: string;
    onLanguageSelect: (lang: string) => void;
}

const INTERESTS = [
    { id: 'history', icon: '🏛️', label: { es: 'Historia', en: 'History', fr: 'Histoire', ca: 'Història', eu: 'Historia' } },
    { id: 'food', icon: '🍷', label: { es: 'Gastro', en: 'Foodie', fr: 'Gastro', ca: 'Gastro', eu: 'Gastro' } },
    { id: 'art', icon: '🎨', label: { es: 'Arte', en: 'Art', fr: 'Art', ca: 'Art', eu: 'Artea' } },
    { id: 'photo', icon: '📸', label: { es: 'Foto', en: 'Photo', fr: 'Photo', ca: 'Foto', eu: 'Argazki' } },
    { id: 'nature', icon: '🌿', label: { es: 'Naturaleza', en: 'Nature', fr: 'Nature', ca: 'Natura', eu: 'Natura' } },
    { id: 'night', icon: '🌙', label: { es: 'Noche', en: 'Nightlife', fr: 'Nuit', ca: 'Nit', eu: 'Gaua' } },
];

const ONBOARDING_TEXT: any = {
    en: {
        step1Title: "Your AI Guide", step1Desc: "We create unique routes based on who you are and what you love.",
        step2Title: "Explore the World", step2Desc: "Every city in the world at your fingertips. AI translates culture for you.",
        step3Title: "Proof of Visit", step3Desc: "To earn miles, you must physically be at the spot. GPS verifies your achievement.",
        step4Title: "Digital Passport", step4Desc: "Collect stamps and climb the global explorer ranking.",
        skip: "Skip", next: "Next", start: "Get Started", selectLang: "Choose Language", selectInt: "Your Interests"
    },
    es: {
        step1Title: "Tu Guía IA", step1Desc: "Creamos rutas únicas basadas en quién eres y qué te gusta.",
        step2Title: "Explora el Mundo", step2Desc: "Todas las ciudades del mundo a tu alcance. La IA traduce la cultura para ti.",
        step3Title: "Prueba de Visita", step3Desc: "Para ganar millas debes estar físicamente en el sitio. El GPS verifica tu hazaña.",
        step4Title: "Pasaporte Digital", step4Desc: "Colecciona sellos reales y sube en el ranking global.",
        skip: "Saltar", next: "Siguiente", start: "Empezar", selectLang: "Elige Idioma", selectInt: "Tus Intereses"
    },
    ca: {
        step1Title: "La teva Guia IA", step1Desc: "Creem rutes úniques basades en qui ets i què t'agrada.",
        step2Title: "Explora el Món", step2Desc: "Totes les ciutats del món al teu abast. La IA tradueix la cultura per a tu.",
        step3Title: "Prova de Visita", step3Desc: "Per guanyar milles has d'estar físicament al lloc. El GPS verifica la teva gesta.",
        step4Title: "Passaport Digital", step4Desc: "Col·lecciona segells i puja en el rànquing global.",
        skip: "Saltar", next: "Següent", start: "Començar", selectLang: "Tria Idioma", selectInt: "Interessos"
    },
    eu: {
        step1Title: "Zure IA Gida", step1Desc: "Ibilbide bereziak sortzen ditugu nor zaren eta zer gustatzen zaizun kontuan hartuta.",
        step2Title: "Mundua Esploratu", step2Desc: "Munduko hiri guztiak zure esku. IA-k kultura itzultzen du zuretzat.",
        step3Title: "Bisita Egiaztapena", step3Desc: "Miliak irabazteko fisikoki lekuan egon behar duzu. GPSak zure lorpena egiaztatzen du.",
        step4Title: "Pasaporte Digitala", step4Desc: "Zigiluak bildu eta igo esploratzaileen rankingean.",
        skip: "Saltatu", next: "Hurrengoa", start: "Hasi", selectLang: "Hizkuntza Aukeratu", selectInt: "Zure Interesak"
    },
    fr: {
        step1Title: "Votre Guide IA", step1Desc: "Nous créons des itinéraires uniques basés sur qui vous êtes et ce que vous aimez.",
        step2Title: "Explorer le Monde", step2Desc: "Toutes les villes du monde à portée de main. L'IA traduit la culture pour vous.",
        step3Title: "Preuve de Visite", step3Desc: "Pour gagner des miles, vous devez être physiquement sur place. Le GPS vérifie votre exploit.",
        step4Title: "Passeport Numérique", step4Desc: "Gagnez des miles y collectionnez des tampons.",
        skip: "Passer", next: "Suivant", start: "Commencer", selectLang: "Choisir la Langue", selectInt: "Vos Interêts"
    }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language, onLanguageSelect }) => {
    const [step, setStep] = useState(0);
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
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 animate-fade-in font-sans overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none"></div>
            
            <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-xl relative z-10">
                {step === 0 && (
                    <div className="animate-slide-up text-center">
                        <h2 className="text-3xl font-black text-white mb-8">{t.selectLang}</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {LANGUAGES.map(lang => (
                                <button key={lang.code} onClick={() => onLanguageSelect(lang.code)} className={`py-4 rounded-2xl font-black transition-all border-2 flex items-center justify-center gap-2 ${language === lang.code ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/60'}`}>
                                    <span className="text-xs uppercase">{lang.name}</span>
                                    <FlagIcon code={lang.code} className="w-5" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="animate-slide-up text-center">
                        <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-purple-500/40">🏛️</div>
                        <h2 className="text-2xl font-black text-white mb-4">{t.step1Title}</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">{t.step1Desc}</p>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slide-up text-center">
                        <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-emerald-500/40">🌍</div>
                        <h2 className="text-2xl font-black text-white mb-4">{t.step2Title}</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">{t.step2Desc}</p>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-slide-up text-center">
                        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-red-500/40">📍</div>
                        <h2 className="text-2xl font-black text-white mb-4">{t.step3Title}</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">{t.step3Desc}</p>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-slide-up text-center">
                        <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-amber-500/40">🎟️</div>
                        <h2 className="text-2xl font-black text-white mb-4">{t.step4Title}</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">{t.step4Desc}</p>
                    </div>
                )}

                {step === 5 && (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white mb-6 text-center">{t.selectInt}</h2>
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {INTERESTS.map(int => (
                                <button key={int.id} onClick={() => toggleInterest(int.id)} className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${selectedInterests.includes(int.id) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                    <span className="text-2xl">{int.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{(int.label as any)[language]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-4 mt-8">
                    <button onClick={handleNext} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                        {step === 5 ? t.start : t.next}
                    </button>
                    {step < 5 && (
                        <button onClick={() => setStep(5)} className="text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors">
                            {t.skip}
                        </button>
                    )}
                </div>

                <div className="flex justify-center gap-1.5 mt-8">
                    {[0,1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-6 bg-purple-500' : 'w-2 bg-white/10'}`}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};
