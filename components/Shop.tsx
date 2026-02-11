
import { UserProfile } from '../types';
import React, { useState } from 'react';

const SHOP_TEXTS: any = {
    en: { title: "bdai marketplace", subtitle: "Official TechTravel Hub", buy: "Shop Now", official: "Our Official Marketplace", mainBtn: "Visit Global Market", cats: { 'Digital': 'Digital Assets', 'Merch': 'Explorer Gear' } },
    es: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", buy: "Comprar Ahora", official: "Nuestro Marketplace Oficial", mainBtn: "Visitar Mercado Global", cats: { 'Digital': 'Activos Digitales', 'Merch': 'Equipo Explorador' } },
    pt: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", buy: "Comprar Agora", official: "Nosso Marketplace Oficial", mainBtn: "Visitar Mercado Global", cats: { 'Digital': 'Produtos Digitais', 'Merch': 'Equipamento' } },
    it: { title: "marketplace bdai", subtitle: "Hub Ufficiale TechTravel", buy: "Acquista Ora", official: "Il Nostro Marketplace Ufficiale", mainBtn: "Visita Mercato Globale", cats: { 'Digital': 'Asset Digitali', 'Merch': 'Attrezzatura' } },
    ru: { title: "маркетплейс bdai", subtitle: "Официальный хаб TechTravel", buy: "Купить сейчас", official: "Наш официальный маркетплейс", mainBtn: "Глобальный рынок", cats: { 'Digital': 'Цифровые товары', 'Merch': 'Снаряжение' } },
    hi: { title: "bdai मार्केटप्लेस", subtitle: "आधिकारिक TechTravel हब", buy: "अभी खरीदें", official: "हमारा आधिकारिक मार्केटप्लेस", mainBtn: "ग्लोबल मार्केट पर जाएं", cats: { 'Digital': 'डिजिटल संपत्ति', 'Merch': 'एक्सप्लोरर गियर' } },
    ko: { title: "bdai 마켓플레이스", subtitle: "공식 TechTravel 허브", buy: "지금 구매", official: "공식 마켓플레이스", mainBtn: "글로벌 마켓 방문", cats: { 'Digital': '디지털 자산', 'Merch': '탐험가 장비' } },
    tr: { title: "bdai pazaryeri", subtitle: "Resmi TechTravel Hub", buy: "Şimdi Satın Al", official: "Resmi Pazaryerimiz", mainBtn: "Küresel Pazarı Ziyaret Et", cats: { 'Digital': 'Dijital Varlıklar', 'Merch': 'Gezgin Ekipmanları' } },
    fr: { title: "marketplace bdai", subtitle: "Hub Officiel TechTravel", buy: "Acheter", official: "Notre Marketplace Officiel", mainBtn: "Visiter le Marché Global", cats: { 'Digital': 'Produits Numériques', 'Merch': 'Équipement' } },
    de: { title: "bdai Marktplatz", subtitle: "Offizieller TechTravel Hub", buy: "Jetzt kaufen", official: "Unser offizieller Marktplatz", mainBtn: "Globalen Markt besuchen", cats: { 'Digital': 'Digitale Güter', 'Merch': 'Ausrüstung' } },
    ja: { title: "bdai マーケットプレイス", subtitle: "公式 TechTravel ハブ", buy: "今すぐ購入", official: "公式マーケットプレイス", mainBtn: "グローバルマーケットへ", cats: { 'Digital': 'デジタル資産', 'Merch': 'エクスプローラーギア' } },
    zh: { title: "bdai 市场", subtitle: "TechTravel 官方枢纽", buy: "立即购买", official: "官方市场", mainBtn: "访问全球市场", cats: { 'Digital': '数字资产', 'Merch': '探险装备' } },
    ca: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", buy: "Comprar Ara", official: "El Nostre Marketplace Oficial", mainBtn: "Visitar Mercat Global", cats: { 'Digital': 'Productes Digitals', 'Merch': 'Equip Explorador' } },
    eu: { title: "bdai marketplace", subtitle: "TechTravel Hub Ofiziala", buy: "Erosi Orain", official: "Gure Marketplace Ofiziala", mainBtn: "Bisitatu Merkatu Globala", cats: { 'Digital': 'Produktu Digitalak', 'Merch': 'Esploratzaile Ekipoa' } },
    ar: { title: "متجر bdai", subtitle: "مركز TechTravel الرسمي", buy: "تسوق الآن", official: "متجرنا الرسمي", mainBtn: "زيارة السوق العالمي", cats: { 'Digital': 'الأصول الرقمية', 'Merch': 'معدات المستكشف' } }
};

