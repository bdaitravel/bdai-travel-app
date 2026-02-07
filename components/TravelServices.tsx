
import React, { useState } from 'react';

const UI_LABELS: Record<string, any> = {
    es: { 
        hubTitle: "Intel Global", hubSub: "Galería de Ciudades Globales", homeTitle: "Ciudades Top", homeSub: "Destinos Imprescindibles", villagesTitle: "Joyas Rurales", villagesSub: "Pueblos con Encanto", catVisited: "Iconos", catGrowth: "En Auge", catExotic: "Exóticos", loading: "Sincronizando...", defaultTheme: "Explorar",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Sevilla': 'Sevilla', 'Valencia': 'Valencia', 'Málaga': 'Málaga', 'Bilbao': 'Bilbao', 'París': 'París', 'Tokio': 'Tokio', 'Nueva York': 'Nueva York', 'Roma': 'Roma', 'Londres': 'Londres', 'El Cairo': 'El Cairo', 'Estambul': 'Estambul', 'Kioto': 'Kioto' },
        themes: { 'Madrid': 'Capital Histórica', 'Barcelona': 'Modernismo Vivo', 'Sevilla': 'Esencia Mudéjar', 'Valencia': 'Ciudad de las Artes', 'Málaga': 'Costa de Picasso', 'Bilbao': 'Alma de Titanio', 'París': 'La Ciudad de la Luz', 'Tokio': 'Cyberpunk Real', 'Nueva York': 'Centro del Mundo', 'Roma': 'La Ciudad Eterna', 'Londres': 'Legado Imperial', 'El Cairo': 'Misterio Faraónico', 'Estambul': 'Puente de Imperios', 'Kioto': 'Tradición Zen' }
    },
    en: { 
        hubTitle: "Global Intel", hubSub: "Global Cities Gallery", homeTitle: "Top Cities", homeSub: "Must-Visit Destinations", villagesTitle: "Rural Gems", villagesSub: "Charming Villages", catVisited: "Icons", catGrowth: "Rising Stars", catExotic: "Exotics", loading: "Syncing...", defaultTheme: "Explore",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Sevilla': 'Seville', 'Valencia': 'Valencia', 'Málaga': 'Malaga', 'Bilbao': 'Bilbao', 'París': 'Paris', 'Tokio': 'Tokyo', 'Nueva York': 'New York', 'Roma': 'Rome', 'Londres': 'London', 'El Cairo': 'Cairo', 'Estambul': 'Istanbul', 'Kioto': 'Kyoto' },
        themes: { 'Madrid': 'Historical Capital', 'Barcelona': 'Modernism', 'Sevilla': 'Mudejar Essence', 'Valencia': 'City of Arts', 'Málaga': 'Picasso\'s Coast', 'Bilbao': 'Titanium Soul', 'París': 'City of Light', 'Tokio': 'Cyberpunk Reality', 'Nueva York': 'World Center', 'Roma': 'The Eternal City', 'Londres': 'Imperial Legacy', 'El Cairo': 'Pharaonic Mystery', 'Estambul': 'Empire Bridge', 'Kioto': 'Zen Tradition' }
    },
    zh: { 
        hubTitle: "全球情报", hubSub: "全球城市画廊", homeTitle: "热门城市", homeSub: "必游目的地", villagesTitle: "乡村名胜", villagesSub: "魅力小镇", catVisited: "经典图标", catGrowth: "新兴之星", catExotic: "异域风情", loading: "同步中...",
        cityNames: { 'Madrid': '马德里', 'Barcelona': '巴塞罗那', 'Sevilla': '塞维利亚', 'Valencia': '瓦伦西亚', 'Málaga': '马拉加', 'Bilbao': '毕尔巴鄂', 'París': '巴黎', 'Tokio': '东京', 'Nueva York': '纽约', 'Roma': '罗马', 'Londres': '伦敦', 'El Cairo': '开罗', 'Estambul': '伊斯坦布尔', 'Kioto': '京都' },
        themes: { 'Madrid': '历史之都', 'Barcelona': '现代主义', 'Sevilla': '穆德哈尔精髓', 'Valencia': '艺术之城', 'Málaga': '毕加索海岸', 'Bilbao': '钛合金之魂', 'París': '光明之城', 'Tokio': '赛博朋克现实', 'Nueva York': '世界中心', 'Roma': '永恒之城', 'Londres': '帝国遗产', 'El Cairo': '法老之谜', 'Estambul': '帝国之桥', 'Kioto': '禅宗传统' }
    },
    pt: { 
        hubTitle: "Intel Global", hubSub: "Galeria de Cidades Globais", homeTitle: "Cidades Top", homeSub: "Destinos Imperdíveis", villagesTitle: "Joias Rurais", villagesSub: "Vilas Charmosas", catVisited: "Ícones", catGrowth: "Em Ascensão", catExotic: "Exóticos", loading: "Sincronizando...",
        cityNames: { 'Madrid': 'Madri', 'Barcelona': 'Barcelona', 'Sevilla': 'Sevilha', 'Valencia': 'Valência', 'Málaga': 'Málaga', 'Bilbao': 'Bilbao', 'París': 'Paris', 'Tokio': 'Tóquio', 'Nueva York': 'Nova York', 'Roma': 'Roma', 'Londres': 'Londres', 'El Cairo': 'Cairo', 'Estambul': 'Istambul', 'Kioto': 'Quioto' },
        themes: { 'Madrid': 'Capital Histórica', 'Barcelona': 'Modernismo Vivo', 'Sevilla': 'Essência Mudéjar', 'Valencia': 'Cidade das Artes', 'Málaga': 'Costa de Picasso', 'Bilbao': 'Alma de Titânio', 'París': 'Cidade da Luz', 'Tokio': 'Cyberpunk Real', 'Nueva York': 'Centro do Mundo', 'Roma': 'Cidade Eterna', 'Londres': 'Legado Imperial', 'El Cairo': 'Mistério Faraônico', 'Estambul': 'Ponte de Impérios', 'Kioto': 'Tradição Zen' }
    },
    fr: { 
        hubTitle: "Intel Global", hubSub: "Galerie des Villes Globales", homeTitle: "Villes Top", homeSub: "Destinations Incontournables", villagesTitle: "Joyaux Ruraux", villagesSub: "Villages de Charme", catVisited: "Icônes", catGrowth: "En Essor", catExotic: "Exotiques", loading: "Synchronisation...",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcelone', 'Sevilla': 'Séville', 'Valencia': 'Valence', 'Málaga': 'Malaga', 'Bilbao': 'Bilbao', 'París': 'Paris', 'Tokio': 'Tokyo', 'Nueva York': 'New York', 'Roma': 'Rome', 'Londres': 'Londres', 'El Cairo': 'Le Caire', 'Estambul': 'Istanbul', 'Kioto': 'Kyoto' },
        themes: { 'Madrid': 'Capitale Historique', 'Barcelona': 'Modernisme Vivant', 'Sevilla': 'Essence Mudéjar', 'Valencia': 'Cité des Arts', 'Málaga': 'Côte de Picasso', 'Bilbao': 'Âme de Titane', 'París': 'Ville Lumière', 'Tokio': 'Réalité Cyberpunk', 'Nueva York': 'Centre du Monde', 'Roma': 'Ville Éternelle', 'Londres': 'Héritage Impérial', 'El Cairo': 'Mystère Pharaonique', 'Estambul': 'Pont des Empires', 'Kioto': 'Tradition Zen' }
    },
    de: { 
        hubTitle: "Globaler Intel", hubSub: "Globale Städtegalerie", homeTitle: "Top-Städte", homeSub: "Muss-Ziele", villagesTitle: "Ländliche Juwelen", villagesSub: "Charmante Dörfer", catVisited: "Ikonen", catGrowth: "Aufsteiger", catExotic: "Exotik", loading: "Synchronisierung...",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Sevilla': 'Sevilla', 'Valencia': 'Valencia', 'Málaga': 'Málaga', 'Bilbao': 'Bilbao', 'París': 'Paris', 'Tokio': 'Tokio', 'Nueva York': 'New York', 'Roma': 'Rom', 'Londres': 'London', 'El Cairo': 'Kairo', 'Estambul': 'Istanbul', 'Kioto': 'Kyoto' },
        themes: { 'Madrid': 'Historische Hauptstadt', 'Barcelona': 'Lebendiger Modernismus', 'Sevilla': 'Mudéjar-Essenz', 'Valencia': 'Stadt der Künste', 'Málaga': 'Picassos Küste', 'Bilbao': 'Titan-Seele', 'París': 'Stadt der Lichter', 'Tokio': 'Cyberpunk-Realität', 'Nueva York': 'Weltzentrum', 'Roma': 'Ewige Stadt', 'Londres': 'Imperiales Erbe', 'El Cairo': 'Pharaonisches Geheimnis', 'Estambul': 'Brücke der Imperien', 'Kioto': 'Zen-Tradition' }
    },
    it: { 
        hubTitle: "Intel Globale", hubSub: "Galleria Città Globali", homeTitle: "Città Top", homeSub: "Destinazioni Imperdibili", villagesTitle: "Gioielli Rurali", villagesSub: "Borghi Incantevoli", catVisited: "Icone", catGrowth: "In Ascesa", catExotic: "Esotiche", loading: "Sincronizzazione...",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcellona', 'Sevilla': 'Siviglia', 'Valencia': 'Valencia', 'Málaga': 'Malaga', 'Bilbao': 'Bilbao', 'París': 'Parigi', 'Tokio': 'Tokyo', 'Nueva York': 'New York', 'Roma': 'Roma', 'Londres': 'Londra', 'El Cairo': 'Il Cairo', 'Estambul': 'Istanbul', 'Kioto': 'Kyoto' },
        themes: { 'Madrid': 'Capitale Storica', 'Barcelona': 'Modernismo Vivo', 'Sevilla': 'Essenza Mudéjar', 'Valencia': 'Città delle Arti', 'Málaga': 'Costa di Picasso', 'Bilbao': 'Anima di Titanio', 'París': 'Città della Luce', 'Tokio': 'Realtà Cyberpunk', 'Nueva York': 'Centro del Mondo', 'Roma': 'Città Eterna', 'Londres': 'Eredità Imperiale', 'El Cairo': 'Mistero Faraonico', 'Estambul': 'Ponte degli Imperi', 'Kioto': 'Tradizione Zen' }
    },
    ja: { 
        hubTitle: "グローバルインテル", hubSub: "グローバルシティギャラリー", homeTitle: "主要都市", homeSub: "必見の目的地", villagesTitle: "田舎の宝石", villagesSub: "魅力的な村", catVisited: "アイコン", catGrowth: "新興スター", catExotic: "エキゾチック", loading: "同期中...",
        cityNames: { 'Madrid': 'マドリード', 'Barcelona': 'バルセロナ', 'Sevilla': 'セビリア', 'Valencia': 'バレンシア', 'Málaga': 'マラガ', 'Bilbao': 'ビルバオ', 'París': 'パリ', 'Tokio': '東京', 'Nueva York': 'ニューヨーク', 'Roma': 'ローマ', 'Londres': 'ロンドン', 'El Cairo': 'カイロ', 'Estambul': 'イスタンブール', 'Kioto': '京都' },
        themes: { 'Madrid': '歴史の都', 'Barcelona': 'モダニズム', 'Sevilla': 'ムデハルの本質', 'Valencia': '芸術の街', 'Málaga': 'ピカソの海岸', 'Bilbao': 'チタンの魂', 'París': '花の都', 'Tokio': 'サイバーパンクな現実', 'Nueva York': '世界の中心', 'Roma': '永遠の都', 'Londres': '帝국의遺産', 'El Cairo': 'ファラオの神秘', 'Estambul': '帝国の架け橋', 'Kioto': '禅の伝統' }
    },
    ar: { 
        hubTitle: "استخبارات عالمية", hubSub: "معرض المدن العالمية", homeTitle: "أهم المدن", homeSub: "وجهات لا بد من زيارتها", villagesTitle: "جواهر ريفية", villagesSub: "قرى ساحرة", catVisited: "أيقونات", catGrowth: "نجوم صاعدة", catExotic: "عجائب", loading: "مزامنة...",
        cityNames: { 'Madrid': 'مدريد', 'Barcelona': 'برشلونة', 'Sevilla': 'إشبيلية', 'Valencia': 'فالنسيا', 'Málaga': 'مالقة', 'Bilbao': 'بلباو', 'París': 'باريس', 'Tokio': 'طوكيو', 'Nueva York': 'نيويورك', 'Roma': 'روما', 'Londres': 'لندن', 'El Cairo': 'القاهرة', 'Estambul': 'إسطنبول', 'Kioto': 'كيوتو' },
        themes: { 'Madrid': 'عاصمة تاريخية', 'Barcelona': 'الحداثة الحية', 'Sevilla': 'جوهر الموديجار', 'Valencia': 'مدينة الفنون', 'Málaga': 'ساحل بيكاسو', 'Bilbao': 'روح التيتانيوم', 'París': 'مدينة النور', 'Tokio': 'واقع السايبربانك', 'Nueva York': 'مركز العالم', 'Roma': 'المدينة الخالدة', 'Londres': 'الإرث الإمبراطوري', 'El Cairo': 'لغز فرعوني', 'Estambul': 'جسر الإمبراطوريات', 'Kioto': 'تقاليد الزن' }
    },
    ru: {
        hubTitle: "Глобальная разведка", hubSub: "Галерея городов мира", homeTitle: "Топ городов", homeSub: "Обязательно к посещению", villagesTitle: "Сельские жемчужины", villagesSub: "Очаровательные деревни", catVisited: "Иконы", catGrowth: "На подъеме", catExotic: "Экзотика", loading: "Синхронизация...",
        cityNames: { 'Madrid': 'Мадрид', 'Barcelona': 'Барселона', 'Sevilla': 'Севилья', 'Valencia': 'Валенсия', 'Málaga': 'Малага', 'Bilbao': 'Бильбао', 'París': 'Париж', 'Tokio': 'Токио', 'Nueva York': 'Нью-Йорк', 'Roma': 'Рим', 'Londres': 'Лондон', 'El Cairo': 'Каир', 'Estambul': 'Стамбул', 'Kioto': 'Киото' },
        themes: { 'Madrid': 'Историческая столица', 'Barcelona': 'Живой модернизм', 'Sevilla': 'Суть мудехара', 'Valencia': 'Город искусств', 'Málaga': 'Берег Пикассо', 'Bilbao': 'Титановая душа', 'París': 'Город света', 'Tokio': 'Киберпанк-реальность', 'Nueva York': 'Центр мира', 'Roma': 'Вечный город', 'Londres': 'Имперское наследие', 'El Cairo': 'Тайны фараонов', 'Estambul': 'Мост империй', 'Kioto': 'Дзен-традиция' }
    },
    hi: {
        hubTitle: "वैश्विक इंटेलिजेंस", hubSub: "वैश्विक शहर गैलरी", homeTitle: "शीर्ष शहर", homeSub: "देखने लायक स्थान", villagesTitle: "ग्रामीण रत्न", villagesSub: "आकर्षक गाँव", catVisited: "प्रतीक", catGrowth: "उभरते सितारे", catExotic: "विदेशी", loading: "सिंक हो रहा है...",
        cityNames: { 'Madrid': 'मैड्रिड', 'Barcelona': 'बार्सिलोना', 'Sevilla': 'सेविल', 'Valencia': 'वेलेंसिया', 'Málaga': 'मलागा', 'Bilbao': 'बिल्बाओ', 'París': 'पेरिस', 'Tokio': 'टोक्यो', 'Nueva York': 'न्यूयॉर्क', 'Roma': 'रोम', 'Londres': 'लंदन', 'El Cairo': 'काहिरा', 'Estambul': 'इस्तांबुल', 'Kioto': 'क्योटो' },
        themes: { 'Madrid': 'ऐतिहासिक राजधानी', 'Barcelona': 'आधुनिकतावाद', 'Sevilla': 'मुदेजर सार', 'Valencia': 'कला का शहर', 'Málaga': 'पिकासो का तट', 'Bilbao': 'टाइटेनियम आत्मा', 'París': 'रोशनी का शहर', 'Tokio': 'साइबरपंक वास्तविकता', 'Nueva York': 'विश्व केंद्र', 'Roma': 'शाश्वत शहर', 'Londres': 'शाही विरासत', 'El Cairo': 'फिरौन का रहस्य', 'Estambul': 'साम्राज्यों का पुल', 'Kioto': 'ज़ेन परंपरा' }
    },
    ko: {
        hubTitle: "글로벌 인텔", hubSub: "글로벌 도시 갤러리", homeTitle: "주요 도시", homeSub: "필수 방문지", villagesTitle: "전원 보석", villagesSub: "매력적인 마을", catVisited: "아이콘", catGrowth: "떠오르는 별", catExotic: "이색 지역", loading: "동기화 중...",
        cityNames: { 'Madrid': '마드리드', 'Barcelona': '바르셀로나', 'Sevilla': '세비야', 'Valencia': '발렌시아', 'Málaga': '말라가', 'Bilbao': '빌바오', 'París': '파리', 'Tokio': '도쿄', 'Nueva York': '뉴욕', 'Roma': '로마', 'Londres': '런던', 'El Cairo': '카이로', 'Estambul': '이스탄불', 'Kioto': '교토' },
        themes: { 'Madrid': '역사적 수도', 'Barcelona': '모더니즘', 'Sevilla': '무데하르 정수', 'Valencia': '예술의 도시', 'Málaga': '피카소의 해변', 'Bilbao': '티타늄 영혼', 'París': '빛의 도시', 'Tokio': '사이버펑크 현실', 'Nueva York': '세계의 중심', 'Roma': '영원한 도시', 'Londres': '제국의 유산', 'El Cairo': '파라오의 신비', 'Estambul': '제국의 다리', 'Kioto': '젠 전통' }
    },
    tr: {
        hubTitle: "Küresel İstihbarat", hubSub: "Küresel Şehirler Galerisi", homeTitle: "En İyi Şehirler", homeSub: "Mutlaka Görülmesi Gerekenler", villagesTitle: "Kırsal Mücevherler", villagesSub: "Büyüleyici Köyler", catVisited: "İkonlar", catGrowth: "Yükselenler", catExotic: "Egzotik", loading: "Senkronize ediliyor...",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barselona', 'Sevilla': 'Sevilla', 'Valencia': 'Valensiya', 'Málaga': 'Malaga', 'Bilbao': 'Bilbao', 'París': 'Paris', 'Tokio': 'Tokyo', 'Nueva York': 'New York', 'Roma': 'Roma', 'Londres': 'Londra', 'El Cairo': 'Kahire', 'Estambul': 'İstanbul', 'Kioto': 'Kyoto' },
        themes: { 'Madrid': 'Tarihi Başkent', 'Barcelona': 'Modernizm', 'Sevilla': 'Mudejar Özü', 'Valencia': 'Sanat Şehri', 'Málaga': 'Picasso\'nun Kıyısı', 'Bilbao': 'Titanyum Ruhu', 'París': 'Işık Şehri', 'Tokio': 'Cyberpunk Gerçekliği', 'Nueva York': 'Dünyanın Merkezi', 'Roma': 'Ölümsüz Şehir', 'Londres': 'İmparatorluk Mirası', 'El Cairo': 'Firavun Gizemi', 'Estambul': 'İmparatorluklar Köprüsü', 'Kioto': 'Zen Geleneği' }
    },
    ca: { 
        hubTitle: "Intel Global", hubSub: "Galeria de Ciutats Globals", homeTitle: "Ciutats Top", homeSub: "Destins Imprescindibles", villagesTitle: "Escapades amb Encant", villagesSub: "Joies Tradicionals", catVisited: "Icones", catGrowth: "En Auge", catExotic: "Exòtics", loading: "Sincronitzant...", defaultTheme: "Explorar",
        cityNames: { 'Madrid': 'Madrid', 'Barcelona': 'Barcelona', 'Sevilla': 'Sevilla', 'Valencia': 'València', 'Málaga': 'Màlaga', 'Bilbao': 'Bilbao', 'París': 'París', 'Tokio': 'Tòquio', 'Nueva York': 'Nova York', 'Roma': 'Roma', 'Londres': 'Londres', 'El Cairo': 'El Caire', 'Estambul': 'Istanbul', 'Kioto': 'Kyoto' },
        themes: { 'Madrid': 'Capital Històrica', 'Barcelona': 'Modernisme Viu', 'Sevilla': 'Essència Mudèjar', 'Valencia': 'Ciutat de les Arts', 'Málaga': 'Costa de Picasso', 'Bilbao': 'Ànima de Titani', 'París': 'La Ciutat de la Llum', 'Tokio': 'Cyberpunk Real', 'Nueva York': 'Centre del Món', 'Roma': 'La Ciutat Eterna', 'Londres': 'Llegat Imperial', 'El Cairo': 'Misteri Faraònic', 'Estambul': 'Pont d\'Imperis', 'Kioto': 'Tradició Zen' }
    },
    eu: { 
        hubTitle: "Intel Globala", hubSub: "Hiri Globalen Galeria", homeTitle: "Hiri Onenak", homeSub: "Ezinbesteko Helmugak", villagesTitle: "Xarma duten Ihesaldiak", villagesSub: "Bitxi Tradizionalak", catVisited: "Ikonoak", catGrowth: "Goraka", catExotic: "Exotikoak", loading: "Sinkronizatzen...", defaultTheme: "Esploratu",
        cityNames: { 'Madrid': 'Madril', 'Barcelona': 'Bartzelona', 'Sevilla': 'Sevilla', 'Valencia': 'Valentzia', 'Málaga': 'Malaga', 'Bilbao': 'Bilbo', 'París': 'Paris', 'Tokio': 'Tokio', 'Nueva York': 'New York', 'Roma': 'Erroma', 'Londres': 'Londres', 'El Cairo': 'Kairo', 'Estambul': 'Istanbul', 'Kioto': 'Kioto' },
        themes: { 'Madrid': 'Hiriburu Historikoa', 'Barcelona': 'Modernismo Bizia', 'Sevilla': 'Mudejar Esentzia', 'Valencia': 'Arteen Hiria', 'Málaga': 'Picassoren Kosta', 'Bilbao': 'Titaniozko Arima', 'París': 'Argiaren Hiria', 'Tokio': 'Cyberpunk Errealitatea', 'Nueva York': 'Munduko Zentroa', 'Roma': 'Hiri Betierekoa', 'Londres': 'Inperioaren Ondarea', 'El Cairo': 'Misterio Faraonikoa', 'Estambul': 'Inperioen Zubia', 'Kioto': 'Zen Tradizioa' }
    }
};

