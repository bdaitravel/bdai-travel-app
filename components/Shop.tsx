
import React, { useState } from 'react';
import { UserProfile } from '../types';

const SHOP_TEXTS: any = {
    en: { title: "bdai market", subtitle: "Traveler Gear & Digital Assets", buy: "Buy on Etsy", download: "Get on Hotmart", official: "Our Official Stores", cats: { 'Digital': 'Digital Goods', 'Merch': 'Physical Gear' } },
    es: { title: "mercado bdai", subtitle: "Equipo para Viajeros y Activos", buy: "Comprar en Etsy", download: "Bajar en Hotmart", official: "Nuestras Tiendas Oficiales", cats: { 'Digital': 'Productos Digitales', 'Merch': 'Ropa y Accesorios' } },
};

const EXTERNAL_STORES = [
    { id: 'etsy', name: 'Etsy Shop', url: 'https://www.etsy.com/es/shop/BdaiShop', icon: 'fa-etsy', color: 'bg-[#F1641E]' },
    { id: 'hotmart', name: 'Hotmart', url: '#', icon: 'fa-fire', color: 'bg-[#f04e23]' },
    { id: 'amazon', name: 'Amazon', url: '#', icon: 'fa-amazon', color: 'bg-[#232f3e]' },
    { id: 'miravia', name: 'Miravia', url: '#', icon: 'fa-shopping-bag', color: 'bg-[#ff3b30]' }
];

const ITEMS = [
    // PRODUCTOS DIGITALES
    { id: 'd1', name: 'Guía de Viaje 1–3 días', price: '9.90€', cat: 'Digital', icon: 'fa-map-location-dot', color: 'bg-purple-600', note: 'Optimizado con IA', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'd2', name: 'Recetarios Digitales', price: '12.50€', cat: 'Digital', icon: 'fa-utensils', color: 'bg-emerald-600', note: 'Sabores del mundo', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'd3', name: 'Plantillas Notion Travel', price: '19.00€', cat: 'Digital', icon: 'fa-clapperboard', color: 'bg-slate-800', note: 'Organización Pro', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'd4', name: 'Álbumes de Fotos IA', price: '7.00€', cat: 'Digital', icon: 'fa-wand-magic-sparkles', color: 'bg-indigo-600', note: 'Retención de recuerdos', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    
    // MERCH (FÍSICO)
    { id: 'p1', name: 'Tote Bag Premium', price: '22.00€', cat: 'Merch', icon: 'fa-bag-shopping', color: 'bg-amber-600', note: 'Estilo Nómada', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'p2', name: 'Camisetas Explorer', price: '32.00€', cat: 'Merch', icon: 'fa-shirt', color: 'bg-blue-600', note: 'Algodón Premium', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'p3', name: 'Láminas / Posters IA', price: '24.00€', cat: 'Merch', icon: 'fa-image', color: 'bg-rose-600', note: 'Arte Generativo', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'p4', name: 'Libretas y Journals', price: '20.00€', cat: 'Merch', icon: 'fa-book-open', color: 'bg-slate-700', note: 'Papel de alta calidad', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'p5', name: 'Recetario Impreso', price: '28.00€', cat: 'Merch', icon: 'fa-mortar-pestle', color: 'bg-orange-700', note: 'Edición Tapa Dura', link: 'https://www.etsy.com/es/shop/BdaiShop' }
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
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{t.title}</h2>
                <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mb-8">{t.subtitle}</p>

                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-4">{t.official}</p>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
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

            <nav className="px-8 mt-10 flex gap-3">
                {Object.keys(t.cats).map(c => (
                    <button key={c} onClick={() => setActiveCat(c)} className={`px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCat === c ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white/40 border-white/5'}`}>
                        {t.cats[c]}
                    </button>
                ))}
            </nav>

            <div className="p-8 grid grid-cols-1 gap-4">
                {ITEMS.filter(i => i.cat === activeCat).map(item => (
                    <div key={item.id} onClick={() => openStore(item.link)} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex items-center justify-between group active:scale-95 transition-all cursor-pointer">
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                                <i className={`fas ${item.icon}`}></i>
                            </div>
                            <div>
                                <h4 className="text-white font-black text-xs uppercase">{item.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[11px] font-black text-purple-400">{item.price}</p>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{item.note}</span>
                                </div>
                            </div>
                        </div>
                        <i className="fas fa-chevron-right text-slate-700 group-hover:text-purple-500"></i>
                    </div>
                ))}

                <div className="mt-8 bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-white/5 p-8 rounded-[3rem] text-center">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-2">Envíos gestionados por Printful</p>
                    <p className="text-[8px] text-slate-500 uppercase leading-relaxed">Garantía de calidad global. Cada compra apoya el desarrollo de mejores destinos con IA.</p>
                </div>
            </div>
        </div>
    );
};