const EXTERNAL_STORES = [
    { id: 'bdai', name: 'bdai.tech', url: 'https://www.bdai.tech/', icon: 'fa-globe', color: 'bg-purple-600' },
    { id: 'etsy', name: 'Etsy Shop', url: 'https://www.etsy.com/es/shop/BdaiShop', icon: 'fa-etsy', color: 'bg-[#F1641E]' },
    { id: 'hotmart', name: 'Hotmart', url: '#', icon: 'fa-fire', color: 'bg-[#f04e23]' }
];

const ITEMS = [
    { id: 'd1', name: 'Travel Guide 1–3 days', price: '9.90€', cat: 'Digital', icon: 'fa-map-location-dot', color: 'bg-purple-600', note: 'AI Optimized', link: 'https://www.bdai.tech/' },
    { id: 'd2', name: 'Digital Recipes', price: '12.50€', cat: 'Digital', icon: 'fa-utensils', color: 'bg-emerald-600', note: 'Global flavors', link: 'https://www.bdai.tech/' },
    { id: 'd3', name: 'Notion Travel Templates', price: '19.00€', cat: 'Digital', icon: 'fa-clapperboard', color: 'bg-slate-800', note: 'Pro Organization', link: 'https://www.bdai.tech/' },
    { id: 'p1', name: 'Premium Tote Bag', price: '22.00€', cat: 'Merch', icon: 'fa-bag-shopping', color: 'bg-amber-600', note: 'Nomad Style', link: 'https://www.bdai.tech/' },
    { id: 'p2', name: 'Explorer T-Shirt', price: '32.00€', cat: 'Merch', icon: 'fa-shirt', color: 'bg-blue-600', note: 'Premium Cotton', link: 'https://www.bdai.tech/' }
];

export const Shop: React.FC<{ user: UserProfile, onPurchase: (reward: number) => void }> = ({ user, onPurchase }) => {
    const [activeCat, setActiveCat] = useState('Digital');
    const t = SHOP_TEXTS[user.language] || SHOP_TEXTS.es;

    const openStore = (url: string) => {
        if (url !== '#') window.open(url, '_blank');
    };

    return (
        <div className="pb-44 animate-fade-in bg-[#020617] min-h-full">
            <header className="bg-gradient-to-b from-purple-900/40 to-slate-950 p-10 rounded-b-[4rem] border-b border-purple-500/20 shadow-2xl">
                <h2 className={`text-4xl font-black text-white tracking-tighter uppercase ${user.language === 'ar' ? 'text-right' : ''}`}>{t.title}</h2>
                <p className={`text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mb-8 ${user.language === 'ar' ? 'text-right' : ''}`}>{t.subtitle}</p>
                
                <button 
                    onClick={() => openStore('https://www.bdai.tech/')}
                    className="w-full bg-white text-slate-950 p-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all flex items-center justify-center gap-3 mb-8"
                >
                    <i className="fas fa-external-link-alt"></i>
                    {t.mainBtn}
                </button>

                <p className={`text-[8px] font-black text-white/40 uppercase tracking-widest mb-4 ${user.language === 'ar' ? 'text-right' : ''}`}>{t.official}</p>
                <div className={`flex gap-3 overflow-x-auto no-scrollbar pb-2 ${user.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    {EXTERNAL_STORES.map(store => (
                        <button key={store.id} onClick={() => openStore(store.url)} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl active:scale-95 transition-all">
                            <div className={`w-8 h-8 rounded-lg ${store.color} flex items-center justify-center text-white text-xs shadow-lg`}>
                                <i className={`fab ${store.icon} ${store.id === 'bdai' ? 'fas fa-globe' : ''}`}></i>
                            </div>
                            <span className="text-[10px] font-black text-white whitespace-nowrap">{store.name}</span>
                        </button>
                    ))}
                </div>
            </header>

            <nav className={`px-8 mt-10 flex gap-3 ${user.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                {Object.keys(t.cats).map(c => (
                    <button key={c} onClick={() => setActiveCat(c)} className={`px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCat === c ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white/40 border-white/5'}`}>
                        {t.cats[c]}
                    </button>
                ))}
            </nav>

            <div className="p-8 grid grid-cols-1 gap-4">
                {ITEMS.filter(i => i.cat === activeCat).map(item => (
                    <div key={item.id} onClick={() => openStore(item.link)} className={`bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex items-center justify-between group active:scale-95 transition-all cursor-pointer ${user.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-5 ${user.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                                <i className={`fas ${item.icon}`}></i>
                            </div>
                            <div className={user.language === 'ar' ? 'text-right' : ''}>
                                <h4 className="text-white font-black text-xs uppercase">{item.name}</h4>
                                <div className={`flex items-center gap-2 mt-1 ${user.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                                    <p className="text-[11px] font-black text-purple-400">{item.price}</p>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{item.note}</span>
                                </div>
                            </div>
                        </div>
                        <i className={`fas fa-chevron-right text-slate-700 group-hover:text-purple-500 ${user.language === 'ar' ? 'rotate-180' : ''}`}></i>
                    </div>
                ))}
            </div>
        </div>
    );
};
