
import React, { useState } from 'react';
import { HubIntel } from '../types';

const CATEGORIES = [
    { id: 'all', name: 'Explorar', icon: 'fa-globe', color: 'bg-purple-600' },
    { id: 'villages', name: 'Pueblos Mágicos', icon: 'fa-house-chimney-window', color: 'bg-emerald-500' },
    { id: 'gastro', name: 'Gastro Gems', icon: 'fa-utensils', color: 'bg-orange-500' },
    { id: 'secret', name: 'Hidden Gems', icon: 'fa-mask', color: 'bg-indigo-600' },
    { id: 'cities', name: 'Metrópolis', icon: 'fa-city', color: 'bg-blue-500' }
];

const EXPLORE_GRID = [
    // METRÓPOLIS
    { name: 'Madrid', theme: 'Kilómetro Cero', cat: 'cities', color: 'from-blue-700 to-indigo-950', icon: 'fa-building-columns' },
    { name: 'Vitoria', theme: 'Green Capital', cat: 'cities', color: 'from-green-600 to-emerald-950', icon: 'fa-leaf' },
    { name: 'Barcelona', theme: 'Modernismo', cat: 'cities', color: 'from-red-600 to-amber-900', icon: 'fa-monument' },
    { name: 'Sevilla', theme: 'Duende y Arte', cat: 'cities', color: 'from-orange-500 to-red-800', icon: 'fa-fan' },
    { name: 'Valencia', theme: 'Fuego y Mar', cat: 'cities', color: 'from-amber-400 to-orange-700', icon: 'fa-fire' },
    { name: 'Bilbao', theme: 'Vanguardia', cat: 'cities', color: 'from-slate-700 to-zinc-900', icon: 'fa-shuttle-space' },
    { name: 'Málaga', theme: 'Costa del Sol', cat: 'cities', color: 'from-cyan-500 to-blue-800', icon: 'fa-umbrella-beach' },

    // PUEBLOS MÁGICOS
    { name: 'Albarracín', theme: 'Murallas Rojas', cat: 'villages', color: 'from-orange-600 to-amber-900', icon: 'fa-chess-rook' },
    { name: 'Cadaqués', theme: 'Refugio Dalí', cat: 'villages', color: 'from-blue-400 to-slate-200', icon: 'fa-anchor' },
    { name: 'Ronda', theme: 'El Tajo Eterno', cat: 'villages', color: 'from-stone-500 to-orange-900', icon: 'fa-bridge' },
    { name: 'Cudillero', theme: 'Anfiteatro Mar', cat: 'villages', color: 'from-emerald-400 to-blue-600', icon: 'fa-ship' },
    { name: 'Valldemossa', theme: 'Cartuja Real', cat: 'villages', color: 'from-green-700 to-stone-800', icon: 'fa-leaf' },
    { name: 'Frigiliana', theme: 'Blanco Puro', cat: 'villages', color: 'from-slate-50 to-blue-100', icon: 'fa-sun' },

    // GASTRO GEMS
    { name: 'San Sebastián', theme: 'Pintxos de Élite', cat: 'gastro', color: 'from-blue-800 to-emerald-900', icon: 'fa-utensils' },
    { name: 'Logroño', theme: 'Calle Laurel', cat: 'gastro', color: 'from-purple-700 to-rose-950', icon: 'fa-grapes' },
    { name: 'Sanlúcar', theme: 'Manzanilla y Mar', cat: 'gastro', color: 'from-amber-500 to-orange-800', icon: 'fa-wine-glass' },
    { name: 'Segovia', theme: 'Asado Real', cat: 'gastro', color: 'from-amber-700 to-stone-900', icon: 'fa-piggy-bank' },
    { name: 'Jabugo', theme: 'Templo del Jamón', cat: 'gastro', color: 'from-red-800 to-zinc-950', icon: 'fa-drumstick-bite' },

    // HIDDEN GEMS
    { name: 'Setenil', theme: 'Bajo la Roca', cat: 'secret', color: 'from-stone-600 to-zinc-900', icon: 'fa-mountain' },
    { name: 'Siurana', theme: 'Salto de Reina', cat: 'secret', color: 'from-rose-700 to-amber-950', icon: 'fa-mountain-sun' },
    { name: 'Morella', theme: 'Gótico de Interior', cat: 'secret', color: 'from-slate-800 to-indigo-950', icon: 'fa-castle' },
    { name: 'Alquézar', theme: 'Cañones de Agua', cat: 'secret', color: 'from-teal-600 to-blue-900', icon: 'fa-water' },
    { name: 'Guadalupe', theme: 'Monasterio Místico', cat: 'secret', color: 'from-amber-600 to-stone-800', icon: 'fa-cross' }
];

const TRENDING_2026 = [
    { name: 'Seúl', theme: 'K-Future', icon: 'fa-tower-observation' },
    { name: 'Riad', theme: 'Visión 2030', icon: 'fa-landmark-dome' },
    { name: 'CDMX', theme: 'Gastro Hub', icon: 'fa-pepper-hot' },
    { name: 'Tokio', theme: 'Neo-Tradition', icon: 'fa-torii-gate' },
    { name: 'Oslo', theme: 'Eco-Avant-Garde', icon: 'fa-leaf' }
];

