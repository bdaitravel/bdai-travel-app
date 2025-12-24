
import React, { useState, useEffect } from 'react';
import { getRecentCommunityCities } from '../services/supabaseClient';

const CHARMING_VILLAGES = [
    { name: 'Albarracín', region: 'Teruel', icon: 'fa-fort-awesome', img: 'https://images.unsplash.com/photo-1599424423789-9e8c47f76632?auto=format&fit=crop&w=600&q=80', 
      desc: { es: 'Murallas rojizas medievales.', en: 'Medieval red walls.', ca: 'Muralles vermelles medievals.', eu: 'Erdi Aroko harresi gorrixkak.', fr: 'Murailles rouges médiévales.' } },
    { name: 'Cudillero', region: 'Asturias', icon: 'fa-anchor', img: 'https://images.unsplash.com/photo-1598449356475-b9f71ef73024?auto=format&fit=crop&w=600&q=80', 
      desc: { es: 'Anfiteatro de colores.', en: 'Colorful amphitheater.', ca: 'Amfiteatre de colors.', eu: 'Koloretako anfiteatroa.', fr: 'Amphithéâtre coloré.' } },
    { name: 'Ronda', region: 'Málaga', icon: 'fa-bridge', img: 'https://images.unsplash.com/photo-1549247796-5d8f09e9034b?auto=format&fit=crop&w=600&q=80', 
      desc: { es: 'Ciudad sobre el tajo.', en: 'City over the gorge.', ca: 'Ciutat sobre el tajo.', eu: 'Arrailaren gaineko hiria.', fr: 'Ville sur la gorge.' } },
    { name: 'Cadaqués', region: 'Girona', icon: 'fa-palette', img: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?auto=format&fit=crop&w=600&q=80', 
      desc: { es: 'Refugio blanco de Dalí.', en: 'Dali\'s white refuge.', ca: 'Refugi blanc de Dalí.', eu: 'Daliren aterpe zuria.', fr: 'Refuge blanc de Dalí.' } },
];

