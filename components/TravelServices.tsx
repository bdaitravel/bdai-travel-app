
import React, { useState } from 'react';

const UI_LABELS: any = {
    en: { hubTitle: "Explore the World", hubSub: "Smart Global Destinations", homeTitle: "Explore Spain", homeSub: "Major Capitals", villagesTitle: "Charming Villages", villagesSub: "Spanish Rural Gems", catVisited: "Global Icons", catGrowth: "Rising Stars", catExotic: "Exotic", loading: "Syncing...", 
          themes: { 'Madrid': 'Historical Capital', 'Barcelona': 'Living Modernism', 'Sevilla': 'Mudejar Essence', 'Albarracín': 'Medieval Treasure', 'Cudillero': 'Marine Amphitheater', 'Ronda': 'The Dream City', 'Santillana del Mar': 'Medieval Town', 'París': 'The City of Light', 'Tokio': 'Cyberpunk Reality', 'Nueva York': 'The Center of the World', 'Tiflis': 'Avant-garde Caucasus', 'Medellín': 'Tropical Innovation', 'Da Nang': 'Future of Vietnam', 'Socotra': 'Forgotten Planet', 'Petra': 'Stone City', 'Wadi Rum': 'Valley of the Moon' }
    },
    es: { hubTitle: "Explora el Mundo", hubSub: "Destinos Globales Inteligentes", homeTitle: "Explora España", homeSub: "Grandes Capitales", villagesTitle: "Pueblos con Encanto", villagesSub: "Joyas Rurales de España", catVisited: "Iconos Mundiales", catGrowth: "Joyas en Auge", catExotic: "Exóticos", loading: "Sincronizando...",
          themes: { 'Madrid': 'Capital Histórica', 'Barcelona': 'Modernismo Vivo', 'Sevilla': 'Esencia Mudéjar', 'Albarracín': 'Tesoro Medieval', 'Cudillero': 'Anfiteatro Marino', 'Ronda': 'La Ciudad Soñada', 'Santillana del Mar': 'Villa Medieval', 'París': 'La Ciudad de la Luz', 'Tokio': 'Cyberpunk Real', 'Nueva York': 'El Centro del Mundo', 'Tiflis': 'Cáucaso Vanguardista', 'Medellín': 'Innovación Tropical', 'Da Nang': 'Futuro de Vietnam', 'Socotra': 'Planeta Olvidado', 'Petra': 'Ciudad de Piedra', 'Wadi Rum': 'Valle de la Luna' }
    },
    it: { hubTitle: "Esplora il Mondo", hubSub: "Destinazioni Globali", homeTitle: "Esplora la Spagna", homeSub: "Grandi Capitali", villagesTitle: "Borghi Incantevoli", villagesSub: "Gemme Rurali", catVisited: "Icone Mondiali", catGrowth: "Stelle Nascenti", catExotic: "Esotici", loading: "Sincronizzazione...",
          themes: { 'Madrid': 'Capitale Storica', 'Barcelona': 'Modernismo Vivo', 'Sevilla': 'Essenza Mudéjar', 'Albarracín': 'Tesoro Medievale', 'Cudillero': 'Anfiteatro Marino', 'Ronda': 'La Città dei Sogni', 'Santillana del Mar': 'Borgo Medievale', 'París': 'Città della Luce', 'Tokio': 'Cyberpunk Reale', 'Nueva York': 'Centro del Mondo', 'Tiflis': 'Avanguardia Caucasica', 'Medellín': 'Innovazione Tropicale', 'Da Nang': 'Futuro del Vietnam', 'Socotra': 'Pianeta Dimenticato', 'Petra': 'Città di Pietra', 'Wadi Rum': 'Valle della Luna' }
    },
    pt: { hubTitle: "Explorar o Mundo", hubSub: "Destinos Globais Inteligentes", homeTitle: "Explorar Espanha", homeSub: "Grandes Capitais", villagesTitle: "Vilas Charmosas", villagesSub: "Joias Rurais", catVisited: "Ícones Globais", catGrowth: "Estrelas em Ascensão", catExotic: "Exóticos", loading: "Sincronizando...",
          themes: { 'Madrid': 'Capital Histórica', 'Barcelona': 'Modernismo Vivo', 'Sevilla': 'Essência Mudéjar', 'Albarracín': 'Tesouro Medieval', 'Cudillero': 'Anfiteatro Marinho', 'Ronda': 'Cidade dos Sonhos', 'Santillana del Mar': 'Vila Medieval', 'París': 'Cidade Luz', 'Tokio': 'Realidade Cyberpunk', 'Nueva York': 'Centro do Mundo', 'Tiflis': 'Vanguarda do Cáucaso', 'Medellín': 'Inovação Tropical', 'Da Nang': 'Futuro do Vietnã', 'Socotra': 'Planeta Esquecido', 'Petra': 'Cidade de Pedra', 'Wadi Rum': 'Vale da Lua' }
    },
    fr: { hubTitle: "Explorer le Monde", hubSub: "Destinations Intelligentes", homeTitle: "Explorer l'Espagne", homeSub: "Grandes Capitales", villagesTitle: "Villages de Charme", villagesSub: "Joyaux Ruraux", catVisited: "Icônes", catGrowth: "Étoiles Montantes", catExotic: "Exotique", loading: "Sync...",
          themes: { 'Madrid': 'Capitale Historique', 'Barcelona': 'Modernisme Vivant', 'Sevilla': 'Essence Mudéjar', 'París': 'Ville Lumière', 'Tokio': 'Réalité Cyberpunk', 'Nueva York': 'Centre du Monde' }
    },
    de: { hubTitle: "Welt Erkunden", hubSub: "Intelligente Reiseziele", homeTitle: "Spanien Erkunden", homeSub: "Große Hauptstädte", villagesTitle: "Charmante Dörfer", villagesSub: "Ländliche Juwelen", catVisited: "Globale Ikonen", catGrowth: "Aufstrebende Sterne", catExotic: "Exotisch", loading: "Sync...",
          themes: { 'Madrid': 'Historische Hauptstadt', 'Barcelona': 'Lebendiger Modernismus', 'Sevilla': 'Mudéjar-Essenz', 'París': 'Stadt der Lichter', 'Tokio': 'Cyberpunk-Realität', 'Nueva York': 'Zentrum der Welt' }
    }
};

