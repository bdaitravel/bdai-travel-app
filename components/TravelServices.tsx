
import React, { useState } from 'react';
import { translations } from '../data/translations';

/**
 * MOTOR DE TRADUCCIÓN GLOBAL BDAI
 * Cobertura garantizada para los 20 idiomas del sistema.
 */
export const CITY_TRANSLATIONS: Record<string, any> = {
  // ESPAÑA
  "madrid": { es: "Madrid", en: "Madrid", fr: "Madrid", de: "Madrid", it: "Madrid", pt: "Madrid", ro: "Madrid", zh: "马德里", ja: "マドリード", ru: "Мадрид", ar: "مدريد", hi: "मैड्रिड", ko: "마드리드", tr: "Madrid", pl: "Madryt", nl: "Madrid", ca: "Madrid", eu: "Madril", vi: "Madrid", th: "มาดริด" },
  "barcelona": { es: "Barcelona", en: "Barcelona", fr: "Barcelone", de: "Barcelona", it: "Barcellona", pt: "Barcelona", ro: "Barcelona", zh: "巴塞罗那", ja: "バルセロナ", ru: "Барселона", ar: "برشلونة", hi: "बार्सिलोना", ko: "바르셀로나", tr: "Barselona", pl: "Barcelona", nl: "Barcelona", ca: "Barcelona", eu: "Bartzelona", vi: "Barcelona", th: "บาร์เซโลนา" },
  "valencia": { es: "Valencia", en: "Valencia", fr: "Valence", de: "Valencia", it: "Valencia", pt: "Valência", ro: "Valencia", zh: "瓦伦西亚", ja: "バレンシア", ru: "Валенсия", ar: "فالنسيا", hi: "वेलेंसिया", ko: "발렌시아", tr: "Valensiya", pl: "Walencja", nl: "Valencia", ca: "València", eu: "Valentzia", vi: "Valencia", th: "บาเลนเซีย" },
  "seville": { es: "Sevilla", en: "Seville", fr: "Séville", de: "Sevilla", it: "Siviglia", pt: "Sevilha", ro: "Sevilla", zh: "塞维利亚", ja: "セビリア", ru: "Севилья", ar: "إشبيلية", hi: "सेविle", ko: "세비야", tr: "Sevilla", pl: "Sewilla", nl: "Sevilla", ca: "Sevilla", eu: "Sevilla", vi: "Sevilla", th: "เซบียา" },
  "sevilla": { es: "Sevilla", en: "Seville", fr: "Séville", de: "Sevilla", it: "Siviglia", pt: "Sevilha", ro: "Sevilla", zh: "塞维利亚", ja: "セビリア", ru: "Севилья", ar: "إشبيلية", hi: "सेविle", ko: "세비야", tr: "Sevilla", pl: "Sewilla", nl: "Sevilla", ca: "Sevilla", eu: "Sevilla", vi: "Sevilla", th: "เซบียา" },
  "granada": { es: "Granada", en: "Granada", fr: "Grenade", de: "Granada", it: "Granada", pt: "Granada", ro: "Granada", zh: "格拉纳达", ja: "グラナダ", ru: "Гранада", ar: "غرناطة", hi: "ग्रेनेडा", ko: "그라나다", tr: "Granada", pl: "Grenada", nl: "Granada", ca: "Granada", eu: "Granada", vi: "Granada", th: "กรานาดา" },
  "malaga": { es: "Málaga", en: "Malaga", fr: "Malaga", de: "Malaga", it: "Malaga", pt: "Málaga", ro: "Malaga", zh: "马拉加", ja: "マラガ", ru: "Малага", ar: "مالقة", hi: "मलागा", ko: "말라가", tr: "Malaga", pl: "Malaga", nl: "Malaga", ca: "Màlaga", eu: "Malaga", vi: "Malaga", th: "มาลากา" },
  "palma": { es: "Palma", en: "Palma", fr: "Palma", de: "Palma", it: "Palma", pt: "Palma", ro: "Palma", zh: "帕尔马", ja: "パルマ", ru: "Пальма", ar: "بالما", hi: "पालमा", ko: "팔마", tr: "Palma", pl: "Palma", nl: "Palma", ca: "Palma", eu: "Palma", vi: "Palma", th: "ปัลมา" },
  "bilbao": { es: "Bilbao", en: "Bilbao", fr: "Bilbao", de: "Bilbao", it: "Bilbao", pt: "Bilbau", ro: "Bilbao", zh: "毕尔巴鄂", ja: "ビルバオ", ru: "Бильбао", ar: "بلباو", hi: "बिल्बाओ", ko: "빌바오", tr: "Bilbao", pl: "Bilbao", nl: "Bilbao", ca: "Bilbao", eu: "Bilbo", vi: "Bilbao", th: "บิลบาโอ" },
  "ronda": { es: "Ronda", en: "Ronda", fr: "Ronda", de: "Ronda", it: "Ronda", pt: "Ronda", ro: "Ronda", zh: "隆达", ja: "ロンダ", ru: "Ронда", ar: "روندا", hi: "रोंडा", ko: "론다", tr: "Ronda", pl: "Ronda", nl: "Ronda", ca: "Ronda", eu: "Ronda", vi: "Ronda", th: "รอนดา" },
  "cadaques": { es: "Cadaqués", en: "Cadaques", fr: "Cadaqués", de: "Cadaqués", it: "Cadaqués", pt: "Cadaqués", ro: "Cadaqués", zh: "卡达克斯", ja: "カダケス", ru: "Кадакес", ar: "كاديكيس", hi: "काडाक्वेस", ko: "카다케스", tr: "Cadaqués", pl: "Cadaqués", nl: "Cadaqués", ca: "Cadaqués", eu: "Cadaqués", vi: "Cadaqués", th: "กาดาเกส" },
  "albarracin": { es: "Albarracín", en: "Albarracin", fr: "Albarracín", de: "Albarracín", it: "Albarracín", pt: "Albarracín", ro: "Albarracín", zh: "阿尔巴拉辛", ja: "アルバラシン", ru: "Альбаррасин", ar: "البراسين", hi: "अल्बारासिन", ko: "알바라신", tr: "Albarracín", pl: "Albarracín", nl: "Albarracín", ca: "Albarrasí", eu: "Albarracin", vi: "Albarracín", th: "อัลบาร์ราซิน" },
  "cudillero": { es: "Cudillero", en: "Cudillero", fr: "Cudillero", de: "Cudillero", it: "Cudillero", pt: "Cudillero", ro: "Cudillero", zh: "库迪列罗", ja: "クディジェロ", ru: "Кудильеро", ar: "كوديليرو", hi: "कुडिलेरो", ko: "쿠디제로", tr: "Cudillero", pl: "Cudillero", nl: "Cudillero", ca: "Cudillero", eu: "Cudillero", vi: "Cudillero", th: "กูดีเยโร" },
  "teruel": { es: "Teruel", en: "Teruel", fr: "Teruel", de: "Teruel", it: "Teruel", pt: "Teruel", ro: "Teruel", zh: "特鲁埃尔", ja: "テルエル", ru: "Теруэль", ar: "تيرويل", hi: "तेरुएल", ko: "테루엘", tr: "Teruel", pl: "Teruel", nl: "Teruel", ca: "Terol", eu: "Teruel", vi: "Teruel", th: "เตรูเอล" },
  "soria": { es: "Soria", en: "Soria", fr: "Soria", de: "Soria", it: "Soria", pt: "Soria", ro: "Soria", zh: "索里亚", ja: "ソリア", ru: "Сория", ar: "سوريا", hi: "सोरिया", ko: "소리아", tr: "Soria", pl: "Soria", nl: "Soria", ca: "Sòria", eu: "Soria", vi: "Soria", th: "โซเรีย" },
  "ubeda": { es: "Úbeda", en: "Ubeda", fr: "Úbeda", de: "Úbeda", it: "Úbeda", pt: "Úbeda", ro: "Úbeda", zh: "乌贝达", ja: "ウベダ", ru: "Убеда", ar: "أبيدة", hi: "उबेदा", ko: "우베다", tr: "Úbeda", pl: "Úbeda", nl: "Úbeda", ca: "Úbeda", eu: "Ubeda", vi: "Úbeda", th: "อูเบดา" },
  "caceres": { es: "Cáceres", en: "Caceres", fr: "Cáceres", de: "Cáceres", it: "Cáceres", pt: "Cáceres", ro: "Cáceres", zh: "卡塞雷斯", ja: "カセレス", ru: "Касерес", ar: "كاثيريس", hi: "कासेरेस", ko: "카세레스", tr: "Cáceres", pl: "Cáceres", nl: "Cáceres", ca: "Càceres", eu: "Caceres", vi: "Cáceres", th: "กาเซเรส" },
  "cordoba": { es: "Córdoba", en: "Cordoba", fr: "Cordoue", de: "Córdoba", it: "Cordova", pt: "Córdoba", ro: "Córdoba", zh: "科尔多瓦", ja: "コルドバ", ru: "Кордова", ar: "قرطبة", hi: "कोर्डोबा", ko: "코르도바", tr: "Córdoba", pl: "Kordoba", nl: "Córdoba", ca: "Còrdova", eu: "Kordoba", vi: "Córdoba", th: "กอร์โดบา" },
  "cadiz": { es: "Cádiz", en: "Cadiz", fr: "Cádiz", de: "Cádiz", it: "Cadice", pt: "Cádiz", ro: "Cádiz", zh: "加的斯", ja: "カディス", ru: "Кадис", ar: "قادس", hi: "काडिज", ko: "카디스", tr: "Cádiz", pl: "Kadyks", nl: "Cádiz", ca: "Cadis", eu: "Cadiz", vi: "Cádiz", th: "กาดิซ" },
  "leon": { es: "León", en: "Leon", fr: "León", de: "León", it: "León", pt: "Leão", ro: "León", zh: "莱昂", ja: "レオン", ru: "Леон", ar: "ليون", hi: "लियोन", ko: "레온", tr: "León", pl: "León", nl: "León", ca: "Lleó", eu: "Leon", vi: "León", th: "เลออน" },
  "gijon": { es: "Gijón", en: "Gijon", fr: "Gijón", de: "Gijón", it: "Gijón", pt: "Gijón", ro: "Gijón", zh: "希洪", ja: "ヒホン", ru: "Хихон", ar: "خيخون", hi: "गिजों", ko: "히혼", tr: "Gijón", pl: "Gijón", nl: "Gijón", ca: "Gijón", eu: "Gijon", vi: "Gijón", th: "คีคอน" },
  "logrono": { es: "Logroño", en: "Logrono", fr: "Logroño", de: "Logroño", it: "Logroño", pt: "Logroño", ro: "Logroño", zh: "洛格罗尼奥", ja: "ログローニョ", ru: "Логроньо", ar: "لوغرونيو", hi: "लोग्रोनो", ko: "로그로뇨", tr: "Logroño", pl: "Logroño", nl: "Logroño", ca: "Logronyo", eu: "Logroño", vi: "Logroño", th: "โลโกรโญ" },
  
  // EUROPA
  "paris": { es: "París", en: "Paris", fr: "Paris", de: "Paris", it: "Parigi", pt: "Paris", ro: "Paris", zh: "巴黎", ja: "パリ", ru: "Париж", ar: "باريس", hi: "पेरिस", ko: "파리", tr: "Paris", pl: "Paryż", nl: "Parijs", ca: "París", eu: "Paris", vi: "Paris", th: "ปารีส" },
  "london": { es: "Londres", en: "London", fr: "Londres", de: "London", it: "Londra", pt: "Londres", ro: "Londra", zh: "伦敦", ja: "ロンドン", ru: "Лондон", ar: "لندن", hi: "लंदन", ko: "런던", tr: "Londra", pl: "Londyn", nl: "Londen", ca: "Londres", eu: "Londres", vi: "Luân Đôn", th: "ลอนดอน" },
  "rome": { es: "Roma", en: "Rome", fr: "Rome", de: "Rom", it: "Roma", pt: "Roma", ro: "Roma", zh: "罗马", ja: "ローマ", ru: "Рим", ar: "روما", hi: "रोम", ko: "로마", tr: "Roma", pl: "Rzym", nl: "Rome", ca: "Roma", eu: "Erroma", vi: "Rô-ma", th: "โรม" },
  "berlin": { es: "Berlín", en: "Berlin", fr: "Berlin", de: "Berlin", it: "Berlino", pt: "Berlim", ro: "Berlin", zh: "柏林", ja: "ベルリン", ru: "Берлин", ar: "برلين", hi: "बर्लिन", ko: "베를린", tr: "Berlin", pl: "Berlin", nl: "Berlijn", ca: "Berlín", eu: "Berlin", vi: "Béc-lin", th: "เบอร์ลิน" },
  "amsterdam": { es: "Ámsterdam", en: "Amsterdam", fr: "Amsterdam", de: "Amsterdam", it: "Amsterdam", pt: "Amesterdão", ro: "Amsterdam", zh: "阿姆斯特丹", ja: "アムステルダム", ru: "Амстердам", ar: "أمستردام", hi: "एम्स्टर्डम", ko: "암스테르담", tr: "Amsterdam", pl: "Amsterdam", nl: "Amsterdam", ca: "Amsterdam", eu: "Amsterdam", vi: "Amsterdam", th: "อัมสเตอร์ดัม" },
  "vienna": { es: "Viena", en: "Vienna", fr: "Vienne", de: "Wien", it: "Vienna", pt: "Viena", ro: "Viena", zh: "维也纳", ja: "ウィーン", ru: "Вена", ar: "فيينا", hi: "वियना", ko: "빈", tr: "Viyana", pl: "Wiedeń", nl: "Wenen", ca: "Viena", eu: "Viena", vi: "Viên", th: "เวียนนา" },
  "prague": { es: "Praga", en: "Prague", fr: "Prague", de: "Prag", it: "Praga", pt: "Praga", ro: "Praga", zh: "布拉格", ja: "プラハ", ru: "Прага", ar: "براغ", hi: "प्राग", ko: "프라하", tr: "Prag", pl: "Praga", nl: "Praag", ca: "Praga", eu: "Praga", vi: "Pra-ha", th: "ปราก" },
  "athens": { es: "Atenas", en: "Athens", fr: "Athènes", de: "Athen", it: "Atene", pt: "Atenas", ro: "Atena", zh: "雅典", ja: "アテネ", ru: "Афины", ar: "أثينا", hi: "एथेंस", ko: "아테네", tr: "Atina", pl: "Ateny", nl: "Athene", ca: "Atenes", eu: "Atenas", vi: "Athena", th: "เอเธนส์" },
  "lisbon": { es: "Lisboa", en: "Lisbon", fr: "Lisbonne", de: "Lissabon", it: "Lisbona", pt: "Lisboa", ro: "Lisabona", zh: "里斯本", ja: "リスボン", ru: "Лиссабон", ar: "لشبونة", hi: "लिस्बन", ko: "리스본", tr: "Lizbon", pl: "Lizbona", nl: "Lissabon", ca: "Lisboa", eu: "Lisboa", vi: "Lisboa", th: "ลิสบอน" },

  // ASIA
  "tokyo": { es: "Tokio", en: "Tokyo", fr: "Tokyo", de: "Tokio", it: "Tokyo", pt: "Tóquio", ro: "Tokyo", zh: "东京", ja: "東京", ru: "Токио", ar: "طوكيو", hi: "टोक्यो", ko: "도쿄", tr: "Tokyo", pl: "Tokio", nl: "Tokio", ca: "Tòquio", eu: "Tokio", vi: "Tô-ky-ô", th: "โตเกียว" },
  "seoul": { es: "Seúl", en: "Seoul", fr: "Séoul", de: "Seoul", it: "Seul", pt: "Seul", ro: "Seul", zh: "首尔", ja: "ソウル", ru: "Сеул", ar: "سيول", hi: "सियोल", ko: "서울", tr: "Seul", pl: "Seul", nl: "Seoel", ca: "Seül", eu: "Seul", vi: "Seoul", th: "โซล" },
  "bangkok": { es: "Bangkok", en: "Bangkok", fr: "Bangkok", de: "Bangkok", it: "Bangkok", pt: "Bangcoc", ro: "Bangkok", zh: "曼谷", ja: "バンコク", ru: "Бангкок", ar: "بانكوك", hi: "बैंकॉक", ko: "방콕", tr: "Bangkok", pl: "Bangkok", nl: "Bangkok", ca: "Bangkok", eu: "Bangkok", vi: "Băng Cốc", th: "กรุงเทพฯ" },
  "beijing": { es: "Pekín", en: "Beijing", fr: "Pékin", de: "Peking", it: "Pechino", pt: "Pequim", ro: "Beijing", zh: "北京", ja: "北京", ru: "Пекин", ar: "بكين", hi: "बीजिंग", ko: "베이징", tr: "Pekin", pl: "Pekin", nl: "Peking", ca: "Pequín", eu: "Pekin", vi: "Bắc Kinh", th: "ปักกิ่ง" },
  "singapore": { es: "Singapur", en: "Singapore", fr: "Singapour", de: "Singapur", it: "Singapore", pt: "Singapura", ro: "Singapore", zh: "新加坡", ja: "シンガポール", ru: "Сингапур", ar: "سنغافورة", hi: "सिंगापुर", ko: "싱가포르", tr: "Singapur", pl: "Singapur", nl: "Singapore", ca: "Singapur", eu: "Singapur", vi: "Singapore", th: "สิงคโปร์" },

  // AMERICA
  "new york": { es: "Nueva York", en: "New York", fr: "New York", de: "New York", it: "New York", pt: "Nova Iorque", ro: "New York", zh: "纽约", ja: "ニューヨーク", ru: "Нью-Йорк", ar: "نيويورك", hi: "न्यूयॉर्क", ko: "뉴욕", tr: "New York", pl: "Nowy Jork", nl: "New York", ca: "Nova York", eu: "New York", vi: "New York", th: "นิวยอร์ก" },
  "mexico city": { es: "Ciudad de México", en: "Mexico City", fr: "Mexico", de: "Mexiko-Stadt", it: "Città del Messico", pt: "Cidade do México", ro: "Ciudad de México", zh: "墨西哥城", ja: "メキシコシティ", ru: "Мехико", ar: "مكسيكو سيتي", hi: "मेक्सिको सिटी", ko: "멕시코 시티", tr: "Meksiko", pl: "Meksyk", nl: "Mexico-Stad", ca: "Ciutat de Mèxic", eu: "Mexiko Hiria", vi: "Thành phố Mexico", th: "เม็กซิโกซิตี" },
  "buenos aires": { es: "Buenos Aires", en: "Buenos Aires", fr: "Buenos Aires", de: "Buenos Aires", it: "Buenos Aires", pt: "Buenos Aires", ro: "Buenos Aires", zh: "布宜诺斯艾利斯", ja: "ブエノスアイレス", ru: "Буэнос-Айрес", ar: "بوينس آيرس", hi: "ब्यूनس आयर्स", ko: "부에노스아이레스", tr: "Buenos Aires", pl: "Buenos Aires", nl: "Buenos Aires", ca: "Buenos Aires", eu: "Buenos Aires", vi: "Buenos Aires", th: "บัวโนสไอเรส" },
  "rio de janeiro": { es: "Río de Janeiro", en: "Rio de Janeiro", fr: "Rio de Janeiro", de: "Rio de Janeiro", it: "Rio de Janeiro", pt: "Rio de Janeiro", ro: "Rio de Janeiro", zh: "里约热内卢", ja: "リオデジャネイロ", ru: "Рио-де-Жанейро", ar: "ريو دي جانيرو", hi: "रियो डी जनेरियो", ko: "리우데자네이루", tr: "Rio de Janeiro", pl: "Rio de Janeiro", nl: "Rio de Janeiro", ca: "Rio de Janeiro", eu: "Rio de Janeiro", vi: "Rio de Janeiro", th: "รีโอเดจาเนโร" },

  // AFRICA
  "cairo": { es: "El Cairo", en: "Cairo", fr: "Le Caire", de: "Kairo", it: "Il Cairo", pt: "Cairo", ro: "Cairo", zh: "开罗", ja: "カイロ", ru: "Каир", ar: "القاهرة", hi: "काहिरा", ko: "카이로", tr: "Kahire", pl: "Kair", nl: "Caïro", ca: "El Caire", eu: "Kairo", vi: "Cairo", th: "ไคโร" },
  "cape town": { es: "Ciudad del Cabo", en: "Cape Town", fr: "Le Cap", de: "Kapstadt", it: "Città del Capo", pt: "Cidade do Cabo", ro: "Cape Town", zh: "开普敦", ja: "ケープタウン", ru: "Кейптаун", ar: "كيب تاون", hi: "केप टाउन", ko: "케이프타운", tr: "Cape Town", pl: "Kapsztad", nl: "Kaapstad", ca: "Ciutat del Cap", eu: "Lurmutur Hiria", vi: "Cape Town", th: "เคปทาวน์" },
  "marrakech": { es: "Marrakech", en: "Marrakech", fr: "Marrakech", de: "Marrakesch", it: "Marrakech", pt: "Marraquexe", ro: "Marrakech", zh: "马拉喀什", ja: "マラケシュ", ru: "Марракеш", ar: "مراكش", hi: "मैराकेच", ko: "마라케시", tr: "Marakeş", pl: "Marrakesz", nl: "Marrakech", ca: "Marràqueix", eu: "Marrakesh", vi: "Marrakech", th: "มาร์ราเกช" },

  // OCEANIA
  "sydney": { es: "Sídney", en: "Sydney", fr: "Sydney", de: "Sydney", it: "Sydney", pt: "Sydney", ro: "Sydney", zh: "悉尼", ja: "シドニー", ru: "Сидней", ar: "سيدني", hi: "सिडनी", ko: "시드니", tr: "Sidney", pl: "Sydney", nl: "Sydney", ca: "Sydney", eu: "Sydney", vi: "Sydney", th: "ซิดนีย์" },
  "melbourne": { es: "Melbourne", en: "Melbourne", fr: "Melbourne", de: "Melbourne", it: "Melbourne", pt: "Melbourne", ro: "Melbourne", zh: "墨尔本", ja: "メルボルン", ru: "Мельбурн", ar: "ملبورن", hi: "मेलबर्न", ko: "멜버른", tr: "Melbourne", pl: "Melbourne", nl: "Melbourne", ca: "Melbourne", eu: "Melbourne", vi: "Melbourne", th: "เมลเบิร์น" }
};