const INTERNATIONAL_DESTINATIONS = [
    { name: 'Tokyo', icon: 'fa-torii-gate', country: { es: 'Japón', en: 'Japan', ca: 'Japó', eu: 'Japonia', fr: 'Japon' }, desc: { es: 'Neón y Tradición Milenaria', en: 'Neon & Ancient Tradition', ca: 'Neó i Tradició Mil·lenària', eu: 'Neona eta Milaka Urteko Tradizioa', fr: 'Néon et Tradition Millénaire' } },
    { name: 'New York', icon: 'fa-city', country: { es: 'EE.UU.', en: 'USA', ca: 'EUA', eu: 'AEB', fr: 'USA' }, desc: { es: 'La Gran Manzana que Nunca Duerme', en: 'The Big Apple That Never Sleeps', ca: 'La Gran Poma que Mai Dorm', eu: 'Inoiz Lotan Ez Den Sagar Handia', fr: 'La Grosse Pomme qui ne dort jamais' } },
    { name: 'Paris', icon: 'fa-tower-observation', country: { es: 'Francia', en: 'France', ca: 'França', eu: 'Frantzia', fr: 'France' }, desc: { es: 'Ciudad de la Luz y el Romance', en: 'City of Lights & Romance', ca: 'Ciutat de la Llum i el Romanç', eu: 'Argiaren Hiria eta Erromantizismoa', fr: 'Ville Lumière et Romance' } },
    { name: 'London', icon: 'fa-clock', country: { es: 'Reino Unido', en: 'UK', ca: 'Regne Unit', eu: 'Erresuma Batua', fr: 'Royaume-Uni' }, desc: { es: 'Legado Imperial y Vanguardia', en: 'Imperial Legacy & Modernity', ca: 'Llegat Imperial i Avantguarda', eu: 'Ondare Inperiala eta Avantguarda', fr: 'Héritage Impérial et Avant-garde' } },
    { name: 'Rome', icon: 'fa-landmark-dome', country: { es: 'Italia', en: 'Italy', ca: 'Itàlia', eu: 'Italia', fr: 'Italie' }, desc: { es: 'La Ciudad Eterna del Imperio', en: 'The Eternal City of the Empire', ca: 'La Ciutat Eterna de l\'Imperi', eu: 'Inperioaren Hiri Betierekoa', fr: 'La Ville Éternelle de l\'Empire' } },
    { name: 'Berlin', icon: 'fa-monument', country: { es: 'Alemania', en: 'Germany', ca: 'Alemanya', eu: 'Alemania', fr: 'Allemagne' }, desc: { es: 'Historia Viva y Cultura Techno', en: 'Living History & Techno Culture', ca: 'Història Viva i Cultura Techno', eu: 'Bizi den Historia eta Techno Kultura', fr: 'Histoire Vivante et Culture Techno' } },
    { name: 'Lisbon', icon: 'fa-ship', country: { es: 'Portugal', en: 'Portugal', ca: 'Portugal', eu: 'Portugal', fr: 'Portugal' }, desc: { es: 'Siete Colinas, Fado y Azulejos', en: 'Seven Hills, Fado & Tiles', ca: 'Set Turons, Fado i Rajoles', eu: 'Zazpi Kodolar, Fadoa eta Azulejuak', fr: 'Sept Collines, Fado et Azulejos' } },
    { name: 'Amsterdam', icon: 'fa-bridge', country: { es: 'Países Bajos', en: 'Netherlands', ca: 'Països Baixos', eu: 'Herbehereak', fr: 'Pays-Bas' }, desc: { es: 'Canales, Libertad y Bicicletas', en: 'Canals, Freedom & Bicycles', ca: 'Canals, Llibertat i Bicicletes', eu: 'Kanalak, Askatasuna eta Bizikletak', fr: 'Canaux, Liberté et Vélos' } },
    { name: 'Vienna', icon: 'fa-music', country: { es: 'Austria', en: 'Austria', ca: 'Àustria', eu: 'Austria', fr: 'Autriche' }, desc: { es: 'Ciudad de la Música y los Valses', en: 'City of Music & Waltzes', ca: 'Ciutat de la Música', eu: 'Musikaren Hiria', fr: 'Ville de la Musique' } },
    { name: 'Prague', icon: 'fa-castle', country: { es: 'Rep. Checa', en: 'Czech Rep.', ca: 'Rep. Txeca', eu: 'Txekiar Rep.', fr: 'Rép. Tchèque' }, desc: { es: 'La Ciudad de las Cien Torres', en: 'City of a Hundred Spires', ca: 'Ciutat de les Cent Torres', eu: 'Ehun Dorreen Hiria', fr: 'La Ville aux Cent Clochers' } },
];

const UI_TEXTS: any = {
    en: { title: "bdai hub", charming: "Charming Villages", world: "Global Top Destinations", community: "Social Activity", search: "Where next?", aiBadge: "AI SMART GUIDE", selection: "Spain Selection" },
    es: { title: "hub bdai", charming: "Pueblos con Encanto", world: "Top Destinos Globales", community: "Actividad Social", search: "¿A dónde vamos?", aiBadge: "GUÍA INTELIGENTE IA", selection: "Selección España" },
    ca: { title: "hub bdai", charming: "Pobles amb Encant", world: "Top Destins Globals", community: "Activitat Social", search: "Cap on anem?", aiBadge: "GUIA INTEL·LIGENT IA", selection: "Selecció Espanya" },
    eu: { title: "bdai gunea", charming: "Herri Xarmangarriak", world: "Mundu Mailako Helmugak", community: "Jarduera Soziala", search: "Nora joango gara?", aiBadge: "IA GIDA ADIMENDUNA", selection: "Espainiako Aukeraketa" },
    fr: { title: "hub bdai", charming: "Villages Charmants", world: "Top Destinations Mondiales", community: "Activité Sociale", search: "Où allons-nous?", aiBadge: "GUIDE INTELLIGENT IA", selection: "Sélection Espagne" }
};