const FIESTAS: HubIntel[] = [
    { 
        id: 'f1', 
        type: 'festival', 
        title: 'Cascamorras', 
        location: 'Guadix / Baza', 
        color: 'from-zinc-700 to-black', 
        icon: 'fa-paint-roller', 
        description: 'Un ritual de barro y pintura que se remonta al siglo XV. El "Cascamorras" debe cruzar la ciudad de Baza sin ser manchado para recuperar una virgen sagrada.',
        details: 'La pintura que se usa hoy es una mezcla ecológica de aceite vegetal y hollín. El Cascamorras real tiene un entrenamiento físico de atleta de élite.'
    },
    { 
        id: 'f2', 
        type: 'festival', 
        title: 'Fallas de Valencia', 
        location: 'Valencia', 
        color: 'from-orange-500 to-red-600', 
        icon: 'fa-fire', 
        description: 'Monumentos efímeros de madera y cartón que arden en la Nit de la Cremà. Un festival de pólvora (Mascletà) y arte satírico único.',
        details: 'Las figuras más altas pueden superar los 20 metros de altura y costar más de 200.000 euros.'
    }
];

const CURIOSIDADES: HubIntel[] = [
    { 
        id: 'c1', 
        type: 'curiosity', 
        title: 'Restaurante Botín', 
        location: 'Madrid', 
        icon: 'fa-utensils', 
        color: 'from-amber-700 to-orange-950',
        description: 'Fundado en 1725, es el restaurante más antiguo del mundo según el Guinness. Su horno nunca se ha apagado totalmente.',
        details: 'Francisco de Goya trabajó aquí fregando platos antes de ser el pintor de cámara del Rey.'
    },
    { 
        id: 'c3', 
        type: 'curiosity', 
        title: 'Calle del Laurel', 
        location: 'Logroño', 
        icon: 'fa-wine-glass', 
        color: 'from-purple-600 to-indigo-900',
        description: 'La zona de pinchos más famosa de La Rioja. Cada bar tiene su especialidad "estrella".',
        details: 'Consejo local: Pide el "Matrimonio" (anchoa y boquerón) o el "Champi" del Bar Soriano.'
    }
];

const GASTRO_ES: HubIntel[] = [
    { 
        id: 'g1', 
        type: 'gastro', 
        title: 'Tortilla de Patatas', 
        location: 'Toda España', 
        icon: 'fa-egg', 
        color: 'from-yellow-400 to-amber-600',
        description: 'El ADN de nuestra cocina. Patata, huevo, sal y cebolla muy pochada.',
        details: 'El primer documento que la menciona es de 1817, en las Cortes de Navarra.'
    },
    { 
        id: 'g2', 
        type: 'gastro', 
        title: 'Cocido Madrileño', 
        location: 'Madrid', 
        icon: 'fa-bowl-food', 
        color: 'from-orange-400 to-red-800',
        description: 'Un ritual en tres vuelcos: sopa, legumbres y carnes.',
        details: 'Los mejores se cocinan en ollas de barro individuales sobre fuego de encina durante más de 6 horas.'
    },
    { 
        id: 'g3', 
        type: 'gastro', 
        title: 'Pulpo a la Gallega', 
        location: 'Galicia', 
        icon: 'fa-fish-fins', 
        color: 'from-red-500 to-rose-900',
        description: 'Servido sobre plato de madera con aceite de oliva, sal gorda y pimentón.',
        details: 'Se debe "asustar" tres veces metiéndolo y sacándolo del agua hirviendo antes de la cocción.'
    }
];

