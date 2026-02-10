
import React from 'react';
import { UserProfile } from '../types';

const SHOP_TEXTS: any = {
    es: { title: "mercado bdai", subtitle: "Equipo Oficial y Servicios Digitales", status: "Próximamente", info: "Estamos construyendo el mejor mercado para viajeros. Pronto podrás encontrar reservas, eSIMs y equipo oficial aquí.", official: "Nuestro Futuro Ecosistema" },
    en: { title: "bdai market", subtitle: "Official Gear & Digital Services", status: "Coming Soon", info: "We are building the best marketplace for travelers. Soon you will find bookings, eSIMs, and official nomad gear here.", official: "Our Future Ecosystem" },
    zh: { title: "bdai 市场", subtitle: "官方装备与数字服务", status: "即将推出", info: "我们正在为旅行者建立最好的市场。很快你就能在这里找到预订、eSIM和官方游牧装备。", official: "我们的未来生态系统" },
    ca: { title: "mercat bdai", subtitle: "Equip Oficial i Serveis Digitals", status: "Properament", info: "Estem construint el millor mercat per a viatgers. Aviat podràs trobar reserves, eSIMs i equip oficial aquí.", official: "El Nostre Futur Ecosistema" },
    eu: { title: "bdai merkatua", subtitle: "Ekipo Ofiziala eta Zerbitzu Digitalak", status: "Laster", info: "Bidaiarientzako merkaturik onena eraikitzen ari gara. Laster erreserbak, eSIMak eta nomada ekipo ofiziala aurkituko dituzu hemen.", official: "Gure Etorkizuneko Ekosistema" },
    ar: { title: "سوق bdai", subtitle: "المعدات الرسمية والخدمات الرقمية", status: "قريباً", info: "نحن نبني أفضل سوق للمسافرين. ستتمكن قريباً من العثور على الحجوزات وشرائح eSIM والمعدات الرسمية هنا.", official: "منظومتنا المستقبلية" },
    pt: { title: "mercado bdai", subtitle: "Equipamento Oficial e Serviços Digitais", status: "Em breve", info: "Estamos construindo o melhor mercado para viajantes. Em breve você poderá encontrar reservas, eSIMs e equipamentos oficiais aqui.", official: "Nosso Futuro Ecossistema" },
    fr: { title: "marché bdai", subtitle: "Équipement Officiel et Services Numériques", status: "Bientôt", info: "Nous construisons le meilleur marché pour les voyageurs. Bientôt vous trouverez ici des réservations, des eSIM et de l'équipement nomade.", official: "Notre Futur Écosystème" },
    de: { title: "bdai marktplatz", subtitle: "Ausrüstung & Digitale Dienste", status: "Demnächst", info: "Wir bauen den besten Marktplatz für Reisende auf. Bald finden Sie hier Buchungen, eSIMs und Nomaden-Ausrüstung.", official: "Unser Zukünftiges Ökosystem" },
    it: { title: "mercato bdai", subtitle: "Equipaggiamento e Servizi Digitali", status: "Prossimamente", info: "Stiamo costruendo il miglior mercato per i viaggiatori. Presto potrai trovare prenotazioni, eSIM e attrezzatura ufficiale.", official: "Il Nostro Futuro Ecosistema" },
    ja: { title: "bdai マーケット", subtitle: "公式ギアとデジタルサービス", status: "近日公開", info: "旅行者のための最高のマーケットプレイスを構築中です。まもなく、予約、eSIM、公式ギアがここで見つかります。", official: "私たちの未来のエコシステム" },
    ru: { title: "маркет bdai", subtitle: "Официальное снаряжение и услуги", status: "Скоро", info: "Мы строим лучший маркетплейс для путешественников. Скоро здесь вы найдете бронирования, eSIM и снаряжение.", official: "Наша будущая экосистема" },
    hi: { title: "bdai बाज़ार", subtitle: "आधिकारिक गियर और डिजिटल सेवाएँ", status: "जल्द ही आ रहा है", info: "हम यात्रियों के लिए सबसे अच्छा बाज़ार बना रहे हैं। जल्द ही आप यहां बुकिंग, ई-सिम और गियर पा सकेंगे।", official: "हमारा भविष्य का पारिस्थितिकी तंत्र" },
    ko: { title: "bdai 마켓", subtitle: "공식 장비 및 디지털 서비스", status: "출시 예정", info: "여행자를 위한 최고의 마켓플레이스를 구축하고 있습니다. 곧 여기서 예약, eSIM 및 공식 장비를 찾을 수 있습니다.", official: "우리의 미래 생태계" },
    tr: { title: "bdai pazarı", subtitle: "Resmi Ekipman ve Dijital Hizmetler", status: "Yakında", info: "Gezginler için en iyi pazaryerini kuruyoruz. Yakında burada rezervasyonlar, eSIM'ler ve ekipmanlar bulabileceksiniz.", official: "Gelecekteki Ekosistemimiz" }
};

export const Shop: React.FC<{ user: UserProfile, onPurchase: (reward: number) => void }> = ({ user }) => {
    const t = SHOP_TEXTS[user.language] || SHOP_TEXTS.en;

    return (
        <div className="pb-44 animate-fade-in bg-[#020617] min-h-full flex flex-col items-center px-8">
            <header className="w-full bg-gradient-to-b from-purple-900/40 to-slate-950 p-10 rounded-b-[4rem] border-b border-purple-500/20 text-center mb-12">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{t.title}</h2>
                <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mb-4">{t.subtitle}</p>
            </header>

            <div className="w-full max-w-sm bg-white/5 border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-purple-600 animate-pulse"></div>
                <div className="w-20 h-20 rounded-[2rem] bg-purple-600/20 text-purple-500 flex items-center justify-center text-3xl mx-auto mb-6 border border-purple-500/30">
                    <i className="fas fa-hammer"></i>
                </div>
                <h3 className="text-white font-black text-xl uppercase tracking-tighter mb-4">{t.status}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium mb-8">
                    {t.info}
                </p>
                <div className="flex justify-center gap-6 text-slate-600 text-xl">
                    <i className="fas fa-hotel"></i>
                    <i className="fas fa-sim-card"></i>
                    <i className="fas fa-bag-shopping"></i>
                    <i className="fas fa-ticket"></i>
                </div>
            </div>

            <div className="mt-12 text-center opacity-30">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{t.official}</p>
                <div className="flex gap-4 items-center justify-center">
                    <i className="fab fa-amazon"></i>
                    <i className="fab fa-etsy"></i>
                    <i className="fas fa-fire"></i>
                </div>
            </div>
        </div>
    );
};
