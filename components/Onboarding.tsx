
import React, { useState } from 'react';
import { LANGUAGES, INTEREST_OPTIONS } from '../types';
import { FlagIcon } from './FlagIcon';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: (interests: string[]) => void;
    language: string;
    onLanguageSelect: (lang: string) => void;
}

const ONBOARDING_TEXT: any = {
    en: {
        step0Title: "Choose Language",
        stepDaiTitle: "Hello, I'm Dai", stepDaiDesc: "I am the AI voice of bdai. I'll be your personal expert, guide, and companion on every journey.",
        step1Title: "AI-Powered Intelligence", step1Desc: "I create unique routes based on who you are and what you love.",
        step2Title: "Explore the World", step2Desc: "Every city in the world at your fingertips. I translate culture for you.",
        step3Title: "Proof of Visit", step3Desc: "To earn miles, you must physically be at the spot. GPS verifies your achievement.",
        step4Title: "Digital Passport", step4Desc: "Collect stamps and climb the global explorer ranking.",
        skip: "Skip", next: "Next", start: "Get Started", selectInt: "Your Interests"
    },
    es: {
        step0Title: "Elige Idioma",
        stepDaiTitle: "Hola, soy Dai", stepDaiDesc: "Soy la inteligencia que vive en bdai. Seré tu guía personal, experta y compañera en cada aventura.",
        step1Title: "Tu Guía IA", step1Desc: "Creo rutas únicas basadas en quién eres y qué te gusta, sin guiones aburridos.",
        step2Title: "Explora el Mundo", step2Desc: "Todas las ciudades del mundo a tu alcance. Traduzco la cultura local para ti.",
        step3Title: "Prueba de Visita", step3Desc: "Para ganar millas debes estar físicamente en el sitio. El GPS verifica tu hazaña.",
        step4Title: "Pasaporte Digital", step4Desc: "Colecciona sellos reales y sube en el ranking global de exploradores.",
        skip: "Saltar", next: "Siguiente", start: "Empezar", selectInt: "Tus Intereses"
    },
    ca: {
        step0Title: "Tria Idioma",
        stepDaiTitle: "Hola, sóc la Dai", stepDaiDesc: "Sóc la intel·ligència que viu a bdai. Seré la teva guia personal, experta i companya en cada aventura.",
        step1Title: "La teva Guia IA", step1Desc: "Creo rutes úniques basades en qui ets i què t'agrada, sense guions avorrits.",
        step2Title: "Explora el Món", step2Desc: "Totes les ciutats del món al teu abast. Tradueixo la cultura local per a tu.",
        step3Title: "Prova de Visita", step3Desc: "Per guanyar milles has d'estar físicament al lloc. El GPS verifica la teva gesta.",
        step4Title: "Passaport Digital", step4Desc: "Col·lecciona segells reals i puja en el rànquing global d'exploradors.",
        skip: "Saltar", next: "Següent", start: "Començar", selectInt: "Els teus Interessos"
    },
    eu: {
        step0Title: "Hizkuntza Aukeratu",
        stepDaiTitle: "Kaixo, Dai naiz", stepDaiDesc: "bdai-n bizi den adimena naiz. Zure gida pertsonala, aditua eta laguna izango naiz abentura bakoitzean.",
        step1Title: "Zure AI Gida", step1Desc: "Ibilbide bereziak sortzen ditut nor zaren eta zer gustatzen zaizun kontuan hartuta.",
        step2Title: "Mundua Esploratu", step2Desc: "Munduko hiri guztiak zure esku. Tokiko kultura itzultzen dut zurezat.",
        step3Title: "Bisita Egiaztagiria", step3Desc: "Miliak irabazteko gunean egon behar duzu fisikoki. GPSak zure ekintza egiaztatzen du.",
        step4Title: "Pasaporte Digitala", step4Desc: "Bildu benetako zigiluak eta igo esploratzaileen munduko sailkapenean.",
        skip: "Saltatu", next: "Hurrengoa", start: "Hasi", selectInt: "Zure Interesak"
    },
    fr: {
        step0Title: "Choisir la Langue",
        stepDaiTitle: "Bonjour, je suis Dai", stepDaiDesc: "Je suis l'intelligence qui vit dans bdai. Je serai votre guide personnel, experte et compagne dans chaque aventure.",
        step1Title: "Votre Guide IA", step1Desc: "Je crée des itinéraires uniques basés sur qui vous êtes et ce que vous aimez.",
        step2Title: "Explorez le Monde", step2Desc: "Toutes les villes du monde à votre portée. Je traduis la culture locale pour vous.",
        step3Title: "Preuve de Visite", step3Desc: "Pour gagner des miles, vous devez être physiquement sur place. Le GPS vérifie votre exploit.",
        step4Title: "Passeport Numérique", step4Desc: "Collectionnez de vrais tampons et grimpez dans le classement mondial des explorateurs.",
        skip: "Passer", next: "Suivant", start: "Commencer", selectInt: "Vos Intérêts"
    },
    de: {
        step0Title: "Sprache wählen",
        stepDaiTitle: "Hallo, ich bin Dai", stepDaiDesc: "Ich bin die KI-Stimme von bdai. Ich werde dein persönlicher Experte, Führer und Begleiter auf jeder Reise sein.",
        step1Title: "KI-gestützte Intelligenz", step1Desc: "Ich erstelle einzigartige Routen basierend darauf, wer du bist und was du liebst.",
        step2Title: "Die Welt erkunden", step2Desc: "Alle Städte der Welt in deiner Hand. Ich übersetze Kultur für dich.",
        step3Title: "Besuchsnachweis", step3Desc: "Um Meilen zu sammeln, musst du physisch vor Ort sein. GPS verifiziert deinen Erfolg.",
        step4Title: "Digitaler Reisepass", step4Desc: "Sammle Stempel und steige im globalen Entdecker-Ranking auf.",
        skip: "Überspringen", next: "Weiter", start: "Loslegen", selectInt: "Deine Interessen"
    },
    ja: {
        step0Title: "言語を選択",
        stepDaiTitle: "こんにちは、Daiです", stepDaiDesc: "私はbdaiのAIボイスです。あらゆる旅であなたの専属エキスパート、ガイド、パートナーになります。",
        step1Title: "AIパワード・インテリジェンス", step1Desc: "あなたの好みや個性に合わせた、ユニークなルートを作成します。",
        step2Title: "世界を探索", step2Desc: "世界中の都市があなたの手の中に。現地の文化をあなたのために翻訳します。",
        step3Title: "訪問の証明", step3Desc: "マイルを獲得するには、実際にその場所にいる必要があります。GPSで実績を検証します。",
        step4Title: "デジタルパスポート", step4Desc: "スタンプを集めて、グローバル・エクスプローラー・ランキングを駆け上がりましょう。",
        skip: "スキップ", next: "次へ", start: "はじめる", selectInt: "興味のあること"
    },
    zh: {
        step0Title: "选择语言",
        stepDaiTitle: "你好，我是 Dai", stepDaiDesc: "我是 bdai 的 AI 声音。我将成为你在每次旅行中的私人专家、向导和伴侣。",
        step1Title: "AI 驱动的智能", step1Desc: "我根据你的身份和喜好创建独特的路线。",
        step2Title: "探索世界", step2Desc: "世界各地的城市触手及。我为你翻译文化。",
        step3Title: "访问证明", step3Desc: "要赚取里程，你必须亲身到达现场. GPS 会验证你的成就。",
        step4Title: "数字护照", step4Desc: "收集印章并提升全球探险家排名。",
        skip: "跳过", next: "下一步", start: "开始使用", selectInt: "你的兴趣"
    },
    ar: {
        step0Title: "اختر اللغة",
        stepDaiTitle: "مرحباً، أنا داي", stepDaiDesc: "أنا صوت الذكاء الاصطناعي في bdai. سأكون خبيرك الشخصي ودليلك ورفيقك في كل رحلة.",
        step1Title: "ذكاء مدعوم بالذكاء الاصطناعي", step1Desc: "أقوم بإنشاء مسارات فريدة بناءً على هويتك وما تحب.",
        step2Title: "استكشف العالم", step2Desc: "كل مدن العالم في متناول يدك. أقوم بترجمة الثقافة لك.",
        step3Title: "إثبات الزيارة", step3Desc: "لكسب الأميال، يجب أن تكون في الموقع فعلياً. يتحقق نظام GPS من إنجازك.",
        step4Title: "جواز السفر الرقمي", step4Desc: "اجمع الأختام وارتقِ في تصنيف المستكشفين العالمي.",
        skip: "تخطي", next: "التالي", start: "ابدأ الآن", selectInt: "اهتماماتك"
    }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language, onLanguageSelect }) => {
    const [step, setStep] = useState(0);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const t = ONBOARDING_TEXT[language || 'es'] || ONBOARDING_TEXT['es'];

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleLanguagePick = (code: string) => {
        onLanguageSelect(code);
        setStep(1); 
    };

    const handleNext = () => {
        if (step < 6) setStep(step + 1);
        else onComplete(selectedInterests);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in font-sans overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none"></div>
            
            <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative z-10 shadow-[0_0_80px_rgba(147,51,234,0.1)]">
                {step === 0 && (
                    <div className="animate-slide-up text-center">
                        <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tighter">{t.step0Title}</h2>
                        <div className="flex justify-start gap-6 overflow-x-auto no-scrollbar py-6 px-2">
                            {LANGUAGES.map(lang => (
                                <div key={lang.code} className="flex flex-col items-center gap-3 shrink-0">
                                    <button 
                                      onClick={() => handleLanguagePick(lang.code)} 
                                      className={`w-16 h-16 rounded-full transition-all border-4 ${language === lang.code ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/40' : 'border-white/10 opacity-30 grayscale'}`}
                                    >
                                        <FlagIcon code={lang.code} className="w-full h-full" />
                                    </button>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${language === lang.code ? 'text-purple-400' : 'text-slate-600'}`}>
                                        {lang.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="animate-slide-up text-center flex flex-col items-center">
                        <div className="w-16 h-16 mb-4 relative">
                            <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                            <div className="relative z-10 bg-slate-900 rounded-2xl w-full h-full flex items-center justify-center border border-purple-500 shadow-xl overflow-hidden">
                                <BdaiLogo className="w-10 h-10" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">{t.stepDaiTitle}</h2>
                        <p className="text-slate-300 text-xs leading-relaxed mb-6 italic">"{t.stepDaiDesc}"</p>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slide-up text-center">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl shadow-purple-500/40">🏛️</div>
                        <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tighter">{t.step1Title}</h2>
                        <p className="text-slate-400 text-xs leading-relaxed mb-6">{t.step1Desc}</p>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-slide-up text-center">
                        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl shadow-emerald-500/40">🌍</div>
                        <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tighter">{t.step2Title}</h2>
                        <p className="text-slate-400 text-xs leading-relaxed mb-6">{t.step2Desc}</p>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-slide-up text-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl shadow-red-500/40">📍</div>
                        <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tighter">{t.step3Title}</h2>
                        <p className="text-slate-400 text-xs leading-relaxed mb-6">{t.step3Desc}</p>
                    </div>
                )}

                {step === 5 && (
                    <div className="animate-slide-up text-center">
                        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl shadow-amber-500/40">🎟️</div>
                        <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tighter">{t.step4Title}</h2>
                        <p className="text-slate-400 text-xs leading-relaxed mb-6">{t.step4Desc}</p>
                    </div>
                )}

                {step === 6 && (
                    <div className="animate-slide-up">
                        <h2 className="text-xl font-black text-white mb-4 text-center uppercase tracking-tighter">{t.selectInt}</h2>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {INTEREST_OPTIONS.map(opt => (
                                <button key={opt.id} onClick={() => toggleInterest(opt.id)} className={`p-3 rounded-xl flex flex-col items-center gap-1 border-2 transition-all ${selectedInterests.includes(opt.id) ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                    <span className="text-xl">{opt.icon}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest">{(opt.label as any)[language || 'es'] || (opt.label as any)['es']}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3 mt-4">
                    {step > 0 && (
                        <button onClick={handleNext} className="w-full py-4 bg-white text-slate-950 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-2xl active:scale-95 transition-all">
                            {step === 6 ? t.start : t.next}
                        </button>
                    )}
                    {step > 0 && step < 6 && (
                        <button onClick={() => setStep(6)} className="text-slate-500 font-bold text-[9px] uppercase tracking-widest hover:text-white transition-colors">
                            {t.skip}
                        </button>
                    )}
                </div>

                <div className="flex justify-center gap-1.5 mt-6">
                    {[0,1,2,3,4,5,6].map(i => (
                        <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-5 bg-purple-500' : 'w-1.5 bg-white/10'}`}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};