export const COUNTRY_TRANSLATIONS: Record<string, any> = {
  "esp": { es: "España", en: "Spain", fr: "Espagne", de: "Spanien", it: "Spagna", pt: "Espanha", ro: "Spania", zh: "西班牙", ja: "スペイン", ru: "Испания", ar: "إسبانيا", hi: "स्पेन", ko: "스페인", tr: "İspanya", pl: "Hiszpania", nl: "Spanje", ca: "Espanya", eu: "Espainia", vi: "Tây Ban Nha", th: "สเปน" },
  "spain": { es: "España", en: "Spain", fr: "Espagne", de: "Spanien", it: "Spagna", pt: "Espanha", ro: "Spania", zh: "西班牙", ja: "スペイン", ru: "Испания", ar: "إسبانيا", hi: "स्पेन", ko: "스페인", tr: "İspanya", pl: "Hiszpania", nl: "Spanje", ca: "Espanya", eu: "Espainia", vi: "Tây Ban Nha", th: "สเปน" },
  "fra": { es: "Francia", en: "France", fr: "France", de: "Frankreich", it: "Francia", pt: "França", ro: "Franța", zh: "法国", ja: "フランス", ru: "Франция", ar: "فرنسا", hi: "फ्रांस", ko: "프랑스", tr: "Fransa", pl: "Francja", nl: "Frankrijk", ca: "França", eu: "Frantzia", vi: "Pháp", th: "ฝรั่งเศส" },
  "france": { es: "Francia", en: "France", fr: "France", de: "Frankreich", it: "Francia", pt: "França", ro: "Franța", zh: "法国", ja: "フランス", ru: "Франция", ar: "فرنسا", hi: "फ्रांस", ko: "프랑스", tr: "Fransa", pl: "Francja", nl: "Frankrijk", ca: "França", eu: "Frantzia", vi: "Pháp", th: "ฝรั่งเศส" },
  "gbr": { es: "Reino Unido", en: "UK", fr: "Royaume-Uni", de: "Vereinigtes Königreich", it: "Regno Unito", pt: "Reino Unido", ro: "Regatul Unit", zh: "英国", ja: "イギリス", ru: "Великобритания", ar: "المملكة المتحدة", hi: "यूनाइटेड किंगडम", ko: "영국", tr: "Birleşik Krallık", pl: "Wielka Brytania", nl: "Verenigd Koninkrijk", ca: "Regne Unit", eu: "Erresuma Batua", vi: "Vương quốc Anh", th: "สหราชอาณาจักร" },
  "united kingdom": { es: "Reino Unido", en: "UK", fr: "Royaume-Uni", de: "Vereinigtes Königreich", it: "Regno Unito", pt: "Reino Unido", ro: "Regatul Unit", zh: "英国", ja: "イギリス", ru: "Великобритания", ar: "المملكة المتحدة", hi: "यूनाइटेड किंग덤", ko: "영국", tr: "Birleşik Krallık", pl: "Wielka Brytania", nl: "Verenigd Koninkrijk", ca: "Regne Unit", eu: "Erresuma Batua", vi: "Vương quốc Anh", th: "สหราชอาณาจักร" },
  "ita": { es: "Italia", en: "Italy", fr: "Italie", de: "Italien", it: "Italia", pt: "Itália", ro: "Italia", zh: "意大利", ja: "イタリア", ru: "Италия", ar: "إيطاليا", hi: "इटली", ko: "이탈리아", tr: "İtalya", pl: "Włochy", nl: "Italië", ca: "Itàlia", eu: "Italia", vi: "Ý", th: "อิตาลี" },
  "italy": { es: "Italia", en: "Italy", fr: "Italie", de: "Italien", it: "Italia", pt: "Itália", ro: "Italia", zh: "意大利", ja: "イタリア", ru: "Италия", ar: "إيطاليا", hi: "इटली", ko: "이탈리아", tr: "İtalya", pl: "Włochy", nl: "Italië", ca: "Itàlia", eu: "Italia", vi: "Ý", th: "อิตาลี" },
  "deu": { es: "Alemania", en: "Germany", fr: "Allemagne", de: "Deutschland", it: "Germania", pt: "Alemanha", ro: "Germania", zh: "德国", ja: "ドイツ", ru: "Германия", ar: "ألمانيا", hi: "जर्मनी", ko: "독일", tr: "Almanya", pl: "Niemcy", nl: "Duitsland", ca: "Alemanya", eu: "Alemania", vi: "Đức", th: "เยอรมนี" },
  "germany": { es: "Alemania", en: "Germany", fr: "Allemagne", de: "Deutschland", it: "Germania", pt: "Alemanha", ro: "Germania", zh: "德国", ja: "ドイツ", ru: "Германия", ar: "ألمانيا", hi: "जर्मनी", ko: "독일", tr: "Almanya", pl: "Niemcy", nl: "Duitsland", ca: "Alemanya", eu: "Alemania", vi: "Đức", th: "เยอรมนี" },
  "tha": { es: "Tailandia", en: "Thailand", fr: "Thaïlande", de: "Thailand", it: "Thailandia", pt: "Tailândia", ro: "Thailanda", zh: "泰国", ja: "タイ", ru: "Таиланд", ar: "تايلاند", hi: "थाईलैंड", ko: "태국", tr: "Tayland", pl: "Tajlandia", nl: "Thailand", ca: "Tailàndia", eu: "Thailandia", vi: "Thái Lan", th: "ประเทศไทย" },
  "thailand": { es: "Tailandia", en: "Thailand", fr: "Thaïlande", de: "Thailand", it: "Thailandia", pt: "Tailândia", ro: "Thailanda", zh: "泰国", ja: "タイ", ru: "Таиланд", ar: "تايلاند", hi: "थाईलैंड", ko: "태국", tr: "Tayland", pl: "Tajlandia", nl: "Thailand", ca: "Tailàndia", eu: "Thailandia", vi: "Thái Lan", th: "ประเทศไทย" },
  "usa": { es: "EE.UU.", en: "USA", fr: "États-Unis", de: "USA", it: "Stati Uniti", pt: "EUA", ro: "SUA", zh: "美国", ja: "アメリカ", ru: "США", ar: "الولايات المتحدة", hi: "अमेरिका", ko: "미국", tr: "ABD", pl: "USA", nl: "VS", ca: "EUA", eu: "AEB", vi: "Hoa Kỳ", th: "สหรัฐอเมริกา" },
  "mexico": { es: "México", en: "Mexico", fr: "Mexique", de: "Mexiko", it: "Messico", pt: "México", ro: "Mexic", zh: "墨西哥", ja: "メキシコ", ru: "Мексика", ar: "المكسيك", hi: "मेक्सिको", ko: "멕시코", tr: "Meksika", pl: "Meksyk", nl: "Mexico", ca: "Mèxic", eu: "Mexiko", vi: "Mexico", th: "เม็กซิโก" },
  "argentina": { es: "Argentina", en: "Argentina", fr: "Argentine", de: "Argentinien", it: "Argentina", pt: "Argentina", ro: "Argentina", zh: "阿根廷", ja: "アルゼンチン", ru: "Аргентина", ar: "الأرجنتين", hi: "अर्जेंटीना", ko: "아르헨티나", tr: "Arjantin", pl: "Argentyna", nl: "Argentinië", ca: "Argentina", eu: "Argentina", vi: "Argentina", th: "อาร์เจนตินา" },
  "brazil": { es: "Brasil", en: "Brazil", fr: "Brésil", de: "Brasilien", it: "Brasile", pt: "Brasil", ro: "Brazilia", zh: "巴西", ja: "ブラジル", ru: "Бразилия", ar: "البرازيل", hi: "ब्राजील", ko: "브라질", tr: "Brezilya", pl: "Brazylia", nl: "Brazilië", ca: "Brasil", eu: "Brasil", vi: "Brazil", th: "บราซิล" },
  "japan": { es: "Japón", en: "Japan", fr: "Japon", de: "Japan", it: "Giappone", pt: "Japão", ro: "Japonia", zh: "日本", ja: "日本", ru: "Япония", ar: "اليابان", hi: "जापान", ko: "일본", tr: "Japonya", pl: "Japonia", nl: "Japan", ca: "Japó", eu: "Japonia", vi: "Nhật Bản", th: "ญี่ปุ่น" },
  "china": { es: "China", en: "China", fr: "Chine", de: "China", it: "Cina", pt: "China", ro: "China", zh: "中国", ja: "中国", ru: "Китай", ar: "الصين", hi: "चीन", ko: "중국", tr: "Çin", pl: "Chiny", nl: "China", ca: "Xina", eu: "Txina", vi: "Trung Quốc", th: "จีน" },
  "netherlands": { es: "Países Bajos", en: "Netherlands", fr: "Pays-Bas", de: "Niederlande", it: "Paesi Bassi", pt: "Países Baixos", ro: "Țările de Jos", zh: "荷兰", ja: "オランダ", ru: "Нидерланды", ar: "هولندا", hi: "नीदरलैंड", ko: "네덜란드", tr: "Hollanda", pl: "Holandia", nl: "Nederland", ca: "Països Baixos", eu: "Herbehereak", vi: "Hà Lan", th: "เนเธอร์แลนด์" },
  "czechia": { es: "Chequia", en: "Czechia", fr: "Tchéquie", de: "Tschechien", it: "Cechia", pt: "Chéquia", ro: "Cehia", zh: "捷克", ja: "チェコ", ru: "Чехия", ar: "التشيك", hi: "चेकिया", ko: "체코", tr: "Çekya", pl: "Czechy", nl: "Tsjechië", ca: "Txèquia", eu: "Txekia", vi: "Séc", th: "เช็ก" },
  "austria": { es: "Austria", en: "Austria", fr: "Autriche", de: "Österreich", it: "Austria", pt: "Áustria", ro: "Austria", zh: "奥地利", ja: "オーストリア", ru: "Австрия", ar: "النمسا", hi: "ऑस्ट्रिया", ko: "오스트리아", tr: "Avusturya", pl: "Austria", nl: "Oostenrijk", ca: "Àustria", eu: "Austria", vi: "Áo", th: "ออสเตรีย" },
  "greece": { es: "Grecia", en: "Greece", fr: "Grèce", de: "Griechenland", it: "Grecia", pt: "Grécia", ro: "Grecia", zh: "希腊", ja: "ギリシャ", ru: "Греция", ar: "اليونان", hi: "यूनान", ko: "그리스", tr: "Yunanistan", pl: "Grecja", nl: "Griekenland", ca: "Grècia", eu: "Grezia", vi: "Hy Lạp", th: "กรíซ" },
  "egypt": { es: "Egipto", en: "Egypt", fr: "Égypte", de: "Ägypten", it: "Egitto", pt: "Egito", ro: "Egipt", zh: "埃及", ja: "エジプト", ru: "Египет", ar: "مصر", hi: "मिस्र", ko: "이집트", tr: "Mısır", pl: "Egipt", nl: "Egypte", ca: "Egipte", eu: "Egipto", vi: "Ai Cập", th: "อียิปต์" },
  "south africa": { es: "Sudáfrica", en: "South Africa", fr: "Afrique du Sud", de: "Südafrika", it: "Sudafrica", pt: "África do Sul", ro: "Africa de Sud", zh: "南非", ja: "南アフリカ", ru: "ЮАР", ar: "جنوب أفريقيا", hi: "दक्षिण अफ्रीका", ko: "남아프리카 공화국", tr: "Güney Afrika", pl: "RPA", nl: "Zuid-Afrika", ca: "Sud-àfrica", eu: "Hegoafrika", vi: "Nam Phi", th: "แอฟริกาใต้" },
  "morocco": { es: "Marruecos", en: "Morocco", fr: "Maroc", de: "Marokko", it: "Marocco", pt: "Marrocos", ro: "Maroc", zh: "摩洛哥", ja: "モロッコ", ru: "Марокко", ar: "المغرب", hi: "मोरक्को", ko: "모ロッ코", tr: "Fas", pl: "Maroko", nl: "Marokko", ca: "Marroc", eu: "Maroko", vi: "Ma-rốc", th: "โมร็อกโก" },
  "australia": { es: "Australia", en: "Australia", fr: "Australie", de: "Australien", it: "Australia", pt: "Australia", ro: "Australia", zh: "澳大利亚", ja: "オーストラリア", ru: "Австралия", ar: "أستراليا", hi: "ऑस्ट्रेलिया", ko: "호주", tr: "Avustralya", pl: "Australia", nl: "Australië", ca: "Austràlia", eu: "Australia", vi: "Úc", th: "ออสเตรเลีย" }
};

