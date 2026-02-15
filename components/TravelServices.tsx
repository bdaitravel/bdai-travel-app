
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useLanguage } from '../context/LanguageContext';

const CityItem: React.FC<{ city: any, onSelect: (name: string) => void, small?: boolean }> = ({ city, onSelect, small }) => {
    const colors = ['from-orange-600 to-slate-900', 'from-blue-700 to-slate-950', 'from-purple-600 to-slate-900', 'from-emerald-600 to-slate-950'];
    const icons = ['fa-landmark', 'fa-city', 'fa-monument', 'fa-building-columns'];
    
    const index = (city.spanishName || city.city).length % 4;
    const color = colors[index];
    const icon = icons[index];

    return (
        <div 
            onClick={() => onSelect(city.spanishName || city.city)} 
            className={`${small ? 'h-28' : 'h-36'} bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden relative group cursor-pointer shadow-xl transition-all hover:border-purple-500/30 active:scale-95`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            <div className="absolute top-3 right-5 text-white/5 text-3xl group-hover:scale-110 transition-transform">
                <i className={`fas ${icon}`}></i>
            </div>
            <div className="absolute bottom-4 left-5 right-5">
                <h4 className="font-black text-white text-sm tracking-tighter uppercase leading-none truncate">{city.spanishName || city.city}</h4>
                <p className="text-[5px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Descubierto por la comunidad</p>
            </div>
        </div>
    );
};

export const TravelServices: React.FC<any> = ({ mode, onCitySelect }) => {
    const { t } = useLanguage();
    const [cities, setCities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchCities = async () => {
            setLoading(true);
            try {
                const { data } = await supabase
                    .from('tours_cache')
                    .select('city, language')
                    .eq('language', 'es')
                    .limit(40);
                
                if (data) {
                    const formatted = data.map(d => ({
                        city: d.city,
                        spanishName: d.city.split('_')[0].charAt(0).toUpperCase() + d.city.split('_')[0].slice(1)
                    }));
                    setCities(formatted.sort(() => Math.random() - 0.5));
                }
            } catch (e) { console.error("DB Error", e); } finally { setLoading(false); }
        };
        fetchCities();
    }, []);

    if (loading) {
        return (
            <div className="p-20 text-center flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-40 px-6 animate-fade-in">
            <header>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase">{mode === 'HUB' ? t('nav.hub') : t('nav.home')}</h3>
                <p className="text-[7px] font-black text-purple-400 uppercase tracking-[0.3em] mt-1">{t('auth.tagline')}</p>
            </header>
            <section className="grid grid-cols-2 gap-3">
                {cities.slice(0, 16).map((city: any) => (
                    <CityItem key={city.city} city={city} onSelect={onCitySelect} small />
                ))}
            </section>
        </div>
    );
};
