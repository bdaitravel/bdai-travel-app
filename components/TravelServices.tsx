
import React, { useState } from 'react';

const UI_LABELS: any = {
    es: { 
        hubTitle: "Explora el Mundo", hubSub: "Destinos Globales Inteligentes", 
        homeTitle: "Explora España", homeSub: "Grandes Capitales",
        villagesTitle: "Pueblos con Encanto", villagesSub: "Joyas Rurales de España",
        catVisited: "Iconos Mundiales", catGrowth: "Joyas en Auge", catExotic: "Destinos Exóticos",
        loading: "Sincronizando con satélites..." 
    },
    en: { 
        hubTitle: "Explore the World", hubSub: "Smart Global Destinations", 
        homeTitle: "Explore Spain", homeSub: "Major Capitals",
        villagesTitle: "Charming Villages", villagesSub: "Spanish Rural Gems",
        catVisited: "Global Icons", catGrowth: "Rising Stars", catExotic: "Exotic Destinations",
        loading: "Syncing with satellites..." 
    },
    ca: { 
        hubTitle: "Explora el Món", hubSub: "Destins Globals Intel·ligents", 
        homeTitle: "Explora Espanya", homeSub: "Grans Capitals",
        villagesTitle: "Pobles amb Encant", villagesSub: "Joies Rurals d'Espanya",
        catVisited: "Icones Mundials", catGrowth: "Joies en Auge", catExotic: "Destins Exòtics",
        loading: "Sincronitzant..." 
    },
    eu: { 
        hubTitle: "Mundua Esploratu", hubSub: "Nazioarteko Helmuga Adimentsuak", 
        homeTitle: "Espainia Esploratu", homeSub: "Hiriburu Handiak",
        villagesTitle: "Herri Xarmangarriak", villagesSub: "Espainiako Landa Bitxiak",
        catVisited: "Ikonikoak", catGrowth: "Goraka Doazenak", catExotic: " Helmuga Exotikoak",
        loading: "Sateliteekin sinkronizatzen..." 
    },
    fr: { 
        hubTitle: "Explorer le Monde", hubSub: "Destinations Globales Intelligentes", 
        homeTitle: "Explorer l'Espagne", homeSub: "Grandes Capitales",
        villagesTitle: "Villages de Charme", villagesSub: "Joyaux Ruraux d'Espagne",
        catVisited: "Icônes Mondiales", catGrowth: "Destinations en Vogue", catExotic: "Destinations Exotiques",
        loading: "Synchronisation..." 
    }
};

const SPAIN_CITIES = [
    { name: 'Madrid', theme: 'Capital Histórica', color: 'from-orange-600 to-slate-900', icon: 'fa-building-columns' },
    { name: 'Barcelona', theme: 'Modernismo Vivo', color: 'from-blue-700 to-slate-950', icon: 'fa-church' },
    { name: 'Sevilla', theme: 'Esencia Mudéjar', color: 'from-amber-600 to-stone-900', icon: 'fa-fan' }
];

const SPAIN_VILLAGES = [
    { name: 'Albarracín', theme: 'Tesoro Medieval', color: 'from-red-800 to-stone-900', icon: 'fa-fort-awesome' },
    { name: 'Cudillero', theme: 'Anfiteatro Marino', color: 'from-cyan-700 to-slate-900', icon: 'fa-anchor' },
    { name: 'Ronda', theme: 'La Ciudad Soñada', color: 'from-emerald-700 to-slate-900', icon: 'fa-bridge' },
    { name: 'Santillana del Mar', theme: 'La Villa de las Tres Mentiras', color: 'from-stone-600 to-slate-950', icon: 'fa-scroll' }
];

