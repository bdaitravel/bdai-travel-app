
import React, { useState } from 'react';
import { generateHubIntel } from '../services/geminiService';

const CATEGORIES = [
    { id: 'gastro', name: 'Gastro', icon: 'fa-utensils', color: 'bg-orange-500' },
    { id: 'arquitectura', name: 'Diseño/Arq', icon: 'fa-landmark-dome', color: 'bg-blue-600' },
    { id: 'historia', name: 'Historia', icon: 'fa-scroll', color: 'bg-amber-700' },
    { id: 'global', name: 'Top Mundo', icon: 'fa-globe', color: 'bg-purple-600' }
];

const EXPLORE_GRID = [
    { name: 'San Sebastián', theme: 'Estrellas y Pintxos', cat: 'gastro', color: 'from-blue-600 to-slate-900', icon: 'fa-utensils', type: 'Gastro' },
    { name: 'Logroño', theme: 'La Senda del Vino', cat: 'gastro', color: 'from-rose-700 to-stone-900', icon: 'fa-wine-glass', type: 'Gastro' },
    { name: 'Valencia', theme: 'Arroz e Ingeniería', cat: 'gastro', color: 'from-orange-500 to-amber-900', icon: 'fa-shrimp', type: 'Gastro' },
    { name: 'Barcelona', theme: 'Gaudí y Geometría', cat: 'arquitectura', color: 'from-cyan-600 to-indigo-900', icon: 'fa-palette', type: 'Diseño' },
    { name: 'Bilbao', theme: 'El Sueño del Titanio', cat: 'arquitectura', color: 'from-slate-500 to-slate-900', icon: 'fa-shapes', type: 'Vanguardia' },
    { name: 'Madrid', theme: 'El Siglo de los Austrias', cat: 'arquitectura', color: 'from-blue-800 to-indigo-950', icon: 'fa-monument', type: 'Capital' },
    { name: 'Sevilla', theme: 'Azahar y Mudejar', cat: 'historia', color: 'from-amber-600 to-red-900', icon: 'fa-fan', type: 'Imperial' },
    { name: 'Granada', theme: 'El Último Reino', cat: 'historia', color: 'from-emerald-700 to-stone-900', icon: 'fa-fort-awesome', type: 'Legado' },
    { name: 'Toledo', theme: 'Las Tres Culturas', cat: 'historia', color: 'from-stone-600 to-red-950', icon: 'fa-shield-halved', type: 'Medieval' },
    { name: 'Londres', theme: 'Fog y Coronas', cat: 'global', color: 'from-blue-900 to-slate-900', icon: 'fa-tower-observation', type: 'Global' },
    { name: 'Nueva York', theme: 'Ingeniería Vertical', cat: 'global', color: 'from-slate-700 to-blue-950', icon: 'fa-city', type: 'Global' },
    { name: 'Tokio', theme: 'Cyberpunk y Zen', cat: 'global', color: 'from-pink-600 to-indigo-900', icon: 'fa-torii-gate', type: 'Global' },
    { name: 'Roma', theme: 'Arqueología de Poder', cat: 'global', color: 'from-orange-800 to-red-950', icon: 'fa-columns', type: 'Global' },
    { name: 'París', theme: 'El Eje Ilustrado', cat: 'global', color: 'from-blue-500 to-slate-900', icon: 'fa-tower-eiffel', type: 'Global' },
    { name: 'Lisboa', theme: 'Saudade y Luz', cat: 'global', color: 'from-yellow-600 to-red-900', icon: 'fa-ship', type: 'Global' }
];

const HUB_INTEL_STATIC = {
    pueblos: [
        { name: 'Albarracín', desc: 'El pueblo más bonito de España según arquitectos.', tag: 'Medieval' },
        { name: 'Cudillero', desc: 'Anfiteatro de colores sobre el Cantábrico.', tag: 'Costa' },
        { name: 'Ronda', desc: 'El tajo que desafía a la gravedad.', tag: 'Andalucía' },
        { name: 'Olite', desc: 'El castillo de cuento de hadas de Navarra.', tag: 'Palacio' }
    ],
    fiestas: [
        { name: 'Batalla del Vino', city: 'Haro', desc: 'Guerra púrpura en los riscos de Bilibio.', date: '29 Jun' },
        { name: 'La Tomatina', city: 'Buñol', desc: 'El caos de munición roja más famoso.', date: 'Ago' },
        { name: 'El Colacho', city: 'Castrillo', desc: 'Saltando bebés para limpiar el pecado.', date: 'Jun' }
    ]
};