const SPAIN_CITIES = [
    { name: 'Madrid', color: 'from-orange-600 to-slate-900', icon: 'fa-building-columns' },
    { name: 'Barcelona', color: 'from-blue-700 to-slate-950', icon: 'fa-church' },
    { name: 'Sevilla', color: 'from-amber-600 to-stone-900', icon: 'fa-fan' }
];

const SPAIN_VILLAGES = [
    { name: 'Albarracín', color: 'from-red-800 to-stone-900', icon: 'fa-fort-awesome' },
    { name: 'Cudillero', color: 'from-cyan-700 to-slate-900', icon: 'fa-anchor' },
    { name: 'Ronda', color: 'from-emerald-700 to-slate-900', icon: 'fa-bridge' },
    { name: 'Santillana del Mar', color: 'from-stone-600 to-slate-950', icon: 'fa-scroll' }
];

const HUB_CATEGORIES: any = {
    visited: [
        { name: 'París', color: 'from-blue-600 to-slate-900', icon: 'fa-tower-eiffel' },
        { name: 'Tokio', color: 'from-fuchsia-700 to-slate-950', icon: 'fa-torii-gate' },
        { name: 'Nueva York', color: 'from-slate-700 to-black', icon: 'fa-city' }
    ],
    growth: [
        { name: 'Tiflis', color: 'from-rose-700 to-stone-900', icon: 'fa-mountain-city' },
        { name: 'Medellín', color: 'from-green-700 to-slate-900', icon: 'fa-leaf' },
        { name: 'Da Nang', color: 'from-yellow-600 to-stone-900', icon: 'fa-dragon' }
    ],
    exotic: [
        { name: 'Socotra', color: 'from-teal-800 to-slate-950', icon: 'fa-tree' },
        { name: 'Petra', color: 'from-orange-800 to-red-950', icon: 'fa-archway' },
        { name: 'Wadi Rum', color: 'from-red-600 to-orange-950', icon: 'fa-sun' }
    ]
};

const CityItem: React.FC<{ city: any, onSelect: (name: string) => void, language: string }> = ({ city, onSelect, language }) => {
    const l = UI_LABELS[language] || UI_LABELS.es;
    const translatedTheme = l.themes[city.name] || city.theme || 'Explora';
    
    return (
        <div onClick={() => onSelect(city.name)} className="h-44 bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden relative group cursor-pointer shadow-2xl transition-all hover:scale-[1.02]">
            <div className={`absolute inset-0 bg-gradient-to-br ${city.color} opacity-40 group-hover:opacity-60 transition-opacity`}></div>
            <div className="absolute top-6 right-8 text-white/5 text-7xl group-hover:rotate-6 transition-transform"><i className={`fas ${city.icon}`}></i></div>
            <div className="absolute bottom-8 left-8 right-8">
                <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">{translatedTheme}</p>
                <h4 className="font-black text-white text-3xl tracking-tighter uppercase leading-none">{city.name}</h4>
            </div>
        </div>
    );
};

export const TravelServices: React.FC<any> = ({ mode, language = 'es', onCitySelect }) => {
    const l = UI_LABELS[language] || UI_LABELS.es;
    const [activeHubCat, setActiveHubCat] = useState<'visited' | 'growth' | 'exotic'>('visited');
    
    if (mode === 'HUB') {
        return (
            <div className="space-y-8 pb-40 animate-fade-in">
                <header><h3 className="text-3xl font-black text-white tracking-tighter uppercase">{l.hubTitle}</h3><p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mt-1">{l.hubSub}</p></header>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {(['visited', 'growth', 'exotic'] as const).map(cat => (
                        <button key={cat} onClick={() => setActiveHubCat(cat)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeHubCat === cat ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-white/40'}`}>{l[`cat${cat.charAt(0).toUpperCase() + cat.slice(1)}`]}</button>
                    ))}
                </div>
                <section className="space-y-5">{HUB_CATEGORIES[activeHubCat].map((city: any) => <CityItem key={city.name} city={city} onSelect={onCitySelect} language={language} />)}</section>
            </div>
        );
    }
    return (
        <div className="space-y-12 pb-32 animate-fade-in">
            <div className="space-y-6"><header><h3 className="text-3xl font-black text-white tracking-tighter uppercase">{l.homeTitle}</h3><p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mt-1">{l.homeSub}</p></header>
                <section className="space-y-5">{SPAIN_CITIES.map(city => <CityItem key={city.name} city={city} onSelect={onCitySelect} language={language} />)}</section>
            </div>
            <div className="space-y-6"><header><h3 className="text-3xl font-black text-white tracking-tighter uppercase">{l.villagesTitle}</h3><p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mt-1">{l.villagesSub}</p></header>
                <section className="space-y-5">{SPAIN_VILLAGES.map(village => <CityItem key={village.name} city={village} onSelect={onCitySelect} language={language} />)}</section>
            </div>
        </div>
    );
};
