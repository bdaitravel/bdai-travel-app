
import React, { useState } from 'react';

const UI_LABELS: Record<string, any> = {
    es: { 
        hubTitle: "Intel Global", hubSub: "Galería de Ciudades Globales", homeTitle: "Ciudades Top", homeSub: "Destinos Imprescindibles", villagesTitle: "Joyas Rurales", villagesSub: "Pueblos con Encanto", catVisited: "Iconos", catGrowth: "En Auge", catExotic: "Exóticos", loading: "Sincronizando...", defaultTheme: "Explorar",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Sevilla': 'Sevilla', 'Valencia': 'Valencia', 'Málaga': 'Málaga', 'Bilbao': 'Bilbao', 'París': 'París', 'Tokio': 'Tokio', 'Nueva York': 'Nueva York', 'Roma': 'Roma', 'Londres': 'Londres', 'El Cairo': 'El Cairo', 'Estambul': 'Estambul', 'Kioto': 'Kioto', 'Tiflis': 'Tiflis', 'Medellín': 'Medellín', 'Chefchaouen': 'Chefchaouen' },
        themes: { 'Madrid': 'Capital Histórica', 'Barcelona': 'Modernismo Vivo', 'Sevilla': 'Esencia Mudéjar', 'Valencia': 'Ciudad de las Artes', 'Málaga': 'Costa de Picasso', 'Bilbao': 'Alma de Titanio', 'París': 'La Ciudad de la Luz', 'Tokio': 'Cyberpunk Real', 'Nueva York': 'Centro del Mundo', 'Roma': 'La Ciudad Eterna', 'Londres': 'Legado Imperial', 'El Cairo': 'Misterio Faraónico', 'Estambul': 'Puente de Imperios', 'Kioto': 'Tradición Zen' }
    },
    en: { 
        hubTitle: "Global Intel", hubSub: "Global Cities Gallery", homeTitle: "Top Cities", homeSub: "Must-Visit Destinations", villagesTitle: "Rural Gems", villagesSub: "Charming Villages", catVisited: "Icons", catGrowth: "Rising Stars", catExotic: "Exotics", loading: "Syncing...", defaultTheme: "Explore",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Sevilla': 'Seville', 'Valencia': 'Valencia', 'Málaga': 'Malaga', 'Bilbao': 'Bilbao', 'París': 'Paris', 'Tokio': 'Tokyo', 'Nueva York': 'New York', 'Roma': 'Rome', 'Londres': 'London', 'El Cairo': 'Cairo', 'Estambul': 'Istanbul', 'Kioto': 'Kyoto' },
        themes: { 'Madrid': 'Historical Capital', 'Barcelona': 'Modernism', 'Sevilla': 'Mudejar Essence', 'Valencia': 'City of Arts', 'Málaga': 'Picasso\'s Coast', 'Bilbao': 'Titanium Soul', 'París': 'City of Light', 'Tokio': 'Cyberpunk Reality', 'Nueva York': 'World Center', 'Roma': 'The Eternal City', 'Londres': 'Imperial Legacy', 'El Cairo': 'Pharaonic Mystery', 'Estambul': 'Empire Bridge', 'Kioto': 'Zen Tradition' }
    }
};

const HUB_CATEGORIES: any = {
    visited: [
        { name: 'París', color: 'from-blue-600 to-slate-900', icon: 'fa-tower-eiffel', theme: 'La Ciudad de la Luz' },
        { name: 'Tokio', color: 'from-fuchsia-700 to-slate-950', icon: 'fa-torii-gate', theme: 'Cyberpunk Real' },
        { name: 'Nueva York', color: 'from-slate-700 to-black', icon: 'fa-city', theme: 'Centro del Mundo' },
        { name: 'Roma', color: 'from-orange-700 to-slate-950', icon: 'fa-landmark', theme: 'La Ciudad Eterna' }
    ],
    growth: [
        { name: 'Tiflis', color: 'from-rose-700 to-stone-900', icon: 'fa-mountain-city', theme: 'Encanto del Cáucaso' },
        { name: 'Medellín', color: 'from-green-700 to-slate-900', icon: 'fa-leaf', theme: 'Eterna Primavera' }
    ],
    exotic: [
        { name: 'Chefchaouen', color: 'from-blue-500 to-slate-950', icon: 'fa-mosque', theme: 'La Perla Azul' }
    ]
};

const SPAIN_CITIES = [
    { name: 'Madrid', color: 'from-orange-600 to-slate-900', icon: 'fa-building-columns' },
    { name: 'Barcelona', color: 'from-blue-700 to-slate-950', icon: 'fa-church' },
    { name: 'Sevilla', color: 'from-amber-600 to-stone-900', icon: 'fa-fan' }
];

const CityItem: React.FC<{ city: any, onSelect: (name: string) => void, language: string, small?: boolean }> = ({ city, onSelect, language, small }) => {
    const l = UI_LABELS[language] || UI_LABELS.es;
    const translatedName = l.cityNames?.[city.name] || city.name;
    const translatedTheme = l.themes?.[city.name] || city.theme || l.defaultTheme || 'Explore';
    
    return (
        <div 
            onClick={() => onSelect(city.name)} 
            className={`${small ? 'h-32' : 'h-36'} bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden relative group cursor-pointer shadow-xl transition-all hover:scale-[1.02] active:scale-95`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${city.color} opacity-30 group-hover:opacity-50 transition-opacity`}></div>
            <div className="absolute top-4 right-6 text-white/5 text-5xl group-hover:rotate-6 transition-transform">
                <i className={`fas ${city.icon}`}></i>
            </div>
            <div className="absolute bottom-5 left-6 right-6">
                <p className="text-[6px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1 opacity-80">{translatedTheme}</p>
                <h4 className="font-black text-white text-xl tracking-tighter uppercase leading-none truncate">{translatedName}</h4>
            </div>
        </div>
    );
};

export const TravelServices: React.FC<any> = ({ mode, language = 'es', onCitySelect }) => {
    const l = UI_LABELS[language] || UI_LABELS.es;
    const [activeHubCat, setActiveHubCat] = useState<'visited' | 'growth' | 'exotic'>('visited');
    
    if (mode === 'HUB') {
        return (
            <div className="space-y-6 pb-40 animate-fade-in">
                <header>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{l.hubTitle}</h3>
                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.3em] mt-1">{l.hubSub}</p>
                </header>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {(['visited', 'growth', 'exotic'] as const).map(cat => (
                        <button key={cat} onClick={() => setActiveHubCat(cat)} className={`px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeHubCat === cat ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 border-white/5 text-white/40'}`}>
                            {cat === 'visited' ? l.catVisited : (cat === 'growth' ? l.catGrowth : l.catExotic)}
                        </button>
                    ))}
                </div>
                <section className="grid grid-cols-2 gap-3">
                    {(HUB_CATEGORIES[activeHubCat] || []).map((city: any) => (
                        <CityItem key={city.name} city={city} onSelect={onCitySelect} language={language} small />
                    ))}
                </section>
            </div>
        );
    }
    return (
        <div className="space-y-10 pb-32 animate-fade-in">
            <div className="space-y-4">
                <header>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{l.homeTitle}</h3>
                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.3em] mt-1">{l.homeSub}</p>
                </header>
                <section className="grid grid-cols-2 gap-3">
                    {SPAIN_CITIES.map(city => (
                        <CityItem key={city.name} city={city} onSelect={onCitySelect} language={language} small />
                    ))}
                </section>
            </div>
        </div>
    );
};
