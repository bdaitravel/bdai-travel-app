
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
    { name: 'Albarracín', theme: 'Pueblo Mágico', cat: 'villages', color: 'from-orange-600 to-amber-900', icon: 'fa-chess-rook' },
    { name: 'Cudillero', theme: 'Hidden Gem', cat: 'villages', color: 'from-teal-600 to-emerald-900', icon: 'fa-anchor' },
    { name: 'Ronda', theme: 'Vistas de Élite', cat: 'villages', color: 'from-rose-600 to-pink-900', icon: 'fa-bridge' },
    { name: 'Girona', theme: 'History Hub', cat: 'cities', color: 'from-amber-700 to-yellow-900', icon: 'fa-fort-awesome' },
    { name: 'Zaragoza', theme: 'Gastro Gems', cat: 'cities', color: 'from-red-600 to-orange-900', icon: 'fa-utensils' },
    { name: 'Trujillo', theme: 'Pueblo Mágico', cat: 'villages', color: 'from-slate-600 to-zinc-900', icon: 'fa-horse-head' },
    { name: 'Salamanca', theme: 'Art & Tech', cat: 'cities', color: 'from-blue-600 to-purple-900', icon: 'fa-university' },
    { name: 'Besalú', theme: 'Hidden Gem', cat: 'villages', color: 'from-emerald-600 to-green-900', icon: 'fa-archway' }
];

// --- RICH HUB DATA ---
const FIESTAS: HubIntel[] = [
    { 
        id: 'f1', 
        type: 'festival', 
        title: 'Cascamorras', 
        location: 'Guadix / Baza', 
        color: 'from-zinc-700 to-black', 
        icon: 'fa-paint-roller', 
        description: 'Un ritual de barro y pintura que se remonta al siglo XV. El "Cascamorras" debe cruzar la ciudad de Baza sin ser manchado para recuperar una virgen sagrada. Sin embargo, miles de locales le esperan con aceite negro y hollín para impedirlo.',
        details: 'Secreto de Dai: La pintura que se usa hoy es una mezcla ecológica de aceite vegetal y hollín, diseñada para ser visualmente impactante pero fácil de lavar del pavimento. El Cascamorras real tiene un entrenamiento físico de atleta de élite para aguantar las horas de asedio.'
    },
    { 
        id: 'f2', 
        type: 'festival', 
        title: 'El Colacho', 
        location: 'Castrillo de Murcia', 
        color: 'from-yellow-600 to-amber-900', 
        icon: 'fa-person-running', 
        description: 'Desde 1621, el día del Corpus Christi, el "Colacho" (el diablo) recorre las calles saltando literalmente sobre colchones donde descansan bebés nacidos ese año. Se cree que el salto del diablo absorbe el mal y protege a los niños.',
        details: 'Curiosidad Histórica: La tradición es tan fuerte que atrae a familias de toda la comarca de Burgos. El Papa Benedicto XVI pidió a los obispos españoles que se distanciaran del rito, pero el fervor local lo ha mantenido intacto durante siglos.'
    },
    { 
        id: 'f3', 
        type: 'festival', 
        title: 'Jarramplas', 
        location: 'Piornal', 
        color: 'from-red-700 to-rose-950', 
        icon: 'fa-drum', 
        description: 'Un personaje con una máscara demoníaca y un traje de cintas multicolores recorre el pueblo más alto de Extremadura mientras los vecinos le lanzan toneladas de nabos reales para expulsar su mala suerte.',
        details: 'Ingeniería Oculta: Bajo el traje de cintas, el Jarramplas lleva una armadura de fibra de carbono y neopreno diseñada por ingenieros locales para aguantar los impactos de los nabos, que llegan a alcanzar velocidades de 80 km/h.'
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
        description: 'Fundado en 1725, es el restaurante más antiguo del mundo que nunca ha cerrado sus puertas. Su horno de leña original nunca se ha apagado totalmente para mantener la temperatura y el alma de sus asados de cochinillo.',
        details: 'Intel Exclusivo: Francisco de Goya trabajó aquí fregando platos antes de ser el pintor de cámara del Rey. Ernest Hemingway tenía su propia mesa reservada en la planta superior.'
    },
    { 
        id: 'c2', 
        type: 'curiosity', 
        title: 'Reloj de la Pasión', 
        location: 'Sevilla', 
        icon: 'fa-clock', 
        color: 'from-indigo-700 to-blue-950',
        description: 'En la fachada de la Iglesia de la Magdalena, un reloj solar único no marca las horas convencionales, sino las estaciones de la Pasión de Cristo según los ritos barrocos sevillanos.',
        details: 'Detalle de Élite: Es casi invisible para el turista común. Su lectura requiere conocer la simbología de las hermandades de Sevilla. Es una pieza de arte y matemática sagrada oculta a plena vista en el centro.'
    }
];