const SPAIN_CITIES = [
    { name: 'Madrid', color: 'from-orange-600 to-slate-900', icon: 'fa-building-columns' },
    { name: 'Barcelona', color: 'from-blue-700 to-slate-950', icon: 'fa-church' },
    { name: 'Sevilla', color: 'from-amber-600 to-stone-900', icon: 'fa-fan' },
    { name: 'Valencia', color: 'from-cyan-500 to-slate-900', icon: 'fa-flask' },
    { name: 'Málaga', color: 'from-rose-500 to-slate-950', icon: 'fa-palette' },
    { name: 'Bilbao', color: 'from-gray-600 to-slate-900', icon: 'fa-industry' }
];

const SPAIN_VILLAGES = [
    { name: 'Albarracín', color: 'from-red-800 to-stone-900', icon: 'fa-fort-awesome' },
    { name: 'Cudillero', color: 'from-cyan-700 to-slate-900', icon: 'fa-anchor' },
    { name: 'Ronda', color: 'from-emerald-700 to-slate-900', icon: 'fa-bridge' },
    { name: 'Laguardia', color: 'from-purple-800 to-slate-950', icon: 'fa-wine-glass' },
    { name: 'Trujillo', color: 'from-amber-700 to-slate-900', icon: 'fa-horse' },
    { name: 'Valldemossa', color: 'from-green-800 to-slate-950', icon: 'fa-tree' },
    { name: 'Besalú', color: 'from-stone-600 to-slate-950', icon: 'fa-chess-rook' },
    { name: 'Frigiliana', color: 'from-blue-400 to-slate-900', icon: 'fa-house-chimney-window' },
    { name: 'Aínsa', color: 'from-orange-800 to-slate-950', icon: 'fa-mountain' },
    { name: 'Morella', color: 'from-gray-700 to-slate-900', icon: 'fa-chess-castle' },
    { name: 'Guadalupe', color: 'from-yellow-700 to-slate-950', icon: 'fa-place-of-worship' },
    { name: 'Alquézar', color: 'from-amber-800 to-slate-900', icon: 'fa-water' }
];

