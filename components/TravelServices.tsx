
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
    de: { 
        hubTitle: "Intel Hub", hubSub: "Globale Datenbank", homeTitle: "Spanien erkunden", homeSub: "Nationale Masterclasses", 
        catCapitales: "Große Hauptstädte", catVisitadas: "Meistbesucht", catPueblos: "Charmante Dörfer", catJoyas: "Verborgene Schätze",
        catEuropa: "Europa", catAmerica: "Amerika", catAsia: "Asien", catAfrica: "Afrika", catOceania: "Ozeanien",
        countries: { esp: "Spanien", fra: "Frankreich", gbr: "Großbritannien", deu: "Deutschland", ita: "Italien", nld: "Niederlande", cze: "Tschechien", aut: "Österreich", grc: "Griechenland", prt: "Portugal", hun: "Ungarn", usa: "USA", mex: "Mexiko", arg: "Argentinien", bra: "Brasilien", col: "Kolumbien", per: "Peru", chl: "Chile", can: "Kanada", jpn: "Japan", kor: "Südkorea", tha: "Thailand", chn: "China", sgp: "Singapur", are: "VAE", ind: "Indien", tur: "Türkei", vnm: "Vietnam", mar: "Marokko", egy: "Ägypten", zaf: "Südafrika", ken: "Kenia", tun: "Tunesien", nga: "Nigeria", sen: "Senegal", aus: "Australien", nzl: "Neuseeland" },
        cities: { mad: "Madrid", bcn: "Barcelona", vlc: "Valencia", svq: "Sevilla", grx: "Granada", agp: "Malaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarracín", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", par: "Paris", lon: "London", ber: "Berlin", rom: "Rom", ams: "Amsterdam", prg: "Prag", vie: "Wien", ath: "Athen", lis: "Lissabon", bud: "Budapest", nyc: "New York", mex: "Mexiko-Stadt", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogotá", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokio", sel: "Seoul", bkk: "Bangkok", pek: "Peking", sin: "Singapur", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hongkong", han: "Hanoi", rak: "Marrakesch", cai: "Kairo", cpt: "Kapstadt", nbo: "Nairobi", tun: "Tunis", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    it: { 
        hubTitle: "Intel Hub", hubSub: "Database Globale", homeTitle: "Esplora la Spagna", homeSub: "Masterclass Nazionali", 
        catCapitales: "Grandi Capitali", catVisitadas: "Più Visitate", catPueblos: "Borghi Incantevoli", catJoyas: "Gemme Nascoste",
        catEuropa: "Europa", catAmerica: "America", catAsia: "Asia", catAfrica: "Africa", catOceania: "Oceania",
        countries: { esp: "Spagna", fra: "Francia", gbr: "Regno Unito", deu: "Germania", ita: "Italia", nld: "Paesi Bassi", cze: "Cechia", aut: "Austria", grc: "Grecia", prt: "Portogallo", hun: "Ungheria", usa: "USA", mex: "Messico", arg: "Argentina", bra: "Brasile", col: "Colombia", per: "Perù", chl: "Cile", can: "Canada", jpn: "Giappone", kor: "Corea del Sud", tha: "Thailandia", chn: "Cina", sgp: "Singapore", are: "EAU", ind: "India", tur: "Turchia", vnm: "Vietnam", mar: "Marocco", egy: "Egitto", zaf: "Sudafrica", ken: "Kenya", tun: "Tunisia", nga: "Nigeria", sen: "Senegal", aus: "Australia", nzl: "Nuova Zelanda" },
        cities: { mad: "Madrid", bcn: "Barcellona", vlc: "Valencia", svq: "Siviglia", grx: "Granada", agp: "Malaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarracín", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", par: "Parigi", lon: "Londra", ber: "Berlino", rom: "Roma", ams: "Amsterdam", prg: "Praga", vie: "Vienna", ath: "Atene", lis: "Lisbona", bud: "Budapest", nyc: "New York", mex: "Città del Messico", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogotà", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokyo", sel: "Seoul", bkk: "Bangkok", pek: "Pechino", sin: "Singapore", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hong Kong", han: "Hanoi", rak: "Marrakech", cai: "Il Cairo", cpt: "Città del Capo", nbo: "Nairobi", tun: "Tunisi", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    pt: { 
        hubTitle: "Intel Hub", hubSub: "Base de Dados Global", homeTitle: "Explorar Espanha", homeSub: "Masterclasses Nacionais", 
        catCapitales: "Grandes Capitais", catVisitadas: "Mais Visitadas", catPueblos: "Aldeias Charmosas", catJoyas: "Joias Escondidas",
        catEuropa: "Europa", catAmerica: "América", catAsia: "Ásia", catAfrica: "África", catOceania: "Oceânia",
        countries: { esp: "Espanha", fra: "França", gbr: "Reino Unido", deu: "Alemanha", ita: "Itália", nld: "Países Baixos", cze: "Chéquia", aut: "Áustria", grc: "Grécia", prt: "Portugal", hun: "Hungria", usa: "EUA", mex: "México", arg: "Argentina", bra: "Brasil", col: "Colômbia", per: "Peru", chl: "Chile", can: "Canadá", jpn: "Japão", kor: "Coreia do Sul", tha: "Tailândia", chn: "China", sgp: "Singapura", are: "EAU", ind: "Índia", tur: "Turquia", vnm: "Vietnã", mar: "Marrocos", egy: "Egito", zaf: "África do Sul", ken: "Quênia", tun: "Tunísia", nga: "Nigéria", sen: "Senegal", aus: "Austrália", nzl: "Nova Zelândia" },
        cities: { mad: "Madrid", bcn: "Barcelona", vlc: "Valência", svq: "Sevilha", grx: "Granada", agp: "Málaga", pmi: "Palma", bio: "Bilbau", ron: "Ronda", cad: "Cadaqués", alb: "Albarracín", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", par: "Paris", lon: "Londres", ber: "Berlim", rom: "Roma", ams: "Amsterdã", prg: "Praga", vie: "Viena", ath: "Atenas", lis: "Lisboa", bud: "Budapeste", nyc: "Nova York", mex: "Cidade do México", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogotá", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "São Francisco", tyo: "Tóquio", sel: "Seul", bkk: "Banguecoque", pek: "Pequim", sin: "Singapura", dxb: "Dubai", bom: "Mumbai", ist: "Istambul", hkg: "Hong Kong", han: "Hanói", rak: "Marrakech", cai: "Cairo", cpt: "Cidade do Cabo", nbo: "Nairobi", tun: "Tunes", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    ro: { 
        hubTitle: "Intel Hub", hubSub: "Bază de Date Globală", homeTitle: "Explorează Spania", homeSub: "Masterclass-uri Naționale", 
        catCapitales: "Capitale Mari", catVisitadas: "Cele Mai Vizitate", catPueblos: "Sate Fermecătoare", catJoyas: "Bijuterii Ascunse",
        catEuropa: "Europa", catAmerica: "America", catAsia: "Asia", catAfrica: "Africa", catOceania: "Oceania",
        countries: { esp: "Spania", fra: "Franța", gbr: "Regatul Unit", deu: "Germania", ita: "Italia", nld: "Țările de Jos", cze: "Cehia", aut: "Austria", grc: "Grecia", prt: "Portugalia", hun: "Ungaria", usa: "SUA", mex: "Mexic", arg: "Argentina", bra: "Brazilia", col: "Columbia", per: "Peru", chl: "Chile", can: "Canada", jpn: "Japonia", kor: "Coreea de Sud", tha: "Thailanda", chn: "China", sgp: "Singapore", are: "EAU", ind: "India", tur: "Turcia", vnm: "Vietnam", mar: "Maroc", egy: "Egipt", zaf: "Africa de Sud", ken: "Kenya", tun: "Tunisia", nga: "Nigeria", sen: "Senegal", aus: "Australia", nzl: "Noua Zeelandă" },
        cities: { mad: "Madrid", bcn: "Barcelona", vlc: "Valencia", svq: "Sevilla", grx: "Granada", agp: "Malaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarracín", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", par: "Paris", lon: "Londra", ber: "Berlin", rom: "Roma", ams: "Amsterdam", prg: "Praga", vie: "Viena", ath: "Atena", lis: "Lisabona", bud: "Budapesta", nyc: "New York", mex: "Ciudad de México", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogotá", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokyo", sel: "Seul", bkk: "Bangkok", pek: "Beijing", sin: "Singapore", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hong Kong", han: "Hanoi", rak: "Marrakech", cai: "Cairo", cpt: "Cape Town", nbo: "Nairobi", tun: "Tunis", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    tr: { 
        hubTitle: "Bilgi Merkezi", hubSub: "Küresel Veritabanı", homeTitle: "İspanya'yı Keşfet", homeSub: "Ulusal Masterclasslar", 
        catCapitales: "Büyük Başkentler", catVisitadas: "En Çok Ziyaret Edilen", catPueblos: "Büyüleyici Kasabalar", catJoyas: "Gizli Cevherler",
        catEuropa: "Avrupa", catAmerica: "Amerika", catAsia: "Asya", catAfrica: "Afrika", catOceania: "Okyanusya",
        countries: { esp: "İspanya", fra: "Fransa", gbr: "Birleşik Krallık", deu: "Almanya", ita: "İtalya", nld: "Hollanda", cze: "Çekya", aut: "Avusturya", grc: "Yunanistan", prt: "Portekiz", hun: "Macaristan", usa: "ABD", mex: "Meksika", arg: "Arjantin", bra: "Brezilya", col: "Kolombiya", per: "Peru", chl: "Şili", can: "Kanada", jpn: "Japonya", kor: "Güney Kore", tha: "Tayland", chn: "Çin", sgp: "Singapur", are: "BAE", ind: "Hindistan", tur: "Türkiye", vnm: "Vietnam", mar: "Fas", egy: "Mısır", zaf: "Güney Afrika", ken: "Kenya", tun: "Tunus", nga: "Nijerya", sen: "Senegal", aus: "Avustralya", nzl: "Yeni Zelanda" },
        cities: { mad: "Madrid", bcn: "Barselona", vlc: "Valensiya", svq: "Sevilla", grx: "Granada", agp: "Malaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarracın", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", par: "Paris", lon: "Londra", ber: "Berlin", rom: "Roma", ams: "Amsterdam", prg: "Prag", vie: "Viyana", ath: "Atina", lis: "Lizbon", bud: "Budapeşte", nyc: "New York", mex: "Meksika", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogota", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokyo", sel: "Seul", bkk: "Bangkok", pek: "Pekin", sin: "Singapur", dxb: "Dubai", bom: "Mumbai", ist: "İstanbul", hkg: "Hong Kong", han: "Hanoi", rak: "Marakeş", cai: "Kahire", cpt: "Cape Town", nbo: "Nairobi", tun: "Tunus", cas: "Kazablanka", los: "Lagos", dkr: "Dakar", syd: "Sidney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    zh: { 
        hubTitle: "情报中心", hubSub: "全球数据库", homeTitle: "探索西班牙", homeSub: "国家大师课", 
        catCapitales: "大都会", catVisitadas: "最受欢迎", catPueblos: "魅力城镇", catJoyas: "隐藏宝石",
        catEuropa: "欧洲", catAmerica: "美洲", catAsia: "亚洲", catAfrica: "非洲", catOceania: "大洋洲",
        countries: { esp: "西班牙", fra: "法国", gbr: "英国", deu: "德国", ita: "意大利", nld: "荷兰", cze: "捷克", aut: "奥地利", grc: "希腊", prt: "葡萄牙", hun: "匈牙利", usa: "美国", mex: "墨西哥", arg: "阿根廷", bra: "巴西", col: "哥伦比亚", per: "秘鲁", chl: "智利", can: "加拿大", jpn: "日本", kor: "韩国", tha: "泰国", chn: "中国", sgp: "新加坡", are: "阿联酋", ind: "印度", tur: "土耳其", vnm: "越南", mar: "摩洛哥", egy: "埃及", zaf: "南非", ken: "肯尼亚", tun: "突尼斯", nga: "尼日利亚", sen: "塞内加尔", aus: "澳大利亚", nzl: "新西兰" },
        cities: { mad: "马德里", bcn: "巴塞罗那", vlc: "瓦伦西亚", svq: "塞维利亚", grx: "格拉纳达", agp: "马拉加", pmi: "帕尔马", bio: "毕尔巴鄂", ron: "龙达", cad: "卡达凯斯", alb: "阿尔巴拉辛", cud: "库迪列罗", ter: "特鲁埃尔", sor: "索里亚", ube: "乌贝达", cac: "卡塞雷斯", par: "巴黎", lon: "伦敦", ber: "柏林", rom: "罗马", ams: "阿姆斯特丹", prg: "布拉格", vie: "维也纳", ath: "雅典", lis: "里斯本", bud: "布达佩斯", nyc: "纽约", mex: "墨西哥城", bue: "布宜诺斯艾利斯", rio: "里约热内卢", bog: "波哥大", lim: "利马", scl: "圣地亚哥", yyz: "多伦多", chi: "芝加哥", sfo: "旧金山", tyo: "东京", sel: "首尔", bkk: "曼谷", pek: "北京", sin: "新加坡", dxb: "迪拜", bom: "孟买", ist: "伊斯坦布尔", hkg: "香港", han: "河内", rak: "马拉喀什", cai: "开罗", cpt: "开普敦", nbo: "内罗毕", tun: "突尼斯市", cas: "卡萨布兰卡", los: "拉各斯", dkr: "达喀尔", syd: "悉尼", mel: "墨尔本", akl: "奥克兰", bne: "布里斯班", per: "珀斯", ool: "黄金海岸" }
    },
    ja: { 
        hubTitle: "情報ハブ", hubSub: "グローバルデータベース", homeTitle: "スペインを探索", homeSub: "ナショナルマスタークラス", 
        catCapitales: "主要都市", catVisitadas: "人気スポット", catPueblos: "魅力的な村", catJoyas: "隠れた宝石",
        catEuropa: "ヨーロッパ", catAmerica: "アメリカ", catAsia: "アジア", catAfrica: "アフリカ", catOceania: "オセアニア",
        countries: { esp: "スペイン", fra: "フランス", gbr: "イギリス", deu: "ドイツ", ita: "イタリア", nld: "オランダ", cze: "チェコ", aut: "オーストリア", grc: "ギリシャ", prt: "ポルトガル", hun: "ハンガリー", usa: "アメリカ", mex: "メキシコ", arg: "アルゼンチン", bra: "ブラジル", col: "コロンビア", per: "ペルー", chl: "チリ", can: "カナダ", jpn: "日本", kor: "韓国", tha: "タイ", chn: "中国", sgp: "シンガポール", are: "UAE", ind: "インド", tur: "トルコ", vnm: "ベトナム", mar: "モロッコ", egy: "エジプト", zaf: "南アフリカ", ken: "ケニア", tun: "チュニジア", nga: "ナイジェリア", sen: "セネガル", aus: "オーストラリア", nzl: "ニュージーランド" },
        cities: { mad: "マドリード", bcn: "バルセロナ", vlc: "バレンシア", svq: "セビリア", grx: "グラナダ", agp: "マラガ", pmi: "パルマ", bio: "ビルバオ", ron: "ロンダ", cad: "カダケス", alb: "アルバラシン", cud: "クディジェロ", ter: "テルエル", sor: "ソリア", ube: "ウベダ", cac: "カセレス", par: "パリ", lon: "ロンドン", ber: "ベルリン", rom: "ローマ", ams: "アムステルダム", prg: "プラハ", vie: "ウィーン", ath: "アテネ", lis: "リスボン", bud: "ブダペスト", nyc: "ニューヨーク", mex: "メキシコシティ", bue: "ブエノスアイレス", rio: "リオデジャネイロ", bog: "ボゴタ", lim: "リマ", scl: "サンティアゴ", yyz: "トロント", chi: "シカゴ", sfo: "サンフランシスコ", tyo: "東京", sel: "ソウル", bkk: "バンコク", pek: "北京", sin: "シンガポール", dxb: "ドバイ", bom: "ムンバイ", ist: "イスタンブール", hkg: "香港", han: "ハノイ", rak: "マラケシュ", cai: "カイロ", cpt: "ケープタウン", nbo: "ナイロビ", tun: "チュニス", cas: "カサブランカ", los: "ラゴス", dkr: "ダカール", syd: "シドニー", mel: "メルボルン", akl: "オークランド", bne: "ブリスベン", per: "パース", ool: "ゴールドコースト" }
    },
    hi: { 
        hubTitle: "इंटेल हब", hubSub: "वैश्विक डेटाबेस", homeTitle: "स्पेन का अन्वेषण", homeSub: "राष्ट्रीय मास्टरक्लास", 
        catCapitales: "बड़ी राजधानियाँ", catVisitadas: "सर्वाधिक देखी गई", catPueblos: "आकर्षक गाँव", catJoyas: "छिपे हुए रत्न",
        catEuropa: "यूरोप", catAmerica: "अमेरिका", catAsia: "एशिया", catAfrica: "अफ्रीका", catOceania: "ओशिनिया",
        countries: { esp: "स्पेन", fra: "फ्रांस", gbr: "ब्रिटेन", deu: "जर्मनी", ita: "इटली", nld: "नीदरलैंड", cze: "चेक गणराज्य", aut: "ऑस्ट्रिया", grc: "ग्रीस", prt: "पुर्तगाल", hun: "हंगरी", usa: "अमेरिका", mex: "मेक्सिको", arg: "अर्जेंटीना", bra: "ब्राजील", col: "कोलंबिया", per: "पेरू", chl: "चिली", can: "कनाडा", jpn: "जापान", kor: "दक्षिण कोरिया", tha: "थाईलैंड", chn: "चीन", sgp: "सिंगापुर", are: "यूएई", ind: "भारत", tur: "तुर्की", vnm: "वियतनाम", mar: "मोरक्को", egy: "मिस्र", zaf: "दक्षिण अफ्रीका", ken: "केन्या", tun: "ट्यूनीशिया", nga: "नाइजीरिया", sen: "सेनेगल", aus: "ऑस्ट्रेलिया", nzl: "न्यूजीलैंड" },
        cities: { mad: "मैड्रिड", bcn: "बार्सिलोना", vlc: "वालेंसिया", svq: "सेविले", grx: "ग्रानाडा", agp: "मालागा", pmi: "पाल्मा", bio: "बिल्बाओ", ron: "रोंडा", cad: "काडाक्वेस", alb: "अल्बारासिन", cud: "कुडिलरो", ter: "टेरुल", sor: "सोरिया", ube: "उबेदा", cac: "कासेरेस", par: "पेरिस", lon: "लंदन", ber: "बर्लिन", rom: "रोम", ams: "एम्स्टर्डम", prg: "प्राग", vie: "वियना", ath: "एथेंस", lis: "लिस्बन", bud: "बुडापेष्ट", nyc: "न्यूयॉर्क", mex: "मेक्सिको सिटी", bue: "ब्यूनस आयर्स", rio: "रियो डी जनेरियो", bog: "बोगोटा", lim: "लीमा", scl: "सैंटियागो", yyz: "टोरंटो", chi: "शिकागो", sfo: "सैन फ्रांसिस्को", tyo: "टोक्यो", sel: "सियोल", bkk: "बैंकॉक", pek: "बीजिंग", sin: "सिंगापुर", dxb: "दुबई", bom: "मुंबई", ist: "इस्तांबुल", hkg: "हांगकांग", han: "हनोई", rak: "माराकेश", cai: "काहिरा", cpt: "केप टाउन", nbo: "नैरोबी", tun: "ट्यूनिस", cas: "कासाब्लांका", los: "लागोस", dkr: "डकार", syd: "सिडनी", mel: "मेलबर्न", akl: "ऑकलैंड", bne: "ब्रिस्बेन", per: "पर्थ", ool: "गोल्ड कोस्ट" }
    },
    ko: { 
        hubTitle: "인텔 허브", hubSub: "글로벌 데이터베이스", homeTitle: "스페인 탐험", homeSub: "국가별 마스터클래스", 
        catCapitales: "주요 수도", catVisitadas: "인기 방문지", catPueblos: "매력적인 마을", catJoyas: "숨겨진 보석",
        catEuropa: "유럽", catAmerica: "아메리카", catAsia: "아시아", catAfrica: "아프리카", catOceania: "오세아니아",
        countries: { esp: "스페인", fra: "프랑스", gbr: "영국", deu: "독일", ita: "이탈리아", nld: "네덜란드", cze: "체코", aut: "오스트리아", grc: "그리스", prt: "포르투갈", hun: "헝가리", usa: "미국", mex: "멕시코", arg: "아르헨티나", bra: "브라질", col: "콜롬비아", per: "페루", chl: "칠레", can: "캐나다", jpn: "일본", kor: "대한민국", tha: "태국", chn: "중국", sgp: "싱가포르", are: "아랍에미리트", ind: "인도", tur: "터키", vnm: "베트남", mar: "모로코", egy: "이집트", zaf: "남아프리카 공화국", ken: "케냐", tun: "튀니지", nga: "나이지리아", sen: "세네갈", aus: "호주", nzl: "뉴질랜드" },
        cities: { mad: "마드리드", bcn: "바르셀로나", vlc: "발렌시아", svq: "세비야", grx: "그라나다", agp: "말라가", pmi: "팔마", bio: "빌바오", ron: "론다", cad: "카다케스", alb: "알바라신", cud: "쿠디예로", ter: "테루엘", sor: "소리아", ube: "우베다", cac: "카세레스", par: "파리", lon: "런던", ber: "베를린", rom: "로마", ams: "암스테르담", prg: "프라하", vie: "비엔나", ath: "아테네", lis: "리스본", bud: "부다페스트", nyc: "뉴욕", mex: "멕시코시티", bue: "부엔오스아이레스", rio: "리우데자네이루", bog: "보고타", lim: "리마", scl: "산티아고", yyz: "토론토", chi: "시카고", sfo: "샌프란시스코", tyo: "도쿄", sel: "서울", bkk: "방콕", pek: "베이징", sin: "싱가포르", dxb: "두바이", bom: "뭄바이", ist: "이스탄불", hkg: "홍콩", han: "하노이", rak: "마라케시", cai: "카이로", cpt: "케이프타운", nbo: "나이로비", tun: "튀니스", cas: "카사블랑카", los: "라고스", dkr: "다카르", syd: "시드니", mel: "멜버른", akl: "오클랜드", bne: "브리즈번", per: "퍼스", ool: "골드코스트" }
    },
    pl: { 
        hubTitle: "Intel Hub", hubSub: "Globalna Baza Danych", homeTitle: "Odkrywaj Hiszpanię", homeSub: "Krajowe Masterclassy", 
        catCapitales: "Wielkie Stolice", catVisitadas: "Najczęściej Odwiedzane", catPueblos: "Urokliwe Miasteczka", catJoyas: "Ukryte Skarby",
        catEuropa: "Europa", catAmerica: "Ameryka", catAsia: "Azja", catAfrica: "Afryka", catOceania: "Oceania",
        countries: { esp: "Hiszpania", fra: "Francja", gbr: "Wielka Brytania", deu: "Niemcy", ita: "Włochy", nld: "Holandia", cze: "Czechy", aut: "Austria", grc: "Grecja", prt: "Portugalia", hun: "Węgry", usa: "USA", mex: "Meksyk", arg: "Argentyna", bra: "Brazylia", col: "Kolumbia", per: "Peru", chl: "Chile", can: "Kanada", jpn: "Japonia", kor: "Korea Południowa", tha: "Tajlandia", chn: "Chiny", sgp: "Singapur", are: "ZEA", ind: "Indie", tur: "Turcja", vnm: "Wietnam", mar: "Maroko", egy: "Egipt", zaf: "RPA", ken: "Kenia", tun: "Tunezja", nga: "Nigeria", sen: "Senegal", aus: "Australia", nzl: "Nowa Zelandia" },
        cities: { mad: "Madryt", bcn: "Barcelona", vlc: "Walencja", svq: "Sewilla", grx: "Grenada", agp: "Malaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarracín", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", par: "Paryż", lon: "Londyn", ber: "Berlin", rom: "Rzym", ams: "Amsterdam", prg: "Praga", vie: "Wiedeń", ath: "Ateny", lis: "Lizbona", bud: "Budapeszt", nyc: "Nowy Jork", mex: "Meksyk", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogota", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokio", sel: "Seul", bkk: "Bangkok", pek: "Pekin", sin: "Singapur", dxb: "Dubaj", bom: "Bombaj", ist: "Stambuł", hkg: "Hongkong", han: "Hanoi", rak: "Marrakesz", cai: "Kair", cpt: "Kapsztad", nbo: "Nairobi", tun: "Tunis", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    nl: { 
        hubTitle: "Intel Hub", hubSub: "Wereldwijde Database", homeTitle: "Ontdek Spanje", homeSub: "Nationale Masterclasses", 
        catCapitales: "Grote Hoofdsteden", catVisitadas: "Meest Bezocht", catPueblos: "Charmante Dorpjes", catJoyas: "Verborgen Parels",
        catEuropa: "Europa", catAmerica: "Amerika", catAsia: "Azië", catAfrica: "Afrika", catOceania: "Oceanië",
        countries: { esp: "Spanje", fra: "Frankrijk", gbr: "Verenigd Koninkrijk", deu: "Duitsland", ita: "Italië", nld: "Nederland", cze: "Tsjechië", aut: "Oostenrijk", grc: "Griekenland", prt: "Portugal", hun: "Hongarije", usa: "VS", mex: "Mexico", arg: "Argentinië", bra: "Brazilië", col: "Colombia", per: "Peru", chl: "Chili", can: "Canada", jpn: "Japan", kor: "Zuid-Korea", tha: "Thailand", chn: "China", sgp: "Singapore", are: "VAE", ind: "India", tur: "Turkije", vnm: "Vietnam", mar: "Marokko", egy: "Egypte", zaf: "Zuid-Afrika", ken: "Kenia", tun: "Tunesië", nga: "Nigeria", sen: "Senegal", aus: "Australië", nzl: "Nieuw-Zeeland" },
        cities: { mad: "Madrid", bcn: "Barcelona", vlc: "Valencia", svq: "Sevilla", grx: "Granada", agp: "Malaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarracín", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", par: "Parijs", lon: "Londen", ber: "Berlijn", rom: "Rome", ams: "Amsterdam", prg: "Praag", vie: "Wenen", ath: "Athene", lis: "Lissabon", bud: "Boedapest", nyc: "New York", mex: "Mexico-Stad", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogota", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokio", sel: "Seoul", bkk: "Bangkok", pek: "Peking", sin: "Singapur", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hongkong", han: "Hanoi", rak: "Marrakesh", cai: "Caïro", cpt: "Kaapstad", nbo: "Nairobi", tun: "Tunis", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    vi: { 
        hubTitle: "Trung tâm Thông tin", hubSub: "Cơ sở dữ liệu toàn cầu", homeTitle: "Khám phá Tây Ban Nha", homeSub: "Lớp học Quốc gia", 
        catCapitales: "Thủ đô lớn", catVisitadas: "Được ghé thăm nhiều nhất", catPueblos: "Thị trấn quyến rũ", catJoyas: "Viên ngọc ẩn",
        catEuropa: "Châu Âu", catAmerica: "Châu Mỹ", catAsia: "Châu Á", catAfrica: "Châu Phi", catOceania: "Châu Đại Dương",
        countries: { esp: "Tây Ban Nha", fra: "Pháp", gbr: "Anh", deu: "Đức", ita: "Ý", nld: "Hà Lan", cze: "Séc", aut: "Áo", grc: "Hy Lạp", prt: "Bồ Đào Nha", hun: "Hungary", usa: "Hoa Kỳ", mex: "Mexico", arg: "Argentina", bra: "Brazil", col: "Colombia", per: "Peru", chl: "Chile", can: "Canada", jpn: "Nhật Bản", kor: "Hàn Quốc", tha: "Thái Lan", chn: "Trung Quốc", sgp: "Singapore", are: "UAE", ind: "Ấn Độ", tur: "Thổ Nhĩ Kỳ", vnm: "Việt Nam", mar: "Ma-rốc", egy: "Ai Cập", zaf: "Nam Phi", ken: "Kenya", tun: "Tunisia", nga: "Nigeria", sen: "Senegal", aus: "Úc", nzl: "New Zealand" },
        cities: { mad: "Madrid", bcn: "Barcelona", vlc: "Valencia", svq: "Seville", grx: "Granada", agp: "Malaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarracín", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", par: "Paris", lon: "London", ber: "Berlin", rom: "Rome", ams: "Amsterdam", prg: "Prague", vie: "Vienna", ath: "Athens", lis: "Lisbon", bud: "Budapest", nyc: "New York", mex: "Thành phố Mexico", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogota", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokyo", sel: "Seoul", bkk: "Bangkok", pek: "Bắc Kinh", sin: "Singapore", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hong Kong", han: "Hà Nội", rak: "Marrakech", cai: "Cairo", cpt: "Cape Town", nbo: "Nairobi", tun: "Tunis", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    th: { 
        hubTitle: "ศูนย์ข้อมูล", hubSub: "ฐานข้อมูลทั่วโลก", homeTitle: "สำรวจสเปน", homeSub: "มาสเตอร์คลาสระดับชาติ", 
        catCapitales: "เมืองหลวงใหญ่", catVisitadas: "ยอดนิยม", catPueblos: "เมืองที่มีเสน่ห์", catJoyas: "อัญมณีที่ซ่อนอยู่",
        catEuropa: "ยุโรป", catAmerica: "อเมริกา", catAsia: "เอเชีย", catAfrica: "แอฟริกา", catOceania: "โอเชียเนีย",
        countries: { esp: "สเปน", fra: "ฝรั่งเศส", gbr: "สหราชอาณาจักร", deu: "เยอรมนี", ita: "อิตาลี", nld: "เนเธอร์แลนด์", cze: "เช็กเกีย", aut: "ออสเตรีย", grc: "กรีซ", prt: "โปรตุเกส", hun: "ฮังการี", usa: "สหรัฐอเมริกา", mex: "เม็กซิโก", arg: "อาร์เจนตินา", bra: "บราซิล", col: "โคลอมเบีย", per: "เปรู", chl: "ชิลี", can: "แคนาดา", jpn: "ญี่ปุ่น", kor: "เกาหลีใต้", tha: "ไทย", chn: "จีน", sgp: "สิงคโปร์", are: "ยูเออี", ind: "อินเดีย", tur: "ตุรกี", vnm: "เวียดนาม", mar: "โมร็อกโก", egy: "อียิปต์", zaf: "แอฟริกาใต้", ken: "เคนยา", tun: "ตูนิเซีย", nga: "ไนจีเรีย", sen: "เซเนกัล", aus: "ออสเตรเลีย", nzl: "นิวซีแลนด์" },
        cities: { mad: "มาดริด", bcn: "บาร์เซโลนา", vlc: "บาเลนเซีย", svq: "เซบียา", grx: "กรานาดา", agp: "มาลากา", pmi: "ปัลมา", bio: "บิลบาโอ", ron: "รอนดา", cad: "กาดาเกส", alb: "อัลบาร์ราซิน", cud: "กูดีเยโร", ter: "เตรูเอล", sor: "โซเรีย", ube: "อูเบดา", cac: "กาเซเรส", par: "ปารีส", lon: "ลอนดอน", ber: "เบอร์ลิน", rom: "โรม", ams: "อัมสเตอร์ดัม", prg: "ปราก", vie: "เวียนนา", ath: "เอเธนส์", lis: "ลิสบอน", bud: "บูดาเปสต์", nyc: "นิวยอร์ก", mex: "เม็กซิโกซิตี้", bue: "บัวโนสไอเรส", rio: "รีโอเดจาเนโร", bog: "โบโกตา", lim: "ลิมา", scl: "ซานติอาโก", yyz: "โทรอนโต", chi: "ชิคาโก", sfo: "ซานฟรานซิสโก", tyo: "โตเกียว", sel: "โซล", bkk: "กรุงเทพฯ", pek: "ปักกิ่ง", sin: "สิงคโปร์", dxb: "ดูไบ", bom: "มุมไบ", ist: "อิสตันบูล", hkg: "ฮ่องกง", han: "ฮานอย", rak: "มาร์ราเกช", cai: "ไคโร", cpt: "เคปทาวน์", nbo: "ไนโรบี", tun: "ตูนิส", cas: "คาซาบลังกา", los: "ลากอส", dkr: "ดาการ์", syd: "ซิดนีย์", mel: "เมลเบิร์น", akl: "โอ๊คแลนด์", bne: "บริสเบน", per: "เพิร์ท", ool: "โกลด์โคสต์" }
    },
    ca: { 
        hubTitle: "Intel Hub", hubSub: "Base de Dades Global", homeTitle: "Explora Espanya", homeSub: "Masterclasses Nacionals", 
        catCapitales: "Grans Capitals", catVisitadas: "Més Visitades", catPueblos: "Pobles amb Encant", catJoyas: "Joies Amagades",
        catEuropa: "Europa", catAmerica: "Amèrica", catAsia: "Àsia", catAfrica: "Àfrica", catOceania: "Oceania",
        countries: { esp: "Espanya", fra: "França", gbr: "Regne Unit", deu: "Alemanya", ita: "Itàlia", nld: "Països Baixos", cze: "Txèquia", aut: "Àustria", grc: "Grècia", prt: "Portugal", hun: "Hongria", usa: "EUA", mex: "Mèxic", arg: "Argentina", bra: "Brasil", col: "Colòmbia", per: "Perú", chl: "Xile", can: "Canadà", jpn: "Japó", kor: "Corea del Sud", tha: "Tailàndia", chn: "Xina", sgp: "Singapur", are: "EAU", ind: "Índia", tur: "Turquia", vnm: "Vietnam", mar: "Marroc", egy: "Egipte", zaf: "Sud-àfrica", ken: "Kenya", tun: "Tunísia", nga: "Nigèria", sen: "Senegal", aus: "Austràlia", nzl: "Nova Zelanda" },
        cities: { mad: "Madrid", bcn: "Barcelona", vlc: "València", svq: "Sevilla", grx: "Granada", agp: "Màlaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarrasí", cud: "Cudillero", ter: "Terol", sor: "Sòria", ube: "Úbeda", cac: "Càceres", par: "París", lon: "Londres", ber: "Berlín", rom: "Roma", ams: "Amsterdam", prg: "Praga", vie: "Viena", ath: "Atenes", lis: "Lisboa", bud: "Budapest", nyc: "Nova York", mex: "Ciutat de Mèxic", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogotà", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tòquio", sel: "Seül", bkk: "Bangkok", pek: "Pequín", sin: "Singapur", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hong Kong", han: "Hanoi", rak: "Marràqueix", cai: "El Caire", cpt: "Ciutat del Cap", nbo: "Nairobi", tun: "Tunis", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
    },
    eu: { 
        hubTitle: "Intel Hub", hubSub: "Datu-base Globala", homeTitle: "Espainia Esploratu", homeSub: "Masterclass Nazionalak", 
        catCapitales: "Hiriburu Handiak", catVisitadas: "Bisitatuenak", catPueblos: "Herri Xarmagarriak", catJoyas: "Ezkutuko Bitxiak",
        catEuropa: "Europa", catAmerica: "Amerika", catAsia: "Asia", catAfrica: "Afrika", catOceania: "Ozeania",
        countries: { esp: "Espainia", fra: "Frantzia", gbr: "Erresuma Batua", deu: "Alemania", ita: "Italia", nld: "Herbehereak", cze: "Txekia", aut: "Austria", grc: "Grezia", prt: "Portugal", hun: "Hungaria", usa: "AEB", mex: "Mexiko", arg: "Argentina", bra: "Brasil", col: "Kolonbia", per: "Peru", chl: "Txile", can: "Kanada", jpn: "Japonia", kor: "Hego Korea", tha: "Thailandia", chn: "Txina", sgp: "Singapur", are: "EAU", ind: "India", tur: "Turkia", vnm: "Vietnam", mar: "Maroko", egy: "Egipto", zaf: "Hegoafrika", ken: "Kenia", tun: "Tunisia", nga: "Nigeria", sen: "Senegal", aus: "Australia", nzl: "Zeelanda Berria" },
        cities: { mad: "Madril", bcn: "Bartzelona", vlc: "Valentzia", svq: "Sevilla", grx: "Granada", agp: "Malaga", pmi: "Palma", bio: "Bilbo", ron: "Ronda", cad: "Cadaqués", alb: "Albarracín", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", par: "Paris", lon: "Londres", ber: "Berlin", rom: "Erroma", ams: "Amsterdam", prg: "Praga", vie: "Viena", ath: "Atenas", lis: "Lisboa", bud: "Budapest", nyc: "New York", mex: "Mexiko Hiria", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogota", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco", tyo: "Tokio", sel: "Seul", bkk: "Bangkok", pek: "Pekin", sin: "Singapur", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hong Kong", han: "Hanoi", rak: "Marrakech", cai: "Kairo", cpt: "Lurmutur Hiria", nbo: "Nairobi", tun: "Tunis", cas: "Casablanca", los: "Lagos", dkr: "Dakar", syd: "Sydney", mel: "Melbourne", akl: "Auckland", bne: "Brisbane", per: "Perth", ool: "Gold Coast" }
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
    const l = UI_LABELS[language] || UI_LABELS.es;
    const [activeTab, setActiveTab] = useState<string>('europa');

    const getCountryName = (key: string) => {
        if (l.countries && l.countries[key]) return l.countries[key];
        if (UI_LABELS.en.countries[key]) return UI_LABELS.en.countries[key];
        return key;
    };

    const getCityName = (key: string) => {
        if (l.cities && l.cities[key]) return l.cities[key];
        if (UI_LABELS.en.cities[key]) return UI_LABELS.en.cities[key];
        return key;
    };

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
