
import React, { useState } from 'react';

const UI_LABELS: any = {
    en: { hubTitle: "Explore the World", hubSub: "Smart Global Destinations", homeTitle: "Explore Spain", homeSub: "Major Capitals", villagesTitle: "Charming Villages", villagesSub: "Spanish Rural Gems", catVisited: "Global Icons", catGrowth: "Rising Stars", catExotic: "Exotic", loading: "Syncing...", 
          themes: { 
            'Madrid': 'Historical Capital', 'Barcelona': 'Living Modernism', 'Sevilla': 'Mudejar Essence', 
            'Albarracín': 'Medieval Treasure', 'Cudillero': 'Marine Amphitheater', 'Ronda': 'The Dream City', 'Santillana del Mar': 'Medieval Town',
            'París': 'The City of Light', 'Tokio': 'Cyberpunk Reality', 'Nueva York': 'The Center of the World',
            'Tiflis': 'Avant-garde Caucasus', 'Medellín': 'Tropical Innovation', 'Da Nang': 'Future of Vietnam',
            'Socotra': 'Forgotten Planet', 'Petra': 'Stone City', 'Wadi Rum': 'Valley of the Moon'
          }
    },
    es: { hubTitle: "Explora el Mundo", hubSub: "Destinos Globales Inteligentes", homeTitle: "Explora España", homeSub: "Grandes Capitales", villagesTitle: "Pueblos con Encanto", villagesSub: "Joyas Rurales de España", catVisited: "Iconos Mundiales", catGrowth: "Joyas en Auge", catExotic: "Exóticos", loading: "Sincronizando...",
          themes: { 
            'Madrid': 'Capital Histórica', 'Barcelona': 'Modernismo Vivo', 'Sevilla': 'Esencia Mudéjar', 
            'Albarracín': 'Tesoro Medieval', 'Cudillero': 'Anfiteatro Marino', 'Ronda': 'La Ciudad Soñada', 'Santillana del Mar': 'Villa Medieval',
            'París': 'La Ciudad de la Luz', 'Tokio': 'Cyberpunk Real', 'Nueva York': 'El Centro del Mundo',
            'Tiflis': 'Cáucaso Vanguardista', 'Medellín': 'Innovación Tropical', 'Da Nang': 'Futuro de Vietnam',
            'Socotra': 'Planeta Olvidado', 'Petra': 'Ciudad de Piedra', 'Wadi Rum': 'Valle de la Luna'
          }
    },
    ca: { hubTitle: "Explora el Món", hubSub: "Destins Globals", homeTitle: "Explora Espanya", homeSub: "Grans Capitals", villagesTitle: "Pobles amb Encant", villagesSub: "Joies Rurals", catVisited: "Icones", catGrowth: "En Auge", catExotic: "Exòtics", loading: "Carregant...",
          themes: { 
            'Madrid': 'Capital Històrica', 'Barcelona': 'Modernisme Viu', 'Sevilla': 'Essència Mudèjar', 
            'Albarracín': 'Tresor Medieval', 'Cudillero': 'Amfiteatre Marí', 'Ronda': 'La Ciutat Somiada', 'Santillana del Mar': 'Vila Medieval',
            'París': 'La Ciutat de la Llum', 'Tokio': 'Cyberpunk Real', 'Nueva York': 'El Centre del Món',
            'Tiflis': 'Caucas Avantguardista', 'Medellín': 'Innovació Tropical', 'Da Nang': 'Futur de Vietnam',
            'Socotra': 'Planeta Oblidat', 'Petra': 'Ciutat de Pedra', 'Wadi Rum': 'Vall de la Lluna'
          }
    },
    eu: { hubTitle: "Mundua Esploratu", hubSub: "Helmuga Adimentsuak", homeTitle: "Espainia Esploratu", homeSub: "Hiriburuak", villagesTitle: "Herri Xarmangarriak", villagesSub: "Bitxiak", catVisited: "Ikonikoak", catGrowth: "Goraka", catExotic: "Exotikoak", loading: "Sinkronizatzen...",
          themes: { 
            'Madrid': 'Hiriburu Historikoa', 'Barcelona': 'Modernismo Bizia', 'Sevilla': 'Mudejar Esentzia', 
            'Albarracín': 'Erdi Aroko Altxorra', 'Cudillero': 'Itsas Anfiteatroa', 'Ronda': 'Amestutako Hiria', 'Santillana del Mar': 'Erdi Aroko Hiria',
            'París': 'Argiaren Hiria', 'Tokio': 'Cyberpunk Erreala', 'Nueva York': 'Munduaren Erdigunea',
            'Tiflis': 'Kaukaso Abangoardista', 'Medellín': 'Berrikuntza Tropikala', 'Da Nang': 'Vietnamgo Etorkizuna',
            'Socotra': 'Ahaztutako Planeta', 'Petra': 'Harrizko Hiria', 'Wadi Rum': 'Ilargiaren Harana'
          }
    },
    fr: { hubTitle: "Explorer le Monde", hubSub: "Destinations Globales", homeTitle: "Explorer l'Espagne", homeSub: "Grandes Capitales", villagesTitle: "Villages de Charme", villagesSub: "Joyaux Ruraux", catVisited: "Icônes", catGrowth: "En Vogue", catExotic: "Exotiques", loading: "Synchronisation...",
          themes: { 
            'Madrid': 'Capitale Historique', 'Barcelona': 'Modernisme Vivant', 'Sevilla': 'Essence Mudéjar', 
            'Albarracín': 'Trésor Médiéval', 'Cudillero': 'Amphithéâtre Marin', 'Ronda': 'La Ville Rêvée', 'Santillana del Mar': 'Ville Médiévale',
            'París': 'La Ville Lumière', 'Tokio': 'Réalité Cyberpunk', 'Nueva York': 'Le Centre du Monde',
            'Tiflis': 'Caucase Avant-gardiste', 'Medellín': 'Innovation Tropicale', 'Da Nang': 'Futur du Vietnam',
            'Socotra': 'Planète Oubliée', 'Petra': 'Cité de Pierre', 'Wadi Rum': 'Vallée de la Lune'
          }
    },
    de: { hubTitle: "Welt erkunden", hubSub: "KI-Reiseziele", homeTitle: "Spanien erkunden", homeSub: "Hauptstädte", villagesTitle: "Schöne Dörfer", villagesSub: "Ländliche Perlen", catVisited: "Ikonen", catGrowth: "Aufsteiger", catExotic: "Exotisch", loading: "Synchronisiere...",
          themes: { 
            'Madrid': 'Historische Hauptstadt', 'Barcelona': 'Lebendiger Modernismus', 'Sevilla': 'Mudejar-Essenz', 
            'Albarracín': 'Mittelalterlicher Schatz', 'Cudillero': 'Meeres-Amphitheater', 'Ronda': 'Die Traumstadt', 'Santillana del Mar': 'Mittelalterliche Stadt',
            'París': 'Stadt der Lichter', 'Tokio': 'Cyberpunk-Realität', 'Nueva York': 'Zentrum der Welt',
            'Tiflis': 'Avantgardistischer Kaukasus', 'Medellín': 'Tropische Innovation', 'Da Nang': 'Zukunft Vietnams',
            'Socotra': 'Vergessener Planet', 'Petra': 'Felsenstadt', 'Wadi Rum': 'Mondtal'
          }
    },
    ja: { hubTitle: "世界を探索", hubSub: "AIスマート目的地", homeTitle: "スペインを探索", homeSub: "主要都市", villagesTitle: "魅力的な村", villagesSub: "田舎の宝石", catVisited: "アイコン", catGrowth: "注目スポット", catExotic: "エキゾチック", loading: "同期中...",
          themes: { 
            'Madrid': '歴史的な首都', 'Barcelona': '生きたモダニズム', 'Sevilla': 'ムデハルの本質', 
            'Albarracín': '中世の宝物', 'Cudillero': '海の円形劇場', 'Ronda': '夢の街', 'Santillana del Mar': '中世の町',
            'París': '光の街', 'Tokio': 'サイバーパンクの現実', 'Nueva York': '世界の中心',
            'Tiflis': 'アバンギャルドなコーカサス', 'Medellín': '熱帯のイノベーション', 'Da Nang': 'ベトナムの未来',
            'Socotra': '忘れられた惑星', 'Petra': '石の街', 'Wadi Rum': '月の谷'
          }
    },
    zh: { hubTitle: "探索世界", hubSub: "智能全球目的地", homeTitle: "探索西班牙", homeSub: "主要省会", villagesTitle: "迷人村庄", villagesSub: "乡村明珠", catVisited: "全球图标", catGrowth: "新兴之星", catExotic: "异域风情", loading: "同步中...",
          themes: { 
            'Madrid': '历史首都', 'Barcelona': '活着的现代主义', 'Sevilla': '穆德哈尔精华', 
            'Albarracín': '中世珍宝', 'Cudillero': '海上剧场', 'Ronda': '梦想之城', 'Santillana del Mar': '中世古镇',
            'París': '光之城', 'Tokio': '赛博朋克现实', 'Nueva York': '世界中心',
            'Tiflis': '前卫高加索', 'Medellín': '热带创新', 'Da Nang': '越南的未来',
            'Socotra': '被遗忘的星球', 'Petra': '石头城', 'Wadi Rum': '月亮谷'
          }
    },
    ar: { hubTitle: "استكشف العالم", hubSub: "وجهات عالمية ذكية", homeTitle: "استكشف إسبانيا", homeSub: "العواصم الكبرى", villagesTitle: "قرى ساحرة", villagesSub: "جواهر ريفية", catVisited: "أيقونات عالمية", catGrowth: "نجوم صاعدة", catExotic: "غريب", loading: "مزامنة...",
          themes: { 
            'Madrid': 'عاصمة تاريخية', 'Barcelona': 'حداثة حية', 'Sevilla': 'جوهر مدجن', 
            'Albarracín': 'كنز من العصور الوسطى', 'Cudillero': 'مدرج بحري', 'Ronda': 'مدينة الأحلام', 'Santillana del Mar': 'قرية من العصور الوسطى',
            'París': 'مدينة الأنوار', 'Tokio': 'واقع سايبربانك', 'Nueva York': 'مركز العالم',
            'Tiflis': 'قوقاز متطور', 'Medellín': 'ابتكار استوائي', 'Da Nang': 'مستقبل فيتنام',
            'Socotra': 'كوكب منسي', 'Petra': 'المدينة الوردية', 'Wadi Rum': 'وادي القمر'
          }
    }
};

