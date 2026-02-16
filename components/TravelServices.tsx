
import React, { useState } from 'react';

const UI_LABELS: Record<string, any> = {
    es: { 
        hubTitle: "Intel Hub", hubSub: "Base de Datos Global", homeTitle: "Explora España", homeSub: "Masterclasses Nacionales", 
        catCapitales: "Grandes Capitales", catVisitadas: "Más Visitadas", catPueblos: "Pueblos con Encanto", catJoyas: "Joyas Escondidas",
        catEuropa: "Europa", catAmerica: "América", catAsia: "Asia", catAfrica: "África", catOceania: "Oceanía",
        countries: { esp: "España", fra: "Francia", gbr: "Reino Unido", deu: "Alemania", ita: "Italia", nld: "Países Bajos", cze: "Chequia", aut: "Austria", grc: "Grecia", prt: "Portugal", hun: "Hungría", usa: "EE.UU.", mex: "México", arg: "Argentina", bra: "Brasil", col: "Colombia", per: "Perú", chl: "Chile", can: "Canadá", jpn: "Japón", kor: "Corea del Sur", tha: "Tailandia", chn: "China", sgp: "Singapur", are: "EAU", ind: "India", tur: "Turquía", vnm: "Vietnam", mar: "Marruecos", egy: "Egipto", zaf: "Sudáfrica", ken: "Kenia", tun: "Túnez", nga: "Nigeria", sen: "Senegal", aus: "Australia", nzl: "Nueva Zelanda" },
        cities: { mad: "Madrid", bcn: "Barcelona", vlc: "Valencia", svq: "Sevilla", grx: "Granada", agp: "Málaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarracín", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", par: "París", lon: "Londres", ber: "Berlín", rom: "Roma", ams: "Ámsterdam", prg: "Praga", vie: "Viena", ath: "Atenas", lis: "Lisboa", bud: "Budapest", nyc: "Nueva York", mex: "Ciudad de México", bue: "Buenos Aires", rio: "Río de Janeiro", bog: "Bogotá", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokio", sel: "Seúl", bkk: "Bangkok", pek: "Pekín", sin: "Singapur", dxb: "Dubái", bom: "Mumbai", ist: "Estambul", hkg: "Hong Kong", han: "Hanói", rak: "Marrakech", cai: "El Cairo", cpt: "Ciudad del Cabo", nbo: "Nairobi", tun: "Túnez", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sídney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    en: { 
        hubTitle: "Intel Hub", hubSub: "Global Database", homeTitle: "Explore Spain", homeSub: "National Masterclasses", 
        catCapitales: "Big Capitals", catVisitadas: "Most Visited", catPueblos: "Charming Towns", catJoyas: "Hidden Gems",
        catEuropa: "Europe", catAmerica: "America", catAsia: "Asia", catAfrica: "Africa", catOceania: "Oceania",
        countries: { esp: "Spain", fra: "France", gbr: "United Kingdom", deu: "Germany", ita: "Italy", nld: "Netherlands", cze: "Czechia", aut: "Austria", grc: "Greece", prt: "Portugal", hun: "Hungary", usa: "USA", mex: "Mexico", arg: "Argentina", bra: "Brazil", col: "Colombia", per: "Peru", chl: "Chile", can: "Canada", jpn: "Japan", kor: "South Korea", tha: "Thailand", chn: "China", sgp: "Singapore", are: "UAE", ind: "India", tur: "Turkey", vnm: "Vietnam", mar: "Morocco", egy: "Egypt", zaf: "South Africa", ken: "Kenya", tun: "Tunisia", nga: "Nigeria", sen: "Senegal", aus: "Australia", nzl: "New Zealand" },
        cities: { mad: "Madrid", bcn: "Barcelona", vlc: "Valencia", svq: "Seville", grx: "Granada", agp: "Malaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaques", alb: "Albarracin", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Ubeda", cac: "Caceres", par: "Paris", lon: "London", ber: "Berlin", rom: "Rome", ams: "Amsterdam", prg: "Prague", vie: "Vienna", ath: "Athens", lis: "Lisbon", bud: "Budapest", nyc: "New York", mex: "Mexico City", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogota", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokyo", sel: "Seoul", bkk: "Bangkok", pek: "Beijing", sin: "Singapore", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hong Kong", han: "Hanoi", rak: "Marrakech", cai: "Cairo", cpt: "Cape Town", nbo: "Nairobi", tun: "Tunis", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    ca: { 
        hubTitle: "Intel Hub", hubSub: "Base de Dades Global", homeTitle: "Explora Espanya", homeSub: "Masterclasses Nacionals", 
        catCapitales: "Grans Capitals", catVisitadas: "Més Visitades", catPueblos: "Pobles amb Encant", catJoyas: "Joies Amagades",
        catEuropa: "Europa", catAmerica: "Amèrica", catAsia: "Àsia", catAfrica: "Àfrica", catOceania: "Oceania",
        countries: { esp: "Espanya", fra: "França", gbr: "Regne Unit", deu: "Alemanya", ita: "Itàlia", nld: "Països Baixos", cze: "Txèquia", aut: "Àustria", grc: "Grècia", prt: "Portugal", hun: "Hongria", usa: "EUA", mex: "Mèxic", arg: "Argentina", bra: "Brasil", col: "Colòmbia", per: "Perú", chl: "Xile", can: "Canadà", jpn: "Japó", kor: "Corea del Sud", tha: "Tailàndia", chn: "Xina", sgp: "Singapur", are: "EAU", ind: "Índia", tur: "Turquia", vnm: "Vietnam", mar: "Marroc", egy: "Egipte", zaf: "Sud-àfrica", ken: "Kenya", tun: "Tunísia", nga: "Nigèria", sen: "Senegal", aus: "Austràlia", nzl: "Nova Zelanda" },
        cities: { mad: "Madrid", bcn: "Barcelona", vlc: "València", svq: "Sevilla", grx: "Granada", agp: "Màlaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarrasí", cud: "Cudillero", ter: "Terol", sor: "Sòria", ube: "Úbeda", cac: "Càceres", par: "París", lon: "Londres", ber: "Berlín", rom: "Roma", ams: "Amsterdam", prg: "Praga", vie: "Viena", ath: "Atenes", lis: "Lisboa", bud: "Budapest", nyc: "Nova York", mex: "Ciutat de Mèxic", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogotà", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tòquio", sel: "Seül", bkk: "Bangkok", pek: "Pequín", sin: "Singapur", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hong Kong", han: "Hanoi", rak: "Marràqueix", cai: "El Caire", cpt: "Ciutat del Cap", nbo: "Nairobi", tun: "Tunis", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    eu: { 
        hubTitle: "Intel Hub", hubSub: "Datu-base Globala", homeTitle: "Espainia Arakatu", homeSub: "Masterclasses Nazionalak", 
        catCapitales: "Hiriburu Handiak", catVisitadas: "Bisitatuenak", catPueblos: "Herri Xarmagarriak", catJoyas: "Ezkutuko Bitxiak",
        catEuropa: "Europa", catAmerica: "Amerika", catAsia: "Asia", catAfrica: "Afrika", catOceania: "Ozeania",
        countries: { esp: "Espainia", fra: "Frantzia", gbr: "Erresuma Batua", deu: "Alemania", ita: "Italia", nld: "Herbehereak", cze: "Txekia", aut: "Austria", grc: "Grezia", prt: "Portugal", hun: "Hungaria", usa: "AEB", mex: "Mexiko", arg: "Argentina", bra: "Brasil", col: "Kolonbia", per: "Peru", chl: "Txile", can: "Kanada", jpn: "Japonia", kor: "Hego Korea", tha: "Thailandia", chn: "Txina", sgp: "Singapur", are: "EAU", ind: "India", tur: "Turkia", vnm: "Vietnam", mar: "Maroko", egy: "Egipto", zaf: "Hegoafrika", ken: "Kenia", tun: "Tunisia", nga: "Nigeria", sen: "Senegal", aus: "Australia", nzl: "Zeelanda Berria" },
        cities: { mad: "Madril", bcn: "Bartzelona", vlc: "Valentzia", svq: "Sevilla", grx: "Granada", agp: "Malaga", pmi: "Palma", bio: "Bilbo", ron: "Ronda", cad: "Cadaques", alb: "Albarracin", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Ubeda", cac: "Caceres", par: "Paris", lon: "Londres", ber: "Berlin", rom: "Erroma", ams: "Amsterdam", prg: "Praga", vie: "Viena", ath: "Atenas", lis: "Lisboa", bud: "Budapest", nyc: "New York", mex: "Mexiko Hiria", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogota", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokio", sel: "Seul", bkk: "Bangkok", pek: "Pekin", sin: "Singapur", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hong Kong", han: "Hanoi", rak: "Marrakesh", cai: "Kairo", cpt: "Lurmutur Hiria", nbo: "Nairobi", tun: "Tunis", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    it: { 
        hubTitle: "Intel Hub", hubSub: "Database Globale", homeTitle: "Esplora Spagna", homeSub: "Masterclass Nazionali", 
        catCapitales: "Capitali", catVisitadas: "Più Visitate", catPueblos: "Borghi Incantevoli", catJoyas: "Gemme Nascoste",
        catEuropa: "Europa", catAmerica: "America", catAsia: "Asia", catAfrica: "Africa", catOceania: "Oceania",
        countries: { esp: "Spagna", fra: "Francia", gbr: "Regno Unito", deu: "Germania", ita: "Italia", nld: "Paesi Bassi", cze: "Cechia", aut: "Austria", grc: "Grecia", prt: "Portogallo", hun: "Ungheria", usa: "USA", mex: "Messico", arg: "Argentina", bra: "Brasile", col: "Colombia", per: "Perù", chl: "Cile", can: "Canada", jpn: "Giappone", kor: "Corea del Sud", tha: "Thailandia", chn: "Cina", sgp: "Singapore", are: "EAU", ind: "India", tur: "Turchia", vnm: "Vietnam", mar: "Marocco", egy: "Egitto", zaf: "Sudafrica", ken: "Kenya", tun: "Tunisia", nga: "Nigeria", sen: "Senegal", aus: "Australia", nzl: "Nuova Zelanda" },
        cities: { mad: "Madrid", bcn: "Barcellona", vlc: "Valencia", svq: "Siviglia", grx: "Granada", agp: "Malaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarracín", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", par: "Parigi", lon: "Londra", ber: "Berlino", rom: "Roma", ams: "Amsterdam", prg: "Praga", vie: "Vienna", ath: "Atene", lis: "Lisbona", bud: "Budapest", nyc: "New York", mex: "Città del Messico", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogotà", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokyo", sel: "Seoul", bkk: "Bangkok", pek: "Pechino", sin: "Singapore", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hong Kong", han: "Hanoi", rak: "Marrakech", cai: "Il Cairo", cpt: "Città del Capo", nbo: "Nairobi", tun: "Tunisi", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    ja: { 
        hubTitle: "インテルハブ", hubSub: "グローバルデータベース", homeTitle: "スペインを探索", homeSub: "ナショナルマスタークラス", 
        catCapitales: "首都", catVisitadas: "訪問済み", catPueblos: "魅力的な町", catJoyas: "隠れた宝石",
        catEuropa: "ヨーロッパ", catAmerica: "アメリカ", catAsia: "アジア", catAfrica: "アフリカ", catOceania: "オセアニア",
        countries: { esp: "スペイン", fra: "フランス", gbr: "イギリス", deu: "ドイツ", ita: "イタリア", nld: "オランダ", cze: "チェコ", aut: "オーストリア", grc: "ギリシャ", prt: "ポルトガル", hun: "ハンガリー", usa: "アメリカ", mex: "メキシコ", arg: "アルゼンチン", bra: "ブラジル", col: "コロンビア", per: "ペルー", chl: "チリ", can: "カナダ", jpn: "日本", kor: "韓国", tha: "タイ", chn: "中国", sgp: "シンガポール", are: "UAE", ind: "インド", tur: "トルコ", vnm: "ベトナム", mar: "モロッコ", egy: "エジプト", zaf: "南アフリカ", ken: "ケニア", tun: "チュニジア", nga: "ナイジェリア", sen: "セネガル", aus: "オーストラリア", nzl: "ニュージーランド" },
        cities: { mad: "マドリード", bcn: "バルセロナ", vlc: "バレンシア", svq: "セビリア", grx: "グラナダ", agp: "マラガ", pmi: "パルマ", bio: "ビルバオ", ron: "ロンダ", cad: "カダケス", alb: "アルバラシン", cud: "クディジェロ", ter: "テルエル", sor: "ソリア", ube: "ウベダ", cac: "カセレス", par: "パリ", lon: "ロンドン", ber: "ベルリン", rom: "ローマ", ams: "アムステルダム", prg: "プラハ", vie: "ウィーン", ath: "アテネ", lis: "リスボン", bud: "ブダペスト", nyc: "ニューヨーク", mex: "メキシコシティ", bue: "ブエノスアイレス", rio: "リオデジャネイロ", bog: "ボゴタ", lim: "リマ", scl: "サンティアゴ", yyz: "トロント", chi: "シカゴ", sfo: "サンフランシスコ", tyo: "東京", sel: "ソウル", bkk: "バンコク", pek: "北京", sin: "シンガポール", dxb: "ドバイ", bom: "ムンバイ", ist: "イスタンブール", hkg: "香港", han: "ハノイ", rak: "マラケシュ", cai: "カイロ", cpt: "ケープタウン", nbo: "ナイロビ", tun: "チュニス", cas: "カサブランカ", los: "ラゴス", dkr: "ダカール", syd: "シドニー", mel: "メルボルン", akl: "オークランド", bne: "ブリスベン", per: "パース", ool: "ゴールドコースト" }
    },
    zh: { 
        hubTitle: "情报中心", hubSub: "全球数据库", homeTitle: "探索西班牙", homeSub: "国家大师课", 
        catCapitales: "首都", catVisitadas: "最常访问", catPueblos: "迷人小镇", catJoyas: "隐藏瑰宝",
        catEuropa: "欧洲", catAmerica: "美洲", catAsia: "亚洲", catAfrica: "非洲", catOceania: "大洋洲",
        countries: { esp: "西班牙", fra: "法国", gbr: "英国", deu: "德国", ita: "意大利", nld: "荷兰", cze: "捷克", aut: "奥地利", grc: "希腊", prt: "葡萄牙", hun: "匈牙利", usa: "美国", mex: "墨西哥", arg: "阿根廷", bra: "巴西", col: "哥伦比亚", per: "秘鲁", chl: "智利", can: "加拿大", jpn: "日本", kor: "韩国", tha: "泰国", chn: "中国", sgp: "新加坡", are: "阿联酋", ind: "印度", tur: "土耳其", vnm: "越南", mar: "摩洛哥", egy: "埃及", zaf: "南非", ken: "肯尼亚", tun: "突尼斯", nga: "尼日利亚", sen: "塞内加尔", aus: "澳大利亚", nzl: "新西兰" },
        cities: { mad: "马德里", bcn: "巴塞罗那", vlc: "瓦伦西亚", svq: "塞维利亚", grx: "格拉纳达", agp: "马拉加", pmi: "帕尔马", bio: "毕尔巴鄂", ron: "龙达", cad: "卡达克斯", alb: "阿尔瓦拉辛", cud: "库迪列罗", ter: "特鲁埃尔", sor: "索里亚", ube: "乌韦达", cac: "卡塞雷斯", par: "巴黎", lon: "伦敦", ber: "柏林", rom: "罗马", ams: "阿姆斯特丹", prg: "布拉格", vie: "维也纳", ath: "雅典", lis: "里斯本", bud: "布达佩斯", nyc: "纽约", mex: "墨西哥城", bue: "布宜诺斯艾利斯", rio: "里约热内卢", bog: "波哥大", lim: "利马", scl: "圣地亚哥", yyz: "多伦多", chi: "芝加哥", sfo: "旧金山", tyo: "东京", sel: "首尔", bkk: "曼谷", pek: "北京", sin: "新加坡", dxb: "迪拜", bom: "孟买", ist: "伊斯坦布尔", hkg: "香港", han: "河内", rak: "马拉喀什", cai: "开罗", cpt: "开普敦", nbo: "内罗毕", tun: "突尼斯市", cas: "卡萨布兰卡", los: "拉各斯", dkr: "达迦马", syd: "悉尼", mel: "墨尔本", akl: "奥克兰", bne: "布里斯班", per: "珀斯", ool: "黄金海岸" }
    }
};

const SPAIN_DATA = {
    capitales: [
        { cityKey: "mad", countryKey: "esp" }, 
        { cityKey: "bcn", countryKey: "esp" }, 
        { cityKey: "vlc", countryKey: "esp" }, 
        { cityKey: "svq", countryKey: "esp" }
    ],
    visitadas: [
        { cityKey: "grx", countryKey: "esp" }, 
        { cityKey: "agp", countryKey: "esp" }, 
        { cityKey: "pmi", countryKey: "esp" }, 
        { cityKey: "bio", countryKey: "esp" }
    ],
    pueblos: [
        { cityKey: "ron", countryKey: "esp" }, 
        { cityKey: "cad", countryKey: "esp" }, 
        { cityKey: "alb", countryKey: "esp" }, 
        { cityKey: "cud", countryKey: "esp" }
    ],
    joyas: [
        { cityKey: "ter", countryKey: "esp" }, 
        { cityKey: "sor", countryKey: "esp" }, 
        { cityKey: "ube", countryKey: "esp" }, 
        { cityKey: "cac", countryKey: "esp" }
    ]
};

const WORLD_DATA = {
    europa: [
        { cityKey: "par", countryKey: "fra" }, { cityKey: "lon", countryKey: "gbr" }, 
        { cityKey: "ber", countryKey: "deu" }, { cityKey: "rom", countryKey: "ita" }, 
        { cityKey: "ams", countryKey: "nld" }, { cityKey: "prg", countryKey: "cze" },
        { cityKey: "vie", countryKey: "aut" }, { cityKey: "ath", countryKey: "grc" },
        { cityKey: "lis", countryKey: "prt" }, { cityKey: "bud", countryKey: "hun" }
    ],
    america: [
        { cityKey: "nyc", countryKey: "usa" }, { cityKey: "mex", countryKey: "mex" }, 
        { cityKey: "bue", countryKey: "arg" }, { cityKey: "rio", countryKey: "bra" }, 
        { cityKey: "bog", countryKey: "col" }, { cityKey: "lim", countryKey: "per" },
        { cityKey: "scl", countryKey: "chl" }, { cityKey: "yyz", countryKey: "can" },
        { cityKey: "chi", countryKey: "usa" }, { cityKey: "sfo", countryKey: "usa" }
    ],
    asia: [
        { cityKey: "tyo", countryKey: "jpn" }, { cityKey: "sel", countryKey: "kor" }, 
        { cityKey: "bkk", countryKey: "tha" }, { cityKey: "pek", countryKey: "chn" }, 
        { cityKey: "sin", countryKey: "sgp" }, { cityKey: "dxb", countryKey: "are" },
        { cityKey: "bom", countryKey: "ind" }, { cityKey: "ist", countryKey: "tur" },
        { cityKey: "hkg", countryKey: "chn" }, { cityKey: "han", countryKey: "vnm" }
    ],
    africa: [
        { cityKey: "rak", countryKey: "mar" }, { cityKey: "cai", countryKey: "egy" }, 
        { cityKey: "cpt", countryKey: "zaf" }, { cityKey: "nbo", countryKey: "ken" },
        { cityKey: "tun", countryKey: "tun" }, { cityKey: "cas", countryKey: "mar" },
        { cityKey: "los", countryKey: "nga" }, { cityKey: "dkr", countryKey: "sen" }
    ],
    oceania: [
        { cityKey: "syd", countryKey: "aus" }, { cityKey: "mel", countryKey: "aus" }, 
        { cityKey: "akl", countryKey: "nzl" }, { cityKey: "bne", countryKey: "aus" },
        { cityKey: "per", countryKey: "aus" }, { cityKey: "ool", countryKey: "aus" }
    ]
};

const CityMiniCard: React.FC<{ name: string, country: string, onSelect: (name: string) => void, colorIdx: number }> = ({ name, country, onSelect, colorIdx }) => {
    const colors = [
        'from-purple-600 to-indigo-900', 
        'from-emerald-600 to-teal-900', 
        'from-amber-600 to-orange-900', 
        'from-rose-600 to-slate-900'
    ];
    const icon = ['fa-fingerprint', 'fa-landmark', 'fa-utensils', 'fa-camera'][colorIdx % 4];
    const color = colors[colorIdx % 4];

    return (
        <div 
            onClick={() => onSelect(name)} 
            className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 group cursor-pointer hover:bg-white/10 transition-all active:scale-95 shadow-lg"
        >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                <i className={`fas ${icon} text-xs`}></i>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-black text-white text-[10px] uppercase truncate tracking-tighter">{name}</h4>
                <p className="text-[7px] text-purple-400/60 font-black uppercase tracking-widest mt-0.5">{country}</p>
            </div>
            <i className="fas fa-chevron-right text-[8px] text-slate-700 group-hover:text-purple-500"></i>
        </div>
    );
};

export const TravelServices: React.FC<any> = ({ mode, language = 'es', onCitySelect }) => {
    // IMPORTANTE: Detección de idioma con fallback inteligente
    const l = UI_LABELS[language] || UI_LABELS.en;
    const [activeTab, setActiveTab] = useState<string>('europa');

    // Función auxiliar para obtener nombres de países/ciudades
    const getCountryName = (key: string) => (l.countries && l.countries[key]) || (UI_LABELS.en.countries[key]) || key;
    const getCityName = (key: string) => (l.cities && l.cities[key]) || (UI_LABELS.en.cities[key]) || key;

    if (mode === 'HUB') {
        return (
            <div className="space-y-10 pb-40 px-6 animate-fade-in">
                <header>
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{l.hubTitle}</h3>
                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.4em] mt-2">{l.hubSub}</p>
                </header>

                <section className="space-y-6">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {[
                            { id: 'europa', label: l.catEuropa },
                            { id: 'america', label: l.catAmerica },
                            { id: 'asia', label: l.catAsia },
                            { id: 'africa', label: l.catAfrica },
                            { id: 'oceania', label: l.catOceania }
                        ].map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)} 
                                className={`px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {(WORLD_DATA as any)[activeTab].map((city: any, i: number) => (
                            <CityMiniCard 
                                key={city.cityKey} 
                                name={getCityName(city.cityKey)} 
                                country={getCountryName(city.countryKey)} 
                                onSelect={() => onCitySelect(getCityName(city.cityKey))} 
                                colorIdx={i} 
                            />
                        ))}
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-32 px-6 animate-fade-in">
            <header>
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{l.homeTitle}</h3>
                <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.4em] mt-2">{l.homeSub}</p>
            </header>

            <div className="space-y-10">
                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{l.catCapitales}</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {SPAIN_DATA.capitales.map((city, i) => (
                            <CityMiniCard key={city.cityKey} name={getCityName(city.cityKey)} country={getCountryName(city.countryKey)} onSelect={() => onCitySelect(getCityName(city.cityKey))} colorIdx={i} />
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{l.catVisitadas}</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {SPAIN_DATA.visitadas.map((city, i) => (
                            <CityMiniCard key={city.cityKey} name={getCityName(city.cityKey)} country={getCountryName(city.countryKey)} onSelect={() => onCitySelect(getCityName(city.cityKey))} colorIdx={i + 4} />
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{l.catPueblos}</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {SPAIN_DATA.pueblos.map((city, i) => (
                            <CityMiniCard key={city.cityKey} name={getCityName(city.cityKey)} country={getCountryName(city.countryKey)} onSelect={() => onCitySelect(getCityName(city.cityKey))} colorIdx={i + 8} />
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{l.catJoyas}</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {SPAIN_DATA.joyas.map((city, i) => (
                            <CityMiniCard key={city.cityKey} name={getCityName(city.cityKey)} country={getCountryName(city.countryKey)} onSelect={() => onCitySelect(getCityName(city.cityKey))} colorIdx={i + 12} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
