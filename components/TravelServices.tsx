
import React, { useMemo } from 'react';

// Etiquetas de UI para los encabezados (15 idiomas)
const UI_LABELS: Record<string, any> = {
    es: { mainTitle: "ESPAÑA", mainSub: "Metrópolis principales", villageTitle: "PUEBLOS MÁGICOS", villageSub: "Tesoros rurales", iconTitle: "ICONOS GLOBALES", iconSub: "Destinos legendarios", risingTitle: "EN AUGE", risingSub: "Tendencias mundiales", exoticTitle: "MARAVILLAS", exoticSub: "Destinos exóticos" },
    en: { mainTitle: "SPAIN", mainSub: "Main metropolis", villageTitle: "MAGIC VILLAGES", villageSub: "Rural treasures", iconTitle: "GLOBAL ICONS", iconSub: "Legendary destinations", risingTitle: "RISING", risingSub: "World trends", exoticTitle: "WONDERS", exoticSub: "Exotic destinations" },
    zh: { mainTitle: "西班牙", mainSub: "主要大都市", villageTitle: "魅力乡村", villageSub: "乡村宝藏", iconTitle: "全球标志", iconSub: "传奇目的地", risingTitle: "新兴", risingSub: "世界趋势", exoticTitle: "奇观", exoticSub: "异国风情" },
    ca: { mainTitle: "ESPANYA", mainSub: "Metròpolis principals", villageTitle: "POBLES MÀGICS", villageSub: "Tresors rurals", iconTitle: "ICONES GLOBALS", iconSub: "Destins llegendaris", risingTitle: "EN AUGE", risingSub: "Tendències mundials", exoticTitle: "MERAVELLES", exoticSub: "Destins exòtics" },
    eu: { mainTitle: "ESPAINIA", mainSub: "Metropoli nagusiak", villageTitle: "HERRI MAGIKOAK", villageSub: "Landa-altxorrak", iconTitle: "IKONO GLOBALAK", iconSub: "Helmuga legendarioak", risingTitle: "GORALDIAN", risingSub: "Mundu mailako joerak", exoticTitle: "MIRARIAK", exoticSub: "Helmuga exotikoak" },
    ar: { mainTitle: "إسبانيا", mainSub: "المدن الرئيسية", villageTitle: "قرى ساحرة", villageSub: "كنوز ريفية", iconTitle: "أيقونات عالمية", iconSub: "وجهات أسطورية", risingTitle: "صاعدة", risingSub: "اتجهات عالمية", exoticTitle: "عجائب", exoticSub: "وجهات غريبة" },
    pt: { mainTitle: "ESPANHA", mainSub: "Metrópoles principais", villageTitle: "VILAS MÁGICAS", villageSub: "Tesouros rurais", iconTitle: "ÍCONES GLOBAIS", iconSub: "Destinos lendários", risingTitle: "EM ASCENSÃO", risingSub: "Tendências mundiais", exoticTitle: "MARAVILHAS", exoticSub: "Destinos exóticos" },
    fr: { mainTitle: "ESPAGNE", mainSub: "Métropoles principales", villageTitle: "VILLAGES MAGIQUES", villageSub: "Trésors ruraux", iconTitle: "ICÔNES MONDIALES", iconSub: "Destinations légendaires", risingTitle: "EN ESSOR", risingSub: "Tendances mondiales", exoticTitle: "MERVEILLES", exoticSub: "Destinations exotiques" },
    de: { mainTitle: "SPANIEN", mainSub: "Hauptstädte", villageTitle: "ZAUBERHAFTE DÖRFER", villageSub: "Ländliche Schätze", iconTitle: "GLOBALE IKONEN", iconSub: "Legendäre Ziele", risingTitle: "AUFSTREBEND", risingSub: "Weltweite Trends", exoticTitle: "WUNDER", exoticSub: "Exotische Ziele" },
    it: { mainTitle: "SPAGNA", mainSub: "Metropoli principali", villageTitle: "BORGHI MAGICI", villageSub: "Tesori rurali", iconTitle: "ICONE GLOBALI", iconSub: "Destinazioni leggendarie", risingTitle: "IN ASCESA", risingSub: "Tendenze mondiali", exoticTitle: "MERAVIGLIE", exoticSub: "Destinazioni esotiche" },
    ja: { mainTitle: "スペイン", mainSub: "主要都市", villageTitle: "魔法の村", villageSub: "田舎の宝物", iconTitle: "グローバルアイコン", iconSub: "伝説の目的地", risingTitle: "新興", risingSub: "トレンド", exoticTitle: "驚異", exoticSub: "エキゾチック" },
    ru: { mainTitle: "ИСПАНИЯ", mainSub: "Главные мегаполисы", villageTitle: "ВОЛШЕБНЫЕ ДЕРЕВНИ", villageSub: "Сельские сокровища", iconTitle: "МИРОВЫЕ ИКОНЫ", iconSub: "Легендарные места", risingTitle: "В РОСТЕ", risingSub: "Мировые тренды", exoticTitle: "ЧУДЕСА", exoticSub: "Экзотика" },
    hi: { mainTitle: "स्पेन", mainSub: "मुख्य महानगर", villageTitle: "जादुई गाँव", villageSub: "ग्रामीण खजाने", iconTitle: "वैश्विक प्रतीक", iconSub: "प्रसिद्ध गंतव्य", risingTitle: "उभरते", risingSub: "विश्व रुझान", exoticTitle: "अजूबे", exoticSub: "विदेशी गंतव्य" },
    ko: { mainTitle: "스페인", mainSub: "주요 대도시", villageTitle: "마법의 마을", villageSub: "전원 보물", iconTitle: "글로벌 아이콘", iconSub: "전설적인 목적지", risingTitle: "상승세", risingSub: "세계 트렌드", exoticTitle: "경이로움", exoticSub: "이국적인 목적지" },
    tr: { mainTitle: "İSPANYA", mainSub: "Ana metropoller", villageTitle: "BÜYÜLÜ KÖYLER", villageSub: "Kırsal hazineler", iconTitle: "KÜRESEL İKONLAR", iconSub: "Efsanevi yerler", risingTitle: "YÜKSELENLER", risingSub: "Dünya trendleri", exoticTitle: "HARİKALAR", exoticSub: "Egzotik yerler" }
};

