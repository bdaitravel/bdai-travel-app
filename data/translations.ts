export const cityLookup: Record<string, Record<string, string>> = {
  "Vienna": { es: "Viena", fr: "Vienne", it: "Vienna", de: "Wien", zh: "维也纳", hi: "वियना", ro: "Viena", ja: "ウィーン", pt: "Viena", ru: "Вена" },
  "Prague": { es: "Praga", fr: "Prague", it: "Praga", de: "Prag", zh: "布拉格", hi: "प्राग", ro: "Praga", ja: "プラハ", pt: "Praga", ru: "Прага" },
  "Athens": { es: "Atenas", fr: "Athènes", it: "Atene", de: "Athen", zh: "雅典", hi: "एथेंस", ro: "Atena", ja: "アテネ", pt: "Atenas", ru: "Афины" },
  "London": { es: "Londres", fr: "Londres", it: "Londra", de: "London", zh: "伦敦", hi: "लंदन", ro: "Londra", ja: "ロンドン", pt: "Londres", ru: "Лондон" },
  "Rome": { es: "Roma", fr: "Rome", it: "Roma", de: "Rom", zh: "罗马", hi: "रोम", ro: "Roma", ja: "ローマ", pt: "Roma", ru: "Рим" },
  "Lisbon": { es: "Lisboa", pt: "Lisboa", zh: "里斯本", hi: "लिस्बन", ro: "Lisabona", it: "Lisbona", fr: "Lisbonne", de: "Lissabon", ru: "Лиссабон" },
  "Seville": { es: "Sevilla", en: "Seville", fr: "Séville", it: "Siviglia", de: "Sevilla", pt: "Sevilha", zh: "塞维利亚", ja: "セビリア" },
  "Madrid": { es: "Madrid", zh: "马德里", hi: "मैड्रिड", ja: "マドリード", ru: "Мадрид", ar: "مدريد" },
  "Barcelona": { es: "Barcelona", zh: "巴塞罗那", hi: "बार्सिलोना", ja: "バルセロナ", ru: "Барселона", ar: "برشلونة" },
  "Paris": { es: "París", fr: "Paris", it: "Parigi", de: "Paris", zh: "巴黎", hi: "पेरिस", ja: "パリ", ru: "Париж" },
  "Berlin": { es: "Berlín", zh: "柏林", hi: "बर्लिन", ru: "Берлин", ja: "ベルリン" },
  "Amsterdam": { es: "Ámsterdam", zh: "阿姆斯特丹", hi: "एम्स्टर्डम", ru: "Амстердам", ja: "アムステルダム" }
};

