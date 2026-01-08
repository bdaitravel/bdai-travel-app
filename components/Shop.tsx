
import React, { useState } from 'react';
import { UserProfile } from '../types';

const SHOP_TEXTS: any = {
    en: { title: "bdai marketplace", subtitle: "Traveler Essentials & Gear", buy: "View Store", miles: "miles", official: "Official Channels", cats: { 'Digital': 'Digital Assets', 'Merch': 'Streetwear', 'Partners': 'Partnerships' } },
    es: { title: "mercado bdai", subtitle: "Esenciales y Equipo de Viaje", buy: "Ver Tienda", miles: "millas", official: "Canales Oficiales", cats: { 'Digital': 'Activos Digitales', 'Merch': 'Ropa y Accesorios', 'Partners': 'Colaboraciones' } },
    ca: { title: "mercat bdai", subtitle: "Essencials i Equip de Viatge", buy: "Veure Botiga", miles: "milles", official: "Canals Oficials", cats: { 'Digital': 'Actius Digitals', 'Merch': 'Roba i Accesoris', 'Partners': 'Col·laboracions' } }
};

const EXTERNAL_STORES = [
    { id: 'etsy', name: 'Etsy Shop', url: 'https://www.etsy.com/es/shop/BdaiShop', icon: 'fa-etsy', color: 'bg-[#F1641E]' },
    { id: 'hotmart', name: 'Hotmart', url: '#', icon: 'fa-fire', color: 'bg-[#f04e23]' },
    { id: 'amazon', name: 'Amazon Store', url: '#', icon: 'fa-amazon', color: 'bg-[#232f3e]' },
    { id: 'miravia', name: 'Miravia', url: '#', icon: 'fa-shopping-bag', color: 'bg-[#ff3b30]' }
];

const ITEMS = [
    // PRODUCTOS DIGITALES
    { id: 'd1', name: 'Guía Pro: 1-3 Días (IA Optimized)', price: '9.90€', cat: 'Digital', icon: 'fa-map-location-dot', color: 'bg-purple-600', note: 'Descarga Inmediata' },
    { id: 'd2', name: 'Recetario Gourmet del Mundo', price: '20.00€', cat: 'Digital', icon: 'fa-utensils', color: 'bg-emerald-600', note: 'E-book PDF' },
    { id: 'd3', name: 'Plantilla Notion: Travel Planner', price: '15.00€', cat: 'Digital', icon: 'fa-clapperboard', color: 'bg-slate-800', note: 'Sincronización Cloud' },
    
    // PRODUCTOS FÍSICOS (MERCH)
    { id: 'p1', name: 'Tote Bag Premium BDAI', price: '18.00€', cat: 'Merch', icon: 'fa-bag-shopping', color: 'bg-amber-600', note: 'Algodón Orgánico' },
    { id: 'p2', name: 'Camiseta Explorer Oversize', price: '28.00€', cat: 'Merch', icon: 'fa-shirt', color: 'bg-indigo-600', note: 'Edición Limitada' },
    { id: 'p3', name: 'Póster / Lámina Ciudad IA', price: '12.00€', cat: 'Merch', icon: 'fa-image', color: 'bg-rose-600', note: 'Papel Mate 200g' },
    { id: 'p4', name: 'Libreta / Journal del Viajero', price: '14.00€', cat: 'Merch', icon: 'fa-book-open', color: 'bg-slate-700', note: 'Tapa Dura' }
];

export const Shop: React.FC<{ user: UserProfile, onPurchase: (reward: number) => void }> = ({ user, onPurchase }) => {
    const [activeCat, setActiveCat] = useState('Digital');
    const t = SHOP_TEXTS[user.language] || SHOP_TEXTS.es;

    const openStore = (url: string) => {
        if (url !== '#') window.open(url, '_blank');
    };

    return (
        <div className="pb-44 animate-fade-in bg-[#020617] min-h-full">
            {/* Header con estilo Marketplace */}
            <header className="bg-gradient-to-b from-purple-900/40 to-slate-950 p-10 rounded-b-[4rem] border-b border-purple-500/20">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{t.title}</h2>
                        <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em]">{t.subtitle}</p>
                    </div>
                </div>

                {/* Accesos Rápidos a Tiendas Reales */}
                <div className="mt-8">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-4 ml-1">{t.official}</p>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {EXTERNAL_STORES.map(store => (
                            <button 
                                key={store.id} 
                                onClick={() => openStore(store.url)}
                                className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                            >
                                <div className={`w-8 h-8 rounded-lg ${store.color} flex items-center justify-center text-white text-xs shadow-lg`}>
                                    <i className={`fab ${store.icon}`}></i>
                                </div>
                                <span className="text-[10px] font-black text-white whitespace-nowrap">{store.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Categorías de Productos */}
            <nav className="px-8 mt-10 flex gap-3 overflow-x-auto no-scrollbar">
                {Object.keys(t.cats).map(c => (
                    <button 
                        key={c} 
                        onClick={() => setActiveCat(c)} 
                        className={`px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border
                            ${activeCat === c ? 'bg-white text-slate-950 shadow-xl border-white' : 'bg-white/5 text-white/40 border-white/5'}`}
                    >
                        {t.cats[c as keyof typeof t.cats]}
                    </button>
                ))}
            </nav>

            {/* Lista de Productos */}
            <div className="p-8 grid grid-cols-1 gap-6">
                {ITEMS.filter(i => i.cat === activeCat).map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => openStore('https://www.etsy.com/es/shop/BdaiShop')}
                        className="bg-white/5 border border-white/10 rounded-[3rem] p-6 flex items-center justify-between group hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="flex items-center gap-6 relative z-10">
                            <div className={`w-16 h-16 rounded-[1.5rem] ${item.color} flex items-center justify-center text-white text-2xl shadow-lg shadow-black/40 group-hover:scale-110 transition-transform`}>
                                <i className={`fas ${item.icon}`}></i>
                            </div>
                            <div>
                                <h4 className="text-white font-black text-sm uppercase tracking-tight">{item.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs font-black text-purple-400">{item.price}</p>
                                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{item.note}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end relative z-10">
                            <button className="bg-white text-slate-950 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg group-hover:bg-purple-500 group-hover:text-white transition-all">
                                {t.buy}
                            </button>
                        </div>
                    </div>
                ))}

                {/* Banner de Envío Gratis o Promo */}
                <div className="mt-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 p-8 rounded-[3rem] text-center">
                    <i className="fas fa-truck-fast text-2xl text-purple-400 mb-3"></i>
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Envíos Internacionales</p>
                    <p className="text-[8px] text-slate-400 uppercase mt-1">Conectando viajeros con el mejor equipo global</p>
                </div>
            </div>
        </div>
    );
};