// Diccionario de Ciudades (Traducciones manuales verificadas para los 15 idiomas)
const CITY_DICT: Record<string, Record<string, { n: string, t: string }>> = {
    // CIUDADES ESPAÑA
    'Madrid': { es: { n: 'Madrid', t: 'Capital' }, en: { n: 'Madrid', t: 'Capital' }, zh: { n: '马德里', t: '首都' }, ca: { n: 'Madrid', t: 'Capital' }, eu: { n: 'Madril', t: 'Hiriburua' }, ar: { n: 'مدريد', t: 'العاصمة' }, ja: { n: 'マドリード', t: '首都' }, hi: { n: 'मैड्रिड', t: 'राजधानी' }, ko: { n: '마드리드', t: '수도' } },
    'Barcelona': { es: { n: 'Barcelona', t: 'Metrópoli' }, en: { n: 'Barcelona', t: 'Metropolis' }, zh: { n: '巴塞罗那', t: '大都市' }, ca: { n: 'Barcelona', t: 'Metròpoli' }, eu: { n: 'Bartzelona', t: 'Metropolia' }, ar: { n: 'برشلونة', t: 'مدينة كبرى' }, ja: { n: 'バルセロナ', t: '大都市' }, hi: { n: 'बार्सिलोना', t: 'महानगर' } },
    'Sevilla': { es: { n: 'Sevilla', t: 'Azahar' }, en: { n: 'Seville', t: 'Soul' }, ar: { n: 'إشبيلية', t: 'روح' }, ja: { n: 'セビリア', t: '魂' }, zh: { n: '塞维利亚', t: '灵魂' }, fr: { n: 'Séville', t: 'Âme' } },
    'Valencia': { es: { n: 'Valencia', t: 'Luz' }, en: { n: 'Valencia', t: 'Light' }, ca: { n: 'València', t: 'Llum' }, ja: { n: 'バレンシア', t: '光' }, ar: { n: 'فالنسيا', t: 'نور' }, zh: { n: '瓦伦西亚', t: '光' } },
    'Málaga': { es: { n: 'Málaga', t: 'Costa' }, en: { n: 'Malaga', t: 'Coast' }, ar: { n: 'مالقة', t: 'ساحل' }, ja: { n: 'マラガ', t: '海岸' }, zh: { n: '马拉加', t: '海岸' } },
    'Bilbao': { es: { n: 'Bilbao', t: 'Titanio' }, en: { n: 'Bilbao', t: 'Titanium' }, eu: { n: 'Bilbo', t: 'Titanioa' }, ja: { n: 'ビルバオ', t: 'チタン' }, zh: { n: '毕尔巴鄂', t: '钛' } },
    'Zaragoza': { es: { n: 'Zaragoza', t: 'Ebro' }, en: { n: 'Zaragoza', t: 'Ebro' }, ar: { n: 'سرقسطة', t: 'إبرو' }, ja: { n: 'サラゴサ', t: 'エブロ' }, zh: { n: '萨拉戈萨', t: '埃布罗' } },
    'Santiago': { es: { n: 'Santiago', t: 'Camino' }, en: { n: 'Santiago', t: 'Way' }, fr: { n: 'Saint-Jacques', t: 'Chemin' }, ja: { n: 'サンティアゴ', t: '道' }, ar: { n: 'سانتياغو', t: 'طريق' } },
    'Toledo': { es: { n: 'Toledo', t: 'Espada' }, en: { n: 'Toledo', t: 'Sword' }, ar: { n: 'طليطلة', t: 'سيف' }, ja: { n: 'トレド', t: '剣' }, zh: { n: '托莱多', t: '剑' } },
    'Cordoba': { es: { n: 'Córdoba', t: 'Mezquita' }, en: { n: 'Cordoba', t: 'Mosque' }, ar: { n: 'قرطبة', t: 'مسجد' }, ja: { n: 'コルドバ', t: 'モスク' }, zh: { n: '科尔多瓦', t: '清真寺' } },
    'Alicante': { es: { n: 'Alicante', t: 'Sol' }, en: { n: 'Alicante', t: 'Sun' }, ca: { n: 'Alacant', t: 'Sol' }, ja: { n: 'アリカンテ', t: '太陽' }, ar: { n: 'أليكانتي', t: 'شمس' } },
    'Salamanca': { es: { n: 'Salamanca', t: 'Saber' }, en: { n: 'Salamanca', t: 'Letters' }, fr: { n: 'Salamanque', t: 'Savoir' }, ja: { n: 'サラマンカ', t: '知識' }, zh: { n: '萨拉曼卡', t: '知识' } },

    // PUEBLOS ESPAÑA
    'Albarracin': { es: { n: 'Albarracín', t: 'Rojo' }, en: { n: 'Albarracin', t: 'Red' }, ar: { n: 'الباراسين', t: 'أحمر' }, ja: { n: 'アルバラシン', t: '赤' }, zh: { n: '阿尔巴拉辛', t: '红色' } },
    'Cudillero': { es: { n: 'Cudillero', t: 'Mar' }, en: { n: 'Cudillero', t: 'Sea' }, ru: { n: 'Кудильеро', t: 'море' }, ja: { n: 'クディジェロ', t: '海' } },
    'Ronda': { es: { n: 'Ronda', t: 'Tajo' }, en: { n: 'Ronda', t: 'Gorge' }, ar: { n: 'روندا', t: 'خانق' }, ja: { n: 'ロンダ', t: '峡谷' }, zh: { n: '龙达', t: '峡谷' } },
    'Cadaques': { es: { n: 'Cadaqués', t: 'Dalí' }, en: { n: 'Cadaques', t: 'Dali' }, ca: { n: 'Cadaqués', t: 'Dalí' }, ja: { n: 'カダケス', t: 'ダリ' }, zh: { n: '卡达凯斯', t: '达利' } },
    'Valldemossa': { es: { n: 'Valldemossa', t: 'Piano' }, en: { n: 'Valldemossa', t: 'Piano' }, ca: { n: 'Valldemossa', t: 'Piano' }, ja: { n: 'バルデモッサ', t: 'ピアノ' } },
    'Morella': { es: { n: 'Morella', t: 'Muros' }, en: { n: 'Morella', t: 'Walls' }, ca: { n: 'Morella', t: 'Murs' }, ja: { n: 'モレラ', t: '壁' } },
    'Trujillo': { es: { n: 'Trujillo', t: 'Plaza' }, en: { n: 'Trujillo', t: 'Square' }, ar: { n: 'تروخيو', t: 'ساحة' }, ja: { n: 'トルヒージョ', t: '広場' } },
    'Frigiliana': { es: { n: 'Frigiliana', t: 'Blanco' }, en: { n: 'Frigiliana', t: 'White' }, ja: { n: 'フリヒリアナ', t: '白' }, zh: { n: '弗里希利亚纳', t: '白色' } },
    'Ainsa': { es: { n: 'Aínsa', t: 'Piedra' }, en: { n: 'Ainsa', t: 'Stone' }, fr: { n: 'Ainsa', t: 'Pierre' }, ja: { n: 'アインサ', t: '石' } },
    'Besalu': { es: { n: 'Besalú', t: 'Puente' }, en: { n: 'Besalu', t: 'Bridge' }, ca: { n: 'Besalú', t: 'Pont' }, ja: { n: 'ベサルー', t: '橋' } },

    // INTERNACIONAL
    'Paris': { es: { n: 'París', t: 'Luz' }, en: { n: 'Paris', t: 'Light' }, fr: { n: 'Paris', t: 'Lumière' }, ar: { n: 'باريس', t: 'نور' }, ja: { n: 'パリ', t: '光' }, zh: { n: '巴黎', t: '光' }, hi: { n: 'पेरिस', t: 'रोशनी' } },
    'Tokyo': { es: { n: 'Tokio', t: 'Neo' }, en: { n: 'Tokyo', t: 'Neo' }, ja: { n: '東京', t: 'ネオ' }, zh: { n: '东京', t: '新' }, ko: { n: '도쿄', t: '네오' }, ar: { n: 'طوكيو', t: 'نيو' } },
    'Rome': { es: { n: 'Roma', t: 'Eterna' }, en: { n: 'Rome', t: 'Eternal' }, it: { n: 'Roma', t: 'Eterna' }, ar: { n: 'روما', t: 'خالدة' }, ja: { n: 'ローマ', t: '永遠' }, zh: { n: '罗马', t: '永恒' } },
    'London': { es: { n: 'Londres', t: 'Mist' }, en: { n: 'London', t: 'Mist' }, ru: { n: 'Лондон', t: 'туман' }, ja: { n: 'ロンドン', t: '霧' }, zh: { n: '伦敦', t: '雾' } },
    'New York': { es: { n: 'Nueva York', t: 'Empire' }, en: { n: 'New York', t: 'Empire' }, ja: { n: 'ニューヨーク', t: '帝国' }, zh: { n: '纽约', t: '帝国' }, ar: { n: 'نيويورك', t: 'إمباير' } },
    'Dubai': { es: { n: 'Dubái', t: 'Oro' }, en: { n: 'Dubai', t: 'Gold' }, ar: { n: 'دبي', t: 'ذهب' }, ja: { n: 'ドバイ', t: '金' }, zh: { n: '迪拜', t: '黄金' } },
    'Seoul': { es: { n: 'Seúl', t: 'Pop' }, en: { n: 'Seoul', t: 'Pop' }, ko: { n: '서울', t: '팝' }, ja: { n: 'ソウル', t: 'ポップ' }, zh: { n: '首尔', t: '流行' } },
    'Istanbul': { es: { n: 'Estambul', t: 'Bósforo' }, en: { n: 'Istanbul', t: 'Bosphorus' }, tr: { n: 'İstanbul', t: 'Boğaz' }, ar: { n: 'إسطنبول', t: 'بوسفور' }, ja: { n: 'イスタンブール', t: 'ボスフォラス' } },
    'Singapore': { es: { n: 'Singapur', t: 'Futuro' }, en: { n: 'Singapore', t: 'Future' }, ja: { n: 'シンガポール', t: '未来' }, zh: { n: '新加坡', t: '未来' } },
    'Bangkok': { es: { n: 'Bangkok', t: 'Templo' }, en: { n: 'Bangkok', t: 'Temple' }, ar: { n: 'بانكوك', t: 'معبد' }, ja: { n: 'バンコク', t: '寺院' } },
    'Petra': { es: { n: 'Petra', t: 'Roca' }, en: { n: 'Petra', t: 'Rock' }, ar: { n: 'البتراء', t: 'صخرة' }, ja: { n: 'ペトラ', t: '岩' }, zh: { n: '佩特拉', t: '岩石' } },
    'Cairo': { es: { n: 'El Cairo', t: 'Nilo' }, en: { n: 'Cairo', t: 'Nile' }, ar: { n: 'القاهرة', t: 'نيل' }, hi: { n: 'काहिरा', t: 'नील' }, ja: { n: 'カイロ', t: 'ナイル' } },
    'Bali': { es: { n: 'Bali', t: 'Zen' }, en: { n: 'Bali', t: 'Zen' }, ja: { n: 'バリ', t: '禅' }, zh: { n: '巴厘岛', t: '禅' } },
    'Marrakech': { es: { n: 'Marrakech', t: 'Zoco' }, en: { n: 'Marrakech', t: 'Souk' }, ar: { n: 'مراكش', t: 'سوق' }, fr: { n: 'Marrakech', t: 'Souk' } },
    'Sydney': { es: { n: 'Sídney', t: 'Opera' }, en: { n: 'Sydney', t: 'Opera' }, ja: { n: 'シドニー', t: 'オペラ' }, zh: { n: '悉尼', t: '歌剧' }, hi: { n: 'सिडनी', t: 'ओपेरा' } }
};

