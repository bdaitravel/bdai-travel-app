import React, { useState, useEffect } from 'react';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    const [step, setStep] = useState(0);

    // Translations for the Onboarding Steps
    const CONTENT: any = {
        en: {
            skip: "Skip",
            next: "Next",
            start: "Get Started",
            steps: [
                { title: "Your Personal Guide", desc: "Discover unique walking tours tailored specifically to your interests and location. Explore the city your way." },
                { title: "Level Up Your Travels", desc: "Collect miles for every landmark you visit. Build your traveler passport, earn badges, and climb the rankings." },
                { title: "Uncover Secrets", desc: "Get insider curiosity facts and local stories that standard guidebooks won't tell you." }
            ]
        },
        es: {
            skip: "Saltar",
            next: "Siguiente",
            start: "Empezar",
            steps: [
                { title: "Tu Guía Personal", desc: "Descubre rutas únicas a pie adaptadas específicamente a tus intereses y ubicación. Explora la ciudad a tu manera." },
                { title: "Sube de Nivel", desc: "Colecciona millas por cada monumento que visites. Construye tu pasaporte de viajero, gana insignias y sube en el ranking." },
                { title: "Descubre Secretos", desc: "Accede a datos curiosos de expertos e historias locales que las guías estándar no te cuentan." }
            ]
        },
        ca: {
            skip: "Saltar",
            next: "Següent",
            start: "Començar",
            steps: [
                { title: "La Teva Guia Personal", desc: "Descobreix rutes úniques a peu adaptades als teus interessos i ubicació. Explora la ciutat a la teva manera." },
                { title: "Puja de Nivell", desc: "Col·lecciona milles per cada monument que visitis. Construeix el teu passaport, guanya insígnies i puja al rànquing." },
                { title: "Descobreix Secrets", desc: "Accedeix a dades curioses d'experts i històries locals que les guies estàndard no t'expliquen." }
            ]
        },
        eu: {
            skip: "Saltatu",
            next: "Hurrengoa",
            start: "Hasi",
            steps: [
                { title: "Zure Gida Pertsonala", desc: "Ezagutu oinezko ibilbide bakarrak zure interesetara eta kokapenera egokituta. Esploratu hiria zure erara." },
                { title: "Mailaz Igo", desc: "Irabazi miliak bisitatzen duzun puntu bakoitzeko. Osatu zure pasaportea, lortu dominak eta igo sailkapenean." },
                { title: "Sekretuak Desestaldu", desc: "Lortu gida estandarretan agertzen ez diren datu bitxiak eta tokiko istorioak." }
            ]
        },
        // Fallback for others to English
        fr: { skip: "Passer", next: "Suivant", start: "Commencer", steps: [{ title: "Votre Guide Personnel", desc: "Découvrez des visites à pied uniques." }, { title: "Montez de Niveau", desc: "Gagnez des miles et des badges." }, { title: "Découvrez des Secrets", desc: "Obtenez des faits curieux locaux." }] },
        de: { skip: "Überspringen", next: "Weiter", start: "Starten", steps: [{ title: "Dein Persönlicher Guide", desc: "Entdecke einzigartige Touren." }, { title: "Level Up", desc: "Sammle Meilen und Abzeichen." }, { title: "Geheimnisse", desc: "Erfahre lokale Kuriositäten." }] },
        ar: { 
            skip: "تخطي", 
            next: "التالي", 
            start: "ابدأ", 
            steps: [
                { title: "دليلك الشخصي", desc: "اكتشف جولات مشي فريدة مصممة خصيصاً لاهتماماتك وموقعك." }, 
                { title: "ارتقِ بسفرك", desc: "اجمع الأميال لكل معلم تزوره. ابنِ جواز سفرك واربح الشارات." }, 
                { title: "اكتشف الأسرار", desc: "احصل على حقائق وقصص محلية لن تخبرك بها الأدلة القياسية." }
            ] 
        },
        pt: { 
            skip: "Pular", 
            next: "Próximo", 
            start: "Começar", 
            steps: [
                { title: "Seu Guia Pessoal", desc: "Descubra passeios a pé únicos adaptados especificamente aos seus interesses e localização." }, 
                { title: "Suba de Nível", desc: "Ganhe milhas por cada ponto turístico que visitar. Construa o seu passaporte de viajante." }, 
                { title: "Descubra Segredos", desc: "Obtenha factos curiosos e histórias locais que os guias padrão não contam." }
            ] 
        },
        zh: { 
            skip: "跳过", 
            next: "下一步", 
            start: "开始", 
            steps: [
                { title: "您的私人向导", desc: "发现为您量身定制的独特徒步旅行。按您的方式探索城市。" }, 
                { title: "升级您的旅行", desc: "访问地标赚取里程。建立您的旅行护照，赢取徽章并提升排名。" }, 
                { title: "揭开秘密", desc: "获取标准指南不会告诉您的当地趣闻和内幕故事。" }
            ] 
        },
        ja: { 
            skip: "スキップ", 
            next: "次へ", 
            start: "スタート", 
            steps: [
                { title: "あなたのパーソナルガイド", desc: "あなたの興味や場所に合わせたユニークなウォーキングツアーを発見しましょう。" }, 
                { title: "旅をレベルアップ", desc: "ランドマークを訪れるたびにマイルを獲得。パスポートを作成し、ランクを上げましょう。" }, 
                { title: "秘密を発見", desc: "ガイドブックには載っていない地元の秘密や興味深い事実を知ることができます。" }
            ] 
        }
    };

    // Select content based on language, fallback to English
    const currentText = CONTENT[language] || CONTENT['en'];
    // If specific language misses steps (like FR/IT/DE brief fallback), merge or ensure structure
    const steps = currentText.steps || CONTENT['en'].steps;

    const ICONS = [
        { icon: "fa-map-marked-alt", color: "text-purple-600", bg: "bg-purple-50" },
        { icon: "fa-passport", color: "text-yellow-500", bg: "bg-yellow-50" },
        { icon: "fa-user-secret", color: "text-indigo-600", bg: "bg-indigo-50" }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in font-sans">
            {/* Background Decor */}
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
                {/* Skip Button */}
                <button 
                    onClick={onComplete}
                    className="absolute top-6 right-6 text-white/90 font-bold text-sm hover:text-white transition-colors z-20"
                >
                    {currentText.skip}
                </button>

                {/* Main Content Card */}
                <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full text-center border border-slate-100 flex flex-col items-center min-h-[400px]">
                    <div className={`w-24 h-24 rounded-full ${ICONS[step].bg} ${ICONS[step].color} flex items-center justify-center text-4xl mb-8 shadow-inner transition-colors duration-500`}>
                        <i className={`fas ${ICONS[step].icon}`}></i>
                    </div>
                    
                    <h2 className="text-3xl font-black text-slate-900 mb-4 transition-all duration-300 leading-tight">
                        {steps[step].title}
                    </h2>
                    <p className="text-slate-500 leading-relaxed text-lg mb-8 transition-all duration-300">
                        {steps[step].desc}
                    </p>

                    <div className="mt-auto w-full">
                         {/* Dots */}
                        <div className="flex justify-center gap-2 mb-8">
                            {steps.map((_: any, i: number) => (
                                <div 
                                    key={i} 
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-slate-900' : 'bg-slate-300'}`}
                                ></div>
                            ))}
                        </div>

                        <button 
                            onClick={handleNext}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg flex items-center justify-center gap-2"
                        >
                            {step === steps.length - 1 ? currentText.start : currentText.next}
                            {step !== steps.length - 1 && <i className="fas fa-arrow-right"></i>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};