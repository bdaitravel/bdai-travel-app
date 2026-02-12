import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const UI_LABELS: Record<string, any> = {
    es: { hubTitle: "Intel Global", hubSub: "Masterclass Mundial", homeTitle: "Ciudades Top", homeSub: "Explora el mundo", catVisited: "Iconos", catGrowth: "En Auge", catExotic: "Ingeniería", loading: "Cargando intel...", defaultTheme: "Explorar" },
    en: { hubTitle: "Global Intel", hubSub: "World Masterclass", homeTitle: "Top Cities", homeSub: "Explore the world", catVisited: "Icons", catGrowth: "Rising Stars", catExotic: "Engineering", loading: "Syncing...", defaultTheme: "Explore" }
};

const CityItem: React.FC<{ city: any, onSelect: (name: string) => void, language: string, small?: boolean }> = ({ city, onSelect, language, small }) => {
    const l = UI_LABELS[language] || UI_LABELS.en || UI_LABELS.es;
    const colors = ['from-orange-600 to-slate-900', 'from-blue-700 to-slate-950', 'from-purple-600 to-slate-900', 'from-emerald-600 to-slate-950'];
    const icons = ['fa-landmark', 'fa-city', 'fa-monument', 'fa-building-columns'];
    
    const index = (city.spanishName || city.city).length % 4;
    const color = colors[index];
    const icon = icons[index];

    return (
        <div 
            onClick={() => onSelect(city.spanishName || city.city)} 
            className={`${small ? 'h-28' : 'h-32'} bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden relative group cursor-pointer shadow-xl transition-all hover:border-purple-500/30 active:scale-95`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            <div className="absolute top-3 right-5 text-white/5 text-3xl">
                <i className={`fas ${icon}`}></i>
            </div>
            <div className="absolute bottom-4 left-5 right-5">
                <p className="text-[5px] font-black text-purple-400/60 uppercase tracking-[0.2em] mb-1">{l.defaultTheme}</p>
                <h4 className="font-black text-white text-sm tracking-tighter uppercase leading-none truncate">{city.spanishName || city.city}</h4>
            </div>
        </div>
    );
};

export const TravelServices: React.FC<any> = ({ mode, language = 'es', onCitySelect }) => {
    const l = UI_LABELS[language] || UI_LABELS.en || UI_LABELS.es;
    const [cities, setCities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeHubCat, setActiveHubCat] = useState<'visited' | 'growth' | 'exotic'>('visited');
    
    useEffect(() => {
        const fetchCities = async () => {
            setLoading(true);
            try {
                // Quitamos el filtro eq('language', 'es') para mostrar TODO el mundo
                const { data } = await supabase
                    .from('tours_cache')
                    .select('city, language')
                    .limit(50);
                
                if (data) {
                    // Fix: Explicitly type uniqueCities as string[] to ensure 'c' in map is correctly typed for split() call
                    const uniqueCities: string[] = Array.from(new Set(data.map((d: any) => d.city as string)));
                    const formatted = uniqueCities.map(c => ({
                        city: c,
                        spanishName: c.split('_')[0].charAt(0).toUpperCase() + c.split('_')[0].slice(1)
                    }));
                    setCities(formatted.sort(() => Math.random() - 0.5));
                }
            } catch (e) { console.error("DB Error", e); } finally { setLoading(false); }
        };
        fetchCities();
    }, [language]);

    if (loading) {
        return <div className="p-20 text-center text-[8px] font-black uppercase text-slate-500 tracking-widest">{l.loading}</div>;
    }

    if (mode === 'HUB') {
        return (
            <div className="space-y-6 pb-40 px-6 animate-fade-in">
                <header>
                    <h3 className="text-xl font-black text-white tracking-tighter uppercase">{l.hubTitle}</h3>
                    <p className="text-[7px] font-black text-purple-400 uppercase tracking-[0.3em] mt-1">{l.hubSub}</p>
                </header>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {(['visited', 'growth', 'exotic'] as const).map(cat => (
                        <button key={cat} onClick={() => setActiveHubCat(cat)} className={`px-4 py-2 rounded-xl text-[7px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeHubCat === cat ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-white/40'}`}>
                            {cat === 'visited' ? l.catVisited : (cat === 'growth' ? l.catGrowth : l.catExotic)}
                        </button>
                    ))}
                </div>
                <section className="grid grid-cols-2 gap-3">
                    {cities.slice(0, 20).map((city: any) => (
                        <CityItem key={city.city} city={city} onSelect={onCitySelect} language={language} small />
                    ))}
                </section>
            </div>
        );
    }
    return (
        <div className="space-y-8 pb-32 px-6 animate-fade-in">
            <div className="space-y-4">
                <header>
                    <h3 className="text-xl font-black text-white tracking-tighter uppercase">{l.homeTitle}</h3>
                    <p className="text-[7px] font-black text-purple-400 uppercase tracking-[0.3em] mt-1">{l.homeSub}</p>
                </header>
                <section className="grid grid-cols-2 gap-3">
                    {cities.slice(0, 10).map(city => (
                        <CityItem key={city.city} city={city} onSelect={onCitySelect} language={language} small />
                    ))}
                </section>
            </div>
        </div>
    );
};