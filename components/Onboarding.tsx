
import React from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const ONBOARDING_TEXT: any = {
    es: { title: "¡Bienvenido a bdai!", subtitle: "Tu Nueva Guía Inteligente", mainDesc: "Descubre el mundo con una guía inteligente, divertida y gratuita.", features: [{ icon: "fa-globe", title: "Gratis y para todos", desc: "Cualquier ciudad, siempre en tu idioma." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Guía única", desc: "Secretos fascinantes y mejores fotos." }, { icon: "fa-headphones", title: "Lee o escucha", desc: "Dai te narra la historia mientras caminas." }, { icon: "fa-trophy", title: "Millas y Ranking", desc: "Gana millas y sube en el ranking mundial." }], btnStart: "¡Empezar aventura!" },
    en: { title: "Welcome to bdai!", subtitle: "Your New Smart Guide", mainDesc: "Discover the world with a smart, fun, and free guide.", features: [{ icon: "fa-globe", title: "Free for everyone", desc: "Search any city in your language." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Unique Guide", desc: "Fascinating secrets and photo tips." }, { icon: "fa-headphones", title: "Read or Listen", desc: "Dai narrates history as you walk." }, { icon: "fa-trophy", title: "Miles & Ranking", desc: "Earn miles and climb the leaderboard." }], btnStart: "Start adventure!" },
    fr: { title: "Bienvenue sur bdai !", subtitle: "Votre nouveau guide intelligent", mainDesc: "Découvrez le monde avec un guide intelligent, ludique et gratuit.", features: [{ icon: "fa-globe", title: "Gratuit pour tous", desc: "Toutes les villes, dans votre langue." }, { icon: "fa-wand-magic-sparkles", title: "Dai : Guide unique", desc: "Secrets fascinants et conseils photo." }, { icon: "fa-headphones", title: "Lire ou écouter", desc: "Dai raconte l'histoire pendant votre marche." }, { icon: "fa-trophy", title: "Miles & Classement", desc: "Gagnez des miles et montez au classement." }], btnStart: "Commencer !" },
    de: { title: "Willkommen bei bdai!", subtitle: "Dein neuer smarter Guide", mainDesc: "Entdecke die Welt mit einem smarten, lustigen und kostenlosen Guide.", features: [{ icon: "fa-globe", title: "Gratis für alle", desc: "Jede Stadt, in deiner Sprache." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Einzigartiger Guide", desc: "Geheimnisse und Foto-Tipps." }, { icon: "fa-headphones", title: "Lesen oder Hören", desc: "Dai erzählt Geschichte beim Gehen." }, { icon: "fa-trophy", title: "Meilen & Ranking", desc: "Meilen sammeln und aufsteigen." }], btnStart: "Abenteuer starten!" },
    it: { title: "Benvenuto su bdai!", subtitle: "La tua nuova guida smart", mainDesc: "Scopri il mondo con una guida intelligente, divertente e gratuita.", features: [{ icon: "fa-globe", title: "Gratis per tutti", desc: "Ogni città, nella tua lingua." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Guida unica", desc: "Segreti e consigli per le foto." }, { icon: "fa-headphones", title: "Leggi o ascolta", desc: "Dai narra la storia mentre cammini." }, { icon: "fa-trophy", title: "Miglia & Classifica", desc: "Guadagna miglia e scala la classifica." }], btnStart: "Inizia ora!" },
    pt: { title: "Bem-vindo ao bdai!", subtitle: "O Teu Novo Guia Inteligente", mainDesc: "Descobre o mundo com um guia inteligente, divertido e gratuito.", features: [{ icon: "fa-globe", title: "Grátis para todos", desc: "Qualquer cidade no teu idioma." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Guia único", desc: "Segredos e dicas para fotos." }, { icon: "fa-headphones", title: "Lê ou ouve", desc: "A Dai narra a história ao caminhar." }, { icon: "fa-trophy", title: "Milhas e Ranking", desc: "Ganha milhas e sobe no ranking." }], btnStart: "Começar aventura!" },
    ro: { title: "Bun venit pe bdai!", subtitle: "Noul tău ghid inteligent", mainDesc: "Descoperă lumea cu un ghid inteligent, distractiv și gratuit.", features: [{ icon: "fa-globe", title: "Gratuit pentru toți", desc: "Orice oraș în limba ta." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Ghid unic", desc: "Secrete și sfaturi foto." }, { icon: "fa-headphones", title: "Citește sau ascultă", desc: "Dai povestește în timp ce mergi." }, { icon: "fa-trophy", title: "Mile & Clasament", desc: "Câștigă mile și urcă în clasament." }], btnStart: "Începe acum!" },
    zh: { title: "欢迎来到 bdai!", subtitle: "您的智能导游", mainDesc: "通过免费、智能且有趣的导游探索世界。", features: [{ icon: "fa-globe", title: "人人免费", desc: "支持全球城市及您的语言。" }, { icon: "fa-wand-magic-sparkles", title: "Dai: 独特导游", desc: "分享迷人秘密与拍照技巧。" }, { icon: "fa-headphones", title: "阅读或聆听", desc: "边走边听历史故事。" }, { icon: "fa-trophy", title: "里程与排名", desc: "赚取里程并提升排名。" }], btnStart: "开启冒险" },
    ja: { title: "bdaiへようこそ！", subtitle: "あなたの新しいスマートガイド", mainDesc: "スマートで楽しく無料のガイドと世界を探索しましょう。", features: [{ icon: "fa-globe", title: "誰でも無料", desc: "どの都市でも、あなたの言語で。" }, { icon: "fa-wand-magic-sparkles", title: "Dai：独自のガイド", desc: "魅力的な秘密と写真のコツ。" }, { icon: "fa-headphones", title: "読むか聞くか", desc: "歩きながら歴史を聞けます。" }, { icon: "fa-trophy", title: "マイルとランク", desc: "マイルを貯めてランクアップ。" }], btnStart: "冒険を始める" },
    ru: { title: "Добро пожаловать в bdai!", subtitle: "Ваш умный гид", mainDesc: "Откройте мир с умным и бесплатным путеводителем.", features: [{ icon: "fa-globe", title: "Бесплатно для всех", desc: "Любой город на вашем языке." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Уникальный гид", desc: "Секреты и советы для фото." }, { icon: "fa-headphones", title: "Читать или слушать", desc: "Dai рассказывает истории в пути." }, { icon: "fa-trophy", title: "Мили и рейтинг", desc: "Копите мили и растите в рейтинге." }], btnStart: "Начать приключение" },
    ar: { title: "مرحباً بك في bdai!", subtitle: "دليلك الذكي الجديد", mainDesc: "اكتشف العالم مع دليل ذكي وممتع ومجاني.", features: [{ icon: "fa-globe", title: "مجاني للجميع", desc: "أي مدينة، دائماً بلغتك." }, { icon: "fa-wand-magic-sparkles", title: "Dai: دليل فريد", desc: "أسرار رائعة ونصائح للتصوير." }, { icon: "fa-headphones", title: "اقرأ أو استمع", desc: "Dai يسرد لك التاريخ أثناء المشي." }, { icon: "fa-trophy", title: "أميال وتصنيف", desc: "اكسب الأميال وارتقِ في التصنيف." }], btnStart: "ابدأ المغامرة" },
    hi: { title: "bdai में आपका स्वागत है!", subtitle: "आपका नया स्मार्ट गाइड", mainDesc: "स्मार्ट और मुफ़्त गाइड के साथ दुनिया की खोज करें।", features: [{ icon: "fa-globe", title: "सभी के लिए मुफ़्त", desc: "कोई भी शहर, आपकी भाषा में।" }, { icon: "fa-wand-magic-sparkles", title: "दाई: अद्वितीय गाइड", desc: "रहस्य और बेहतरीन फोटो टिप्स।" }, { icon: "fa-headphones", title: "पढ़ें या सुनें", desc: "चलते-फिरते इतिहास सुनें।" }, { icon: "fa-trophy", title: "मील और रैंकिंग", desc: "मील कमाएं और ऊपर चढ़ें।" }], btnStart: "शुरू करें" },
    ko: { title: "bdai에 오신 것을 환영합니다!", subtitle: "새로운 스마트 가이드", mainDesc: "스마트하고 재미있는 무료 가이드와 세계를 탐험하세요.", features: [{ icon: "fa-globe", title: "모두에게 무료", desc: "모든 도시를 모국어로." }, { icon: "fa-wand-magic-sparkles", title: "Dai: 특별한 가이드", desc: "흥미로운 비밀과 사진 팁." }, { icon: "fa-headphones", title: "읽기 또는 듣기", desc: "걸으면서 역사를 들으세요." }, { icon: "fa-trophy", title: "마일리지 & 랭킹", desc: "마일리지를 쌓고 순위를 높이세요." }], btnStart: "모험 시작" },
    tr: { title: "bdai'ye Hoş Geldiniz!", subtitle: "Yeni Akıllı Rehberiniz", mainDesc: "Akıllı ve ücretsiz bir rehberle dünyayı keşfedin.", features: [{ icon: "fa-globe", title: "Herkes için Ücretsiz", desc: "Her şehir kendi dilinizde." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Eşsiz Rehber", desc: "Sırlar ve fotoğraf ipuçları." }, { icon: "fa-headphones", title: "Oku veya Dinle", desc: "Yürürken tarihi dinleyin." }, { icon: "fa-trophy", title: "Mil & Sıralama", desc: "Mil kazanın ve yükselin." }], btnStart: "Maceraya Başla" },
    pl: { title: "Witaj w bdai!", subtitle: "Twój nowy inteligentny przewodnik", mainDesc: "Odkrywaj świat z darmowym i zabawnym przewodnikiem.", features: [{ icon: "fa-globe", title: "Darmowy dla wszystkich", desc: "Każde miasto w Twoim języku." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Wyjątkowy przewodnik", desc: "Sekrety i porady fotograficzne." }, { icon: "fa-headphones", title: "Czytaj lub słuchaj", desc: "Dai opowiada historię podczas spaceru." }, { icon: "fa-trophy", title: "Mile i ranking", desc: "Zbieraj mile i awansuj." }], btnStart: "Zacznij przygodę" },
    nl: { title: "Welkom bij bdai!", subtitle: "Jouw nieuwe slimme gids", mainDesc: "Ontdek de wereld met een slimme en gratis gids.", features: [{ icon: "fa-globe", title: "Gratis voor iedereen", desc: "Elke stad in jouw taal." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Unieke gids", desc: "Geheimen en fototips." }, { icon: "fa-headphones", title: "Lezen of luisteren", desc: "Dai vertelt tijdens het wandelen." }, { icon: "fa-trophy", title: "Miles & Ranking", desc: "Verdien miles en stijg." }], btnStart: "Start nu" },
    ca: { title: "Benvingut a bdai!", subtitle: "La teva nova guia intel·ligent", mainDesc: "Descobreix el món amb una guia intel·ligent i gratuïta.", features: [{ icon: "fa-globe", title: "Gratis i per a tots", desc: "Qualsevol ciutat en el teu idioma." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Guia única", desc: "Secrets i millors fotos." }, { icon: "fa-headphones", title: "Llegeix o escolta", desc: "La Dai t'ho explica mentre camines." }, { icon: "fa-trophy", title: "Milles i Rànquing", desc: "Guanya milles i puja de nivell." }], btnStart: "Comença ara!" },
    eu: { title: "Ongi etorri bdai-ra!", subtitle: "Zure gida adimentsu berria", mainDesc: "Ezagutu mundua gida adimentsu eta doako batekin.", features: [{ icon: "fa-globe", title: "Doan denontzat", desc: "Edozein hiri zure hizkuntzan." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Gida berezia", desc: "Sekretuak eta argazki aholkuak." }, { icon: "fa-headphones", title: "Irakurri edo entzun", desc: "Daik historia kontatzen dizu." }, { icon: "fa-trophy", title: "Miliak eta Sailkapena", desc: "Irabazi miliak eta igo mailaz." }], btnStart: "Hasi abentura!" },
    vi: { title: "Chào mừng đến với bdai!", subtitle: "Hướng dẫn viên thông minh mới", mainDesc: "Khám phá thế giới với hướng dẫn viên miễn phí.", features: [{ icon: "fa-globe", title: "Miễn phí cho mọi người", desc: "Mọi thành phố theo ngôn ngữ của bạn." }, { icon: "fa-wand-magic-sparkles", title: "Dai: Hướng dẫn duy nhất", desc: "Bí mật và mẹo chụp ảnh." }, { icon: "fa-headphones", title: "Đọc hoặc nghe", desc: "Dai kể chuyện khi bạn đi bộ." }, { icon: "fa-trophy", title: "Dặm & Xếp hạng", desc: "Tích dặm và thăng hạng." }], btnStart: "Bắt đầu ngay" },
    th: { title: "ยินดีต้อนรับสู่ bdai!", subtitle: "ไกด์อัจฉริยะคนใหม่ของคุณ", mainDesc: "สำรวจโลกด้วยไกด์อัจฉริยะที่สนุกและฟรี", features: [{ icon: "fa-globe", title: "ฟรีสำหรับทุกคน", desc: "ทุกเมืองในภาษาของคุณ" }, { icon: "fa-wand-magic-sparkles", title: "Dai: ไกด์ที่ไม่เหมือนใคร", desc: "ความลับและเคล็ดลับการถ่ายภาพ" }, { icon: "fa-headphones", title: "อ่านหรือฟัง", desc: "Dai เล่าประวัติศาสตร์ขณะคุณเดิน" }, { icon: "fa-trophy", title: "ไมล์และอันดับ", desc: "สะสมไมล์และเลื่อนอันดับ" }], btnStart: "เริ่มการผจญภัย" }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
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