const HUB_CATEGORIES: any = {
    visited: [
        { name: 'París', color: 'from-blue-600 to-slate-900', icon: 'fa-tower-eiffel' },
        { name: 'Tokio', color: 'from-fuchsia-700 to-slate-950', icon: 'fa-torii-gate' },
        { name: 'Nueva York', color: 'from-slate-700 to-black', icon: 'fa-city' },
        { name: 'Roma', color: 'from-orange-700 to-slate-950', icon: 'fa-landmark' },
        { name: 'Londres', color: 'from-red-700 to-slate-900', icon: 'fa-clock' },
        { name: 'El Cairo', color: 'from-yellow-700 to-slate-950', icon: 'fa-pyramids' },
        { name: 'Estambul', color: 'from-indigo-600 to-slate-900', icon: 'fa-mosque' },
        { name: 'Kioto', color: 'from-rose-600 to-slate-950', icon: 'fa-pagelines' }
    ],
    growth: [
        { name: 'Tiflis', color: 'from-rose-700 to-stone-900', icon: 'fa-mountain-city' },
        { name: 'Medellín', color: 'from-green-700 to-slate-900', icon: 'fa-leaf' },
        { name: 'Luang Prabang', color: 'from-orange-600 to-stone-950', icon: 'fa-dharmachakra' },
        { name: 'Gjirokastër', color: 'from-slate-600 to-slate-950', icon: 'fa-gem' },
        { name: 'Samarcanda', color: 'from-blue-800 to-slate-900', icon: 'fa-archway' },
        { name: 'Da Nang', color: 'from-teal-600 to-slate-950', icon: 'fa-bridge-water' },
        { name: 'Ciudad de México', color: 'from-amber-800 to-slate-950', icon: 'fa-skull' },
        { name: 'Ho Chi Minh', color: 'from-red-700 to-slate-900', icon: 'fa-bolt' }
    ],
    exotic: [
        { name: 'Chefchaouen', color: 'from-blue-500 to-slate-950', icon: 'fa-mosque' },
        { name: 'Leh', color: 'from-amber-800 to-stone-950', icon: 'fa-om' },
        { name: 'Bukhara', color: 'from-yellow-600 to-stone-900', icon: 'fa-scroll' },
        { name: 'Kotor', color: 'from-teal-700 to-slate-950', icon: 'fa-ship' },
        { name: 'Yazd', color: 'from-orange-900 to-stone-950', icon: 'fa-wind' },
        { name: 'Socotra', color: 'from-green-900 to-slate-950', icon: 'fa-sprout' },
        { name: 'Lalibela', color: 'from-red-900 to-stone-950', icon: 'fa-cross' },
        { name: 'Siwa', color: 'from-yellow-800 to-slate-950', icon: 'fa-sun' }
    ]
};