const HUB_CATEGORIES: any = {
    visited: [
        { name: 'París', theme: 'La Ciudad de la Luz', color: 'from-blue-600 to-slate-900', icon: 'fa-tower-eiffel' },
        { name: 'Tokio', theme: 'Cyberpunk Real', color: 'from-fuchsia-700 to-slate-950', icon: 'fa-torii-gate' },
        { name: 'Nueva York', theme: 'El Centro del Mundo', color: 'from-slate-700 to-black', icon: 'fa-city' }
    ],
    growth: [
        { name: 'Tiflis', theme: 'Vanguardia del Cáucaso', color: 'from-rose-700 to-stone-900', icon: 'fa-mountain-city' },
        { name: 'Medellín', theme: 'Innovación Tropical', color: 'from-green-700 to-slate-900', icon: 'fa-leaf' },
        { name: 'Da Nang', theme: 'Futuro de Vietnam', color: 'from-yellow-600 to-stone-900', icon: 'fa-dragon' }
    ],
    exotic: [
        { name: 'Socotra', theme: 'El Planeta Olvidado', color: 'from-teal-800 to-slate-950', icon: 'fa-tree' },
        { name: 'Petra', theme: 'La Ciudad de Piedra', color: 'from-orange-800 to-red-950', icon: 'fa-archway' },
        { name: 'Wadi Rum', theme: 'El Valle de la Luna', color: 'from-red-600 to-orange-950', icon: 'fa-sun' }
    ]
};

const CityItem: React.FC<{ city: any, onSelect: (name: string) => void }> = ({ city, onSelect }) => (
    <div 
        onClick={() => onSelect(city.name)}
        className="h-44 bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden relative group cursor-pointer shadow-2xl transition-all hover:scale-[1.02] hover:border-purple-500/40"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${city.color} opacity-40 group-hover:opacity-60 transition-opacity`}></div>
        <div className="absolute top-6 right-8 text-white/5 text-7xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
            <i className={`fas ${city.icon}`}></i>
        </div>
        <div className="absolute bottom-8 left-8 right-8">
            <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">{city.theme}</p>
            <h4 className="font-black text-white text-3xl tracking-tighter uppercase leading-none">{city.name}</h4>
        </div>
    </div>
);

export const TravelServices: React.FC<{ mode: 'HOME' | 'HUB', language?: string, onCitySelect: (city: string) => void }> = ({ mode, language = 'es', onCitySelect }) => {
    const l = UI_LABELS[language] || UI_LABELS.es;
    const [activeHubCat, setActiveHubCat] = useState<'visited' | 'growth' | 'exotic'>('visited');

    if (mode === 'HUB') {
        return (
            <div className="space-y-8 pb-40 animate-fade-in">
                <header className="px-8 pt-4">
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{l.hubTitle}</h3>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mt-1">{l.hubSub}</p>
                </header>

                <div className="flex gap-2 overflow-x-auto no-scrollbar px-8 pb-2">
                    {(['visited', 'growth', 'exotic'] as const).map((cat) => (
                        <button 
                            key={cat} 
                            onClick={() => setActiveHubCat(cat)}
                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeHubCat === cat ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-white/40'}`}
                        >
                            {l[`cat${cat.charAt(0).toUpperCase() + cat.slice(1)}`]}
                        </button>
                    ))}
                </div>

                <section className="px-8 space-y-5">
                    {HUB_CATEGORIES[activeHubCat].map((city: any) => (
                        <CityItem key={city.name} city={city} onSelect={onCitySelect} />
                    ))}
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-32 animate-fade-in">
            <div className="space-y-6">
                <header className="px-8">
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{l.homeTitle}</h3>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mt-1">{l.homeSub}</p>
                </header>
                <section className="px-8 space-y-5">
                    {SPAIN_CITIES.map(city => (
                        <CityItem key={city.name} city={city} onSelect={onCitySelect} />
                    ))}
                </section>
            </div>

            <div className="space-y-6">
                <header className="px-8">
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{l.villagesTitle}</h3>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mt-1">{l.villagesSub}</p>
                </header>
                <section className="px-8 space-y-5">
                    {SPAIN_VILLAGES.map(village => (
                        <CityItem key={village.name} city={village} onSelect={onCitySelect} />
                    ))}
                </section>
            </div>
        </div>
    );
};
