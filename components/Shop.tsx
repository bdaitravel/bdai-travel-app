
import React, { useState } from 'react';
import { UserProfile } from '../types';

const SHOP_TEXTS: any = {
    en: { title: "bdai shop", subtitle: "Official Digital Gear", buy: "Acquire", miles: "miles", cats: { 'Routes': 'AI Tours', 'Gear': 'Equipment', 'Vip': 'Premium' } },
    es: { title: "tienda bdai", subtitle: "Equipamiento Digital", buy: "Adquirir", miles: "millas", cats: { 'Routes': 'Rutas IA', 'Gear': 'Equipo', 'Vip': 'Premium' } },
    fr: { title: "boutique bdai", subtitle: "Équipement Numérique", buy: "Acheter", miles: "miles", cats: { 'Routes': 'Routes IA', 'Gear': 'Équipement', 'Vip': 'Premium' } },
    ca: { title: "botiga bdai", subtitle: "Equipament Digital", buy: "Adquirir", miles: "milles", cats: { 'Routes': 'Rutes IA', 'Gear': 'Equipament', 'Vip': 'Premium' } },
    eu: { title: "bdai denda", subtitle: "Tresneria Digitala", buy: "Eskuratu", miles: "miliak", cats: { 'Routes': 'IA Ibilbideak', 'Gear': 'Ekipoa', 'Vip': 'Premium' } }
};

const ITEMS = [
    { id: '1', name: 'Premium Guide: Tokyo Tech', price: 1500, cat: 'Routes', icon: 'fa-robot', color: 'bg-pink-600' },
    { id: '2', name: 'Tactical Backpack BDAI', price: 5000, cat: 'Gear', icon: 'fa-briefcase', color: 'bg-slate-700' },
    { id: '3', name: 'Global eSIM 20GB', price: 3500, cat: 'Vip', icon: 'fa-wifi', color: 'bg-blue-600' }
];

export const Shop: React.FC<{ user: UserProfile, onPurchase: (reward: number) => void }> = ({ user, onPurchase }) => {
    const [activeCat, setActiveCat] = useState('Routes');
    const t = SHOP_TEXTS[user.language] || SHOP_TEXTS.es;

    return (
        <div className="pb-44 animate-fade-in bg-[#020617] min-h-full">
            <header className="bg-gradient-to-b from-purple-900/40 to-slate-950 p-10 rounded-b-[4rem] border-b border-purple-500/20">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{t.title}</h2>
                        <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em]">{t.subtitle}</p>
                    </div>
                    <div className="bg-white/10 px-5 py-2 rounded-2xl border border-white/10 text-[10px] font-black text-white">
                        <i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}
                    </div>
                </div>
            </header>

            <nav className="px-8 mt-10 flex gap-3 overflow-x-auto no-scrollbar">
                {Object.keys(t.cats).map(c => (
                    <button key={c} onClick={() => setActiveCat(c)} className={`px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCat === c ? 'bg-white text-slate-950 shadow-xl' : 'bg-white/5 text-white/40 border border-white/5'}`}>
                        {t.cats[c as keyof typeof t.cats]}
                    </button>
                ))}
            </nav>

            <div className="p-8 grid grid-cols-1 gap-6">
                {ITEMS.filter(i => i.cat === activeCat).map(item => (
                    <div key={item.id} className="bg-white/5 border border-white/10 rounded-[3rem] p-6 flex items-center justify-between group hover:border-purple-500/40 transition-all">
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-[1.5rem] ${item.color} flex items-center justify-center text-white text-2xl shadow-lg shadow-black/40`}>
                                <i className={`fas ${item.icon}`}></i>
                            </div>
                            <div>
                                <h4 className="text-white font-black text-sm uppercase tracking-tight">{item.name}</h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{item.price} {t.miles}</p>
                            </div>
                        </div>
                        <button className="bg-white text-slate-950 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
