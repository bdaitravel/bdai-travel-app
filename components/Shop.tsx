
import { UserProfile } from '../types';
import React from 'react';

const SHOP_TEXTS: any = {
    es: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", official: "Nuestras Tiendas Oficiales", mainBtn: "Visitar Mercado Global" },
    en: { title: "bdai marketplace", subtitle: "Official TechTravel Hub", official: "Our Official Stores", mainBtn: "Visit Global Market" },
    it: { title: "marketplace bdai", subtitle: "Hub Ufficiale TechTravel", official: "Nostri Negozi Ufficiali", mainBtn: "Visita Mercato Globale" },
    fr: { title: "marketplace bdai", subtitle: "Hub Officiel TechTravel", official: "Nos Boutiques Officielles", mainBtn: "Visiter le Marché Global" },
    de: { title: "bdai Marktplatz", subtitle: "Offizieller TechTravel Hub", official: "Unsere Offiziellen Shops", mainBtn: "Globalen Markt besuchen" },
    pt: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", official: "Nossas Lojas Oficiais", mainBtn: "Visitar Mercado Global" },
    ro: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", official: "Magazinele Noastre Oficiale", mainBtn: "Vizitați Piața Globală" },
    ca: { title: "marketplace bdai", subtitle: "Hub Oficial TechTravel", official: "Les Nostres Botigues", mainBtn: "Visitar Mercat Global" },
    nl: { title: "bdai marktplaats", subtitle: "Officiële TechTravel Hub", official: "Onze Officiële Winkels", mainBtn: "Bezoek de Wereldmarkt" },
    zh: { title: "bdai 市场", subtitle: "TechTravel 官方枢纽", official: "我们的官方商店", mainBtn: "访问全球市场" },
    ja: { title: "bdai マーケットプレイス", subtitle: "公式 TechTravel ハブ", official: "公式ストア", mainBtn: "グローバルマーケットへ" },
    ru: { title: "маркетплейс bdai", subtitle: "Официальный хаб TechTravel", official: "Наши официальные магазины", mainBtn: "Глобальный рынок" },
    tr: { title: "bdai pazaryeri", subtitle: "Resmi TechTravel Hub", official: "Resmi Mağazalarımız", mainBtn: "Küresel Pazarı Ziyaret Et" },
    pl: { title: "marketplace bdai", subtitle: "Oficjalny Hub TechTravel", official: "Nasze Oficjalne Sklepy", mainBtn: "Odwiedź Rynek Globalny" },
    hi: { title: "bdai मार्केटप्लेस", subtitle: "आधिकारिक TechTravel हब", official: "हमारे आधिकारिक स्टोर", mainBtn: "ग्लोबल मार्केट पर जाएं" },
    ko: { title: "bdai 마켓플레이스", subtitle: "공식 TechTravel 허브", official: "공식 스토어", mainBtn: "글로벌 마켓 방문" },
    ar: { title: "متجر bdai", subtitle: "مركز TechTravel الرسمي", official: "متاجرنا الرسمية", mainBtn: "زيارة السوق العالمي" },
    eu: { title: "bdai marketplace", subtitle: "TechTravel Hub Ofiziala", official: "Gure Denda Ofizialak", mainBtn: "Bisitatu Merkatu Globala" },
    vi: { title: "thị trường bdai", subtitle: "Trung tâm TechTravel", official: "Cửa hàng chính thức", mainBtn: "Ghé thăm thị trường" },
    th: { title: "ตลาด bdai", subtitle: "ศูนย์กลาง TechTravel", official: "ร้านค้าอย่างเป็นทางการ", mainBtn: "เยี่ยมชมตลาดโลก" }
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
                    onClick={() => openStore('https://www.bdai.tech/')}
                    className="w-full bg-white text-slate-950 p-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all flex items-center justify-center gap-3 mb-8"
                >
                    <i className="fas fa-external-link-alt"></i>
                    {t.mainBtn}
                </button>
            </header>

            <div className="p-8 space-y-6">
                <h3 className={`text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-2 ${user.language === 'ar' ? 'text-right' : ''}`}>{t.official}</h3>
                <div className="grid grid-cols-1 gap-4">
                    {EXTERNAL_STORES.map(store => (
                        <div key={store.id} onClick={() => openStore(store.url)} className={`bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex items-center justify-between group active:scale-95 transition-all cursor-pointer ${user.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-5 ${user.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-14 h-14 rounded-2xl ${store.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                                    <i className={`fab ${store.icon} ${store.id === 'bdai' ? 'fas fa-globe' : ''} ${store.id === 'miravia' ? 'fas fa-shopping-bag' : ''}`}></i>
                                </div>
                                <div className={user.language === 'ar' ? 'text-right' : ''}>
                                    <h4 className="text-white font-black text-sm uppercase">{store.name}</h4>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Official platform</p>
                                </div>
                            </div>
                            <i className={`fas fa-external-link-alt text-slate-700 group-hover:text-purple-500 ${user.language === 'ar' ? 'rotate-180' : ''}`}></i>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