interface VillageCardProps {
    village: any;
    onClick: () => void;
    lang: string;
}

const VillageCard: React.FC<VillageCardProps> = ({ village, onClick, lang }) => {
    const [error, setError] = useState(false);
    return (
        <div onClick={onClick} className="w-48 flex-shrink-0 relative h-64 rounded-[2rem] overflow-hidden border border-white/10 group cursor-pointer shadow-xl bg-slate-900">
            {!error ? (
                <img src={village.img} onError={() => setError(true)} className="w-full h-full object-cover grayscale-[0.2] transition-transform group-hover:scale-110 duration-1000" alt={village.name} />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-950 flex flex-col items-center justify-center p-4">
                    <i className={`fas ${village.icon} text-4xl text-purple-400 mb-3 opacity-40`}></i>
                    <span className="text-[7px] text-white/30 uppercase tracking-[0.3em] font-black">bdai Seal</span>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
            <div className="absolute bottom-6 left-5 right-5">
                <h4 className="text-lg font-black text-white mb-1 leading-tight">{village.name}</h4>
                <p className="text-[8px] text-white/50 font-medium uppercase tracking-widest">{(village.desc as any)[lang] || village.region}</p>
            </div>
        </div>
    );
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

    return (
        <div className="pb-32 animate-fade-in space-y-12 px-6 pt-10 bg-slate-950 min-h-full">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-heading font-black text-white lowercase tracking-tighter">{t.title}</h2>
                    <p className="text-purple-400 text-[8px] font-black uppercase tracking-[0.5em] opacity-50">Exploring the Future</p>
                </div>
                <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                    <i className="fas fa-globe-americas text-white"></i>
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
                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white outline-none focus:border-purple-500 focus:bg-white/10 transition-all shadow-2xl text-sm" 
                />
            </div>

            <section className="space-y-6">
                <div className="flex justify-between items-end">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{t.charming}</h3>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t.selection}</span>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
                    {CHARMING_VILLAGES.map((v) => (
                        <VillageCard key={v.name} village={v} lang={language} onClick={() => onCitySelect(v.name)} />
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex justify-between items-end">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{t.world}</h3>
                    <span className="text-[8px] font-bold text-purple-500 uppercase tracking-widest">Global Elite</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {INTERNATIONAL_DESTINATIONS.map((v) => (
                        <button 
                            key={v.name} 
                            onClick={() => onCitySelect(v.name)}
                            className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all active:scale-[0.98] text-left group"
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 border border-white/10">
                                <i className={`fas ${v.icon} text-purple-400 text-lg`}></i>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-white font-black text-sm">{v.name}</h4>
                                    <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">{(v.country as any)[language] || 'World'}</span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-medium">{(v.desc as any)[language]}</p>
                            </div>
                            <i className="fas fa-arrow-right text-[10px] text-slate-700 group-hover:text-purple-500 transition-colors"></i>
                        </button>
                    ))}
                </div>
            </section>

            {communityCities.length > 0 && (
                <section className="space-y-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{t.community}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {communityCities.map((cityObj) => (
                            <button 
                                key={cityObj.city} 
                                onClick={() => onCitySelect(cityObj.city)}
                                className="bg-white/5 border border-white/10 p-5 rounded-[2rem] text-left hover:bg-white/10 transition-all group relative overflow-hidden h-32 flex flex-col justify-end"
                            >
                                <div className="absolute -right-4 -top-4 w-12 h-12 bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform"></div>
                                <i className="fas fa-rocket text-purple-500/20 text-4xl absolute top-4 left-4"></i>
                                <span className="text-[7px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1 block relative z-10">{t.aiBadge}</span>
                                <span className="text-sm font-black text-white block truncate relative z-10">{cityObj.city}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};