const normalizeKey = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export const formatCityName = (rawName: string | null, lang: string): string => {
  if (!rawName) return "";
  const cleanKey = normalizeKey(rawName.split(',')[0]);
  const translated = CITY_TRANSLATIONS[cleanKey]?.[lang];
  return (translated || rawName.split(',')[0].trim()).toUpperCase();
};

export const formatCountryName = (rawCountry: string | null, lang: string): string => {
  if (!rawCountry) return "";
  const cleanKey = normalizeKey(rawCountry);
  const translated = COUNTRY_TRANSLATIONS[cleanKey]?.[lang];
  return (translated || rawCountry).toUpperCase();
};

const CITY_NAME_MAP_RAW: Record<string, string> = {
  mad: "Madrid", bcn: "Barcelona", vlc: "Valencia", svq: "Seville", grx: "Granada", agp: "Málaga", pmi: "Palma", bio: "Bilbao", ron: "Ronda", cad: "Cadaqués", alb: "Albarracín", cud: "Cudillero", ter: "Teruel", sor: "Soria", ube: "Úbeda", cac: "Cáceres", cor: "Córdoba", cdz: "Cádiz", len: "León", gij: "Gijón", log: "Logroño",
  par: "Paris", lon: "London", ber: "Berlin", rom: "Rome", ams: "Amsterdam", prg: "Prague", vie: "Vienna", ath: "Athens", lis: "Lisbon", bud: "Budapest",
  nyc: "New York", mex: "Mexico City", bue: "Buenos Aires", rio: "Rio de Janeiro", bog: "Bogotá", lim: "Lima", scl: "Santiago", yyz: "Toronto", chi: "Chicago", sfo: "San Francisco",
  tyo: "Tokyo", sel: "Seoul", bkk: "Bangkok", pek: "Beijing", sin: "Singapore", dxb: "Dubai", bom: "Mumbai", ist: "Istanbul", hkg: "Hong Kong", han: "Hanoi",
  cai: "Cairo", cpt: "Cape Town", rak: "Marrakech", syd: "Sydney", mel: "Melbourne"
};

