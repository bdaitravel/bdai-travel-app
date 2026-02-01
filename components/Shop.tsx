
import React, { useState } from 'react';
import { UserProfile } from '../types';

const SHOP_TEXTS: any = {
    en: { title: "bdai market", subtitle: "Traveler Gear & Digital Assets", buy: "Buy on Etsy", download: "Get on Hotmart", official: "Our Official Stores", cats: { 'Digital': 'Digital Goods', 'Merch': 'Physical Gear' } },
    es: { title: "mercado bdai", subtitle: "Equipo para Viajeros y Activos", buy: "Comprar en Etsy", download: "Bajar en Hotmart", official: "Nuestras Tiendas Oficiales", cats: { 'Digital': 'Productos Digitales', 'Merch': 'Ropa y Accesorios' } },
    pt: { title: "mercado bdai", subtitle: "Equipamento e Ativos Digitais", buy: "Comprar no Etsy", download: "Baixar no Hotmart", official: "Lojas Oficiais", cats: { 'Digital': 'Produtos Digitais', 'Merch': 'Vestuário' } },
    it: { title: "mercato bdai", subtitle: "Attrezzatura e Asset Digitali", buy: "Compra su Etsy", download: "Scarica su Hotmart", official: "Nostri Store Ufficiali", cats: { 'Digital': 'Prodotti Digitali', 'Merch': 'Abbigliamento' } },
    ru: { title: "рынок bdai", subtitle: "Снаряжение и цифровые активы", buy: "Купить на Etsy", download: "Hotmart", official: "Наши официальные магазины", cats: { 'Digital': 'Цифровые товары', 'Merch': 'Мерч' } },
    hi: { title: "bdai बाज़ार", subtitle: "यात्री गियर और डिजिटल संपत्ति", buy: "Etsy पर खरीदें", download: "Hotmart पर प्राप्त करें", official: "हमारे आधिकारिक स्टोर", cats: { 'Digital': 'डिजिटल सामान', 'Merch': 'फिजिकल गियर' } },
    ko: { title: "bdai 마켓", subtitle: "여행자 장비 및 디지털 자산", buy: "Etsy에서 구매", download: "Hotmart에서 다운로드", official: "공식 스토어", cats: { 'Digital': '디지털 상품', 'Merch': '의류 및 액세서리' } },
    tr: { title: "bdai pazarı", subtitle: "Gezgin Ekipmanları ve Dijital Varlıklar", buy: "Etsy'den satın al", download: "Hotmart'tan indir", official: "Resmi Mağazalarımız", cats: { 'Digital': 'Dijital Ürünler', 'Merch': 'Giyim ve Aksesuar' } },
    fr: { title: "marché bdai", subtitle: "Équipement pour Voyageurs", buy: "Acheter sur Etsy", download: "Sur Hotmart", official: "Boutiques Officielles", cats: { 'Digital': 'Produits Numériques', 'Merch': 'Vêtements' } },
    de: { title: "bdai Markt", subtitle: "Ausrüstung & Digitale Produkte", buy: "Auf Etsy kaufen", download: "Auf Hotmart", official: "Offizielle Shops", cats: { 'Digital': 'Digitale Güter', 'Merch': 'Kleidung' } },
    ja: { title: "bdai マーケット", subtitle: "トラベラーギアとデジタル資産", buy: "Etsyで購入", download: "Hotmartで入手", official: "公式ストア", cats: { 'Digital': 'デジタル商品', 'Merch': 'フィジカルギア' } },
    zh: { title: "bdai 市场", subtitle: "旅行装备与数字资产", buy: "在 Etsy 购买", download: "在 Hotmart 获取", official: "官方商店", cats: { 'Digital': '数字产品', 'Merch': '实体装备' } },
    ca: { title: "mercat bdai", subtitle: "Equip per a Viatgers", buy: "Comprar a Etsy", download: "Baixar a Hotmart", official: "Botigues Oficials", cats: { 'Digital': 'Productes Digitals', 'Merch': 'Roba' } },
    eu: { title: "bdai merkatua", subtitle: "Bidaiarientzako Ekipoa", buy: "Etsy-n erosi", download: "Hotmart-en deskargatu", official: "Denda Ofizialak", cats: { 'Digital': 'Produktu Digitalak', 'Merch': 'Arropa' } },
    ar: { title: "سوق bdai", subtitle: "معدات المسافرين والأصول الرقمية", buy: "شراء من Etsy", download: "تحميل من Hotmart", official: "متاجرنا الرسمية", cats: { 'Digital': 'بضائع رقمية', 'Merch': 'ملابس وأدوات' } }
};

