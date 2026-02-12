
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const UI_LABELS: Record<string, any> = {
    es: { hubTitle: "Intel Global", hubSub: "Masterclass Mundial", homeTitle: "Ciudades Top", homeSub: "Explora el mundo", catVisited: "Iconos", catGrowth: "En Auge", catExotic: "Ingeniería", loading: "Cargando intel...", defaultTheme: "Explorar" },
    en: { hubTitle: "Global Intel", hubSub: "World Masterclass", homeTitle: "Top Cities", homeSub: "Explore the world", catVisited: "Icons", catGrowth: "Rising Stars", catExotic: "Engineering", loading: "Syncing...", defaultTheme: "Explore" },
    it: { hubTitle: "Intel Globale", hubSub: "Masterclass Mondiale", homeTitle: "Città Top", homeSub: "Esplora il mondo", catVisited: "Icone", catGrowth: "In Ascesa", catExotic: "Ingegneria", loading: "Caricamento...", defaultTheme: "Esplora" },
    fr: { hubTitle: "Intel Global", hubSub: "Masterclass Mondiale", homeTitle: "Top Villes", homeSub: "Explorer le monde", catVisited: "Icônes", catGrowth: "En Hausse", catExotic: "Ingénierie", loading: "Chargement...", defaultTheme: "Explorer" },
    de: { hubTitle: "Globale Intel", hubSub: "Welt-Masterclass", homeTitle: "Top-Städte", homeSub: "Entdecke die Welt", catVisited: "Ikonen", catGrowth: "Aufstrebend", catExotic: "Engineering", loading: "Lade...", defaultTheme: "Erkunden" },
    pt: { hubTitle: "Intel Global", hubSub: "Masterclass Mundial", homeTitle: "Cidades Top", homeSub: "Explore o mundo", catVisited: "Ícones", catGrowth: "Em Ascensão", catExotic: "Engenharia", loading: "Carregando...", defaultTheme: "Explorar" },
    ro: { hubTitle: "Intel Global", hubSub: "Masterclass Mondial", homeTitle: "Orașe Top", homeSub: "Explorează lumea", catVisited: "Icoane", catGrowth: "În Creștere", catExotic: "Inginerie", loading: "Se încarcă...", defaultTheme: "Explorează" },
    ca: { hubTitle: "Intel Global", hubSub: "Masterclass Mundial", homeTitle: "Ciutats Top", homeSub: "Explora el món", catVisited: "Icones", catGrowth: "En auge", catExotic: "Enginyeria", loading: "Carregant...", defaultTheme: "Explorar" },
    nl: { hubTitle: "Globale Intel", hubSub: "Wereld Masterclass", homeTitle: "Top Steden", homeSub: "Ontdek de wereld", catVisited: "Iconen", catGrowth: "In opkomst", catExotic: "Techniek", loading: "Laden...", defaultTheme: "Ontdekken" },
    zh: { hubTitle: "全球情报", hubSub: "世界大师课", homeTitle: "热门城市", homeSub: "探索世界", catVisited: "图腾", catGrowth: "兴起", catExotic: "工程", loading: "加载中...", defaultTheme: "探索" },
    ja: { hubTitle: "グローバルインテル", hubSub: "世界マスタークラス", homeTitle: "トップ都市", homeSub: "世界を探索する", catVisited: "アイコン", catGrowth: "急成長中", catExotic: "エンジニアリング", loading: "ロード中...", defaultTheme: "探索" },
    ru: { hubTitle: "Глобальный интеллект", hubSub: "Мировой мастер-класс", homeTitle: "Лучшие города", homeSub: "Исследуй мир", catVisited: "Иконы", catGrowth: "На подъеме", catExotic: "Инженерия", loading: "Загрузка...", defaultTheme: "Исследовать" },
    tr: { hubTitle: "Küresel Intel", hubSub: "Dünya Masterclass", homeTitle: "En İyi Şehirler", homeSub: "Dünyayı keşfet", catVisited: "İkonlar", catGrowth: "Yükselen", catExotic: "Mühendislik", loading: "Yükleniyor...", defaultTheme: "Keşfet" },
    pl: { hubTitle: "Globalny Intel", hubSub: "Światowy Masterclass", homeTitle: "Top Miasta", homeSub: "Odkrywaj świat", catVisited: "Ikony", catGrowth: "Na fali", catExotic: "Inżynieria", loading: "Ładowanie...", defaultTheme: "Odkrywaj" },
    hi: { hubTitle: "ग्लोबल इंटेल", hubSub: "WORLD MASTERCLASS", homeTitle: "शीर्ष शहर", homeSub: "दुनिया का अन्वेषण करें", catVisited: "प्रतीक", catGrowth: "उभरते", catExotic: "इंजीनियरिंग", loading: "लोड हो रहा है...", defaultTheme: "अन्वेषण" },
    ko: { hubTitle: "글로벌 인텔", hubSub: "WORLD MASTERCLASS", homeTitle: "인기 도시", homeSub: "세계 탐험", catVisited: "아이콘", catGrowth: "상승세", catExotic: "공학", loading: "로딩 중...", defaultTheme: "탐색" },
    ar: { hubTitle: "الذكاء العالمي", hubSub: "ماستركلاس عالمي", homeTitle: "أفضل المدن", homeSub: "استكشف العالم", catVisited: "أيقونات", catGrowth: "في صعود", catExotic: "هندسة", loading: "جاري التحميل...", defaultTheme: "استكشف" },
    eu: { hubTitle: "Intel Globala", hubSub: "Mundu Masterclassa", homeTitle: "Hiri Onenak", homeSub: "Mundua esploratu", catVisited: "Ikonoak", catGrowth: "Hazten", catExotic: "Ingeniaritza", loading: "Kargatzen...", defaultTheme: "Esploratu" },
    vi: { hubTitle: "Thông tin Toàn cầu", hubSub: "Lớp học Thế giới", homeTitle: "Thành phố Hàng đầu", homeSub: "Khám phá thế giới", catVisited: "Biểu tượng", catGrowth: "Đang phát triển", catExotic: "Kỹ thuật", loading: "Đang tải...", defaultTheme: "Khám phá" },
    th: { hubTitle: "ข้อมูลทั่วโลก", hubSub: "มาสเตอร์คลาสระดับโลก", homeTitle: "เมืองยอดนิยม", homeSub: "สำรวจโลก", catVisited: "ไอคอน", catGrowth: "กำลังเติเติบโต", catExotic: "วิศวกรรม", loading: "กำลังโหลด...", defaultTheme: "สำรวจ" }
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
                    {cities.slice(0, 16).map((city: any) => (
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
