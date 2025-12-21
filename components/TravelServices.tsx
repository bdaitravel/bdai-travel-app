
import React from 'react';

const VILLAGES = [
    { name: 'Albarracín', province: 'Teruel', secret: 'Sus murallas parecen sacadas de Juego de Tronos.', img: 'https://images.unsplash.com/photo-1518715303843-586e350765b2?auto=format&fit=crop&w=400&q=80' },
    { name: 'Cudillero', province: 'Asturias', secret: 'El pueblo forma un anfiteatro natural hacia el mar.', img: 'https://images.unsplash.com/photo-1543783232-260a990a1c02?auto=format&fit=crop&w=400&q=80' },
    { name: 'Ronda', province: 'Málaga', secret: 'Su puente Tajo divide la ciudad en dos abismos.', img: 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?auto=format&fit=crop&w=400&q=80' }
];

const WORLD_TOP = [
    { rank: 1, city: 'Dubai', visitors: '16.7M', attraction: 'Luxury & Future', trend: '+12%' },
    { rank: 2, city: 'Londres', visitors: '15.8M', attraction: 'History & Arts', trend: '+5%' },
    { rank: 3, city: 'París', visitors: '14.2M', attraction: 'Romance & Food', trend: '+8%' },
    { rank: 4, city: 'Bangkok', visitors: '12.1M', attraction: 'Street Life', trend: '-2%' }
];

const LOCAL_DIGEST = [
    { title: 'Tapa de la Semana', desc: 'Prueba la alcachofa confitada en el Barrio de las Letras.', type: 'Gastro', icon: 'fa-utensils', color: 'bg-emerald-500/10 text-emerald-500', city: 'Madrid' },
    { title: 'Mercado de Motores', desc: 'Este finde en la antigua estación de Delicias.', type: 'Evento', icon: 'fa-calendar-star', color: 'bg-purple-500/10 text-purple-500', city: 'Madrid' },
    { title: 'Vistas Secretas', desc: 'La azotea oculta con las mejores vistas del Palacio Real.', type: 'Secreto', icon: 'fa-eye', color: 'bg-blue-500/10 text-blue-500', city: 'Madrid' }
];

const UI_TEXTS: any = {
    en: { title: "bdai Hub", digest: "Local Digest", villages: "Charming Villages", villagesSub: "Spain's hidden gems", world: "Global Trends", worldSub: "Most visited cities in 2024", search: "Search any city..." },
    es: { title: "bdai Hub", digest: "Sabores & Eventos", villages: "Pueblos con Encanto", villagesSub: "Joyas ocultas de España", world: "Tendencias Mundiales", worldSub: "Ciudades más visitadas 2024", search: "Buscar cualquier ciudad..." },
    ca: { title: "bdai Hub", digest: "Sabors i Events", villages: "Pobles amb Encant", villagesSub: "Joies ocultes d'Espanya", world: "Tendències Mundials", worldSub: "Ciutats més visitades 2024", search: "Cerca qualsevol ciutat..." },
    eu: { title: "bdai Hub", digest: "Tokiko Digest", villages: "Herri Xarmangarriak", villagesSub: "Espainiako harribitxi ezkutuak", world: "Joera Globalak", worldSub: "2024an gehien bisitatutako hiriak", search: "Bilatu edozein hiri..." },
    fr: { title: "bdai Hub", digest: "Digest Local", villages: "Villages de Charme", villagesSub: "Joyaux cachés d'Espagne", world: "Tendances Mondiales", worldSub: "Villes les plus visitées 2024", search: "Rechercher une ville..." }
};

interface TravelServicesProps {
    language?: string;
    onCitySelect: (city: string) => void;
}

export const TravelServices: React.FC<TravelServicesProps> = ({ language = 'es', onCitySelect }) => {
    const t = UI_TEXTS[language] || UI_TEXTS['es'];
    const [searchValue, setSearchValue] = React.useState('');

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchValue.trim()) {
            onCitySelect(searchValue.trim());
        }
    };

    return (
        <div className="pb-32 animate-fade-in space-y-10 px-6 pt-10">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-white lowercase tracking-tighter">{t.title}</h2>
                    <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] opacity-60">Smart Travel Concierge</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <i className="fas fa-satellite-dish text-purple-500 animate-pulse"></i>
                </div>
            </header>

            <div className="relative">
                <i className="fas fa-search absolute left-5 top-5 text-slate-500"></i>
                <input 
                    type="text" 
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={handleSearch}
                    placeholder={t.search} 
                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white outline-none focus:border-purple-500 transition-all shadow-xl" 
                />
            </div>

            <section className="space-y-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <i className="fas fa-fire-flame-curved text-orange-500"></i> {t.digest}
                </h3>
                <div className="space-y-3">
                    {LOCAL_DIGEST.map((item, idx) => (
                        <div key={idx} onClick={() => onCitySelect(item.city)} className="bg-white/5 border border-white/10 p-5 rounded-[2rem] flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer active:scale-[0.98]">
                            <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-xl`}>
                                <i className={`fas ${item.icon}`}></i>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{item.type}</p>
                                <h4 className="text-sm font-black text-white">{item.title}</h4>
                                <p className="text-[11px] text-slate-400 font-medium leading-tight">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <h3 className="text-lg font-black text-white">{t.villages}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.villagesSub}</p>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
                    {VILLAGES.map(v => (
                        <div key={v.name} onClick={() => onCitySelect(v.name)} className="w-64 flex-shrink-0 relative h-80 rounded-[2.5rem] overflow-hidden border border-white/10 group shadow-2xl cursor-pointer active:scale-95 transition-transform">
                            <img src={v.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={v.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">{v.province}</p>
                                <h4 className="text-xl font-black text-white mb-2">{v.name}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4 pb-10">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <i className="fas fa-globe-americas text-blue-500"></i> {t.world}
                </h3>
                <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden backdrop-blur-sm">
                    {WORLD_TOP.map((city, idx) => (
                        <div 
                            key={city.city} 
                            onClick={() => onCitySelect(city.city)}
                            className={`flex items-center p-5 gap-4 cursor-pointer hover:bg-white/5 transition-colors ${idx !== WORLD_TOP.length - 1 ? 'border-b border-white/5' : ''}`}
                        >
                            <span className="text-2xl font-black text-slate-800 w-8">{city.rank}</span>
                            <div className="flex-1">
                                <p className="font-black text-white">{city.city}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{city.attraction}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-bold text-white text-sm">{city.visitors}</p>
                                <span className="text-[8px] font-black text-green-400">{city.trend}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