const CityItem: React.FC<{ city: any, onSelect: (name: string) => void, language: string, small?: boolean }> = ({ city, onSelect, language, small }) => {
    const l = UI_LABELS[language] || UI_LABELS.es;
    const translatedTheme = l.themes?.[city.name] || city.theme || l.defaultTheme || 'Explore';
    const translatedName = l.cityNames?.[city.name] || city.name;
    
    return (
        <div 
            onClick={() => onSelect(city.name)} 
            className={`${small ? 'h-32' : 'h-36'} bg-slate-900 border border-white/5 rounded-[2rem] overflow-hidden relative group cursor-pointer shadow-xl transition-all hover:scale-[1.02] active:scale-95`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${city.color} opacity-30 group-hover:opacity-50 transition-opacity`}></div>
            <div className="absolute top-4 right-6 text-white/5 text-5xl group-hover:rotate-6 transition-transform">
                <i className={`fas ${city.icon}`}></i>
            </div>
            <div className="absolute bottom-5 left-6 right-6">
                <p className="text-[6px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1 opacity-80">{translatedTheme}</p>
                <h4 className="font-black text-white text-xl tracking-tighter uppercase leading-none truncate">{translatedName}</h4>
            </div>
        </div>
    );
};

export const TravelServices: React.FC<any> = ({ mode, language = 'es', onCitySelect }) => {
    const l = UI_LABELS[language] || UI_LABELS.es;
    const [activeHubCat, setActiveHubCat] = useState<'visited' | 'growth' | 'exotic'>('visited');
    
    if (mode === 'HUB') {
        return (
            <div className="space-y-6 pb-40 animate-fade-in">
                <header>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{l.hubTitle}</h3>
                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.3em] mt-1">{l.hubSub}</p>
                </header>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {(['visited', 'growth', 'exotic'] as const).map(cat => (
                        <button key={cat} onClick={() => setActiveHubCat(cat)} className={`px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeHubCat === cat ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 border-white/5 text-white/40'}`}>
                            {cat === 'visited' ? l.catVisited : (cat === 'growth' ? l.catGrowth : l.catExotic)}
                        </button>
                    ))}
                </div>
                <section className="grid grid-cols-2 gap-3">
                    {HUB_CATEGORIES[activeHubCat].map((city: any) => (
                        <CityItem key={city.name} city={city} onSelect={onCitySelect} language={language} small />
                    ))}
                </section>
            </div>
        );
    }
    return (
        <div className="space-y-10 pb-32 animate-fade-in">
            <div className="space-y-4">
                <header>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{l.homeTitle}</h3>
                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.3em] mt-1">{l.homeSub}</p>
                </header>
                <section className="grid grid-cols-2 gap-3">
                    {SPAIN_CITIES.map(city => (
                        <CityItem key={city.name} city={city} onSelect={onCitySelect} language={language} small />
                    ))}
                </section>
            </div>
            <div className="space-y-4">
                <header>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{l.villagesTitle}</h3>
                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.3em] mt-1">{l.villagesSub}</p>
                </header>
                <section className="grid grid-cols-2 gap-3">
                    {SPAIN_VILLAGES.map(village => (
                        <CityItem key={village.name} city={village} onSelect={onCitySelect} language={language} small />
                    ))}
                </section>
            </div>
        </div>
    );
};