const SPAIN_CITIES = [
    { name: 'Madrid', color: 'from-orange-600 to-slate-900', icon: 'fa-building-columns' },
    { name: 'Barcelona', color: 'from-blue-700 to-slate-950', icon: 'fa-church' },
    { name: 'Sevilla', color: 'from-amber-600 to-stone-900', icon: 'fa-fan' }
];

const SPAIN_VILLAGES = [
    { name: 'Albarracín', color: 'from-red-800 to-stone-900', icon: 'fa-fort-awesome' },
    { name: 'Cudillero', color: 'from-cyan-700 to-slate-900', icon: 'fa-anchor' },
    { name: 'Ronda', color: 'from-emerald-700 to-slate-900', icon: 'fa-bridge' },
    { name: 'Santillana del Mar', color: 'from-stone-600 to-slate-950', icon: 'fa-scroll' }
];

const HUB_CATEGORIES: any = {
    visited: [
        { name: 'París', color: 'from-blue-600 to-slate-900', icon: 'fa-tower-eiffel' },
        { name: 'Tokio', color: 'from-fuchsia-700 to-slate-950', icon: 'fa-torii-gate' },
        { name: 'Nueva York', color: 'from-slate-700 to-black', icon: 'fa-city' }
    ],
    growth: [
        { name: 'Tiflis', color: 'from-rose-700 to-stone-900', icon: 'fa-mountain-city' },
        { name: 'Medellín', color: 'from-green-700 to-slate-900', icon: 'fa-leaf' },
        { name: 'Da Nang', color: 'from-yellow-600 to-stone-900', icon: 'fa-dragon' }
    ],
    exotic: [
        { name: 'Socotra', color: 'from-teal-800 to-slate-950', icon: 'fa-tree' },
        { name: 'Petra', color: 'from-orange-800 to-red-950', icon: 'fa-archway' },
        { name: 'Wadi Rum', color: 'from-red-600 to-orange-950', icon: 'fa-sun' }
    ]
};