const SPAIN_LIST = [
    { id: 'Madrid', color: 'from-orange-600 to-slate-900', icon: 'fa-building-columns' },
    { id: 'Barcelona', color: 'from-blue-700 to-slate-950', icon: 'fa-church' },
    { id: 'Sevilla', color: 'from-amber-600 to-stone-900', icon: 'fa-fan' },
    { id: 'Valencia', color: 'from-cyan-500 to-slate-900', icon: 'fa-flask' },
    { id: 'Málaga', color: 'from-rose-500 to-slate-950', icon: 'fa-palette' },
    { id: 'Bilbao', color: 'from-gray-600 to-slate-900', icon: 'fa-industry' },
    { id: 'Zaragoza', color: 'from-yellow-600 to-slate-900', icon: 'fa-synagogue' },
    { id: 'Santiago', color: 'from-blue-400 to-slate-950', icon: 'fa-person-hiking' },
    { id: 'Toledo', color: 'from-amber-700 to-stone-950', icon: 'fa-khanda' },
    { id: 'Cordoba', color: 'from-emerald-700 to-slate-900', icon: 'fa-mosque' },
    { id: 'Alicante', color: 'from-blue-300 to-slate-950', icon: 'fa-umbrella-beach' },
    { id: 'Salamanca', color: 'from-orange-400 to-amber-900', icon: 'fa-graduation-cap' }
];