const GASTRO_WORLD: HubIntel[] = [
    {
        id: 'gw1',
        type: 'gastro',
        title: 'Tsukiji Outer Market',
        location: 'Tokio, Japón',
        icon: 'fa-fish-fins',
        color: 'from-blue-600 to-slate-900',
        description: 'El corazón del sushi mundial. Traslado del mercado mayorista, pero el mercado exterior sigue siendo el lugar donde los mejores chefs de Tokio compran su producto diario.',
        details: 'Consejo Pro: Busca el puesto de "Tamagoyaki" de Yamacho. Por menos de 1 euro tienes la tortilla japonesa más sedosa del mundo. El atún de calidad o-toro se vende aquí a una fracción del precio de los restaurantes de Ginza.'
    },
    {
        id: 'gw2',
        type: 'gastro',
        title: 'Street Food Napolitano',
        location: 'Nápoles, Italia',
        icon: 'fa-pizza-slice',
        color: 'from-red-600 to-yellow-600',
        description: 'La cuna de la pizza. Pero el verdadero secreto es la "Pizza Fritta" y la "Frittatina di Pasta" que se vende en los callejones del Quartieri Spagnoli.',
        details: 'Local Intel: Ve a Pizzeria di Matteo en Via Tribunali. Bill Clinton comió allí y cambió la percepción mundial de la pizza callejera. No pidas cubiertos, se come con las manos "a portafoglio".'
    }
];

const WORLD_METROS: HubIntel[] = [
    {
        id: 'wm1',
        type: 'expat',
        title: 'Londres',
        location: 'Reino Unido',
        icon: 'fa-bridge-water',
        color: 'from-blue-800 to-red-800',
        description: 'La metrópolis global definitiva. Hogar de una de las comunidades de españoles más vibrantes fuera de la península.',
        details: 'Guía Expat: El barrio de Portobello tiene la mayor concentración de productos españoles auténticos de la ciudad. Si buscas el "sentimiento de casa", visita García & Sons.'
    },
    {
        id: 'wm2',
        type: 'expat',
        title: 'Nueva York',
        location: 'EE.UU.',
        icon: 'fa-statue-of-liberty',
        color: 'from-sky-700 to-indigo-900',
        description: 'La ciudad que nunca duerme. Un crisol de culturas donde cada bloque cuenta una historia diferente del mundo.',
        details: 'Secret Spot: La pequeña España (Little Spain) en Hudson Yards es un mercado gastronómico curado por el Chef José Andrés que trae lo mejor de nuestra tierra al corazón de Manhattan.'
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
                            <div 
                                key={f.id} 
                                onClick={() => onHubItemSelect?.(f)}
                                className={`bg-gradient-to-r ${f.color} rounded-[2rem] p-6 border border-white/10 flex items-center gap-6 shadow-xl cursor-pointer hover:scale-[1.02] transition-transform`}
                            >
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
                            <p className="text-[8px] text-amber-400 uppercase tracking-widest mt-1">Descubrimientos de Dai</p>
                        </div>
                        <i className="fas fa-eye text-amber-500"></i>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {CURIOSIDADES.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => onHubItemSelect?.(c)}
                                className="bg-white/5 border border-white/10 rounded-[2rem] p-5 flex items-start gap-5 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors"
                            >
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
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Gastro World</h3>
                            <p className="text-[8px] text-red-500 uppercase tracking-widest mt-1">Joyas culinarias globales</p>
                        </div>
                        <i className="fas fa-utensils text-red-500"></i>
                    </div>
                    <div className="space-y-4">
                        {GASTRO_WORLD.map(g => (
                            <div 
                                key={g.id} 
                                onClick={() => onHubItemSelect?.(g)}
                                className={`bg-gradient-to-br ${g.color} rounded-[2rem] p-6 border border-white/10 flex items-center gap-6 shadow-xl cursor-pointer hover:scale-[1.02] transition-transform`}
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl text-white">
                                    <i className={`fas ${g.icon}`}></i>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">{g.location}</p>
                                    <h4 className="text-md font-black text-white uppercase tracking-tighter">{g.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Metrópolis</h3>
                            <p className="text-[8px] text-blue-400 uppercase tracking-widest mt-1">Los favoritos del mundo</p>
                        </div>
                        <i className="fas fa-city text-blue-500"></i>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {WORLD_METROS.map(m => (
                            <div 
                                key={m.id} 
                                onClick={() => onHubItemSelect?.(m)}
                                className={`h-40 bg-gradient-to-br ${m.color} rounded-[2.5rem] p-6 border border-white/10 flex flex-col justify-between group cursor-pointer active:scale-95 transition-all shadow-2xl relative overflow-hidden`}
                            >
                                <div className="absolute top-2 right-4 text-white/10 text-6xl group-hover:rotate-12 transition-transform">
                                    <i className={`fas ${m.icon}`}></i>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">{m.location}</p>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tighter leading-none">{m.title}</h4>
                                </div>
                                <i className="fas fa-chevron-right text-white/20 text-xs self-end relative z-10"></i>
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
                <div className="relative h-64 w-full rounded-[3rem] overflow-hidden group shadow-2xl border border-white/10 bg-[#020617]">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-indigo-950/20 to-black z-0"></div>
                    <div className="relative z-20 h-full p-8 flex flex-col justify-between">
                        <div>
                            <div className="bg-purple-600 text-white text-[8px] font-black uppercase tracking-[0.3em] py-1 px-3 rounded-full w-fit mb-3">Expedición 2026</div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Descubre el<br/><span className="text-purple-400">Próximo Mundo</span></h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                            {['Tromsø', 'Al-Ula', 'Ljubljana'].map(name => (
                                <div key={name} onClick={() => onCitySelect(name)} className="min-w-[120px] h-24 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-3 flex flex-col justify-end group/item cursor-pointer hover:bg-white/10 transition-all">
                                    <p className="text-xs font-black text-white uppercase">{name}</p>
                                </div>
                            ))}
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
                                    <p className="text-[7px] font-black text-purple-400 uppercase tracking-widest">Ver Rutas</p>
                                </div>
                                <i className={`fas ${city.icon} text-white/10 text-4xl group-hover:scale-110 transition-transform`}></i>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
