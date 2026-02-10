
import React from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const CONTENT: any = {
    es: { 
        title: "bienvenido a bdai", 
        subtitle: "tours globales gratuitos y a tu ritmo",
        intro: "Explora el mundo con la profundidad de un experto local, sin horarios y totalmente gratis gracias a nuestra inteligencia artificial.",
        btnStart: "inicia tu experiencia",
        features: [
            { title: "Tours Gratis e Ilimitados", desc: "Cualquier ciudad del mundo está a tu alcance. Generamos masterclasses técnicas al instante.", icon: "fa-globe" },
            { title: "Dai: Tu Guía con IA", desc: "Secretos técnicos, historia pura e ingeniería. Recibe el 'Dai Shot' para la foto perfecta.", icon: "fa-wand-magic-sparkles" },
            { title: "Lectura, Audio y GPS", desc: "Tú eliges el ritmo. Lee, escucha el audio de Dai o sigue la ruta exacta con nuestro mapa interactivo.", icon: "fa-location-dot" },
            { title: "Millas y Rango", desc: "Cada paso cuenta. Gana millas, sube en el ranking global y desbloquea insignias exclusivas.", icon: "fa-trophy" },
            { title: "Pasaporte Digital", desc: "Tus viajes se quedan contigo. Cada ciudad completada te da un visado oficial en tu perfil.", icon: "fa-passport" }
        ],
        footer: "proximamente: marketplace bdai, la ecommerce del viajero."
    },
    en: { 
        title: "welcome to bdai", 
        subtitle: "free global tours at your own pace",
        intro: "Explore the world with the depth of a local expert, with no schedules and completely free through our AI.",
        btnStart: "start your experience",
        features: [
            { title: "Free & Unlimited Tours", desc: "Every city in the world at your fingertips. High-quality masterclasses generated instantly.", icon: "fa-globe" },
            { title: "Dai: Your AI Guide", desc: "Technical secrets, pure history, and engineering. Get the 'Dai Shot' for the perfect photo.", icon: "fa-wand-magic-sparkles" },
            { title: "Read, Listen & GPS", desc: "Your pace, your choice. Read secrets, listen to audio guides, or follow the precise GPS route.", icon: "fa-location-dot" },
            { title: "Miles & Ranking", desc: "Every step counts. Earn miles, climb global rankings, and unlock exclusive badges.", icon: "fa-trophy" },
            { title: "Digital Passport", desc: "Your travels stay with you. Get official visas for every city you complete.", icon: "fa-passport" }
        ],
        footer: "coming soon: bdai marketplace, the traveler's ecommerce."
    },
    zh: { 
        title: "欢迎来到 bdai", 
        subtitle: "免费全球旅游，按您的节奏进行",
        intro: "借助我们的人工智能，您可以像当地专家一样深入探索世界，无需预约，完全免费。",
        btnStart: "开启体验",
        features: [
            { title: "免费无限旅游", desc: "全球任何城市触手可及。即时生成技术级大师课。", icon: "fa-globe" },
            { title: "Dai：AI 导游", desc: "技术秘密、纯粹历史与工程学。获取“Dai Shot”拍出完美照片。", icon: "fa-wand-magic-sparkles" },
            { title: "阅读、语音与 GPS", desc: "节奏由您掌握。阅读、听取语音导览或跟随 GPS 地图。", icon: "fa-location-dot" },
            { title: "里程与等级", desc: "每一步都有价值。赚取里程，提升全球排名，解锁独家徽章。", icon: "fa-trophy" },
            { title: "数字护照", desc: "您的旅程将永远伴随您。完成每个城市都会在您的资料中获得正式签证。", icon: "fa-passport" }
        ],
        footer: "即将推出：bdai 市场，旅行者的电子商务。"
    },
    ca: { 
        title: "benvingut a bdai", 
        subtitle: "tours globals gratuïts i al teu ritme",
        intro: "Explora el món amb la profunditat d'un expert local, sense horaris i totalment gratis gràcies a la nostra intel·ligència artificial.",
        btnStart: "inicia la teva experiència",
        features: [
            { title: "Tours Gratis i Il·limitats", desc: "Qualsevol ciutat del món al teu abast. Generem masterclasses tècniques a l'instant.", icon: "fa-globe" },
            { title: "Dai: El teu Guia amb IA", desc: "Secrets tècnics, història pura i enginyeria. Rep el 'Dai Shot' per a la foto perfecta.", icon: "fa-wand-magic-sparkles" },
            { title: "Lectura, Àudio i GPS", desc: "Tu tries el ritme. Llegeix, escolta l'àudio d'en Dai o segueix la ruta amb el mapa interactiu.", icon: "fa-location-dot" },
            { title: "Milles i Rang", desc: "Cada pas compta. Guanya milles, puja en el rànquing global i desbloqueja insígnies.", icon: "fa-trophy" },
            { title: "Passaport Digital", desc: "Els teus viatges es queden amb tu. Cada ciutat completada et dóna un visat oficial al perfil.", icon: "fa-passport" }
        ],
        footer: "properament: marketplace bdai, l'ecommerce del viatger."
    },
    eu: { 
        title: "ongi etorri bdai-ra", 
        subtitle: "doako tour globalak zure erritmoan",
        intro: "Esploratu mundua tokiko aditu baten sakontasunarekin, ordutegirik gabe eta doan gure adimen artifizialari esker.",
        btnStart: "hasi zure esperientzia",
        features: [
            { title: "Doako Tour Mugagabeak", desc: "Munduko edozein hiri zure esku. Masterclass teknikoak berehala sortzen ditugu.", icon: "fa-globe" },
            { title: "Dai: Zure IA Gida", desc: "Sekretu teknikoak, historia hutsa eta ingeniaritza. Jaso 'Dai Shot'-a argazki perfekturako.", icon: "fa-wand-magic-sparkles" },
            { title: "Irakurketa, Audioa eta GPS", desc: "Zuk aukeratu ritmoa. Irakurri, entzun Dai-ren audioa edo jarraitu mapa interaktiboa.", icon: "fa-location-dot" },
            { title: "Miliak eta Maila", desc: "Urrats bakoitzak balio du. Irabazi miliak, igo sailkapenean eta desblokeatu bereizgarriak.", icon: "fa-trophy" },
            { title: "Pasaporte Digitala", desc: "Zure bidaiak zurekin geratzen dira. Osatutako hiri bakoitzak bisa ofiziala ematen dizu.", icon: "fa-passport" }
        ],
        footer: "laster: bdai marketplace, bidaiariaren ecommerce-a."
    },
    pt: { 
        title: "bem-vindo ao bdai", 
        subtitle: "tours globais gratuitos e no seu ritmo",
        intro: "Explore o mundo com a profundidade de um especialista local, sem horários e totalmente grátis graças à nossa inteligência artificial.",
        btnStart: "inicie sua experiência",
        features: [
            { title: "Tours Grátis e Ilimitados", desc: "Qualquer cidade do mundo ao seu alcance. Geramos masterclasses técnicas instantaneamente.", icon: "fa-globe" },
            { title: "Dai: Seu Guia com IA", desc: "Segredos técnicos, história pura e engenharia. Receba o 'Dai Shot' para a foto perfeita.", icon: "fa-wand-magic-sparkles" },
            { title: "Leitura, Áudio e GPS", desc: "Você escolhe o ritmo. Leia, ouça o áudio do Dai ou siga a rota com o mapa interativo.", icon: "fa-location-dot" },
            { title: "Milhas e Ranking", desc: "Cada passo conta. Ganhe milhas, suba no ranking global e desbloqueie insígnias.", icon: "fa-trophy" },
            { title: "Passaporte Digital", desc: "Suas viagens ficam com você. Cada cidade concluída dá um visto oficial no perfil.", icon: "fa-passport" }
        ],
        footer: "em breve: marketplace bdai, o ecommerce do viajante."
    },
    fr: { 
        title: "bienvenue sur bdai", 
        subtitle: "tours mondiaux gratuits et à votre rythme",
        intro: "Explorez le monde avec la profondeur d'un expert local, sans horaires et totalement gratuit grâce à notre intelligence artificielle.",
        btnStart: "commencez votre expérience",
        features: [
            { title: "Tours Gratuits & Illimités", desc: "N'importe quelle ville du monde à votre portée. Masterclasses techniques instantanées.", icon: "fa-globe" },
            { title: "Dai : Votre Guide IA", desc: "Secrets techniques, histoire pure et ingénierie. Recevez le 'Dai Shot' pour la photo parfaite.", icon: "fa-wand-magic-sparkles" },
            { title: "Lecture, Audio & GPS", desc: "Choisissez votre rythme. Lisez, écoutez Dai ou suivez la route avec la carte interactive.", icon: "fa-location-dot" },
            { title: "Miles & Classement", desc: "Chaque pas compte. Gagnez des miles, montez au classement et débloquez des badges.", icon: "fa-trophy" },
            { title: "Passeport Digital", desc: "Vos voyages restent avec vous. Chaque ville complétée vous donne un visa officiel.", icon: "fa-passport" }
        ],
        footer: "bientôt : marketplace bdai, l'e-commerce du voyageur."
    },
    de: { 
        title: "willkommen bei bdai", 
        subtitle: "kostenlose globale touren in ihrem tempo",
        intro: "Entdecken Sie die Welt mit der Tiefe eines lokalen Experten, ohne Zeitplan und völlig kostenlos dank unserer KI.",
        btnStart: "erlebnis starten",
        features: [
            { title: "Kostenlose Touren", desc: "Jede Stadt der Welt zum Greifen nah. Sofortige technische Masterclasses.", icon: "fa-globe" },
            { title: "Dai: Ihr KI-Guide", desc: "Technische Geheimnisse, pure Geschichte. Holen Sie sich den 'Dai Shot' für das perfekte Foto.", icon: "fa-wand-magic-sparkles" },
            { title: "Lesen, Audio & GPS", desc: "Sie bestimmen das Tempo. Lesen, hören oder folgen Sie der Route auf der Karte.", icon: "fa-location-dot" },
            { title: "Meilen & Ranking", desc: "Jeder Schritt zählt. Sammeln Sie Meilen, steigen Sie im Ranking und schalten Sie Badges frei.", icon: "fa-trophy" },
            { title: "Digitaler Pass", desc: "Ihre Reisen bleiben bei Ihnen. Jede Stadt bringt Ihnen ein offizielles Visum im Profil.", icon: "fa-passport" }
        ],
        footer: "demnächst: bdai marketplace, der e-commerce für reisende."
    },
    it: { 
        title: "benvenuto su bdai", 
        subtitle: "tour mondiali gratuiti e al tuo ritmo",
        intro: "Esplora il mondo con la profondità di un esperto locale, senza orari e totalmente gratis grazie alla nostra intelligenza artificiale.",
        btnStart: "inizia l'esperienza",
        features: [
            { title: "Tour Gratuiti e Illimitati", desc: "Qualsiasi città del mondo a portata di mano. Masterclass tecniche istantanee.", icon: "fa-globe" },
            { title: "Dai: La tua Guida IA", desc: "Segreti tecnici, storia pura e ingegneria. Ricevi il 'Dai Shot' per la foto perfetta.", icon: "fa-wand-magic-sparkles" },
            { title: "Lettura, Audio e GPS", desc: "Scegli tu il ritmo. Leggi, ascolta l'audio di Dai o segui la mappa interattiva.", icon: "fa-location-dot" },
            { title: "Miglia e Classifica", desc: "Ogni passo conta. Guadagna miglia, scala la classifica e sblocca i badge.", icon: "fa-trophy" },
            { title: "Passaporto Digitale", desc: "I tuoi viaggi restano con te. Ogni città completata ti dà un visto ufficiale.", icon: "fa-passport" }
        ],
        footer: "prossimamente: marketplace bdai, l'ecommerce del viaggiatore."
    },
    ja: { 
        title: "bdaiへようこそ", 
        subtitle: "あなたのペースで楽しめる無料の世界ツアー",
        intro: "AIのおかげで、地元の専門家のような深い洞察を持って、スケジュールなしで完全に無料で世界を探索できます。",
        btnStart: "体験を始める",
        features: [
            { title: "無料・無制限ツアー", desc: "世界中のあらゆる都市があなたの手の中に。テクニカルなマスタークラスを即座に生成。", icon: "fa-globe" },
            { title: "Dai：AIガイド", desc: "技術の秘密、純粋な歴史、工学。完璧な写真のための「Dai Shot」を受け取る。", icon: "fa-wand-magic-sparkles" },
            { title: "読書、音声、GPS", desc: "ペースはあなた次第。読む、Daiの音声を聞く、または地図でルートを追う。", icon: "fa-location-dot" },
            { title: "マイルとランク", desc: "一歩一歩が大切。マイルを稼ぎ、世界ランキングを上げ、限定バッジを解除。", icon: "fa-trophy" },
            { title: "デジタルパスポート", desc: "旅の記録はあなたのもの。都市を完了するごとに公式ビザがプロフィールに付与。", icon: "fa-passport" }
        ],
        footer: "近日公開：bdaiマーケットプレイス、旅行者のためのeコマース。"
    },
    ru: { 
        title: "добро пожаловать в bdai", 
        subtitle: "бесплатные туры по миру в вашем темпе",
        intro: "Исследуйте мир с глубиной местного эксперта, без расписаний и совершенно бесплатно благодаря нашему ИИ.",
        btnStart: "начать приключение",
        features: [
            { title: "Бесплатные туры", desc: "Любой город мира у вас под рукой. Мгновенные технические мастер-классы.", icon: "fa-globe" },
            { title: "Dai: Ваш ИИ-гид", desc: "Технические секреты, чистая история. Получите 'Dai Shot' для идеального фото.", icon: "fa-wand-magic-sparkles" },
            { title: "Чтение, Аудио и GPS", desc: "Вы выбираете темп. Читайте, слушайте Dai или следуйте по интерактивной карте.", icon: "fa-location-dot" },
            { title: "Мили и Рейтинг", desc: "Каждый шаг важен. Зарабатывайте мили, поднимайтесь в рейтинге и открывайте значки.", icon: "fa-trophy" },
            { title: "Цифровой паспорт", desc: "Ваши путешествия остаются с вами. Каждая виза сохраняется в вашем профиле.", icon: "fa-passport" }
        ],
        footer: "скоро: маркетплейс bdai, электронная коммерция для путешественников."
    },
    hi: { 
        title: "bdai में आपका स्वागत है", 
        subtitle: "अपनी गति से निःशुल्क वैश्विक यात्रा",
        intro: "हमारे एआई की मदद से किसी स्थानीय विशेषज्ञ की गहराई के साथ दुनिया की खोज करें, बिना किसी समय सीमा के और पूरी तरह से निःशुल्क।",
        btnStart: "अनुभव शुरू करें",
        features: [
            { title: "मुफ़्त और असीमित टूर", desc: "दुनिया का कोई भी शहर आपकी पहुंच में। तुरंत तकनीकी मास्टरक्लास तैयार करें।", icon: "fa-globe" },
            { title: "Dai: आपका AI गाइड", desc: "तकनीकी रहस्य, शुद्ध इतिहास और इंजीनियरिंग। बेहतरीन फोटो के लिए 'Dai Shot' प्राप्त करें।", icon: "fa-wand-magic-sparkles" },
            { title: "पढ़ें, सुनें और GPS", desc: "गति आपकी, चुनाव आपका। पढ़ें, दाई का ऑडियो सुनें या मैप का पालन करें।", icon: "fa-location-dot" },
            { title: "मील और रैंकिंग", desc: "हर कदम मायने रखता है। मील कमाएं, रैंकिंग में ऊपर जाएं और बैज अनलॉक करें।", icon: "fa-trophy" },
            { title: "डिजिटल पासपोर्ट", desc: "आपकी यात्राएं आपके साथ रहती हैं। हर शहर के लिए अपने प्रोफाइल में आधिकारिक वीजा पाएं।", icon: "fa-passport" }
        ],
        footer: "जल्द ही आ रहा है: bdai मार्केटप्लेस, यात्री ई-कॉमर्स।"
    },
    ko: { 
        title: "bdai에 오신 것을 환영합니다", 
        subtitle: "당신의 속도에 맞춘 무료 글로벌 투어",
        intro: "인공지능의 도움으로 현지 전문가처럼 깊이 있게, 일정에 얽매이지 않고 완전히 무료로 세계를 탐험하세요.",
        btnStart: "체험 시작하기",
        features: [
            { title: "무료 및 무제한 투어", desc: "전 세계 모든 도시가 내 손안에. 즉석에서 기술적인 마스터클래스 생성.", icon: "fa-globe" },
            { title: "Dai: AI 가이드", desc: "기술적 비밀, 순수한 역사 및 엔지니어링. 완벽한 사진을 위한 'Dai Shot' 제공.", icon: "fa-wand-magic-sparkles" },
            { title: "읽기, 오디오 및 GPS", desc: "템포는 당신의 선택. 읽거나, Dai의 오디오를 듣거나, 지도를 따라가세요.", icon: "fa-location-dot" },
            { title: "마일리지 및 랭킹", desc: "모든 발걸음이 가치 있습니다. 마일리지를 쌓고 랭킹을 올려 뱃지를 획득하세요.", icon: "fa-trophy" },
            { title: "디지털 여권", desc: "당신의 여행 기록은 영원히 남습니다. 완료한 도시마다 공식 비자가 발급됩니다.", icon: "fa-passport" }
        ],
        footer: "출시 예정: bdai 마켓플레이스, 여행자를 위한 이커머스।"
    },
    tr: { 
        title: "bdai'ye hoş geldiniz", 
        subtitle: "kendi hızınızda ücretsiz küresel turlar",
        intro: "Yapay zekamız sayesinde dünyanın her yerini yerel bir uzman derinliğinde, programlara bağlı kalmadan ve tamamen ücretsiz keşfedin.",
        btnStart: "deneyimi başlat",
        features: [
            { title: "Ücretsiz ve Sınırsız", desc: "Dünyanın her şehri parmaklarınızın ucunda. Anında teknik ustalık sınıfları.", icon: "fa-globe" },
            { title: "Dai: AI Rehberiniz", desc: "Teknik sırlar, saf tarih ve mühendislik. Mükemmel fotoğraf için 'Dai Shot' alın.", icon: "fa-wand-magic-sparkles" },
            { title: "Okuma, Ses ve GPS", desc: "Hızınızı siz belirleyin. Okuyun, Dai'yi dinleyin veya rotayı haritadan izleyin.", icon: "fa-location-dot" },
            { title: "Miller ve Sıralama", desc: "Her adım değerlidir. Mil kazanın, sıralamada yükselin ve rozetleri açın.", icon: "fa-trophy" },
            { title: "Dijital Pasaport", desc: "Seyahatleriniz sizinle kalır. Tamamlanan her şehir profilinize vize olarak işlenir.", icon: "fa-passport" }
        ],
        footer: "yakında: bdai marketplace, gezginin e-ticaret sitesi."
    },
    ar: { 
        title: "مرحباً بك في bdai", 
        subtitle: "جولات عالمية مجانية وبالوتيرة التي تناسبك",
        intro: "استكشف العالم بعمق الخبير المحلي، بدون مواعيد وبشكل مجاني تماماً بفضل ذكائنا الاصطناعي.",
        btnStart: "ابدأ تجربتك",
        features: [
            { title: "جولات مجانية وغير محدودة", desc: "أي مدينة في العالم بين يديك. نقوم بإنشاء دروس تقنية متقدمة فوراً.", icon: "fa-globe" },
            { title: "Dai: دليلك بالذكاء الاصطناعي", desc: "أسرار تقنية، تاريخ نقي وهندسة. احصل على 'Dai Shot' للصورة المثالية.", icon: "fa-wand-magic-sparkles" },
            { title: "قراءة، صوت و GPS", desc: "أنت تختار الوتيرة. اقرأ، استمع إلى Dai أو اتبع المسار عبر الخريطة.", icon: "fa-location-dot" },
            { title: "أميال وتصنيف", desc: "كل خطوة مهمة. اربح الأميال، اصعد في الترتيب العالمي وافتح الأوسمة.", icon: "fa-trophy" },
            { title: "جواز سفر رقمي", desc: "رحلاتك تبقى معك. كل مدينة تكملها تمنحك تأشيرة رسمية في ملفك الشخصي.", icon: "fa-passport" }
        ],
        footer: "قريباً: متجر bdai، التجارة الإلكترونية للمسافر."
    }
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    // Obtenemos el contenido del idioma actual o español por defecto
    const baseT = CONTENT[language] || CONTENT['es'];
    
    // Fallback de features: si el idioma actual no tiene features definidos, usamos los de español
    const featuresSource = (baseT.features && baseT.features.length > 0) ? baseT.features : CONTENT['es'].features;

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617] overflow-y-auto no-scrollbar animate-fade-in flex flex-col text-white pb-32">
            {/* Cabecera */}
            <div className="relative pt-20 pb-12 px-8 flex flex-col items-center text-center bg-gradient-to-b from-purple-600/10 to-transparent">
                <BdaiLogo className="w-20 h-20 mb-6 animate-pulse-logo" />
                <h1 className="text-4xl font-black lowercase tracking-tighter mb-2">{baseT.title}</h1>
                <p className="text-[10px] font-black text-purple-500 lowercase tracking-[0.2em] mb-6">{baseT.subtitle}</p>
                {baseT.intro && (
                    <p className="text-slate-400 text-sm max-w-xs leading-relaxed font-medium">{baseT.intro}</p>
                )}
            </div>

            {/* Listado de Características (Features) */}
            <div className="px-8 space-y-10">
                {featuresSource.map((f: any, i: number) => (
                    <div key={i} className="flex gap-6 items-start animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-500 text-xl shadow-lg">
                            <i className={`fas ${f.icon}`}></i>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-black text-base uppercase tracking-tight mb-1">{f.title}</h4>
                            <p className="text-slate-500 text-xs leading-relaxed font-medium">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / CTA */}
            <div className="mt-16 px-8 flex flex-col items-center gap-6">
                <div className="w-full h-px bg-white/5"></div>
                <p className="text-[9px] font-black text-slate-600 lowercase tracking-[0.2em] text-center">{baseT.footer}</p>
                <button 
                    onClick={onComplete}
                    className="w-full max-w-sm py-6 bg-white text-slate-950 rounded-[2rem] font-black lowercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all"
                >
                    {baseT.btnStart}
                </button>
            </div>
        </div>
    );
};