const VILLAGES_LIST = [
    { id: 'Albarracin', color: 'from-red-800 to-stone-900', icon: 'fa-chess-rook' },
    { id: 'Cudillero', color: 'from-cyan-700 to-slate-900', icon: 'fa-anchor' },
    { id: 'Ronda', color: 'from-emerald-700 to-slate-900', icon: 'fa-bridge' },
    { id: 'Cadaques', color: 'from-blue-500 to-white/10', icon: 'fa-ship' },
    { id: 'Valldemossa', color: 'from-green-800 to-slate-950', icon: 'fa-music' },
    { id: 'Morella', color: 'from-slate-600 to-black', icon: 'fa-mountain-city' },
    { id: 'Trujillo', color: 'from-amber-800 to-slate-950', icon: 'fa-horse' },
    { id: 'Frigiliana', color: 'from-slate-200 to-slate-800', icon: 'fa-house' },
    { id: 'Ainsa', color: 'from-stone-600 to-stone-950', icon: 'fa-castle' },
    { id: 'Besalu', color: 'from-orange-900 to-black', icon: 'fa-archway' }
];

const ICONS_LIST = [
    { id: 'Paris', color: 'from-blue-600 to-slate-900', icon: 'fa-tower-eiffel' },
    { id: 'Tokyo', color: 'from-fuchsia-700 to-slate-950', icon: 'fa-torii-gate' },
    { id: 'Rome', color: 'from-orange-700 to-slate-950', icon: 'fa-landmark' },
    { id: 'London', color: 'from-red-700 to-slate-900', icon: 'fa-clock' },
    { id: 'New York', color: 'from-slate-500 to-slate-900', icon: 'fa-statue-of-liberty' }
];

