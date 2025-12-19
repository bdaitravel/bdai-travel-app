
import React, { useState } from 'react';
import { CurrencyConverter } from './CurrencyConverter';

const INSURANCE_PROVIDERS = [
    { name: 'WorldNomads', color: 'bg-red-600', coverage: 'Full Adventure', price: '4.5€/day', icon: 'fa-shield-heart' },
    { name: 'SafetyWing', color: 'bg-blue-400', coverage: 'Digital Nomad', price: '1.2€/day', icon: 'fa-laptop-code' },
    { name: 'Heymondo', color: 'bg-green-600', coverage: 'Smart Choice', price: '2.8€/day', icon: 'fa-check-double' },
];

const ESIM_PROVIDERS = [
    { name: 'Airalo', region: 'Global', data: '10GB', validity: '30 days', price: '22€', icon: 'fa-sim-card' },
    { name: 'Holafly', region: 'Unlimited Data', data: '∞ GB', validity: '15 days', price: '47€', icon: 'fa-bolt' },
    { name: 'Nomad', region: 'Local Plans', data: '5GB', validity: '15 days', price: '12€', icon: 'fa-signal' },
];

const HOTEL_PROVIDERS = [
    { name: 'Booking.com', rating: '4.8', feature: 'Cancelación Gratuita', deal: '-15% Genius', color: 'bg-blue-800', icon: 'fa-hotel' },
    { name: 'Airbnb', rating: '4.7', feature: 'Experiencias Únicas', deal: 'Desde 45€/noche', color: 'bg-rose-500', icon: 'fa-house-chimney-user' },
    { name: 'Expedia', rating: '4.5', feature: 'Vuelo + Hotel', deal: 'Puntos Reward', color: 'bg-indigo-600', icon: 'fa-suitcase-rolling' },
];

const UI_TEXTS: any = {
    en: { 
        title: "Traveler Toolkit", 
        insurance: "Travel Insurance", 
        esim: "Digital eSIM Plans", 
        hotels: "Hotels & Stays",
        search: "Search Destination", 
        findStay: "Find your next stay",
        compareHotels: "Compare top booking sites",
        checkIn: "Check-in",
        checkOut: "Check-out",
        guests: "Guests",
        searchBtn: "Search Stays"
    },
    es: { 
        title: "Herramientas", 
        insurance: "Seguro de Viaje", 
        esim: "Planes eSIM Digital", 
        hotels: "Hoteles y Alojamientos",
        search: "Buscar Destino", 
        findStay: "Encuentra tu próximo alojamiento",
        compareHotels: "Compara los mejores portales",
        checkIn: "Entrada",
        checkOut: "Salida",
        guests: "Personas",
        searchBtn: "Buscar Alojamiento"
    }
};

export const TravelServices: React.FC<{ language?: string }> = ({ language = 'es' }) => {
    const t = UI_TEXTS[language] || UI_TEXTS['en'];
    const [destination, setDestination] = useState('');
    const [searching, setSearching] = useState(false);

    const handleSearch = () => {
        setSearching(true);
        setTimeout(() => setSearching(false), 1500);
    };

    return (
        <div className="pb-24 animate-fade-in space-y-8 p-6">
            <header className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 lowercase tracking-tighter">{t.title}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Global Travel Utilities</p>
            </header>

            {/* Hotels Section - Enhanced Search */}
            <section className="space-y-4">
                <div className="flex justify-between items-end">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <i className="fas fa-bed text-purple-600"></i> {t.hotels}
                    </h3>
                </div>
                
                <div className="bg-white p-5 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-4 transition-all hover:shadow-2xl">
                    <div className="space-y-3">
                        <div className="relative">
                            <i className="fas fa-location-dot absolute left-4 top-3.5 text-purple-500"></i>
                            <input 
                                type="text" 
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                placeholder={t.findStay}
                                className="w-full bg-slate-50 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all border border-slate-100"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">{t.checkIn}</label>
                                <input type="date" className="w-full bg-transparent text-xs font-bold outline-none text-slate-800" />
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">{t.checkOut}</label>
                                <input type="date" className="w-full bg-transparent text-xs font-bold outline-none text-slate-800" />
                            </div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">{t.guests}</label>
                                <p className="text-xs font-bold text-slate-800">2 Adultos, 0 Niños</p>
                            </div>
                            <i className="fas fa-users text-slate-300"></i>
                        </div>

                        <button 
                            onClick={handleSearch}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${searching ? 'bg-slate-100 text-slate-400' : 'bg-purple-600 text-white shadow-lg active:scale-95'}`}
                        >
                            {searching ? <><i className="fas fa-spinner fa-spin"></i> Buscando...</> : <><i className="fas fa-search"></i> {t.searchBtn}</>}
                        </button>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.compareHotels}</p>
                        {HOTEL_PROVIDERS.map(hotel => (
                            <div key={hotel.name} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${hotel.color} text-white flex items-center justify-center shadow-md`}>
                                        <i className={`fas ${hotel.icon} text-sm`}></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{hotel.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{hotel.feature}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 mb-0.5">
                                        <i className="fas fa-star text-yellow-400 text-[8px]"></i>
                                        <span className="text-[10px] font-black text-slate-800">{hotel.rating}</span>
                                    </div>
                                    <p className="text-[9px] font-black text-green-600 uppercase tracking-tighter">{hotel.deal}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* eSIM Section */}
            <section className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <i className="fas fa-sim-card text-purple-600"></i> {t.esim}
                </h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                    {ESIM_PROVIDERS.map(plan => (
                        <div key={plan.name} className="w-56 flex-shrink-0 bg-slate-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-xl border border-white/5 group">
                            <i className={`fas ${plan.icon} absolute -right-4 -top-4 text-6xl text-white/5 transition-transform group-hover:scale-110`}></i>
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-2">{plan.name}</p>
                            <h4 className="text-xl font-black mb-1">{plan.region}</h4>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-black">{plan.data}</span>
                                <span className="text-xs text-white/40 font-bold">/ {plan.validity}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-2xl font-black text-yellow-400">{plan.price}</p>
                                <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-all"><i className="fas fa-plus"></i></button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Insurance Section */}
            <section className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <i className="fas fa-user-shield text-purple-600"></i> {t.insurance}
                </h3>
                <div className="space-y-3">
                    {INSURANCE_PROVIDERS.map(item => (
                        <div key={item.name} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl ${item.color} text-white flex items-center justify-center shadow-lg`}>
                                    <i className={`fas ${item.icon} text-lg`}></i>
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 leading-none mb-1">{item.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.coverage}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-purple-600">{item.price}</p>
                                <button className="text-[9px] font-black uppercase text-slate-300 group-hover:text-purple-500 transition-colors">Select <i className="fas fa-chevron-right ml-1"></i></button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Currency Section */}
            <section className="space-y-4">
                <CurrencyConverter language={language} />
            </section>
        </div>
    );
};
