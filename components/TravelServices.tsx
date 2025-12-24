
import React, { useState, useEffect } from 'react';
import { getRecentCommunityCities } from '../services/supabaseClient';

const HIDDEN_GEMS: any = {
    es: [
        { name: 'Albarracín', province: 'Teruel', secret: 'Sus murallas parecen sacadas de una fábula medieval.', img: 'https://images.unsplash.com/photo-1518715303843-586e350765b2?auto=format&fit=crop&w=600&q=80' },
        { name: 'Morella', province: 'Castellón', secret: 'Una ciudad amurallada coronada por un castillo imponente.', img: 'https://images.unsplash.com/photo-1543783232-260a990a1c02?auto=format&fit=crop&w=600&q=80' },
        { name: 'Cudillero', province: 'Asturias', secret: 'El pueblo marinero más fotogénico del Cantábrico.', img: 'https://images.unsplash.com/photo-1590756254933-2873d72a83b6?auto=format&fit=crop&w=600&q=80' },
        { name: 'Ronda', province: 'Málaga', secret: 'Un puente que desafía al abismo desde el siglo XVIII.', img: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80' }
    ],
    en: [
        { name: 'Albarracín', province: 'Teruel', secret: 'Medieval walls straight out of a fairy tale.', img: 'https://images.unsplash.com/photo-1518715303843-586e350765b2?auto=format&fit=crop&w=600&q=80' },
        { name: 'Morella', province: 'Castellon', secret: 'A fortress city crowned by a majestic castle.', img: 'https://images.unsplash.com/photo-1543783232-260a990a1c02?auto=format&fit=crop&w=600&q=80' },
        { name: 'Cudillero', province: 'Asturias', secret: 'The jewel of the Cantabrian coast.', img: 'https://images.unsplash.com/photo-1590756254933-2873d72a83b6?auto=format&fit=crop&w=600&q=80' }
    ]
};

const UI_TEXTS: any = {
    en: { title: "techtravel", gems: "Hidden Gems (Spain)", world: "Community Routes", search: "Search any city...", aiBadge: "AI Generated" },
    es: { title: "techtravel", gems: "Pueblos con Encanto", world: "Rutas de la Comunidad", search: "Busca cualquier ciudad...", aiBadge: "Generado por IA" }
};

export const TravelServices: React.FC<{ language?: string, onCitySelect: (city: string) => void }> = ({ language = 'es', onCitySelect }) => {
    const t = UI_TEXTS[language] || UI_TEXTS['es'];
    const [searchValue, setSearchValue] = useState('');
    const [communityCities, setCommunityCities] = useState<{city: string}[]>([]);

    useEffect(() => {
        const fetchCommunityData = async () => {
            const cities = await getRecentCommunityCities(language);
            setCommunityCities(cities);
        };
        fetchCommunityData();
    }, [language]);

    const gems = HIDDEN_GEMS[language] || HIDDEN_GEMS['es'];

    return (
        <div className="pb-32 animate-fade-in space-y-12 px-6 pt-10 bg-slate-950 min-h-full">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-white lowercase tracking-tighter">{t.title}</h2>
                    <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] opacity-60">Verified Smart Guides</p>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <i className="fas fa-compass text-purple-500"></i>
                </div>
            </header>

            <div className="relative group">
                <i className="fas fa-search absolute left-5 top-5 text-slate-500 group-focus-within:text-purple-500 transition-colors"></i>
                <input 
                    type="text" 
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchValue.trim() && onCitySelect(searchValue.trim())}
                    placeholder={t.search} 
                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white outline-none focus:border-purple-500 focus:bg-white/10 transition-all shadow-2xl" 
                />
            </div>

            {/* RUTAS DE LA COMUNIDAD (DINÁMICAS DE SUPABASE) */}
            {communityCities.length > 0 && (
                <section className="space-y-6">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">{t.world}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {communityCities.map((cityObj) => (
                            <button 
                                key={cityObj.city} 
                                onClick={() => onCitySelect(cityObj.city)}
                                className="bg-white/5 border border-white/10 p-4 rounded-[2rem] text-left hover:bg-white/10 transition-all group overflow-hidden relative"
                            >
                                <div className="absolute -right-4 -top-4 w-12 h-12 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform"></div>
                                <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1 block">{t.aiBadge}</span>
                                <span className="text-sm font-black text-white block truncate">{cityObj.city}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* GEMS SECTION */}
            <section className="space-y-6">
                <h3 className="text-lg font-black text-white uppercase tracking-widest">{t.gems}</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
                    {gems.map((v: any) => (
                        <div key={v.name} onClick={() => onCitySelect(v.name)} className="w-64 flex-shrink-0 relative h-80 rounded-[3rem] overflow-hidden border border-white/10 group cursor-pointer">
                            <img src={v.img} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={v.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent"></div>
                            <div className="absolute bottom-8 left-6 right-6">
                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">{v.province}</p>
                                <h4 className="text-2xl font-black text-white mb-2">{v.name}</h4>
                                <p className="text-[10px] text-white/60 font-medium leading-relaxed italic">{v.secret}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