const CityItem: React.FC<{ city: any, onSelect: (name: string) => void, language: string }> = ({ city, onSelect, language }) => {
    const l = UI_LABELS[language] || UI_LABELS.es;
    const translatedTheme = l.themes[city.name] || city.theme || 'Explora';
    
    return (
        <div onClick={() => onSelect(city.name)} className="h-44 bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden relative group cursor-pointer shadow-2xl transition-all hover:scale-[1.02]">
            <div className={`absolute inset-0 bg-gradient-to-br ${city.color} opacity-40 group-hover:opacity-60 transition-opacity`}></div>
            <div className="absolute top-6 right-8 text-white/5 text-7xl group-hover:rotate-6 transition-transform"><i className={`fas ${city.icon}`}></i></div>
            <div className="absolute bottom-8 left-8 right-8">
                <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">{translatedTheme}</p>
                <h4 className="font-black text-white text-3xl tracking-tighter uppercase leading-none">{city.name}</h4>
            </div>
        </div>
    );
};

export const TravelServices: React.FC<any> = ({ mode, language = 'es', onCitySelect }) => {
    const l = UI_LABELS[language] || UI_LABELS.es;
    const [activeHubCat, setActiveHubCat] = useState<'visited' | 'growth' | 'exotic'>('visited');
    
    if (mode === 'HUB') {
        return (
            <div className="space-y-8 pb-40 animate-fade-in">
                <header><h3 className="text-3xl font-black text-white tracking-tighter uppercase">{l.hubTitle}</h3><p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mt-1">{l.hubSub}</p></header>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {(['visited', 'growth', 'exotic'] as const).map(cat => (
                        <button key={cat} onClick={() => setActiveHubCat(cat)} className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeHubCat === cat ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-white/40'}`}>{l[`cat${cat.charAt(0).toUpperCase() + cat.slice(1)}`]}</button>
                    ))}
                </div>
                <section className="space-y-5">{HUB_CATEGORIES[activeHubCat].map((city: any) => <CityItem key={city.name} city={city} onSelect={onCitySelect} language={language} />)}</section>
            </div>
        );
    }
    return (
        <div className="space-y-12 pb-32 animate-fade-in">
            <div className="space-y-6"><header><h3 className="text-3xl font-black text-white tracking-tighter uppercase">{l.homeTitle}</h3><p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mt-1">{l.homeSub}</p></header>
                <section className="space-y-5">{SPAIN_CITIES.map(city => <CityItem key={city.name} city={city} onSelect={onCitySelect} language={language} />)}</section>
            </div>
            <div className="space-y-6"><header><h3 className="text-3xl font-black text-white tracking-tighter uppercase">{l.villagesTitle}</h3><p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mt-1">{l.villagesSub}</p></header>
                <section className="space-y-5">{SPAIN_VILLAGES.map(village => <CityItem key={village.name} city={village} onSelect={onCitySelect} language={language} />)}</section>
            </div>
        </div>
    );
};