const EXTERNAL_STORES = [
    { id: 'etsy', name: 'Etsy Shop', url: 'https://www.etsy.com/es/shop/BdaiShop', icon: 'fa-etsy', color: 'bg-[#F1641E]' },
    { id: 'hotmart', name: 'Hotmart', url: '#', icon: 'fa-fire', color: 'bg-[#f04e23]' },
    { id: 'amazon', name: 'Amazon', url: '#', icon: 'fa-amazon', color: 'bg-[#232f3e]' },
    { id: 'miravia', name: 'Miravia', url: '#', icon: 'fa-shopping-bag', color: 'bg-[#ff3b30]' }
];

const ITEMS = [
    { id: 'd1', name: 'Travel Guide 1–3 days', price: '9.90€', cat: 'Digital', icon: 'fa-map-location-dot', color: 'bg-purple-600', note: 'AI Optimized', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'd2', name: 'Digital Recipes', price: '12.50€', cat: 'Digital', icon: 'fa-utensils', color: 'bg-emerald-600', note: 'Global flavors', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'd3', name: 'Notion Travel Templates', price: '19.00€', cat: 'Digital', icon: 'fa-clapperboard', color: 'bg-slate-800', note: 'Pro Organization', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'p1', name: 'Premium Tote Bag', price: '22.00€', cat: 'Merch', icon: 'fa-bag-shopping', color: 'bg-amber-600', note: 'Nomad Style', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'p2', name: 'Explorer T-Shirt', price: '32.00€', cat: 'Merch', icon: 'fa-shirt', color: 'bg-blue-600', note: 'Premium Cotton', link: 'https://www.etsy.com/es/shop/BdaiShop' }
];

export const Shop: React.FC<{ user: UserProfile, onPurchase: (reward: number) => void }> = ({ user, onPurchase }) => {
    const [activeCat, setActiveCat] = useState('Merch');
    const t = SHOP_TEXTS[user.language] || SHOP_TEXTS.es;

    const openStore = (url: string) => {
        if (url !== '#') window.open(url, '_blank');
    };

    return (
        <div className="pb-44 animate-fade-in bg-[#020617] min-h-full">
            <header className="bg-gradient-to-b from-purple-900/40 to-slate-950 p-10 rounded-b-[4rem] border-b border-purple-500/20">
                <h2 className={`text-4xl font-black text-white tracking-tighter uppercase ${user.language === 'ar' ? 'text-right' : ''}`}>{t.title}</h2>
                <p className={`text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mb-8 ${user.language === 'ar' ? 'text-right' : ''}`}>{t.subtitle}</p>
                <p className={`text-[8px] font-black text-white/40 uppercase tracking-widest mb-4 ${user.language === 'ar' ? 'text-right' : ''}`}>{t.official}</p>
                <div className={`flex gap-3 overflow-x-auto no-scrollbar pb-2 ${user.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    {EXTERNAL_STORES.map(store => (
                        <button key={store.id} onClick={() => openStore(store.url)} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl active:scale-95 transition-all">
                            <div className={`w-8 h-8 rounded-lg ${store.color} flex items-center justify-center text-white text-xs shadow-lg`}>
                                <i className={`fab ${store.icon}`}></i>
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