const WORLD_DATA = {
  europa: [{ cityKey: "par", countryKey: "france" }, { cityKey: "lon", countryKey: "united kingdom" }, { cityKey: "ber", countryKey: "germany" }, { cityKey: "rom", countryKey: "italy" }, { cityKey: "ams", countryKey: "netherlands" }, { cityKey: "prg", countryKey: "czechia" }, { cityKey: "vie", countryKey: "austria" }, { cityKey: "ath", countryKey: "greece" }],
  america: [{ cityKey: "nyc", countryKey: "usa" }, { cityKey: "mex", countryKey: "mexico" }, { cityKey: "bue", countryKey: "argentina" }, { cityKey: "rio", countryKey: "brazil" }],
  asia: [{ cityKey: "tyo", countryKey: "japan" }, { cityKey: "bkk", countryKey: "thailand" }, { cityKey: "sin", countryKey: "singapore" }, { cityKey: "pek", countryKey: "china" }],
  africa: [{ cityKey: "cai", countryKey: "egypt" }, { cityKey: "cpt", countryKey: "south africa" }, { cityKey: "rak", countryKey: "morocco" }],
  oceania: [{ cityKey: "syd", countryKey: "australia" }, { cityKey: "mel", countryKey: "australia" }]
};

const SPAIN_DATA = {
  capitales: [{ cityKey: "mad", countryKey: "spain" }, { cityKey: "bcn", countryKey: "spain" }, { cityKey: "vlc", countryKey: "spain" }, { cityKey: "svq", countryKey: "spain" }, { cityKey: "cor", countryKey: "spain" }],
  visitadas: [{ cityKey: "grx", countryKey: "spain" }, { cityKey: "agp", countryKey: "spain" }, { cityKey: "pmi", countryKey: "spain" }, { cityKey: "bio", countryKey: "spain" }, { cityKey: "cdz", countryKey: "spain" }],
  pueblos: [{ cityKey: "ron", countryKey: "spain" }, { cityKey: "cad", countryKey: "spain" }, { cityKey: "alb", countryKey: "spain" }, { cityKey: "cud", countryKey: "spain" }],
  joyas: [{ cityKey: "ter", countryKey: "spain" }, { cityKey: "sor", countryKey: "spain" }, { cityKey: "ube", countryKey: "spain" }, { cityKey: "cac", countryKey: "spain" }, { cityKey: "len", countryKey: "spain" }, { cityKey: "gij", countryKey: "spain" }, { cityKey: "log", countryKey: "spain" }]
};

