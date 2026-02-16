
import React from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const ONBOARDING_TEXT: any = {
    es: {
        title: "¡Bienvenido a bdai!",
        subtitle: "Tu Nueva Guía Inteligente",
        mainDesc: "Descubre el mundo con una guía inteligente, divertida y gratuita que te acompaña a cada paso. ¡Es el futuro de los tours!",
        features: [
            { icon: "fa-globe", title: "Gratis y para todos", desc: "Busca cualquier ciudad. Es totalmente gratis y siempre en tu idioma." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Guía única", desc: "Dai te cuenta secretos fascinantes y te da el mejor ángulo para tus fotos." },
            { icon: "fa-headphones", title: "Lee o escucha", desc: "Tú eliges el ritmo. Dai puede narrarte la historia mientras caminas." },
            { icon: "fa-trophy", title: "Millas y Ranking", desc: "Gana millas que podrás canjear pronto y sube en el ranking mundial." }
        ],
        btnStart: "¡Empezar mi aventura!"
    },
    en: {
        title: "Welcome to bdai!",
        subtitle: "Your New Smart Guide",
        mainDesc: "Discover the world with a smart, fun, and free guide at every step. This is the future of touring!",
        features: [
            { icon: "fa-globe", title: "Free for everyone", desc: "Search any city globally. It's completely free and in your language." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Unique Guide", desc: "Dai shares fascinating secrets and tips for the perfect photo." },
            { icon: "fa-headphones", title: "Read or Listen", desc: "You choose. Dai can narrate the history as you walk." },
            { icon: "fa-trophy", title: "Miles & Ranking", desc: "Earn miles to redeem soon and climb the global leaderboard." }
        ],
        btnStart: "Start my adventure!"
    },
    ro: {
        title: "Bun venit la bdai!",
        subtitle: "Noul tău Ghid Inteligent",
        mainDesc: "Descoperă lumea cu un ghid inteligent, distractiv și gratuit care te însoțește la fiecare pas.",
        features: [
            { icon: "fa-globe", title: "Gratuit pentru toți", desc: "Caută orice oraș. Este complet gratuit și mereu în limba ta." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Ghid unic", desc: "Dai îți spune secrete fascinante și îți oferă cel mai bun unghi pentru poze." },
            { icon: "fa-headphones", title: "Citește sau ascultă", desc: "Tu alegi ritmul. Dai îți poate povesti istoria în timp ce mergi." },
            { icon: "fa-trophy", title: "Mile și Clasament", desc: "Câștigă mile pe care le poți schimba curând și urcă în clasament." }
        ],
        btnStart: "Începe aventura!"
    },
    hi: {
        title: "bdai में आपका स्वागत है!",
        subtitle: "आपका नया स्मार्ट गाइड",
        mainDesc: "हर कदम पर एक स्मार्ट, मज़ेदार और मुफ़्त गाइड के साथ दुनिया की खोज करें।",
        features: [
            { icon: "fa-globe", title: "सभी के लिए मुफ़्त", desc: "किसी भी शहर को खोजें। यह मुफ़्त है और आपकी भाषा में है।" },
            { icon: "fa-wand-magic-sparkles", title: "दाई: अद्वितीय गाइड", desc: "दाई दिलचस्प रहस्य और बेहतरीन फोटो टिप्स साझा करती है।" },
            { icon: "fa-headphones", title: "पढ़ें या सुनें", desc: "आप गति चुनें। दाई चलते-फिरते इतिहास सुना सकती है।" },
            { icon: "fa-trophy", title: "मील और रैंकिंग", desc: "मील कमाएं और वैश्विक लीडरबोर्ड पर चढ़ें।" }
        ],
        btnStart: "साहसिक कार्य शुरू करें!"
    },
    ja: {
        title: "bdaiへようこそ！",
        subtitle: "あなたの新しいスマートガイド",
        mainDesc: "スマートで楽しく、無料のガイドと共に、一歩一歩世界を探索しましょう。",
        features: [
            { icon: "fa-globe", title: "誰でも無料", desc: "どの都市でも検索可能。完全に無料であなたの言語に対応。" },
            { icon: "fa-wand-magic-sparkles", title: "Dai：ユニークなガイド", desc: "魅力的な秘密や完璧な写真のためのヒントを共有。" },
            { icon: "fa-headphones", title: "読むか聞くか", desc: "自分のペースで。歩きながら歴史を聞くことができます。" },
            { icon: "fa-trophy", title: "マイルとランキング", desc: "マイルを貯めて、グローバルリーダーボードを駆け上がろう。" }
        ],
        btnStart: "冒険を始める"
    },
    zh: {
        title: "欢迎来到 bdai!",
        subtitle: "您的全新智能导游",
        mainDesc: "在每一步中，通过智能、有趣且免费的导游探索世界。这是旅游的未来！",
        features: [
            { icon: "fa-globe", title: "人人免费", desc: "全球搜索任何城市。完全免费，且支持您的语言。" },
            { icon: "fa-wand-magic-sparkles", title: "Dai: 独特的导游", desc: "Dai 分享迷人的秘密和完美照片的建议。" },
            { icon: "fa-headphones", title: "阅读或聆听", desc: "您选择节奏。Dai 可以在您步行时讲述历史。" },
            { icon: "fa-trophy", title: "里程与排名", desc: "赚取里程并攀登全球排行榜。" }
        ],
        btnStart: "开始我的冒险"
    },
    pt: {
        title: "Bem-vindo ao bdai!",
        subtitle: "O Teu Novo Guia Inteligente",
        mainDesc: "Descobre o mundo com um guia inteligente, divertido e gratuito que te acompanha a cada passo.",
        features: [
            { icon: "fa-globe", title: "Grátis para todos", desc: "Pesquisa qualquer cidade. É totalmente grátis e sempre no teu idioma." },
            { icon: "fa-wand-magic-sparkles", title: "Dai: Guia único", desc: "A Dai conta segredos fascinantes e dá-te o melhor ângulo para as fotos." },
            { icon: "fa-headphones", title: "Lê ou ouve", desc: "Tu escolhes o ritmo. A Dai pode narrar a história enquanto caminhas." },
            { icon: "fa-trophy", title: "Milhas e Ranking", desc: "Ganha milhas e sobe no ranking mundial." }
        ],
        btnStart: "Começar a minha aventura!"
    }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    // Forzamos la carga del idioma seleccionado o fallback a inglés
    const t = ONBOARDING_TEXT[language] || ONBOARDING_TEXT['en'] || ONBOARDING_TEXT['es'];

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617] flex flex-col items-center p-6 overflow-y-auto no-scrollbar animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-600/30 to-transparent"></div>
            
            <div className="w-full max-w-sm mt-12 flex flex-col items-center relative z-10">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[3.5rem] shadow-2xl backdrop-blur-xl w-full flex flex-col items-center">
                    <BdaiLogo className="w-16 h-16 mb-6 animate-pulse-logo" />
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center leading-tight">{t.title}</h2>
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.4em] mt-3 text-center">{t.subtitle}</p>
                    
                    <div className="w-full space-y-5 mt-10">
                        {t.features.map((f: any, i: number) => (
                            <div key={i} className="flex gap-4 items-center">
                                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                                    <i className={`fas ${f.icon} text-purple-500 text-sm`}></i>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-black uppercase text-[10px] tracking-widest mb-1">{f.title}</h4>
                                    <p className="text-slate-500 text-[9px] font-bold italic">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={onComplete} className="w-full mt-10 py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all">
                        {t.btnStart}
                    </button>
                </div>
            </div>
        </div>
    );
};