export const translations: Record<string, any> = {
  en: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "your@email.com", 
    requestAccess: "REQUEST CODE", verifyCode: "VERIFY CODE", enterCode: "Enter 8-digit code", 
    searchPlaceholder: "search city...", generating: "MINTING VISA...", ready: "⚡ READY",
    navElite: "elite", navHub: "intel", navVisa: "passport", navStore: "store",
    sectionPopular: "TOP DESTINATIONS", sectionVillages: "CHARMING VILLAGES", sectionHidden: "HIDDEN SECRETS", countryName: "Spain",
    back: "BACK", discoverTitle: "DISCOVER THE SOUL OF", expertGuide: "BECOME A LOCAL EXPERT",
    socialAccess: "SOCIAL ACCESS"
  },
  es: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "tu@email.com", 
    requestAccess: "SOLICITAR CÓDIGO", verifyCode: "VERIFICAR", enterCode: "Introduce código 8 dígitos", 
    searchPlaceholder: "busca ciudad...", generating: "GENERANDO VISA...", ready: "⚡ LISTO",
    navElite: "élite", navHub: "intel", navVisa: "pasaporte", navStore: "tienda",
    sectionPopular: "DESTINOS TOP", sectionVillages: "PUEBLOS CON ENCANTO", sectionHidden: "SECRETOS OCULTOS", countryName: "España",
    back: "ATRÁS", discoverTitle: "DESCUBRE EL ALMA DE", expertGuide: "SÉ UN EXPERTO LOCAL",
    socialAccess: "ACCESO SOCIAL"
  },
  fr: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "votre@email.com", 
    requestAccess: "DEMANDER CODE", verifyCode: "VÉRIFIER", enterCode: "Entrez le code à 8 chiffres", 
    searchPlaceholder: "chercher ville...", generating: "CRÉATION VISA...", ready: "⚡ PRÊT",
    navElite: "élite", navHub: "intel", navVisa: "passeport", navStore: "boutique",
    sectionPopular: "DESTINATIONS TOP", sectionVillages: "VILLAGES DE CHARME", sectionHidden: "SECRETS CACHÉS", countryName: "Espagne",
    back: "RETOUR", discoverTitle: "DÉCOUVREZ L'ÂME DE", expertGuide: "DEVENEZ UN EXPERT LOCAL",
    socialAccess: "ACCÈS SOCIAL"
  },
  de: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "deine@email.com", 
    requestAccess: "CODE ANFORDERN", verifyCode: "BESTÄTIGEN", enterCode: "8-stelligen Code eingeben", 
    searchPlaceholder: "stadt suchen...", generating: "VISA ERSTELLEN...", ready: "⚡ BEREIT",
    navElite: "elite", navHub: "intel", navVisa: "pass", navStore: "laden",
    sectionPopular: "TOP ZIELE", sectionVillages: "CHARMANTE DÖRFER", sectionHidden: "VERBORGENE GEHEIMNISSE", countryName: "Spanien",
    back: "ZURÜCK", discoverTitle: "ENTDECKE DIE SEELE VON", expertGuide: "WERDEN SIE LOKALER EXPERTE",
    socialAccess: "SOZIALER ZUGANG"
  },
  it: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "tua@email.com", 
    requestAccess: "RICHIEDI CODICE", verifyCode: "VERIFICA", enterCode: "Inserisci codice 8 cifre", 
    searchPlaceholder: "cerca città...", generating: "CREAZIONE VISA...", ready: "⚡ PRONTO",
    navElite: "élite", navHub: "intel", navVisa: "passaporto", navStore: "negozio",
    sectionPopular: "DESTINAZIONI TOP", sectionVillages: "BORGHI INCANTEVOLI", sectionHidden: "SEGRETI NASCOSTI", countryName: "Spagna",
    back: "INDIETRO", discoverTitle: "SCOPRI L'ANIMA DI", expertGuide: "DIVENTA UN ESPERTO LOCALE",
    socialAccess: "ACCESSO SOCIALE"
  },
  pt: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "seu@email.com", 
    requestAccess: "PEDIR CÓDIGO", verifyCode: "VERIFICAR", enterCode: "Digite o código de 8 dígitos", 
    searchPlaceholder: "buscar cidade...", generating: "CRIANDO VISA...", ready: "⚡ PRONTO",
    navElite: "elite", navHub: "intel", navVisa: "passaporte", navStore: "loja",
    sectionPopular: "PRINCIPAIS DESTINOS", sectionVillages: "VILAS CHARMOSAS", sectionHidden: "SEGREDOS ESCONDIDOS", countryName: "Espanha",
    back: "VOLTAR", discoverTitle: "DESCUBRA A ALMA DA", expertGuide: "TORNE-SE UM ESPECIALISTA LOCAL",
    socialAccess: "ACESSO SOCIAL"
  },
  nl: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "uw@email.com", 
    requestAccess: "CODE AANVRAGEN", verifyCode: "VERIFIËREN", enterCode: "Voer 8-cijferige code in", 
    searchPlaceholder: "zoek stad...", generating: "VISA MAKEN...", ready: "⚡ KLAAR",
    navElite: "elite", navHub: "intel", navVisa: "paspoort", navStore: "winkel",
    sectionPopular: "TOPBESTEMMINGEN", sectionVillages: "CHARMANTE DORPEN", sectionHidden: "VERBORGEN GEHEIMEN", countryName: "Spanje",
    back: "TERUG", discoverTitle: "ONTDEK DE ZIEL VAN", expertGuide: "WORD EEN LOKALE EXPERT",
    socialAccess: "SOCIALE TOEGANG"
  },
  ro: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "email@tau.com", 
    requestAccess: "SOLICITĂ COD", verifyCode: "VERIFICĂ", enterCode: "Cod 8 cifre", 
    searchPlaceholder: "caută oraș...", generating: "GENERARE VISA...", ready: "⚡ GATA",
    navElite: "elită", navHub: "intel", navVisa: "pașaport", navStore: "magazin",
    sectionPopular: "DESTINAȚII TOP", sectionVillages: "SATE FERMECĂTOARE", sectionHidden: "SECRETE ASCUNSE", countryName: "Spania",
    back: "ÎNAPOI", discoverTitle: "DESCOPERĂ SUFLETUL", expertGuide: "DEVENIȚI UN EXPERT LOCAL",
    socialAccess: "ACCES SOCIAL"
  },
  pl: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "twoj@email.com", 
    requestAccess: "POPROŚ O KOD", verifyCode: "WERYFIKUJ", enterCode: "Wpisz 8-cyfrowy kod", 
    searchPlaceholder: "szukaj miasta...", generating: "TWORZENIE WIZY...", ready: "⚡ GOTOWE",
    navElite: "elita", navHub: "intel", navVisa: "paszport", navStore: "sklep",
    sectionPopular: "TOP MIEJSCA", sectionVillages: "UROKLIWE WIOSKI", sectionHidden: "UKRYTE TAJEMNICE", countryName: "Hiszpania",
    back: "WSTECZ", discoverTitle: "ODKRYJ DUSZĘ", expertGuide: "ZOSTAŃ LOKALNYM EKSPERTEM",
    socialAccess: "DOSTĘP SPOŁECZNY"
  },
  sv: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "din@email.com", 
    requestAccess: "BEGÄR KOD", verifyCode: "VERIFIERA", enterCode: "Ange 8-siffrig kod", 
    searchPlaceholder: "sök stad...", generating: "SKAPAR VISA...", ready: "⚡ KLAR",
    navElite: "elit", navHub: "intel", navVisa: "pass", navStore: "butik",
    sectionPopular: "TOPPDESTINATIONER", sectionVillages: "CHARMIGA BYAR", sectionHidden: "DOLDA HEMLIGHETER", countryName: "Spanien",
    back: "TILLBAKA", discoverTitle: "UPPTÄCK SJÄLEN I", expertGuide: "BLI EN LOKAL EXPERT",
    socialAccess: "SOCIAL TILLGÅNG"
  },
  da: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "din@email.com", 
    requestAccess: "ANMOD OM KODE", verifyCode: "BEKRÆFT", enterCode: "Indtast 8-cifret kode", 
    searchPlaceholder: "søg by...", generating: "OPRETTER VISA...", ready: "⚡ KLAR",
    navElite: "elite", navHub: "intel", navVisa: "pas", navStore: "butik",
    sectionPopular: "TOPDESTINATIONER", sectionVillages: "CHARMERENDE BYER", sectionHidden: "SKJULTE HEMMELIGHEDER", countryName: "Spanien",
    back: "TILBAGE", discoverTitle: "OPDAG SJÆLEN I", expertGuide: "BLIV LOKAL EKSPERT",
    socialAccess: "SOCIAL ADGANG"
  },
  fi: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "sinun@email.com", 
    requestAccess: "PYYDÄ KOODI", verifyCode: "VAHVISTA", enterCode: "Syötä 8-numeroinen koodi", 
    searchPlaceholder: "etsi kaupunki...", generating: "LUODAAN VISA...", ready: "⚡ VALMIS",
    navElite: "eliitti", navHub: "intel", navVisa: "passi", navStore: "kauppa",
    sectionPopular: "SUOSITUIMMAT", sectionVillages: "VIEHÄTTÄVÄT KYLÄT", sectionHidden: "PIILOTETUT SALAISUUDET", countryName: "Espanja",
    back: "TAKAISIN", discoverTitle: "LÖYDÄ SIELU", expertGuide: "TULE PAIKALLISEKSI ASIANTUNTIJAKSI",
    socialAccess: "SOSIAALINEN PÄÄSY"
  },
  no: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "din@email.com", 
    requestAccess: "BE OM KODE", verifyCode: "BEKREFT", enterCode: "Skriv 8-siffrig kode", 
    searchPlaceholder: "søk by...", generating: "OPPRETTER VISA...", ready: "⚡ KLAR",
    navElite: "elite", navHub: "intel", navVisa: "pass", navStore: "butikk",
    sectionPopular: "TOPPDESTINASJONER", sectionVillages: "SJARMERENDE BYER", sectionHidden: "SKJULTE HEMMELIGHETER", countryName: "Spania",
    back: "TILBAKE", discoverTitle: "OPPDAG SJELEN I", expertGuide: "BLI EN LOKAL EXPERT",
    socialAccess: "SOSIAL TILGANG"
  },
  ru: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "vashe@email.com", 
    requestAccess: "ПОЛУЧИТЬ КОД", verifyCode: "ПРОВЕРИТЬ", enterCode: "Введите 8-значный код", 
    searchPlaceholder: "поиск города...", generating: "СОЗДАНИЕ ВИЗЫ...", ready: "⚡ ГОТОВО",
    navElite: "элита", navHub: "интел", navVisa: "паспорт", navStore: "магазин",
    sectionPopular: "ЛУЧШИЕ НАПРАВЛЕНИЯ", sectionVillages: "КРАСИВЫЕ ДЕРЕВНИ", sectionHidden: "СКРЫТЫЕ ТАЙНЫ", countryName: "Испания",
    back: "НАЗАД", discoverTitle: "ОТКРОЙТЕ ДУШУ", expertGuide: "СТАНЬТЕ МЕСТНЫМ ЭКСПЕРТОМ",
    socialAccess: "СОЦИАЛЬНЫЙ ДОСТУП"
  },
  zh: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "您的电子邮件", 
    requestAccess: "获取验证码", verifyCode: "验证", enterCode: "输入8位验证码", 
    searchPlaceholder: "搜索城市...", generating: "生成签证...", ready: "⚡ 就绪",
    navElite: "精英", navHub: "情报", navVisa: "护照", navStore: "商店",
    sectionPopular: "热门目的地", sectionVillages: "魅力城镇", sectionHidden: "隐藏秘密", countryName: "西班牙",
    back: "返回", discoverTitle: "探索灵魂之境：", expertGuide: "成为当地专家",
    socialAccess: "社交登录"
  },
  ja: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "メールアドレス", 
    requestAccess: "コードを請求", verifyCode: "確認", enterCode: "8桁のコードを入力", 
    searchPlaceholder: "都市を検索...", generating: "ビザ作成中...", ready: "⚡ 完了",
    navElite: "エリート", navHub: "インテル", navVisa: "パスポート", navStore: "ストア",
    sectionPopular: "人気の目的地", sectionVillages: "魅力的な村", sectionHidden: "隠された秘密", countryName: "スペイン",
    back: "戻る", discoverTitle: "その魂に触れる：", expertGuide: "現地の達人になる",
    socialAccess: "ソーシャルアクセス"
  },
  ko: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "이메일 주소", 
    requestAccess: "코드 요청", verifyCode: "확인", enterCode: "8자리 코드 입력", 
    searchPlaceholder: "도시 검색...", generating: "비자 생성 중...", ready: "⚡ 준비됨",
    navElite: "엘리트", navHub: "インテル", navVisa: "여권", navStore: "상점",
    sectionPopular: "인기 여행지", sectionVillages: "매력적인 마을", sectionHidden: "숨겨진 비밀", countryName: "스เป인",
    back: "뒤로", discoverTitle: "영혼을 발견하다:", expertGuide: "현지 전문가가 되십시오",
    socialAccess: "소셜 액세스"
  },
  ar: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "بريدك الإلكتروني", 
    requestAccess: "طلب الرمز", verifyCode: "تحقق", enterCode: "أدخل الرمز المكون من 8 أرقام", 
    searchPlaceholder: "بحث عن مدينة...", generating: "جاري إنشاء التأشيرة...", ready: "⚡ جاهز",
    navElite: "نخبة", navHub: "معلومات", navVisa: "جواز سفر", navStore: "متجر",
    sectionPopular: "أفضل الوجهات", sectionVillages: "قرى ساحرة", sectionHidden: "أسرars خفية", countryName: "إسبانيا",
    back: "عودة", discoverTitle: "اكتشف روح", expertGuide: "كن خبيراً محلياً",
    socialAccess: "الدخول الاجتماعي"
  },
  hi: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "आपका ईमेल", 
    requestAccess: "कोड मांगें", verifyCode: "सत्यापित करें", enterCode: "8-अंकीय कोड डालें", 
    searchPlaceholder: "शहर खोजें...", generating: "वीज़ा बना रहा है...", ready: "⚡ तैयार",
    navElite: "अभिजात", navHub: "इंटेल", navVisa: "पासपोर्ट", navStore: "स्टोर",
    sectionPopular: "शीर्ष गंतव्य", sectionVillages: "आकर्षक गाँव", sectionHidden: "छिपे हुए रहस्य", countryName: "स्पेन",
    back: "वापस", discoverTitle: "आत्मा की खोज करें:", expertGuide: "एक स्थानीय विशेषज्ञ बनें",
    socialAccess: "सामाजिक पहुंच"
  },
  th: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "อีเมลของคุณ", 
    requestAccess: "ขอรหัส", verifyCode: "ยืนยัน", enterCode: "ใส่รหัส 8 หลัก", 
    searchPlaceholder: "ค้นหาเมือง...", generating: "กำลังสร้าง...", ready: "⚡ พร้อม",
    navElite: "อีลิท", navHub: "ข้อมูล", navVisa: "พาสปอร์ต", navStore: "ร้านค้า",
    sectionPopular: "จุดหมายยอดนิยม", sectionVillages: "เมืองน่ารัก", sectionHidden: "ความลับที่ซ่อนอยู่", countryName: "สเปน",
    back: "ย้อนกลับ", discoverTitle: "ค้นพบจิตวิญญาณของ", expertGuide: "กลายเป็นผู้เชี่ยวชาญท้องถิ่น",
    socialAccess: "การเข้าถึงโซเชียล"
  },
  vi: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "email@cua.ban", 
    requestAccess: "YÊU CẦU MÃ", verifyCode: "XÁC MINH", enterCode: "Nhập mã 8 số", 
    searchPlaceholder: "Tìm thành phố...", generating: "Đang tạo...", ready: "⚡ Sẵn sàng",
    navElite: "tinh hoa", navHub: "thông tin", navVisa: "hộ chiếu", navStore: "cửa hàng",
    sectionPopular: "Điểm đến Hàng đầu", sectionVillages: "Thị trấn Quyến rũ", sectionHidden: "Bí mật Ẩn giấu", countryName: "Tây Ban Nha",
    back: "QUAY LẠI", discoverTitle: "KHÁM PHÁ LINH HỒN CỦA", expertGuide: "TRỞ THÀNH CHUYÊN GIA ĐỊA PHƯƠNG",
    socialAccess: "TRUY CẬP MẠNG XÃ HỘI"
  },
  ca: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "el@teu.email", 
    requestAccess: "DEMANAR CODI", verifyCode: "VERIFICAR", enterCode: "Introdueix el codi de 8 dígits", 
    searchPlaceholder: "cerca ciutat...", generating: "GENERANT...", ready: "⚡ LLEST",
    navElite: "elit", navHub: "intel", navVisa: "passaport", navStore: "botiga",
    sectionPopular: "DESTINS TOP", sectionVillages: "POBLES AMB ENCANT", sectionHidden: "SECRETS OCULTOS", countryName: "Espanya",
    back: "ENRERE", discoverTitle: "DESCOBREIX L'ÀNIMA DE", expertGuide: "SIGUES UN EXPERT LOCAL",
    socialAccess: "ACCÉS SOCIAL"
  },
  eu: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "zure@emaila.com", 
    requestAccess: "KODEA ESKATU", verifyCode: "EGIAZTATU", enterCode: "Sartu 8 digituko kodea", 
    searchPlaceholder: "bilatu hiria...", generating: "SORTZEN...", ready: "⚡ PREST",
    navElite: "elitea", navHub: "intel", navVisa: "pasaportea", navStore: "denda",
    sectionPopular: "HELMUGA NAGUSIAK", sectionVillages: "HERRI XARMAGARRIAK", sectionHidden: "EZKUTUKO SEKRETUAK", countryName: "Espania",
    back: "ATZERA", discoverTitle: "DESCOBREIX ARIMAREN", expertGuide: "BIHURTU TOKIKO ADITU",
    socialAccess: "SARRERA SOZIALA"
  },
  tr: { 
    headerTitle: "bdai", subTitle: "better destinations by ai", emailPlaceholder: "senin@email.com", 
    requestAccess: "KOD İSTE", verifyCode: "DOĞRULA", enterCode: "8 haneli kodu girin", 
    searchPlaceholder: "şehir ara...", generating: "VİZE OLUŞTURULUYOR...", ready: "⚡ HAZIR",
    navElite: "seçkin", navHub: "intel", navVisa: "pasaport", navStore: "mağaza",
    sectionPopular: "POPÜLER ROTALAR", sectionVillages: "GÜZEL KASABALAR", sectionHidden: "GİZLİ SIRLAR", countryName: "İspanya",
    back: "GERİ", discoverTitle: "RUHUNU KEŞFET:", expertGuide: "YEREL BİR UZMAN OLUN",
    socialAccess: "SOSYAL ERİŞİM"
  }
};