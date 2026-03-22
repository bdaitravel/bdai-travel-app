
import { UserProfile } from '../types';
import React from 'react';

const SHOP_TEXTS: any = {
    es: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", mainBtn: "Próximamente", devMsg: "DAI está viajando por el mundo para traerte los mejores productos para viajeros. ¡Próximamente!", construction: "Marketplace en Construcción", working: "DAI está trabajando" },
    en: { title: "bdai marketplace", subtitle: "Official TechTravel Hub", mainBtn: "Coming soon", devMsg: "DAI is traveling the world to bring you the best traveler essentials. Coming soon!", construction: "Marketplace Under Construction", working: "DAI is working" },
    it: { title: "marketplace bdai", subtitle: "Hub Ufficiale TechTravel", mainBtn: "Prossimamente", devMsg: "DAI sta viaggiando per il mondo per portarti i migliori prodotti per viaggiatori. Presto disponibili!", construction: "Marketplace in Costruzione", working: "DAI è al lavoro" },
    fr: { title: "marketplace bdai", subtitle: "Hub Officiel TechTravel", mainBtn: "Bientôt disponible", devMsg: "DAI voyage à travers le monde pour vous apporter les meilleurs produits pour voyageurs. Bientôt disponible !", construction: "Marketplace en Construction", working: "DAI travaille" },
    de: { title: "bdai Marktplatz", subtitle: "Offizieller TechTravel Hub", mainBtn: "Demnächst verfügbar", devMsg: "DAI reist um die Welt, um Ihnen die besten Produkte für Reisende zu bringen. Bald verfügbar!", construction: "Marktplatz im Aufbau", working: "DAI arbeitet daran" },
    pt: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", mainBtn: "Em breve", devMsg: "DAI está viajando pelo mundo para trazer os melhores produtos para viajantes. Em breve!", construction: "Marketplace em Construção", working: "DAI está trabalhando" },
    ro: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", mainBtn: "În curând", devMsg: "DAI călătorește prin lume pentru a vă aduce cele mai bune produse pentru călători. În curând!", construction: "Marketplace în Construcție", working: "DAI lucrează" },
    ca: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", mainBtn: "Properament", devMsg: "DAI està viatjant pel món per portar-te els millors productes per a viatgers. Properament!", construction: "Marketplace en Construcció", working: "DAI està treballant" },
    nl: { title: "bdai marktplaats", subtitle: "Officiële TechTravel Hub", mainBtn: "Binnenkort beschikbaar", devMsg: "DAI reist de wereld rond om u de beste reisbenodigdheden te brengen. Binnenkort beschikbaar!", construction: "Marktplaats in Opbouw", working: "DAI is aan het werk" },
    zh: { title: "bdai 市场", subtitle: "TechTravel 官方枢纽", mainBtn: "即将推出", devMsg: "DAI 正在环游世界，为您带来最好的旅行必备品。即将推出！", construction: "市场建设中", working: "DAI 正在努力" },
    ja: { title: "bdai マーケットプレイス", subtitle: "公式 TechTravel ハブ", mainBtn: "近日公開", devMsg: "DAIは旅行者に最高の製品を届けるために世界中を旅しています。近日公開！", construction: "マーケットプレイス建设中", working: "DAIが作業中" },
    ru: { title: "маркетплейс bdai", subtitle: "Официальный хаб TechTravel", mainBtn: "Скоро", devMsg: "DAI путешествует по миру, чтобы привезти вам лучшие товары для путешественников. Скоро!", construction: "Маркетплейс в разработке", working: "DAI работает" },
    ar: { title: "سوق bdai", subtitle: "المركز الرسمي لـ TechTravel", mainBtn: "قريباً", devMsg: "تسافر DAI حول العالم لتجلب لك أفضل منتجات المسافرين. قريباً!", construction: "السوق قيد الإنشاء", working: "DAI تعمل" },
    hi: { title: "bdai मार्केटप्लेस", subtitle: "आधिकारिक TechTravel हब", mainBtn: "जल्द आ रहा है", devMsg: "DAI आपको बेहतरीन यात्री उत्पाद लाने के लिए दुनिया भर की यात्रा कर रही है। जल्द आ रहा है!", construction: "मार्केटप्लेस निर्माणाधीन है", working: "DAI काम कर रही है" },
    ko: { title: "bdai 마켓플레이스", subtitle: "공식 TechTravel 허브", mainBtn: "곧 출시됨", devMsg: "DAI는 여행자를 위한 최고의 제품을 제공하기 위해 전 세계를 여행하고 있습니다. 곧 출시됩니다!", construction: "마켓플레이스 공사 중", working: "DAI 작업 중" },
    tr: { title: "bdai pazaryeri", subtitle: "Resmi TechTravel Merkezi", mainBtn: "Yakında", devMsg: "DAI, size en iyi seyahat ürünlerini getirmek için dünyayı dolaşıyor. Yakında!", construction: "Pazaryeri Yapım Aşamasında", working: "DAI çalışıyor" },
    pl: { title: "rynek bdai", subtitle: "Oficjalne centrum TechTravel", mainBtn: "Wkrótce", devMsg: "DAI podróżuje po świecie, aby dostarczyć Ci najlepsze produkty dla podróżników. Wkrótce!", construction: "Rynek w budowie", working: "DAI pracuje" },
    eu: { title: "bdai merkatua", subtitle: "TechTravel Gune Ofiziala", mainBtn: "Laster", devMsg: "DAI munduan zehar bidaiatzen ari da bidaiarientzako produktu onenak ekartzeko. Laster!", construction: "Merkatua Eraikitzen", working: "DAI lanean ari da" },
    vi: { title: "chợ bdai", subtitle: "Trung tâm TechTravel chính thức", mainBtn: "Sắp ra mắt", devMsg: "DAI đang đi khắp thế giới để mang đến cho bạn những sản phẩm du lịch tốt nhất. Sắp ra mắt!", construction: "Chợ đang xây dựng", working: "DAI đang làm việc" },
    th: { title: "ตลาด bdai", subtitle: "ศูนย์กลาง TechTravel อย่างเป็นทางการ", mainBtn: "เร็วๆ นี้", devMsg: "DAI กำลังเดินทางรอบโลกเพื่อนำเสนอผลิตภัณฑ์ที่ดีที่สุดสำหรับนักเดินทาง เร็วๆ นี้!", construction: "ตลาดกำลังก่อสร้าง", working: "DAI กำลังทำงาน" }
};

export const Shop: React.FC<{ user: UserProfile, onPurchase: (reward: number) => void }> = ({ user, onPurchase }) => {
    const t = SHOP_TEXTS[user.language] || SHOP_TEXTS.en;

    return (
        <div className="pb-44 animate-fade-in bg-[#020617] min-h-full">
            <header className="bg-gradient-to-b from-purple-900/40 to-slate-950 p-10 rounded-b-[4rem] border-b border-purple-500/20 shadow-2xl">
                <h2 className={`text-4xl font-black text-white tracking-tighter uppercase ${user.language === 'ar' ? 'text-right' : ''}`}>{t.title}</h2>
                <p className={`text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mb-4 ${user.language === 'ar' ? 'text-right' : ''}`}>{t.subtitle}</p>
            </header>

            <div className="p-8 space-y-6">
                <div className="bg-purple-600/10 border border-purple-500/20 p-10 rounded-[3rem] text-center space-y-6 backdrop-blur-md">
                    <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/40 animate-pulse">
                        <i className="fas fa-tools text-3xl text-white"></i>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">{t.construction}</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                        "{t.devMsg}"
                    </p>
                    <div className="pt-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t.working}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