const RISING_LIST = [
    { id: 'Dubai', color: 'from-yellow-600 to-slate-950', icon: 'fa-building-ngo' },
    { id: 'Seoul', color: 'from-emerald-600 to-slate-900', icon: 'fa-microphone' },
    { id: 'Istanbul', color: 'from-indigo-700 to-slate-900', icon: 'fa-mosque' },
    { id: 'Singapore', color: 'from-cyan-400 to-blue-900', icon: 'fa-leaf' },
    { id: 'Bangkok', color: 'from-orange-400 to-yellow-900', icon: 'fa-vihara' }
];

const EXOTIC_LIST = [
    { id: 'Petra', color: 'from-rose-800 to-stone-900', icon: 'fa-monument' },
    { id: 'Cairo', color: 'from-yellow-700 to-amber-950', icon: 'fa-pyramids' },
    { id: 'Bali', color: 'from-emerald-500 to-green-950', icon: 'fa-tree' },
    { id: 'Marrakech', color: 'from-orange-700 to-red-950', icon: 'fa-sun' },
    { id: 'Sydney', color: 'from-blue-400 to-slate-900', icon: 'fa-water' }
];

const CityItem: React.FC<{ city: any, onSelect: (name: string) => void, language: string, small?: boolean }> = ({ city, onSelect, language, small }) => {
    const info = useMemo(() => {
        const d = CITY_DICT[city.id];
        if (d) {
            const local = d[language] || d['en'] || d['es'] || { n: city.id, t: 'Discovery' };
            return local;
        }
        return { n: city.id, t: 'Travel' };
    }, [city.id, language]);

    return (
        <div 
            onClick={() => onSelect(info.n)} 
            className={`${small ? 'h-32' : 'h-36'} bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden relative group cursor-pointer shadow-xl transition-all hover:scale-[1.02] active:scale-95`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${city.color} opacity-30 group-hover:opacity-50 transition-opacity`}></div>
            <div className="absolute top-4 right-6 text-white/5 text-5xl group-hover:rotate-6 transition-transform">
                <i className={`fas ${city.icon}`}></i>
            </div>
            <div className="absolute bottom-5 left-6 right-6">
                <p className="text-[7px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1 opacity-80 lowercase">{info.t}</p>
                <h4 className="font-black text-white text-xl tracking-tighter uppercase leading-none truncate">{info.n}</h4>
            </div>
        </div>
    );
};

const SectionHeader: React.FC<{ title: string, sub: string }> = ({ title, sub }) => (
    <header className="mb-4">
        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{title}</h3>
        <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.3em] mt-1">{sub}</p>
    </header>
);

export const TravelServices: React.FC<any> = ({ mode, language = 'es', onCitySelect }) => {
    const l = UI_LABELS[language] || UI_LABELS['en'] || UI_LABELS['es'];
    
    // Si el modo es HUB o HOME, ahora mostramos una vista unificada enriquecida
    return (
        <div className="space-y-12 pb-32 animate-fade-in">
            {/* ESPAÑA */}
            <section className="space-y-4">
                <SectionHeader title={l.mainTitle} sub={l.mainSub} />
                <div className="grid grid-cols-2 gap-3">
                    {SPAIN_LIST.map(city => (
                        <CityItem key={city.id} city={city} onSelect={onCitySelect} language={language} small />
                    ))}
                </div>
            </section>

            {/* PUEBLOS MÁGICOS */}
            <section className="space-y-4">
                <SectionHeader title={l.villageTitle} sub={l.villageSub} />
                <div className="grid grid-cols-2 gap-3">
                    {VILLAGES_LIST.map(v => (
                        <CityItem key={v.id} city={v} onSelect={onCitySelect} language={language} small />
                    ))}
                </div>
            </section>

            {/* ICONOS GLOBALES (INTEGRADO) */}
            <section className="space-y-4">
                <SectionHeader title={l.iconTitle} sub={l.iconSub} />
                <div className="grid grid-cols-2 gap-3">
                    {ICONS_LIST.map(i => (
                        <CityItem key={i.id} city={i} onSelect={onCitySelect} language={language} small />
                    ))}
                </div>
            </section>

            {/* EN AUGE (INTEGRADO) */}
            <section className="space-y-4">
                <SectionHeader title={l.risingTitle} sub={l.risingSub} />
                <div className="grid grid-cols-2 gap-3">
                    {RISING_LIST.map(r => (
                        <CityItem key={r.id} city={r} onSelect={onCitySelect} language={language} small />
                    ))}
                </div>
            </section>

            {/* EXÓTICOS / MARAVILLAS (INTEGRADO) */}
            <section className="space-y-4">
                <SectionHeader title={l.exoticTitle} sub={l.exoticSub} />
                <div className="grid grid-cols-2 gap-3">
                    {EXOTIC_LIST.map(e => (
                        <CityItem key={e.id} city={e} onSelect={onCitySelect} language={language} small />
                    ))}
                </div>
            </section>
        </div>
    );
};
