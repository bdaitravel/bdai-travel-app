
import React, { useState } from 'react';
import { UserProfile, TravelerRank } from '../types';

interface ShopProps { user: UserProfile; }

const DISCOUNT_MAP: Record<TravelerRank, number> = {
    'Turista': 0, 
    'Explorador': 5, 
    'Wanderer': 10, 
    'Globe-Trotter': 15, 
    'Leyenda': 20
};

const CATEGORIES = [
    {
        id: 'guias',
        name: 'Guías Premium',
        icon: 'fa-map-location-dot',
        items: [
            { id: 'g1', name: 'Barcelona en 1 día', price: 9.99, desc: 'Optimiza tu tiempo con lo mejor de Gaudí.' },
            { id: 'g2', name: 'Tokyo Photo Tour', price: 12.50, desc: 'Los spots más estéticos de Shibuya y Akihabara.' },
            { id: 'g3', name: 'Roma: 48h Gastronómicas', price: 10.99, desc: 'Huye de las trampas para turistas en el Trastevere.' },
        ]
    },
    {
        id: 'recetas',
        name: 'Recetarios Culturales',
        icon: 'fa-utensils',
        items: [
            { id: 'r1', name: 'Cocina Japonesa Casera', price: 7.50, desc: 'Aprende a cocinar Ramen y Gyoza como en casa.' },
            { id: 'r2', name: 'Recetas Riojanas Tradicionales', price: 6.99, desc: 'Los secretos de la cocina de fuego lento.' },
            { id: 'r3', name: 'Salsas del Sudeste Asiático', price: 5.50, desc: 'Domina el equilibrio entre picante, dulce y ácido.' },
        ]
    },
    {
        id: 'souvenirs',
        name: 'Souvenirs Estéticos',
        icon: 'fa-palette',
        items: [
            { id: 's1', name: 'Álbum de Viaje Digital', price: 24.99, desc: 'Generado por IA con tus mejores momentos.' },
            { id: 's2', name: 'Libreta Monumentos', price: 14.50, desc: 'Diseño minimalista para tus bocetos y notas.' },
            { id: 's3', name: 'Poster Minimalista París', price: 19.00, desc: 'Arte de pared de alta calidad (42x60cm).' },
            { id: 's4', name: 'Tote Bag Minimalista', price: 12.00, desc: 'Algodón orgánico con el logo bdai.' },
        ]
    }
];

export const Shop: React.FC<ShopProps> = ({ user }) => {
    const [activeCat, setActiveCat] = useState('guias');
    const discount = DISCOUNT_MAP[user.rank] || 0;

    return (
        <div className="p-8 animate-fade-in pb-32">
            <header className="mb-10">
                <div className="flex items-center gap-4 mb-3">
                    <div className="bg-purple-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-200">
                        <i className="fas fa-shopping-bag text-sm"></i>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter lowercase">Shop</h2>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Premium Rewards</p>
                    <div className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-2 shadow-xl shadow-purple-200">
                        <i className="fas fa-crown text-[8px]"></i> {user.rank}: -{discount}%
                    </div>
                </div>
            </header>

            <div className="flex gap-3 overflow-x-auto no-scrollbar mb-10 pb-2">
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveCat(cat.id)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border ${activeCat === cat.id ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-purple-200'}`}
                    >
                        <i className={`fas ${cat.icon} text-xs`}></i>
                        {cat.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-5">
                {CATEGORIES.find(c => c.id === activeCat)?.items.map(p => {
                    const finalPrice = p.price * (1 - discount/100);
                    return (
                        <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all duration-500 relative overflow-hidden">
                            <div className="flex items-center gap-5 relative z-10">
                                <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-2xl text-slate-300 group-hover:bg-purple-600 group-hover:text-white transition-all duration-700 shadow-inner">
                                    <i className={`fas ${CATEGORIES.find(c => c.id === activeCat)?.icon} text-xl`}></i>
                                </div>
                                <div className="max-w-[160px]">
                                    <p className="font-black text-slate-900 leading-tight mb-1 text-base tracking-tight">{p.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold line-clamp-2 leading-tight uppercase tracking-tight opacity-70">{p.desc}</p>
                                </div>
                            </div>

                            <div className="text-right relative z-10 pl-4">
                                <p className="text-[10px] font-black text-slate-300 line-through mb-1">${p.price.toFixed(2)}</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter mb-3">${finalPrice.toFixed(2)}</p>
                                <button className="bg-slate-950 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:bg-purple-600 active:scale-95 transition-all">
                                    Comprar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px] -mr-12 -mt-12 group-hover:bg-purple-600/20 transition-all duration-1000"></div>
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <h3 className="text-3xl font-black mb-2 tracking-tighter lowercase">cajero millas</h3>
                        <p className="text-[10px] text-white/40 font-bold max-w-[200px] leading-relaxed uppercase tracking-wider">Canjea tus logros por productos y experiencias únicas.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-purple-400 tracking-tighter">{user.miles.toLocaleString()}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Millas bdai</p>
                    </div>
                </div>
                <button className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-slate-50 transition-all relative z-10 active:scale-95">
                    Canjear Millas
                </button>
            </div>
        </div>
    );
};