export const TravelServices: React.FC<{ 
    mode: 'HOME' | 'HUB', 
    language?: string, 
    onCitySelect: (city: string) => void,
    onHubItemSelect?: (item: HubIntel) => void 
}> = ({ mode, onCitySelect, onHubItemSelect }) => {
    const [activeCat, setActiveCat] = useState('all');

    if (mode === 'HUB') {
        return (
            <div className="space-y-16 pb-32 px-8 pt-4 animate-fade-in">
                <section>
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Folklore Intel</h3>
                            <p className="text-[8px] text-purple-400 uppercase tracking-widest mt-1">Fiestas que desafían la lógica</p>
                        </div>
                        <i className="fas fa-mask text-purple-600"></i>
                    </div>
                    <div className="space-y-4">
                        {FIESTAS.map(f => (
                            <div key={f.id} onClick={() => onHubItemSelect?.(f)} className={`bg-gradient-to-r ${f.color} rounded-[2rem] p-6 border border-white/10 flex items-center gap-6 shadow-xl cursor-pointer hover:scale-[1.02] transition-transform`}>
                                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl text-white">
                                    <i className={`fas ${f.icon}`}></i>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">{f.location}</p>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tighter">{f.title}</h4>
                                    <p className="text-[10px] text-white/40 leading-tight mt-1 line-clamp-1">{f.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">City Secrets</h3>
                            <p className="text-[8px] text-amber-400 uppercase tracking-widest mt-1">Descubrimientos verificados</p>
                        </div>
                        <i className="fas fa-eye text-amber-500"></i>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {CURIOSIDADES.map(c => (
                            <div key={c.id} onClick={() => onHubItemSelect?.(c)} className="bg-white/5 border border-white/10 rounded-[2rem] p-5 flex items-start gap-5 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors">
                                <i className={`fas ${c.icon} text-amber-500 mt-1`}></i>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{c.title} <span className="text-white/20 ml-2">[{c.location}]</span></h4>
                                    <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-2">{c.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Gastro Tech</h3>
                            <p className="text-[8px] text-red-500 uppercase tracking-widest mt-1">ADN culinario regional</p>
                        </div>
                        <i className="fas fa-fire text-red-500"></i>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar">
                        {GASTRO_ES.map(g => (
                            <div key={g.id} onClick={() => onHubItemSelect?.(g)} className="min-w-[180px] aspect-square rounded-[2.5rem] bg-slate-900 border border-white/10 p-6 flex flex-col justify-between group cursor-pointer hover:border-red-500/50 transition-all">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-white shadow-lg`}>
                                    <i className={`fas ${g.icon}`}></i>
                                </div>
                                <div>
                                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">{g.location}</p>
                                    <p className="text-xs font-black text-white uppercase leading-none">{g.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        );
    }

    const filteredGrid = activeCat === 'all' 
        ? EXPLORE_GRID 
        : EXPLORE_GRID.filter((item: any) => item.cat === activeCat);

    return (
        <div className="space-y-12 pb-24">
            <section className="px-8 mt-4">
                <div className="relative h-[340px] w-full rounded-[3.5rem] overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/10 bg-slate-950">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-black z-0"></div>
                    
                    <div className="relative z-20 h-full p-10 flex flex-col">
                        <div className="mb-10 animate-fade-in">
                            <div className="inline-flex items-center gap-2 bg-purple-600/20 backdrop-blur-md text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] py-2 px-4 rounded-full border border-purple-500/30 mb-5">
                                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                                Expedición 2026
                            </div>
                            <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
                                Descubre el<br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">Próximo Mundo</span>
                            </h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-4 opacity-60">Metrópolis en tendencia orbital</p>
                        </div>
                        
                        <div className="mt-auto -mx-10 overflow-hidden">
                            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-10 px-10 snap-x">
                                {TRENDING_2026.map(city => (
                                    <div 
                                        key={city.name} 
                                        onClick={() => onCitySelect(city.name)} 
                                        className="min-w-[150px] h-28 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 flex flex-col justify-between group/item cursor-pointer hover:bg-white/15 transition-all snap-center border-l-4 border-l-purple-500"
                                    >
                                        <div className="flex justify-between items-start">
                                            <i className={`fas ${city.icon} text-lg text-white/40 group-hover/item:text-purple-400 transition-colors`}></i>
                                            <i className="fas fa-arrow-up-right text-[10px] text-white/10 group-hover/item:text-white/40"></i>
                                        </div>
                                        <div>
                                            <p className="text-[7px] font-black text-purple-400 uppercase tracking-widest mb-1">{city.theme}</p>
                                            <p className="text-sm font-black text-white uppercase tracking-tighter">{city.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="px-8 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCat(cat.id)} className={`flex items-center gap-2 px-6 py-4 rounded-full border transition-all whitespace-nowrap text-[10px] font-black uppercase tracking-widest ${activeCat === cat.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg scale-105' : 'bg-white/5 border-white/10 text-white/60'}`}>
                        <i className={`fas ${cat.icon}`}></i> {cat.name}
                    </button>
                ))}
            </div>

            <section className="px-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                    {filteredGrid.map((city: any) => (
                        <div key={city.name} onClick={() => onCitySelect(city.name)} className={`h-64 bg-slate-950 border border-white/10 rounded-[2.5rem] overflow-hidden relative group cursor-pointer shadow-2xl transition-all hover:border-purple-500/50 hover:-translate-y-1`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${city.color} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                <span className="text-[12rem] font-black group-hover:scale-125 transition-transform duration-1000 leading-none select-none text-white">{city.name.charAt(0)}</span>
                            </div>
                            <div className="absolute top-4 left-4">
                                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                    <i className={`fas ${city.icon} text-purple-400 text-[10px]`}></i>
                                    <span className="text-[7px] font-black text-white uppercase tracking-widest">{city.theme}</span>
                                </div>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                                <div>
                                    <h4 className="font-black text-white text-xl tracking-tighter uppercase leading-none mb-1">{city.name}</h4>
                                    <p className="text-[7px] font-black text-purple-400 uppercase tracking-widest">Rutas Inteligentes</p>
                                </div>
                                <i className={`fas ${city.icon} text-white/20 text-4xl group-hover:scale-110 transition-transform`}></i>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
