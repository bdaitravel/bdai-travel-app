
import React from 'react';

const GLOBAL_DESTINATIONS = [
    { name: 'Kyoto', region: 'Japan', icon: 'fa-torii-gate', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80', color: 'from-red-500 to-orange-600', tags: ['Zen', 'Temple'] },
    { name: 'Reykjavik', region: 'Iceland', icon: 'fa-snowflake', img: 'https://images.unsplash.com/photo-1520116468816-95b69f847357?auto=format&fit=crop&w=600&q=80', color: 'from-blue-500 to-cyan-600', tags: ['Arctic', 'Aurora'] },
    { name: 'Santorini', region: 'Greece', icon: 'fa-archway', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80', color: 'from-blue-400 to-white', tags: ['Aegean', 'Views'] }
];

const HUB_TEXTS: any = {
    en: { title: "Global Hub", subtitle: "Culture & 2026 Agenda", villages: "Curated Escapes", agenda: "World Events 2026", explore: "Explore with IA" },
    es: { title: "Hub Global", subtitle: "Cultura y Agenda 2026", villages: "Escapadas Curadas", agenda: "Eventos Mundiales 2026", explore: "Explorar con IA" },
    ca: { title: "Hub Global", subtitle: "Cultura i Agenda 2026", villages: "Escapades Curades", agenda: "Esdeveniments 2026", explore: "Explorar amb IA" },
    eu: { title: "Hub Globala", subtitle: "Kultura eta 2026 Agenda", villages: "Ibilbide Bereziak", agenda: "Munduko Ekitaldiak 2026", explore: "IArekin arakatu" },
    fr: { title: "Hub Global", subtitle: "Culture & Agenda 2026", villages: "Escapades Curatées", agenda: "Événements 2026", explore: "Explorer avec l'IA" }
};

const GLOBAL_EVENTS = [
    { name: 'World Expo 2026', city: 'International', date: 'ENE-DIC', type: 'Global Summit', icon: 'fa-globe' },
    { name: 'FIFA World Cup (Prep)', city: 'Multiple', date: 'JUN-JUL', type: 'Sports', icon: 'fa-futbol' },
    { name: 'Rio Carnaval 2026', city: 'Rio de Janeiro', date: 'FEBRERO', type: 'Cultural', icon: 'fa-mask' },
    { name: 'Cherry Blossom', city: 'Kyoto', date: 'ABRIL', type: 'Nature', icon: 'fa-spa' },
    { name: 'Oktoberfest 2026', city: 'Munich', date: 'SEP-OCT', type: 'Tradition', icon: 'fa-beer' },
];

export const TravelServices: React.FC<{ language?: string, onCitySelect: (city: string) => void }> = ({ language = 'es', onCitySelect }) => {
    const t = HUB_TEXTS[language] || HUB_TEXTS['es'];

    return (
        <div className="pb-40 animate-fade-in space-y-12 px-6 pt-12 bg-slate-950 min-h-full">
            <header className="mb-8">
                <h2 className="text-5xl font-black text-white lowercase tracking-tighter mb-2">{t.title}</h2>
                <p className="text-purple-500 text-[10px] font-black uppercase tracking-[0.5em] opacity-80">{t.subtitle}</p>
            </header>

            <section className="space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-2 h-6 bg-purple-600 rounded-full"></div>
                    {t.villages}
                </h3>
                <div className="flex gap-5 overflow-x-auto no-scrollbar -mx-6 px-6">
                    {GLOBAL_DESTINATIONS.map((v) => (
                        <div key={v.name} onClick={() => onCitySelect(v.name)} className="w-64 flex-shrink-0 bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-2xl transition-all hover:scale-[1.02] hover:border-purple-500/30">
                            <div className="relative h-40 overflow-hidden">
                                <img src={v.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={v.name} />
                                <div className={`absolute inset-0 bg-gradient-to-t ${v.color} opacity-40 mix-blend-overlay`}></div>
                                <div className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                                    <i className={`fas ${v.icon}`}></i>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-2 mb-3">
                                    {v.tags.map(tag => (
                                        <span key={tag} className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/5 text-slate-400 rounded-md">{tag}</span>
                                    ))}
                                </div>
                                <h4 className="font-black text-white text-lg mb-1">{v.name}</h4>
                                <p className="text-[10px] text-slate-500 leading-tight uppercase font-bold tracking-widest">{v.region}</p>
                                <div className="mt-4 pt-4 border-t border-white/5 text-purple-500 text-[9px] font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                                    {t.explore} <i className="fas fa-arrow-right ml-2"></i>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="w-2 h-6 bg-purple-600 rounded-full"></div>
                    {t.agenda}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    {GLOBAL_EVENTS.map(event => (
                        <div key={event.name} onClick={() => onCitySelect(event.city)} className="flex items-center gap-5 bg-white/5 border border-white/5 p-5 rounded-[2rem] hover:bg-white/10 transition-all cursor-pointer group">
                            <div className="w-14 h-14 rounded-2xl bg-purple-600/10 flex flex-col items-center justify-center text-purple-600 font-black border border-purple-600/20">
                                <span className="text-[8px] tracking-widest leading-none mb-1">{event.date.includes(' ') ? event.date.split(' ')[1] : ''}</span>
                                <span className="text-xs leading-none">{event.date.split(' ')[0]}</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-black text-base group-hover:text-purple-500 transition-colors">{event.name}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{event.city} • {event.type}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-white transition-colors">
                                <i className={`fas ${event.icon}`}></i>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
