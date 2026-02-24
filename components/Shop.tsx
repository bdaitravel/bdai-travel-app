
import { UserProfile } from '../types';
import React from 'react';

const SHOP_TEXTS: any = {
    it: { title: "marketplace bdai", subtitle: "Hub Ufficiale TechTravel", official: "Nostri Negozi Ufficiali", mainBtn: "Prossimamente", devMsg: "DAI sta viaggiando per il mondo per portarti i migliori prodotti per viaggiatori. Presto disponibili!" },
    fr: { title: "marketplace bdai", subtitle: "Hub Officiel TechTravel", official: "Nos Boutiques Officielles", mainBtn: "Bientôt disponible", devMsg: "DAI voyage à travers le monde pour vous apporter les meilleurs produits pour voyageurs. Bientôt disponible !" },
    de: { title: "bdai Marktplatz", subtitle: "Offizieller TechTravel Hub", official: "Unsere Offiziellen Shops", mainBtn: "Demnächst verfügbar", devMsg: "DAI reist um die Welt, um Ihnen die besten Produkte für Reisende zu bringen. Bald verfügbar!" },
    es: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", official: "Nuestras Tiendas Oficiales", mainBtn: "Próximamente", devMsg: "DAI está viajando por el mundo para traerte los mejores productos para viajeros. ¡Próximamente!" },
    en: { title: "bdai marketplace", subtitle: "Official TechTravel Hub", official: "Our Official Stores", mainBtn: "Coming soon", devMsg: "DAI is traveling the world to bring you the best traveler essentials. Coming soon!" },
    pt: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", official: "Nossas Lojas Oficiais", mainBtn: "Em breve", devMsg: "DAI está viajando pelo mundo para trazer os melhores produtos para viajantes. Em breve!" },
    ro: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", official: "Magazinele Noastre Oficiale", mainBtn: "În curând", devMsg: "DAI călătorește prin lume pentru a vă aduce cele mai bune produse pentru călători. În curând!" },
    ca: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", official: "Les Nostres Botigues", mainBtn: "Properament", devMsg: "DAI està viatjant pel món per portar-te els millors productes per a viatgers. Properament!" },
    nl: { title: "bdai marktplaats", subtitle: "Officiële TechTravel Hub", official: "Onze Officiële Winkels", mainBtn: "Binnenkort beschikbaar", devMsg: "DAI reist de wereld rond om u de beste reisbenodigdheden te brengen. Binnenkort beschikbaar!" },
    zh: { title: "bdai 市场", subtitle: "TechTravel 官方枢纽", official: "我们的官方商店", mainBtn: "即将推出", devMsg: "DAI 正在环游世界，为您带来最好的旅行必备品。即将推出！" },
    ja: { title: "bdai マーケットプレイス", subtitle: "公式 TechTravel ハブ", official: "公式ストア", mainBtn: "近日公開", devMsg: "DAIは旅行者に最高の製品を届けるために世界中を旅しています。近日公開！" },
};

const EXTERNAL_STORES = [
    { id: 'bdai', name: 'bdai.tech', url: 'https://www.bdai.tech/', icon: 'fa-globe', color: 'bg-purple-600' },
    { id: 'etsy', name: 'Etsy Shop', url: 'https://www.etsy.com/es/shop/BdaiShop', icon: 'fa-etsy', color: 'bg-[#F1641E]' },
    { id: 'hotmart', name: 'Hotmart', url: '#', icon: 'fa-fire', color: 'bg-[#f04e23]' },
    { id: 'amazon', name: 'Amazon', url: '#', icon: 'fa-amazon', color: 'bg-[#FF9900]' },
    { id: 'miravia', name: 'Miravia', url: '#', icon: 'fa-shopping-bag', color: 'bg-[#fe016d]' }
];

export const Shop: React.FC<{ user: UserProfile, onPurchase: (reward: number) => void }> = ({ user, onPurchase }) => {
    const t = SHOP_TEXTS[user.language] || SHOP_TEXTS.en;

    const openStore = (url: string) => {
        if (url !== '#') window.open(url, '_blank');
    };

    return (
        <div className="pb-44 animate-fade-in bg-[#020617] min-h-full">
            <header className="bg-gradient-to-b from-purple-900/40 to-slate-950 p-10 rounded-b-[4rem] border-b border-purple-500/20 shadow-2xl">
                <h2 className={`text-4xl font-black text-white tracking-tighter uppercase ${user.language === 'ar' ? 'text-right' : ''}`}>{t.title}</h2>
                <p className={`text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mb-8 ${user.language === 'ar' ? 'text-right' : ''}`}>{t.subtitle}</p>
                
                <button 
                    disabled
                    className="w-full bg-white/10 text-white/40 p-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest border border-white/5 flex items-center justify-center gap-3 mb-8 cursor-not-allowed"
                >
                    <i className="fas fa-lock"></i>
                    {t.mainBtn}
                </button>

                <div className="bg-purple-600/20 border border-purple-500/30 p-6 rounded-[2rem] backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <i className="fas fa-info-circle text-purple-400"></i>
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Update</span>
                    </div>
                    <p className="text-white/80 text-xs font-medium leading-relaxed italic">
                        "{t.devMsg || SHOP_TEXTS.en.devMsg}"
                    </p>
                </div>
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