export const TravelServices: React.FC<{ 
    mode: 'HOME' | 'HUB', 
    language?: string, 
    onCitySelect: (city: string) => void
}> = ({ mode, language = 'es', onCitySelect }) => {
    const [activeCat, setActiveCat] = useState('gastro');
    const [hubCity, setHubCity] = useState('Tokio');
    const [aiIntel, setAiIntel] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchIntel = async (q: string) => {
        setLoading(true);
        const data = await generateHubIntel(q, language);
        setAiIntel(data);
        setLoading(false);
    };

    if (mode === 'HUB') {
        return (
            <div className="space-y-10 pb-32 px-8 pt-4 animate-fade-in text-slate-100">
                <header className="flex flex-col gap-2">
                    <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">Intelligence Center</h3>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Lanzadera Global de Inteligencia.</p>
                </header>

                {/* AI Intel Selector para Top Mundo */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                        <i className="fas fa-satellite text-purple-500"></i> Top Mundo: Deep Intel
                    </h4>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {['Nueva York', 'Londres', 'París', 'Tokio', 'Roma', 'Lisboa', 'San Francisco', 'Berlín'].map(c => (
                            <button key={c} onClick={() => {setHubCity(c); fetchIntel(c);}} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${hubCity === c ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                                {c}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="py-20 text-center animate-pulse">
                            <i className="fas fa-satellite-dish text-3xl text-purple-600 mb-4 block"></i>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sincronizando con archivos locales...</span>
                        </div>
                    ) : aiIntel ? (
                        <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/20 p-8 rounded-[3rem] space-y-6 animate-slide-up shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <i className="fas fa-microchip text-8xl"></i>
                            </div>
                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Expediente // {hubCity.toUpperCase()}</span>
                                    <span className="bg-purple-600/20 text-purple-400 text-[7px] font-black px-2 py-0.5 rounded uppercase">Verified by BDAI</span>
                                </div>
                                <p className="text-xs font-medium text-slate-100 leading-relaxed italic border-l-2 border-purple-500/50 pl-4">"{aiIntel.curiosities[0]}"</p>
                                <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Jerga local y Contexto:</p>
                                    <p className="text-lg font-black text-white">"{aiIntel.phrases[0].original}"</p>
                                    <p className="text-[9px] text-slate-500 leading-tight bg-white/5 p-3 rounded-xl">{aiIntel.phrases[0].meaning} — <span className="text-purple-400">{aiIntel.phrases[0].context}</span></p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => onCitySelect(hubCity)}
                                className="w-full py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <i className="fas fa-map-location-dot"></i> Iniciar Tour de {hubCity}
                            </button>
                        </div>
                    ) : (
                        <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                             <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Selecciona una ciudad para desplegar inteligencia</p>
                        </div>
                    )}
                </section>

                {/* Pueblos con Encanto */}
                <section className="space-y-4 pt-4 border-t border-white/5">
                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                        <i className="fas fa-mountain text-emerald-500"></i> Pueblos Imprescindibles
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {HUB_INTEL_STATIC.pueblos.map(p => (
                            <div key={p.name} onClick={() => onCitySelect(p.name)} className="bg-white/5 border border-white/5 p-4 rounded-3xl hover:bg-white/10 transition-all group cursor-pointer active:scale-95">
                                <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest block mb-1">{p.tag}</span>
                                <h5 className="font-black text-xs text-white mb-1">{p.name}</h5>
                                <p className="text-[9px] text-slate-500 leading-tight line-clamp-2">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Fiestas Curiosas */}
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                        <i className="fas fa-masks-theater text-rose-500"></i> Fiestas Únicas
                    </h4>
                    <div className="space-y-2">
                        {HUB_INTEL_STATIC.fiestas.map(f => (
                            <div key={f.name} className="bg-gradient-to-r from-white/5 to-transparent border border-white/5 p-4 rounded-3xl flex justify-between items-center group hover:from-white/10 transition-all cursor-pointer">
                                <div>
                                    <h5 className="font-black text-xs text-white uppercase group-hover:text-rose-400 transition-colors">{f.name} <span className="text-slate-500 font-bold ml-1">({f.city})</span></h5>
                                    <p className="text-[9px] text-slate-400 mt-0.5">{f.desc}</p>
                                </div>
                                <div className="bg-rose-600/20 text-rose-400 px-3 py-1.5 rounded-xl text-[8px] font-black whitespace-nowrap">{f.date}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        );
    }

    const filteredGrid = EXPLORE_GRID.filter(item => item.cat === activeCat);

    return (
        <div className="space-y-10 pb-24">
            <div className="px-8 flex gap-3 overflow-x-auto no-scrollbar">
                {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCat(cat.id)} className={`flex items-center gap-2 px-6 py-4 rounded-full border transition-all text-[9px] font-black uppercase tracking-widest ${activeCat === cat.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg scale-105' : 'bg-white/5 border-white/10 text-white/60'}`}>
                        <i className={`fas ${cat.icon}`}></i> {cat.name}
                    </button>
                ))}
            </div>

            <section className="px-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    {filteredGrid.map(city => (
                        <div key={city.name} onClick={() => onCitySelect(city.name)} className={`h-64 bg-slate-950 border border-white/10 rounded-[2.5rem] overflow-hidden relative group cursor-pointer shadow-2xl transition-all hover:border-purple-500/50 hover:-translate-y-1`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${city.color} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                            <div className="absolute top-4 left-4">
                                <div className={`px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 backdrop-blur-md bg-white/5`}>
                                    <span className="text-[7px] font-black uppercase tracking-widest text-white/60">{city.type}</span>
                                </div>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <p className="text-[7px] font-black text-purple-400 uppercase tracking-widest mb-1">{city.theme}</p>
                                <h4 className="font-black text-white text-xl tracking-tighter uppercase leading-none">{city.name}</h4>
                            </div>
                            <div className="absolute -right-4 -bottom-4 text-white/5 text-8xl transition-transform group-hover:scale-110">
                                <i className={`fas ${city.icon}`}></i>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