const CityMiniCard: React.FC<{ rawName: string, lang: string, countryKey: string, onSelect: (name: string) => void, colorIdx: number }> = ({ rawName, lang, countryKey, onSelect, colorIdx }) => {
  const colors = ['from-purple-600 to-indigo-900', 'from-emerald-600 to-teal-900', 'from-amber-600 to-orange-900', 'from-rose-600 to-slate-900'];
  const icon = ['fa-fingerprint', 'fa-landmark', 'fa-utensils', 'fa-camera'][colorIdx % 4];
  const color = colors[colorIdx % 4];

  return (
    <div onClick={() => onSelect(rawName)} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 group cursor-pointer hover:bg-white/10 transition-all active:scale-95 shadow-lg">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg shrink-0`}>
        <i className={`fas ${icon} text-xs`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <span className="text-white font-black text-[10px] uppercase truncate tracking-tighter">
            {formatCityName(rawName, lang)}
          </span>
          <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
            {formatCountryName(countryKey, lang)}
          </span>
        </div>
      </div>
      <i className="fas fa-chevron-right text-[8px] text-slate-700 group-hover:text-purple-500"></i>
    </div>
  );
};

export const TravelServices = ({ mode, lang, onCitySelect }: { mode: string, lang: string, onCitySelect: (name: string) => void }) => {
  const t = translations[lang] || translations.en;
  const [activeTab, setActiveTab] = useState<string>('europa');

  const handleCitySelection = (cityKey: string) => {
    const rawName = CITY_NAME_MAP_RAW[cityKey] || cityKey;
    onCitySelect(rawName);
  };

  if (mode === 'HUB') {
    return (
      <div className="space-y-10 pb-48 px-6 animate-fade-in">
        <header>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{t.navHub} HUB</h3>
          <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.4em] mt-2">Global Intel Database</p>
        </header>
        <section className="space-y-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {['europa', 'america', 'asia', 'africa', 'oceania'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeTab === tab ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {(WORLD_DATA as any)[activeTab].map((city: any, i: number) => (
              <CityMiniCard key={city.cityKey} rawName={CITY_NAME_MAP_RAW[city.cityKey] || city.cityKey} lang={lang} countryKey={city.countryKey} onSelect={() => handleCitySelection(city.cityKey)} colorIdx={i} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32 px-6 animate-fade-in">
      <header>
        <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
          {t.discoverTitle} <span className="text-purple-400">{formatCountryName("spain", lang)}</span>
        </h3>
        <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.4em] mt-2">{t.expertGuide}</p>
      </header>
      <div className="space-y-10">
        <section className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t.sectionPopular}</h4>
          <div className="grid grid-cols-1 gap-3">
            {SPAIN_DATA.capitales.map((city, i) => <CityMiniCard key={city.cityKey} rawName={CITY_NAME_MAP_RAW[city.cityKey]} lang={lang} countryKey="spain" onSelect={() => handleCitySelection(city.cityKey)} colorIdx={i} />)}
            {SPAIN_DATA.visitadas.map((city, i) => <CityMiniCard key={city.cityKey} rawName={CITY_NAME_MAP_RAW[city.cityKey]} lang={lang} countryKey="spain" onSelect={() => handleCitySelection(city.cityKey)} colorIdx={i+4} />)}
          </div>
        </section>
        <section className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t.sectionVillages}</h4>
          <div className="grid grid-cols-1 gap-3">
            {SPAIN_DATA.pueblos.map((city, i) => <CityMiniCard key={city.cityKey} rawName={CITY_NAME_MAP_RAW[city.cityKey]} lang={lang} countryKey="spain" onSelect={() => handleCitySelection(city.cityKey)} colorIdx={i+8} />)}
          </div>
        </section>
        <section className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t.sectionHidden}</h4>
          <div className="grid grid-cols-1 gap-3">
            {SPAIN_DATA.joyas.map((city, i) => <CityMiniCard key={city.cityKey} rawName={CITY_NAME_MAP_RAW[city.cityKey]} lang={lang} countryKey="spain" onSelect={() => handleCitySelection(city.cityKey)} colorIdx={i+12} />)}
          </div>
        </section>
      </div>
    </div>
  );
};
