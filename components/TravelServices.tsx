
import React, { useState } from 'react';

const UI_LABELS: Record<string, any> = {
    es: { 
        hubTitle: "Intel Global", hubSub: "Galería de Ciudades Globales", homeTitle: "Ciudades Top", homeSub: "Destinos Imprescindibles", villagesTitle: "Joyas Rurales", villagesSub: "Pueblos con Encanto", catVisited: "Iconos", catGrowth: "En Auge", catExotic: "Exóticos", loading: "Sincronizando...", defaultTheme: "Explorar",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Sevilla': 'Sevilla', 'Valencia': 'Valencia', 'Málaga': 'Málaga', 'Bilbao': 'Bilbao', 'París': 'París', 'Tokio': 'Tokio', 'Nueva York': 'Nueva York', 'Roma': 'Roma', 'Londres': 'Londres', 'El Cairo': 'El Cairo', 'Estambul': 'Estambul', 'Kioto': 'Kioto', 'Tiflis': 'Tiflis', 'Medellín': 'Medellín', 'Luang Prabang': 'Luang Prabang', 'Gjirokastër': 'Gjirokastër', 'Samarcanda': 'Samarcanda', 'Da Nang': 'Da Nang', 'Ciudad de México': 'CDMX', 'Ho Chi Minh': 'Ho Chi Minh' },
        themes: { 'Madrid': 'Capital Histórica', 'Barcelona': 'Modernismo Vivo', 'Sevilla': 'Esencia Mudéjar', 'Valencia': 'Ciudad de las Artes', 'Málaga': 'Costa de Picasso', 'Bilbao': 'Alma de Titanio', 'París': 'La Ciudad de la Luz', 'Tokio': 'Cyberpunk Real', 'Nueva York': 'Centro del Mundo', 'Roma': 'La Ciudad Eterna', 'Londres': 'Legado Imperial', 'El Cairo': 'Misterio Faraónico', 'Estambul': 'Puente de Imperios', 'Kioto': 'Tradición Zen' }
    },
    en: { 
        hubTitle: "Global Intel", hubSub: "Global Cities Gallery", homeTitle: "Top Cities", homeSub: "Must-Visit Destinations", villagesTitle: "Rural Gems", villagesSub: "Charming Villages", catVisited: "Icons", catGrowth: "Rising Stars", catExotic: "Exotics", loading: "Syncing...", defaultTheme: "Explore",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Sevilla': 'Seville', 'Valencia': 'Valencia', 'Málaga': 'Malaga', 'Bilbao': 'Bilbao', 'París': 'Paris', 'Tokio': 'Tokyo', 'Nueva York': 'New York', 'Roma': 'Rome', 'Londres': 'London', 'El Cairo': 'Cairo', 'Estambul': 'Istanbul', 'Kioto': 'Kyoto', 'Tiflis': 'Tbilisi', 'Medellín': 'Medellin', 'Luang Prabang': 'Luang Prabang', 'Gjirokastër': 'Gjirokaster', 'Samarcanda': 'Samarkand', 'Da Nang': 'Da Nang', 'Ciudad de México': 'Mexico City', 'Ho Chi Minh': 'Ho Chi Minh' },
        themes: { 'Madrid': 'Historical Capital', 'Barcelona': 'Modernism', 'Sevilla': 'Mudejar Essence', 'Valencia': 'City of Arts', 'Málaga': 'Picasso\'s Coast', 'Bilbao': 'Titanium Soul', 'París': 'City of Light', 'Tokio': 'Cyberpunk Reality', 'Nueva York': 'World Center', 'Roma': 'The Eternal City', 'Londres': 'Imperial Legacy', 'El Cairo': 'Pharaonic Mystery', 'Estambul': 'Empire Bridge', 'Kioto': 'Zen Tradition' }
    },
    fr: { 
        hubTitle: "Intel Global", hubSub: "Galerie des Villes", homeTitle: "Villes Top", homeSub: "Destinations Incontournables", villagesTitle: "Joyaux Ruraux", villagesSub: "Villages de Charme", catVisited: "Icônes", catGrowth: "En Essor", catExotic: "Exotiques", loading: "Synchro...",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcelone', 'Sevilla': 'Séville', 'París': 'Paris', 'Tokio': 'Tokyo', 'Nueva York': 'New York', 'Londres': 'Londres' }
    },
    de: { hubTitle: "Globale Intel", hubSub: "Städtegalerie", homeTitle: "Top Städte", homeSub: "Top-Reiseziele", villagesTitle: "Ländliche Juwelen", cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Sevilla': 'Sevilla' } },
    it: { hubTitle: "Intel Globale", hubSub: "Galleria Città", homeTitle: "Top Città", homeSub: "Destinazioni Imperdibili", cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcellona', 'Sevilla': 'Siviglia' } },
    zh: { 
        hubTitle: "全球情报", hubSub: "全球城市画廊", homeTitle: "热门城市", homeSub: "必游目的地", villagesTitle: "乡村名胜", villagesSub: "魅力小镇", catVisited: "经典图标", catGrowth: "新兴之星", catExotic: "异域风情", loading: "同步中...",
        cityNames: { 'Madrid': '马德里', 'Barcelona': '巴塞罗那', 'Sevilla': '塞维利亚', 'Valencia': '瓦伦西亚', 'Málaga': '马拉加', 'Bilbao': '毕尔巴鄂', 'París': '巴黎', 'Tokio': '东京', 'Nueva York': '纽约', 'Roma': '罗马', 'Londres': '伦敦', 'El Cairo': '开罗', 'Estambul': '伊斯坦布尔', 'Kioto': '京都', 'Tiflis': '第比利斯', 'Medellín': '麦德林', 'Luang Prabang': '琅勃拉邦', 'Gjirokastër': '吉诺卡斯特', 'Samarcanda': '撒马尔罕', 'Da Nang': '岘港', 'Ciudad de México': '墨西哥城', 'Ho Chi Minh': '胡志明市' },
        themes: { 'Madrid': '历史之都', 'Barcelona': '现代主义', 'Sevilla': '穆德哈尔精髓', 'Valencia': '艺术之城', 'Málaga': '毕加索海岸', 'Bilbao': '钛合金之魂', 'París': '光明之城', 'Tokio': '赛博朋克现实', 'Nueva York': '世界中心', 'Roma': '永恒之城', 'Londres': '帝国遗产', 'El Cairo': '法老之谜', 'Estambul': '帝国之桥', 'Kioto': '禅宗传统' }
    },
    ja: { hubTitle: "グローバル・インテル", homeTitle: "トップ都市", cityNames: { 'Madrid': 'マドリード', 'Barcelona': 'バルセロナ', 'Sevilla': 'セビリア', 'Tokio': '東京' } }
};

const SPAIN_CITIES = [
    { name: 'Madrid', color: 'from-orange-600 to-slate-900', icon: 'fa-building-columns' },
    { name: 'Barcelona', color: 'from-blue-700 to-slate-950', icon: 'fa-church' },
    { name: 'Sevilla', color: 'from-amber-600 to-stone-900', icon: 'fa-fan' },
    { name: 'Valencia', color: 'from-cyan-500 to-slate-900', icon: 'fa-flask' },
    { name: 'Málaga', color: 'from-rose-500 to-slate-950', icon: 'fa-palette' },
    { name: 'Bilbao', color: 'from-gray-600 to-slate-900', icon: 'fa-industry' }
];

const SPAIN_VILLAGES = [
    { name: 'Albarracín', color: 'from-red-800 to-stone-900', icon: 'fa-fort-awesome' },
    { name: 'Cudillero', color: 'from-cyan-700 to-slate-900', icon: 'fa-anchor' },
    { name: 'Ronda', color: 'from-emerald-700 to-slate-900', icon: 'fa-bridge' },
    { name: 'Laguardia', color: 'from-purple-800 to-slate-950', icon: 'fa-wine-glass' },
    { name: 'Trujillo', color: 'from-amber-700 to-slate-900', icon: 'fa-horse' },
    { name: 'Valldemossa', color: 'from-green-800 to-slate-950', icon: 'fa-tree' }
];

const HUB_CATEGORIES: any = {
    visited: [
        { name: 'París', color: 'from-blue-600 to-slate-900', icon: 'fa-tower-eiffel' },
        { name: 'Tokio', color: 'from-fuchsia-700 to-slate-950', icon: 'fa-torii-gate' },
        { name: 'Nueva York', color: 'from-slate-700 to-black', icon: 'fa-city' },
        { name: 'Roma', color: 'from-orange-700 to-slate-950', icon: 'fa-landmark' },
        { name: 'Londres', color: 'from-red-700 to-slate-900', icon: 'fa-clock' },
        { name: 'El Cairo', color: 'from-yellow-700 to-slate-950', icon: 'fa-pyramids' },
        { name: 'Estambul', color: 'from-indigo-600 to-slate-900', icon: 'fa-mosque' },
        { name: 'Kioto', color: 'from-rose-600 to-slate-950', icon: 'fa-pagelines' }
    ],
    growth: [
        { name: 'Tiflis', color: 'from-rose-700 to-stone-900', icon: 'fa-mountain-city' },
        { name: 'Medellín', color: 'from-green-700 to-slate-900', icon: 'fa-leaf' },
        { name: 'Luang Prabang', color: 'from-orange-600 to-stone-950', icon: 'fa-dharmachakra' },
        { name: 'Samarcanda', color: 'from-blue-800 to-slate-900', icon: 'fa-archway' },
        { name: 'Da Nang', color: 'from-teal-600 to-slate-950', icon: 'fa-bridge-water' },
        { name: 'Ciudad de México', color: 'from-amber-800 to-slate-950', icon: 'fa-skull' },
        { name: 'Ho Chi Minh', color: 'from-red-700 to-slate-900', icon: 'fa-bolt' }
    ],
    exotic: [
        { name: 'Chefchaouen', color: 'from-blue-500 to-slate-950', icon: 'fa-mosque' },
        { name: 'Leh', color: 'from-amber-800 to-stone-950', icon: 'fa-om' },
        { name: 'Bukhara', color: 'from-yellow-600 to-stone-900', icon: 'fa-scroll' },
        { name: 'Kotor', color: 'from-teal-700 to-slate-950', icon: 'fa-ship' },
        { name: 'Yazd', color: 'from-orange-900 to-stone-950', icon: 'fa-wind' }
    ]
};

const CityItem: React.FC<{ city: any, onSelect: (name: string) => void, language: string, small?: boolean }> = ({ city, onSelect, language, small }) => {
    const l = UI_LABELS[language] || UI_LABELS.en || UI_LABELS.es;
    const translatedTheme = l.themes?.[city.name] || l.defaultTheme || 'Explore';
    const translatedName = l.cityNames?.[city.name] || city.name;
    
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
    const l = UI_LABELS[language] || UI_LABELS.en || UI_LABELS.es;
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
                    {HUB_CATEGORIES[activeHubCat].map((city: any) => (
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
            <div className="space-y-4">
                <header>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{l.villagesTitle}</h3>
                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.3em] mt-1">{l.villagesSub}</p>
                </header>
                <section className="grid grid-cols-2 gap-3">
                    {SPAIN_VILLAGES.map(village => (
                        <CityItem key={village.name} city={village} onSelect={onCitySelect} language={language} small />
                    ))}
                </section>
            </div>
        </div>
    );
};
