import React, { useState } from 'react';
import { BdaiLogo } from './BdaiLogo';
import { UserProfile } from '../types';
import { translations } from '../data/translations';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
    user: UserProfile;
}

const ONBOARDING_TEXTS: Record<string, any> = {
    es: {
        step1: { title: "Bienvenido a bdai", subtitle: "Tu Ecosistema de Viajes", content: "bdai es tu compañero de viajes inteligente. Aquí descubrirás los secretos mejor guardados de cualquier ciudad del mundo, guiado por inteligencia artificial." },
        step2: { title: "Tours Únicos", subtitle: "Generación Inteligente", content: "Busca cualquier ciudad y crearé 3 rutas temáticas al instante. Calculo el tiempo real de caminata y visita. ¡Cero paradas repetidas, 100% lugares increíbles y gemas ocultas!" },
        step3: { title: "Geolocalización", subtitle: "Check-in Real", content: "Para avanzar en el tour, debes estar físicamente a menos de 50 metros de la parada. El GPS validará tu posición para hacer 'Check-in' y desbloquear la historia." },
        step4: { title: "Millas y Ranking", subtitle: "Gamificación Real", content: "Cada 'Check-in' te otorga Millas. Acumula millas para subir de nivel en el Ranking Global (desde ZERO hasta ZENITH). ¡Compite contra otros viajeros para ser el mejor!" },
        step5: { title: "Insignias", subtitle: "Colecciona tus descubrimientos", content: "Gana puntos e insignias según el tipo de lugares que visites. Cada parada tiene una categoría especial. ¡Explora todas las facetas de la ciudad para completar tu colección!" },
        step6: { title: "Comparte tus Logros", subtitle: "Visados y Rango", content: "Al terminar un tour, recibirás un Visado digital de la ciudad. ¡Compártelo en tus redes sociales junto con tu nivel del Ranking Global para demostrar quién es el mejor viajero!" },
        step7: { title: "A Tener en Cuenta", subtitle: "Pequeños detalles", content: "1. El GPS puede ser menos preciso en calles muy estrechas.\n2. Necesito unos segundos para pensar y generar los mejores tours para ti.\n3. ¡Mantén los ojos abiertos y disfruta del viaje!" },
        btnNext: "SIGUIENTE", btnDone: "ENTENDIDO",
        catHistory: "Historia", catArt: "Arte", catFood: "Comida", catNature: "Naturaleza", catPhoto: "Foto", catCulture: "Cultura", catArchi: "Arqui", catSpecial: "Especial",
        rankLabel: "Rango", visaLabel: "Visado"
    },
    en: {
        step1: { title: "Welcome to bdai", subtitle: "Your Travel Ecosystem", content: "bdai is your smart travel companion. Here you will discover the best-kept secrets of any city in the world, guided by artificial intelligence." },
        step2: { title: "Unique Tours", subtitle: "Smart Generation", content: "Search for any city and I will create 3 thematic routes instantly. I calculate real walking and visiting times. Zero repeated stops, 100% amazing places and hidden gems!" },
        step3: { title: "Geolocation", subtitle: "Real Check-in", content: "To advance in the tour, you must be physically within 50 meters of the stop. The GPS will validate your position to 'Check-in' and unlock the story." },
        step4: { title: "Miles & Ranking", subtitle: "Real Gamification", content: "Every 'Check-in' grants you Miles. Accumulate miles to level up in the Global Ranking (from ZERO to ZENITH). Compete against other travelers to be the best!" },
        step5: { title: "Badges", subtitle: "Collect your discoveries", content: "Earn points and badges based on the type of places you visit. Each stop has a special category. Explore all facets of the city to complete your collection!" },
        step6: { title: "Share your Achievements", subtitle: "Visas and Rank", content: "Upon finishing a tour, you will receive a digital Visa of the city. Share it on your social networks along with your Global Ranking level to show who is the best traveler!" },
        step7: { title: "Keep in Mind", subtitle: "Small details", content: "1. GPS might be less accurate in very narrow streets.\n2. I need a few seconds to think and generate the best tours for you.\n3. Keep your eyes open and enjoy the trip!" },
        btnNext: "NEXT", btnDone: "GOT IT",
        catHistory: "History", catArt: "Art", catFood: "Food", catNature: "Nature", catPhoto: "Photo", catCulture: "Culture", catArchi: "Archi", catSpecial: "Special",
        rankLabel: "Rank", visaLabel: "Visa"
    },
    fr: {
        step1: { title: "Bienvenue sur bdai", subtitle: "Votre Écosystème de Voyage", content: "bdai est votre compagnon de voyage intelligent. Ici, vous découvrirez les secrets les mieux gardés de n'importe quelle ville du monde, guidé par l'intelligence artificielle." },
        step2: { title: "Visites Uniques", subtitle: "Génération Intelligente", content: "Cherchez n'importe quelle ville et je créerai 3 itinéraires thématiques instantanément. Zéro arrêts répétés, 100% de lieux incroyables et de joyaux cachés!" },
        step3: { title: "Géolocalisation", subtitle: "Check-in Réel", content: "Pour avancer dans la visite, vous devez être physiquement à moins de 50 mètres de l'arrêt. Le GPS validera votre position pour effectuer le 'Check-in'." },
        step4: { title: "Miles et Classement", subtitle: "Gamification Réelle", content: "Chaque 'Check-in' vous accorde des Miles. Accumulez des miles pour monter dans le Classement Mondial (de ZERO à ZENITH). Rivalisez avec d'autres voyageurs!" },
        step5: { title: "Badges", subtitle: "Collectionnez vos découvertes", content: "Gagnez des points et des badges selon le type de lieux visités. Chaque arrêt a une catégorie spéciale. Explorez toutes les facettes de la ville!" },
        step6: { title: "Partagez vos Succès", subtitle: "Visas et Rang", content: "En terminant une visite, vous recevrez un Visa numérique de la ville. Partagez-le sur vos réseaux avec votre niveau de Classement!" },
        step7: { title: "À Savoir", subtitle: "Petits détails", content: "1. Le GPS peut être moins précis dans les rues très étroites.\n2. J'ai besoin de quelques secondes pour générer les meilleures visites.\n3. Gardez les yeux ouverts et profitez du voyage!" },
        btnNext: "SUIVANT", btnDone: "COMPRIS",
        catHistory: "Histoire", catArt: "Art", catFood: "Cuisine", catNature: "Nature", catPhoto: "Photo", catCulture: "Culture", catArchi: "Archi", catSpecial: "Spécial",
        rankLabel: "Rang", visaLabel: "Visa"
    },
    de: {
        step1: { title: "Willkommen bei bdai", subtitle: "Ihr Reise-Ökosystem", content: "bdai ist Ihr intelligenter Reisebegleiter. Hier entdecken Sie die bestgehüteten Geheimnisse jeder Stadt der Welt, geführt von künstlicher Intelligenz." },
        step2: { title: "Einzigartige Touren", subtitle: "Intelligente Generierung", content: "Suchen Sie nach einer Stadt und ich erstelle sofort 3 thematische Routen. Keine wiederholten Stopps, 100% unglaubliche Orte und verborgene Schätze!" },
        step3: { title: "Geolokalisierung", subtitle: "Echter Check-in", content: "Um in der Tour voranzukommen, müssen Sie sich physisch innerhalb von 50 Metern der Haltestelle befinden. Das GPS validiert Ihre Position zum 'Check-in'." },
        step4: { title: "Meilen & Ranking", subtitle: "Echte Gamification", content: "Jeder 'Check-in' gewährt Ihnen Meilen. Sammeln Sie Meilen, um im Weltranking aufzusteigen (von ZERO bis ZENITH). Wetteifern Sie mit anderen Reisenden!" },
        step5: { title: "Abzeichen", subtitle: "Sammeln Sie Ihre Entdeckungen", content: "Verdienen Sie Punkte und Abzeichen je nach Art der besuchten Orte. Jede Haltestelle hat eine besondere Kategorie. Erkunden Sie alle Facetten der Stadt!" },
        step6: { title: "Teilen Sie Ihre Erfolge", subtitle: "Visa und Rang", content: "Nach Abschluss einer Tour erhalten Sie ein digitales Visum der Stadt. Teilen Sie es in Ihren sozialen Netzwerken mit Ihrem Weltranking-Level!" },
        step7: { title: "Zu Beachten", subtitle: "Kleine Details", content: "1. GPS kann in sehr engen Straßen ungenauer sein.\n2. Ich brauche ein paar Sekunden, um die besten Touren zu generieren.\n3. Halten Sie die Augen offen und genießen Sie die Reise!" },
        btnNext: "WEITER", btnDone: "VERSTANDEN",
        catHistory: "Geschichte", catArt: "Kunst", catFood: "Essen", catNature: "Natur", catPhoto: "Foto", catCulture: "Kultur", catArchi: "Archit.", catSpecial: "Spezial",
        rankLabel: "Rang", visaLabel: "Visum"
    },
    it: {
        step1: { title: "Benvenuto su bdai", subtitle: "Il Tuo Ecosistema di Viaggio", content: "bdai è il tuo compagno di viaggio intelligente. Qui scoprirai i segreti meglio custoditi di qualsiasi città del mondo, guidato dall'intelligenza artificiale." },
        step2: { title: "Tour Unici", subtitle: "Generazione Intelligente", content: "Cerca qualsiasi città e creerò 3 percorsi tematici all'istante. Zero tappe ripetute, 100% luoghi incredibili e gemme nascoste!" },
        step3: { title: "Geolocalizzazione", subtitle: "Check-in Reale", content: "Per avanzare nel tour, devi trovarti fisicamente entro 50 metri dalla tappa. Il GPS validerà la tua posizione per fare il 'Check-in'." },
        step4: { title: "Miglia e Classifica", subtitle: "Gamification Reale", content: "Ogni 'Check-in' ti assegna Miglia. Accumula miglia per salire nella Classifica Globale (da ZERO a ZENITH). Gareggia con altri viaggiatori!" },
        step5: { title: "Distintivi", subtitle: "Colleziona le tue scoperte", content: "Guadagna punti e distintivi in base al tipo di luoghi visitati. Ogni tappa ha una categoria speciale. Esplora tutte le sfaccettature della città!" },
        step6: { title: "Condividi i tuoi Successi", subtitle: "Visti e Rango", content: "Terminando un tour, riceverai un Visto digitale della città. Condividilo sui social insieme al tuo livello nella Classifica Globale!" },
        step7: { title: "Da Tenere a Mente", subtitle: "Piccoli dettagli", content: "1. Il GPS potrebbe essere meno preciso nelle strade molto strette.\n2. Ho bisogno di qualche secondo per generare i migliori tour.\n3. Tieni gli occhi aperti e goditi il viaggio!" },
        btnNext: "AVANTI", btnDone: "CAPITO",
        catHistory: "Storia", catArt: "Arte", catFood: "Cibo", catNature: "Natura", catPhoto: "Foto", catCulture: "Cultura", catArchi: "Archit.", catSpecial: "Speciale",
        rankLabel: "Grado", visaLabel: "Visto"
    },
    pt: {
        step1: { title: "Bem-vindo ao bdai", subtitle: "O Seu Ecossistema de Viagem", content: "bdai é o seu companheiro de viagem inteligente. Aqui descobrirá os segredos mais bem guardados de qualquer cidade do mundo, guiado pela inteligência artificial." },
        step2: { title: "Tours Únicos", subtitle: "Geração Inteligente", content: "Pesquise qualquer cidade e criarei 3 rotas temáticas instantaneamente. Zero paragens repetidas, 100% lugares incríveis e joias escondidas!" },
        step3: { title: "Geolocalização", subtitle: "Check-in Real", content: "Para avançar no tour, deve estar fisicamente a menos de 50 metros da paragem. O GPS validará a sua posição para fazer 'Check-in'." },
        step4: { title: "Milhas e Ranking", subtitle: "Gamificação Real", content: "Cada 'Check-in' concede-lhe Milhas. Acumule milhas para subir no Ranking Global (de ZERO a ZENITH). Compita com outros viajantes!" },
        step5: { title: "Emblemas", subtitle: "Colecione as suas descobertas", content: "Ganhe pontos e emblemas consoante o tipo de lugares visitados. Cada paragem tem uma categoria especial. Explore todas as facetas da cidade!" },
        step6: { title: "Partilhe as suas Conquistas", subtitle: "Vistos e Nível", content: "Ao terminar um tour, receberá um Visto digital da cidade. Partilhe-o nas redes sociais com o seu nível no Ranking Global!" },
        step7: { title: "A Ter em Conta", subtitle: "Pequenos detalhes", content: "1. O GPS pode ser menos preciso em ruas muito estreitas.\n2. Preciso de alguns segundos para gerar os melhores tours.\n3. Mantenha os olhos abertos e desfrute da viagem!" },
        btnNext: "SEGUINTE", btnDone: "ENTENDIDO",
        catHistory: "História", catArt: "Arte", catFood: "Comida", catNature: "Natureza", catPhoto: "Foto", catCulture: "Cultura", catArchi: "Arquit.", catSpecial: "Especial",
        rankLabel: "Nível", visaLabel: "Visto"
    },
    ru: {
        step1: { title: "Добро пожаловать в bdai", subtitle: "Ваша Экосистема Путешествий", content: "bdai — ваш умный спутник путешествий. Здесь вы откроете самые тщательно хранимые секреты любого города мира, ведомые искусственным интеллектом." },
        step2: { title: "Уникальные Туры", subtitle: "Умная Генерация", content: "Найдите любой город, и я мгновенно создам 3 тематических маршрута. Ноль повторяющихся остановок, 100% удивительных мест и скрытых жемчужин!" },
        step3: { title: "Геолокация", subtitle: "Реальный Check-in", content: "Чтобы продвигаться по туру, вы должны физически находиться в пределах 50 метров от остановки. GPS подтвердит ваше местоположение для 'Check-in'." },
        step4: { title: "Мили и Рейтинг", subtitle: "Реальная Геймификация", content: "Каждый 'Check-in' дает вам Мили. Накапливайте мили, чтобы подняться в Мировом Рейтинге (от ZERO до ZENITH). Соревнуйтесь с другими путешественниками!" },
        step5: { title: "Значки", subtitle: "Коллекционируйте открытия", content: "Зарабатывайте очки и значки в зависимости от типа посещаемых мест. Каждая остановка имеет особую категорию. Исследуйте все грани города!" },
        step6: { title: "Делитесь Достижениями", subtitle: "Визы и Ранг", content: "По завершении тура вы получите цифровую Визу города. Поделитесь ею в социальных сетях вместе с вашим уровнем в Мировом Рейтинге!" },
        step7: { title: "Обратите Внимание", subtitle: "Небольшие детали", content: "1. GPS может быть менее точным на очень узких улицах.\n2. Мне нужно несколько секунд для генерации лучших туров.\n3. Держите глаза открытыми и наслаждайтесь путешествием!" },
        btnNext: "ДАЛЕЕ", btnDone: "ПОНЯТНО",
        catHistory: "История", catArt: "Искусство", catFood: "Еда", catNature: "Природа", catPhoto: "Фото", catCulture: "Культура", catArchi: "Архит.", catSpecial: "Особое",
        rankLabel: "Ранг", visaLabel: "Виза"
    },
    zh: {
        step1: { title: "欢迎来到 bdai", subtitle: "您的旅行生态系统", content: "bdai 是您的智能旅行伴侣。在这里，您将在人工智能的引导下，发现世界任何城市最隐秘的秘密。" },
        step2: { title: "独特旅游路线", subtitle: "智能生成", content: "搜索任何城市，我将立即创建 3 条主题路线。零重复停靠，100% 令人惊叹的地方和隐藏的宝藏！" },
        step3: { title: "地理定位", subtitle: "真实签到", content: "要在游览中前进，您必须实际处于停靠点 50 米以内。GPS 将验证您的位置以进行'签到'。" },
        step4: { title: "里程与排名", subtitle: "真实游戏化", content: "每次'签到'都会给您里程。积累里程以在全球排名中提升等级（从 ZERO 到 ZENITH）。与其他旅行者竞争！" },
        step5: { title: "徽章", subtitle: "收集您的发现", content: "根据参观地点的类型赚取积分和徽章。每个停靠点都有一个特殊类别。探索城市的各个方面！" },
        step6: { title: "分享您的成就", subtitle: "签证与等级", content: "完成游览后，您将收到该城市的数字签证。将其与您的全球排名等级分享到社交网络！" },
        step7: { title: "注意事项", subtitle: "小细节", content: "1. GPS 在非常狭窄的街道上可能不太准确。\n2. 我需要几秒钟来生成最好的旅游路线。\n3. 睁大眼睛，享受旅程！" },
        btnNext: "下一步", btnDone: "明白了",
        catHistory: "历史", catArt: "艺术", catFood: "美食", catNature: "自然", catPhoto: "摄影", catCulture: "文化", catArchi: "建筑", catSpecial: "特别",
        rankLabel: "等级", visaLabel: "签证"
    },
    ja: {
        step1: { title: "bdaiへようこそ", subtitle: "あなたの旅行エコシステム", content: "bdaiはあなたのスマート旅行コンパニオンです。人工知能に導かれ、世界中の都市の最も守られた秘密を発見しましょう。" },
        step2: { title: "ユニークなツアー", subtitle: "スマート生成", content: "どの都市でも検索して、即座に3つのテーマルートを作成します。繰り返しのストップはゼロ、100%素晴らしい場所と隠れた宝石！" },
        step3: { title: "ジオロケーション", subtitle: "リアルチェックイン", content: "ツアーを進めるには、ストップから50メートル以内にいる必要があります。GPSが位置を確認して'チェックイン'します。" },
        step4: { title: "マイルとランキング", subtitle: "リアルゲーミフィケーション", content: "各'チェックイン'でマイルを獲得。マイルを積み上げてグローバルランキングでレベルアップ（ZEROからZENITHまで）！" },
        step5: { title: "バッジ", subtitle: "発見を集めよう", content: "訪れる場所の種類に応じてポイントとバッジを獲得。各ストップには特別なカテゴリーがあります。都市のあらゆる側面を探索！" },
        step6: { title: "実績を共有しよう", subtitle: "ビザとランク", content: "ツアー終了後、都市のデジタルビザを受け取ります。グローバルランキングレベルとともにSNSでシェアしましょう！" },
        step7: { title: "注意事項", subtitle: "小さな詳細", content: "1. とても狭い通りではGPSが不正確になる場合があります。\n2. 最高のツアーを生成するために数秒かかります。\n3. 目を開いて旅を楽しんでください！" },
        btnNext: "次へ", btnDone: "了解しました",
        catHistory: "歴史", catArt: "アート", catFood: "食事", catNature: "自然", catPhoto: "写真", catCulture: "文化", catArchi: "建築", catSpecial: "特別",
        rankLabel: "ランク", visaLabel: "ビザ"
    },
    ar: {
        step1: { title: "مرحباً بك في bdai", subtitle: "نظامك البيئي للسفر", content: "bdai هو رفيق سفرك الذكي. هنا ستكتشف أفضل الأسرار المحفوظة في أي مدينة في العالم، بتوجيه من الذكاء الاصطناعي." },
        step2: { title: "جولات فريدة", subtitle: "توليد ذكي", content: "ابحث عن أي مدينة وسأنشئ 3 مسارات موضوعية على الفور. صفر توقفات متكررة، 100% أماكن مذهلة وجواهر خفية!" },
        step3: { title: "تحديد الموقع", subtitle: "تسجيل وصول حقيقي", content: "للتقدم في الجولة، يجب أن تكون جسدياً على بُعد 50 متر من التوقف. سيتحقق GPS من موقعك للقيام بـ'تسجيل الوصول'." },
        step4: { title: "الأميال والترتيب", subtitle: "التلعيب الحقيقي", content: "كل 'تسجيل وصول' يمنحك أميالاً. راكم الأميال للارتقاء في الترتيب العالمي (من ZERO إلى ZENITH). تنافس مع مسافرين آخرين!" },
        step5: { title: "الأوسمة", subtitle: "اجمع اكتشافاتك", content: "اكسب نقاطاً وأوسمة بناءً على نوع الأماكن التي تزورها. كل توقف له فئة خاصة. استكشف كل أوجه المدينة!" },
        step6: { title: "شارك إنجازاتك", subtitle: "التأشيرات والرتبة", content: "عند الانتهاء من الجولة، ستحصل على تأشيرة رقمية للمدينة. شاركها على شبكاتك الاجتماعية مع مستواك في الترتيب العالمي!" },
        step7: { title: "ضع في اعتبارك", subtitle: "تفاصيل صغيرة", content: "١. قد يكون GPS أقل دقة في الشوارع الضيقة جداً.\n٢. أحتاج بضع ثوانٍ لتوليد أفضل الجولات.\n٣. ابقِ عينيك مفتوحتين واستمتع بالرحلة!" },
        btnNext: "التالي", btnDone: "فهمت",
        catHistory: "تاريخ", catArt: "فن", catFood: "طعام", catNature: "طبيعة", catPhoto: "صورة", catCulture: "ثقافة", catArchi: "معمار", catSpecial: "خاص",
        rankLabel: "الرتبة", visaLabel: "تأشيرة"
    },
    ca: {
        step1: { title: "Benvingut a bdai", subtitle: "El Teu Ecosistema de Viatge", content: "bdai és el teu company de viatge intel·ligent. Aquí descobriràs els secrets més ben guardats de qualsevol ciutat del món, guiat per la intel·ligència artificial." },
        step2: { title: "Tours Únics", subtitle: "Generació Intel·ligent", content: "Cerca qualsevol ciutat i crearé 3 rutes temàtiques a l'instant. Zero parades repetides, 100% llocs increïbles i joies ocultes!" },
        step3: { title: "Geolocalització", subtitle: "Check-in Real", content: "Per avançar al tour, has d'estar físicament a menys de 50 metres de la parada. El GPS validarà la teva posició per fer el 'Check-in'." },
        step4: { title: "Milles i Rànquing", subtitle: "Gamificació Real", content: "Cada 'Check-in' et dona Milles. Acumula milles per pujar de nivell al Rànquing Global (de ZERO a ZENITH). Competeix amb altres viatgers!" },
        step5: { title: "Insígnies", subtitle: "Col·lecciona les teves descobertes", content: "Guanya punts i insígnies segons el tipus de llocs que visitis. Cada parada té una categoria especial. Explora totes les facetes de la ciutat!" },
        step6: { title: "Comparteix els teus Assoliments", subtitle: "Visats i Rang", content: "En acabar un tour, rebràs un Visat digital de la ciutat. Comparteix-lo a les xarxes socials amb el teu nivell al Rànquing Global!" },
        step7: { title: "A Tenir en Compte", subtitle: "Petits detalls", content: "1. El GPS pot ser menys precís en carrers molt estrets.\n2. Necessito uns segons per generar els millors tours.\n3. Mantén els ulls oberts i gaudeix del viatge!" },
        btnNext: "SEGÜENT", btnDone: "ENTÈS",
        catHistory: "Història", catArt: "Art", catFood: "Menjar", catNature: "Natura", catPhoto: "Foto", catCulture: "Cultura", catArchi: "Arquit.", catSpecial: "Especial",
        rankLabel: "Rang", visaLabel: "Visat"
    },
    eu: {
        step1: { title: "Ongi etorri bdai-ra", subtitle: "Zure Bidaia Ekosistema", content: "bdai zure bidaia lagun adimenduna da. Hemen adimen artifizialaren gidarekin munduko edozein hiriko sekretu ondirien gordeenak aurkituko dituzu." },
        step2: { title: "Tour Bakarrak", subtitle: "Sorrera Adimenduna", content: "Bilatu edozein hiri eta 3 bide tematiko sortuko ditut berehala. Zero geldialdirik errepikatu, %100 leku harrigarriak eta ezkutuko harribitxiak!" },
        step3: { title: "Geolokalizazioa", subtitle: "Benetako Check-in", content: "Tourean aurrera egiteko, geldialdiak 50 metrotara fisikoki egon behar duzu. GPSek zure posizioa egiaztatu eta 'Check-in' egin dezakezu." },
        step4: { title: "Miliak eta Sailkapena", subtitle: "Benetako Gamifikazioa", content: "Bakoitzak 'Check-in' egitean Miliak ematen dizkizu. Pilatu miliak Sailkapen Globalean maila igotzeko (ZEROtik ZENITHera). Lehiatu beste bidaiariekin!" },
        step5: { title: "Txapak", subtitle: "Zure aurkikuntzak bildu", content: "Irabazi puntuak eta txapak bisitatu dituzun leku motaren arabera. Geldialdirik badauka kategoria berezia. Esploratu hiriaren alderdi guztiak!" },
        step6: { title: "Partekatu Lorpenak", subtitle: "Bisatuak eta Maila", content: "Tour bat amaitutakoan, hiriaren bisa digital bat jasoko duzu. Partekatu sare sozialetan Sailkapen Globaleko mailarekin batera!" },
        step7: { title: "Kontuan Hartu", subtitle: "Xehetasun txikiak", content: "1. GPSa gutxiago zehatza izan daiteke kale oso estuetan.\n2. Segundu batzuk behar ditut tour onenak sortzeko.\n3. Begiak zabalik mantendu eta bidaia gozatu!" },
        btnNext: "HURRENGOA", btnDone: "ULERTUTA",
        catHistory: "Historia", catArt: "Artea", catFood: "Janaria", catNature: "Natura", catPhoto: "Argazkia", catCulture: "Kultura", catArchi: "Arkit.", catSpecial: "Berezia",
        rankLabel: "Maila", visaLabel: "Bisatua"
    },
    ro: {
        step1: { title: "Bun venit la bdai", subtitle: "Ecosistemul Tău de Călătorie", content: "bdai este companionul tău inteligent de călătorie. Aici vei descoperi secretele cele mai bine păzite ale oricărui oraș din lume, ghidat de inteligența artificială." },
        step2: { title: "Tururi Unice", subtitle: "Generare Inteligentă", content: "Caută orice oraș și voi crea 3 rute tematice instantaneu. Zero opriri repetate, 100% locuri incredibile și bijuterii ascunse!" },
        step3: { title: "Geolocalizare", subtitle: "Check-in Real", content: "Pentru a avansa în tur, trebuie să fii fizic la mai puțin de 50 de metri de oprire. GPS-ul va valida poziția ta pentru 'Check-in'." },
        step4: { title: "Mile și Clasament", subtitle: "Gamificare Reală", content: "Fiecare 'Check-in' îți acordă Mile. Acumulează mile pentru a urca în Clasamentul Global (de la ZERO la ZENITH). Concurează cu alți călători!" },
        step5: { title: "Insigne", subtitle: "Colecționează descoperirile tale", content: "Câștigă puncte și insigne în funcție de tipul de locuri vizitate. Fiecare oprire are o categorie specială. Explorează toate fațetele orașului!" },
        step6: { title: "Împărtășește Realizările", subtitle: "Vize și Rang", content: "La terminarea unui tur, vei primi o Viză digitală a orașului. Distribuie-o pe rețelele sociale împreună cu nivelul tău din Clasamentul Global!" },
        step7: { title: "De Reținut", subtitle: "Detalii mici", content: "1. GPS-ul poate fi mai puțin precis pe străzi foarte înguste.\n2. Am nevoie de câteva secunde pentru a genera cele mai bune tururi.\n3. Ține ochii deschiși și bucură-te de călătorie!" },
        btnNext: "URMĂTOR", btnDone: "AM ÎNȚELES",
        catHistory: "Istorie", catArt: "Artă", catFood: "Mâncare", catNature: "Natură", catPhoto: "Foto", catCulture: "Cultură", catArchi: "Arhit.", catSpecial: "Special",
        rankLabel: "Rang", visaLabel: "Viză"
    },
    nl: {
        step1: { title: "Welkom bij bdai", subtitle: "Uw Reisecosysteem", content: "bdai is uw slimme reisgezel. Hier ontdekt u de best bewaarde geheimen van elke stad ter wereld, geleid door kunstmatige intelligentie." },
        step2: { title: "Unieke Tours", subtitle: "Slimme Generatie", content: "Zoek een stad en ik maak direct 3 thematische routes. Geen herhaalde stops, 100% geweldige plekken en verborgen juweeltjes!" },
        step3: { title: "Geolocalisatie", subtitle: "Echte Check-in", content: "Om verder te gaan in de tour moet u fysiek binnen 50 meter van de stop zijn. GPS valideert uw positie voor 'Check-in'." },
        step4: { title: "Mijlen & Ranking", subtitle: "Echte Gamificatie", content: "Elke 'Check-in' geeft u Mijlen. Spaar mijlen om te stijgen in de Wereldranglijst (van ZERO naar ZENITH). Concurreer met andere reizigers!" },
        step5: { title: "Badges", subtitle: "Verzamel uw ontdekkingen", content: "Verdien punten en badges op basis van het type bezochte plaatsen. Elke stop heeft een speciale categorie. Verken alle facetten van de stad!" },
        step6: { title: "Deel uw Prestaties", subtitle: "Visa en Rang", content: "Na het voltooien van een tour ontvangt u een digitaal Visum van de stad. Deel het op uw sociale netwerken samen met uw Wereldranglijst niveau!" },
        step7: { title: "Houd Rekening Mee", subtitle: "Kleine details", content: "1. GPS kan minder nauwkeurig zijn in zeer smalle straten.\n2. Ik heb een paar seconden nodig om de beste tours te genereren.\n3. Houd uw ogen open en geniet van de reis!" },
        btnNext: "VOLGENDE", btnDone: "BEGREPEN",
        catHistory: "Geschiedenis", catArt: "Kunst", catFood: "Eten", catNature: "Natuur", catPhoto: "Foto", catCulture: "Cultuur", catArchi: "Archit.", catSpecial: "Speciaal",
        rankLabel: "Rang", visaLabel: "Visum"
    },
    pl: {
        step1: { title: "Witamy w bdai", subtitle: "Twój Ekosystem Podróży", content: "bdai to Twój inteligentny towarzysz podróży. Tutaj odkryjesz najlepiej strzeżone sekrety każdego miasta na świecie, prowadzony przez sztuczną inteligencję." },
        step2: { title: "Unikalne Trasy", subtitle: "Inteligentna Generacja", content: "Wyszukaj dowolne miasto, a ja natychmiast stworzę 3 trasy tematyczne. Zero powtarzających się przystanków, 100% niesamowitych miejsc i ukrytych klejnotów!" },
        step3: { title: "Geolokalizacja", subtitle: "Prawdziwy Check-in", content: "Aby przejść dalej w trasie, musisz znajdować się fizycznie w odległości 50 metrów od przystanku. GPS potwierdzi Twoją pozycję do 'Check-in'." },
        step4: { title: "Mile i Ranking", subtitle: "Prawdziwa Gamifikacja", content: "Każdy 'Check-in' daje Ci Mile. Zbieraj mile, aby awansować w Rankingu Globalnym (od ZERO do ZENITH). Rywalizuj z innymi podróżnikami!" },
        step5: { title: "Odznaki", subtitle: "Zbieraj odkrycia", content: "Zdobywaj punkty i odznaki w zależności od typu odwiedzanych miejsc. Każdy przystanek ma specjalną kategorię. Poznaj wszystkie oblicza miasta!" },
        step6: { title: "Dziel się Osiągnięciami", subtitle: "Wizy i Ranga", content: "Po ukończeniu trasy otrzymasz cyfrową Wizę miasta. Udostępnij ją w mediach społecznościowych wraz z poziomem w Rankingu Globalnym!" },
        step7: { title: "Pamiętaj", subtitle: "Małe szczegóły", content: "1. GPS może być mniej dokładny na bardzo wąskich ulicach.\n2. Potrzebuję kilku sekund, aby wygenerować najlepsze trasy.\n3. Trzymaj oczy otwarte i ciesz się podróżą!" },
        btnNext: "DALEJ", btnDone: "ROZUMIEM",
        catHistory: "Historia", catArt: "Sztuka", catFood: "Jedzenie", catNature: "Natura", catPhoto: "Foto", catCulture: "Kultura", catArchi: "Archit.", catSpecial: "Specjalne",
        rankLabel: "Ranga", visaLabel: "Wiza"
    },
    hi: {
        step1: { title: "bdai में आपका स्वागत है", subtitle: "आपका यात्रा पारिस्थितिकी तंत्र", content: "bdai आपका स्मार्ट यात्रा साथी है। यहां आप कृत्रिम बुद्धिमत्ता द्वारा निर्देशित होकर दुनिया के किसी भी शहर के सबसे अच्छे रहस्य खोजेंगे।" },
        step2: { title: "अनूठे टूर", subtitle: "स्मार्ट जनरेशन", content: "किसी भी शहर की खोज करें और मैं तुरंत 3 थीमैटिक मार्ग बनाऊंगा। शून्य दोहराई गई रुकावटें, 100% अद्भुत स्थान और छिपे हुए रत्न!" },
        step3: { title: "जियोलोकेशन", subtitle: "वास्तविक चेक-इन", content: "टूर में आगे बढ़ने के लिए, आपको स्टॉप से 50 मीटर के भीतर भौतिक रूप से होना चाहिए। GPS आपकी स्थिति को 'Check-in' के लिए सत्यापित करेगा।" },
        step4: { title: "मील और रैंकिंग", subtitle: "वास्तविक गेमिफिकेशन", content: "प्रत्येक 'Check-in' आपको मील देता है। वैश्विक रैंकिंग में स्तर बढ़ाने के लिए मील जमा करें (ZERO से ZENITH तक)। अन्य यात्रियों के साथ प्रतिस्पर्धा करें!" },
        step5: { title: "बैज", subtitle: "अपनी खोजें एकत्र करें", content: "आपके द्वारा देखे जाने वाले स्थानों के प्रकार के आधार पर अंक और बैज अर्जित करें। प्रत्येक स्टॉप में एक विशेष श्रेणी होती है।" },
        step6: { title: "अपनी उपलब्धियां साझा करें", subtitle: "वीजा और रैंक", content: "एक टूर समाप्त करने पर, आपको शहर का एक डिजिटल वीजा मिलेगा। इसे अपने वैश्विक रैंकिंग स्तर के साथ सोशल नेटवर्क पर साझा करें!" },
        step7: { title: "ध्यान रखें", subtitle: "छोटी-छोटी बातें", content: "1. बहुत संकरी गलियों में GPS कम सटीक हो सकता है।\n2. मुझे आपके लिए सर्वोत्तम टूर उत्पन्न करने में कुछ सेकंड लगते हैं।\n3. आंखें खुली रखें और यात्रा का आनंद लें!" },
        btnNext: "अगला", btnDone: "समझ गया",
        catHistory: "इतिहास", catArt: "कला", catFood: "भोजन", catNature: "प्रकृति", catPhoto: "फोटो", catCulture: "संस्कृति", catArchi: "वास्तु", catSpecial: "विशेष",
        rankLabel: "रैंक", visaLabel: "वीजा"
    },
    ko: {
        step1: { title: "bdai에 오신 것을 환영합니다", subtitle: "당신의 여행 생태계", content: "bdai는 당신의 스마트 여행 동반자입니다. 여기서 인공지능의 안내를 받아 세계 어느 도시의 가장 잘 간직된 비밀을 발견하게 됩니다." },
        step2: { title: "독특한 투어", subtitle: "스마트 생성", content: "어느 도시나 검색하면 즉시 3개의 테마 경로를 만들어드립니다. 반복 정류장 없음, 100% 놀라운 장소와 숨겨진 보석!" },
        step3: { title: "지오로케이션", subtitle: "실제 체크인", content: "투어를 진행하려면 정류장에서 50미터 이내에 물리적으로 있어야 합니다. GPS가 '체크인'을 위해 위치를 확인합니다." },
        step4: { title: "마일 및 랭킹", subtitle: "실제 게임화", content: "모든 '체크인'마다 마일을 획득합니다. 마일을 쌓아 글로벌 랭킹에서 레벨업하세요 (ZERO에서 ZENITH까지). 다른 여행자들과 경쟁하세요!" },
        step5: { title: "배지", subtitle: "발견을 수집하세요", content: "방문하는 장소 유형에 따라 점수와 배지를 획득합니다. 각 정류장에는 특별한 카테고리가 있습니다." },
        step6: { title: "성과 공유하기", subtitle: "비자 및 랭크", content: "투어를 마치면 도시의 디지털 비자를 받게 됩니다. 글로벌 랭킹 레벨과 함께 소셜 네트워크에 공유하세요!" },
        step7: { title: "유의사항", subtitle: "작은 세부사항", content: "1. 매우 좁은 거리에서는 GPS가 덜 정확할 수 있습니다.\n2. 최고의 투어를 생성하는 데 몇 초가 필요합니다.\n3. 눈을 크게 뜨고 여행을 즐기세요!" },
        btnNext: "다음", btnDone: "알겠습니다",
        catHistory: "역사", catArt: "예술", catFood: "음식", catNature: "자연", catPhoto: "사진", catCulture: "문화", catArchi: "건축", catSpecial: "특별",
        rankLabel: "랭크", visaLabel: "비자"
    },
    tr: {
        step1: { title: "bdai'ye Hoş Geldiniz", subtitle: "Seyahat Ekosisteминiz", content: "bdai, akıllı seyahat arkadaşınızdır. Burada yapay zeka rehberliğinde dünyanın herhangi bir şehrinin en iyi saklanan sırlarını keşfedeceksiniz." },
        step2: { title: "Benzersiz Turlar", subtitle: "Akıllı Üretim", content: "Herhangi bir şehri arayın ve anında 3 tematik rota oluşturayım. Sıfır tekrarlanan durak, %100 inanılmaz yerler ve gizli mücevherler!" },
        step3: { title: "Jeolokasyon", subtitle: "Gerçek Check-in", content: "Turda ilerlemek için durağa 50 metre mesafede fiziksel olarak bulunmalısınız. GPS, 'Check-in' için konumunuzu doğrulayacaktır." },
        step4: { title: "Mil ve Sıralama", subtitle: "Gerçek Oyunlaştırma", content: "Her 'Check-in' size Mil kazandırır. Global Sıralamada yükselmek için mil biriktirin (ZERO'dan ZENITH'e). Diğer gezginlerle rekabet edin!" },
        step5: { title: "Rozetler", subtitle: "Keşiflerinizi toplayın", content: "Ziyaret ettiğiniz yerlerin türüne göre puan ve rozet kazanın. Her durağın özel bir kategorisi vardır." },
        step6: { title: "Başarılarınızı Paylaşın", subtitle: "Vizeler ve Rütbe", content: "Turu tamamladığınızda şehrin dijital Vizesini alacaksınız. Global Sıralama seviyenizle birlikte sosyal ağlarınızda paylaşın!" },
        step7: { title: "Aklınızda Bulundurun", subtitle: "Küçük detaylar", content: "1. GPS çok dar sokaklarda daha az doğru olabilir.\n2. En iyi turları oluşturmam için birkaç saniyeye ihtiyacım var.\n3. Gözlerinizi açık tutun ve yolculuğun tadını çıkarın!" },
        btnNext: "SONRAKI", btnDone: "ANLADIM",
        catHistory: "Tarih", catArt: "Sanat", catFood: "Yemek", catNature: "Doğa", catPhoto: "Foto", catCulture: "Kültür", catArchi: "Mimari", catSpecial: "Özel",
        rankLabel: "Rütbe", visaLabel: "Vize"
    },
    vi: {
        step1: { title: "Chào mừng đến với bdai", subtitle: "Hệ sinh thái Du lịch của bạn", content: "bdai là người bạn đồng hành du lịch thông minh của bạn. Tại đây bạn sẽ khám phá những bí mật được giữ kín nhất của bất kỳ thành phố nào trên thế giới, được hướng dẫn bởi trí tuệ nhân tạo." },
        step2: { title: "Tour Độc đáo", subtitle: "Tạo Thông minh", content: "Tìm kiếm bất kỳ thành phố nào và tôi sẽ tạo ngay 3 tuyến đường theo chủ đề. Không có điểm dừng lặp lại, 100% địa điểm tuyệt vời và viên ngọc ẩn!" },
        step3: { title: "Định vị địa lý", subtitle: "Check-in Thực tế", content: "Để tiến trong tour, bạn phải ở trong phạm vi 50 mét vật lý từ điểm dừng. GPS sẽ xác nhận vị trí của bạn để 'Check-in'." },
        step4: { title: "Dặm & Xếp hạng", subtitle: "Trò chơi hóa Thực tế", content: "Mỗi lần 'Check-in' cho bạn Dặm. Tích lũy dặm để lên cấp trong Bảng xếp hạng Toàn cầu (từ ZERO đến ZENITH). Cạnh tranh với các du khách khác!" },
        step5: { title: "Huy hiệu", subtitle: "Thu thập khám phá của bạn", content: "Kiếm điểm và huy hiệu dựa trên loại địa điểm bạn ghé thăm. Mỗi điểm dừng có một danh mục đặc biệt." },
        step6: { title: "Chia sẻ Thành tích", subtitle: "Thị thực và Hạng", content: "Sau khi hoàn thành tour, bạn sẽ nhận được Thị thực kỹ thuật số của thành phố. Chia sẻ nó trên mạng xã hội cùng với cấp độ Bảng xếp hạng Toàn cầu của bạn!" },
        step7: { title: "Lưu ý", subtitle: "Chi tiết nhỏ", content: "1. GPS có thể kém chính xác hơn trên các con phố rất hẹp.\n2. Tôi cần vài giây để tạo các tour tốt nhất cho bạn.\n3. Hãy mở to mắt và tận hưởng chuyến đi!" },
        btnNext: "TIẾP THEO", btnDone: "ĐÃ HIỂU",
        catHistory: "Lịch sử", catArt: "Nghệ thuật", catFood: "Ẩm thực", catNature: "Thiên nhiên", catPhoto: "Ảnh", catCulture: "Văn hóa", catArchi: "Kiến trúc", catSpecial: "Đặc biệt",
        rankLabel: "Hạng", visaLabel: "Thị thực"
    },
    th: {
        step1: { title: "ยินดีต้อนรับสู่ bdai", subtitle: "ระบบนิเวศการท่องเที่ยวของคุณ", content: "bdai คือเพื่อนร่วมเดินทางอัจฉริยะของคุณ ที่นี่คุณจะค้นพบความลับที่ถูกเก็บรักษาไว้อย่างดีที่สุดของทุกเมืองในโลก โดยได้รับคำแนะนำจากปัญญาประดิษฐ์" },
        step2: { title: "ทัวร์ที่ไม่เหมือนใคร", subtitle: "การสร้างอัจฉริยะ", content: "ค้นหาเมืองใดก็ได้และฉันจะสร้าง 3 เส้นทางตามธีมทันที ไม่มีจุดแวะพักซ้ำ 100% สถานที่ที่น่าทึ่งและอัญมณีที่ซ่อนอยู่!" },
        step3: { title: "การระบุตำแหน่งทางภูมิศาสตร์", subtitle: "เช็คอินจริง", content: "เพื่อก้าวหน้าในทัวร์ คุณต้องอยู่ในระยะ 50 เมตรจากจุดแวะพักทางกายภาพ GPS จะตรวจสอบตำแหน่งของคุณเพื่อ 'เช็คอิน'" },
        step4: { title: "ไมล์และการจัดอันดับ", subtitle: "เกมมิฟิเคชันจริง", content: "ทุกครั้งที่ 'เช็คอิน' คุณได้รับไมล์ สะสมไมล์เพื่อเลื่อนระดับในการจัดอันดับโลก (จาก ZERO ถึง ZENITH) แข่งขันกับนักท่องเที่ยวคนอื่นๆ!" },
        step5: { title: "เหรียญตรา", subtitle: "เก็บสะสมการค้นพบของคุณ", content: "รับคะแนนและเหรียญตราตามประเภทของสถานที่ที่คุณเยี่ยมชม แต่ละจุดแวะพักมีหมวดหมู่พิเศษ" },
        step6: { title: "แบ่งปันความสำเร็จ", subtitle: "วีซ่าและอันดับ", content: "เมื่อทำทัวร์เสร็จ คุณจะได้รับวีซ่าดิจิทัลของเมือง แบ่งปันบนโซเชียลเน็ตเวิร์กพร้อมกับระดับการจัดอันดับโลกของคุณ!" },
        step7: { title: "โปรดทราบ", subtitle: "รายละเอียดเล็กน้อย", content: "1. GPS อาจมีความแม่นยำน้อยลงบนถนนที่แคบมาก\n2. ฉันต้องการเวลาสองสามวินาทีเพื่อสร้างทัวร์ที่ดีที่สุดสำหรับคุณ\n3. เปิดตาให้กว้างและสนุกกับการเดินทาง!" },
        btnNext: "ถัดไป", btnDone: "เข้าใจแล้ว",
        catHistory: "ประวัติศาสตร์", catArt: "ศิลปะ", catFood: "อาหาร", catNature: "ธรรมชาติ", catPhoto: "ภาพถ่าย", catCulture: "วัฒนธรรม", catArchi: "สถาปัตยกรรม", catSpecial: "พิเศษ",
        rankLabel: "อันดับ", visaLabel: "วีซ่า"
    },
};

const getTexts = (language: string) => ONBOARDING_TEXTS[language] || ONBOARDING_TEXTS.en;

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language, user }) => {
    const [step, setStep] = useState(0);
    const t = getTexts(language);

    const steps = [
        {
            title: t.step1.title, subtitle: t.step1.subtitle, content: t.step1.content,
            icon: <BdaiLogo className="w-20 h-20 mb-6 animate-pulse-logo" />
        },
        {
            title: t.step2.title, subtitle: t.step2.subtitle, content: t.step2.content,
            icon: <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/40 border border-blue-400/30"><i className="fas fa-route text-4xl text-white"></i></div>
        },
        {
            title: t.step3.title, subtitle: t.step3.subtitle, content: t.step3.content,
            icon: <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/40 border border-emerald-400/30"><i className="fas fa-location-crosshairs text-4xl text-white"></i></div>
        },
        {
            title: t.step4.title, subtitle: t.step4.subtitle, content: t.step4.content,
            icon: <div className="w-20 h-20 bg-yellow-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-yellow-500/40 border border-yellow-400/30"><i className="fas fa-ranking-star text-4xl text-slate-900"></i></div>
        },
        {
            title: t.step5.title, subtitle: t.step5.subtitle, content: t.step5.content,
            icon: <div className="w-20 h-20 bg-rose-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-rose-500/40 border border-rose-400/30"><i className="fas fa-medal text-4xl text-white"></i></div>,
            customContent: (
                <div className="grid grid-cols-4 gap-3 mt-6">
                    {[
                        { icon: 'fa-landmark', color: 'text-amber-500', label: t.catHistory },
                        { icon: 'fa-palette', color: 'text-pink-500', label: t.catArt },
                        { icon: 'fa-utensils', color: 'text-orange-500', label: t.catFood },
                        { icon: 'fa-leaf', color: 'text-green-500', label: t.catNature },
                        { icon: 'fa-camera', color: 'text-blue-500', label: t.catPhoto },
                        { icon: 'fa-masks-theater', color: 'text-purple-500', label: t.catCulture },
                        { icon: 'fa-building', color: 'text-cyan-500', label: t.catArchi },
                        { icon: 'fa-star', color: 'text-yellow-500', label: t.catSpecial },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className={`w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center ${item.color} mb-1.5 shadow-lg`}>
                                <i className={`fas ${item.icon}`}></i>
                            </div>
                            <span className="text-[7px] font-black uppercase text-slate-400">{item.label}</span>
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: t.step6.title, subtitle: t.step6.subtitle, content: t.step6.content,
            icon: <div className="w-20 h-20 bg-indigo-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/40 border border-indigo-400/30"><i className="fas fa-share-nodes text-4xl text-white"></i></div>,
            customContent: (
                <div className="flex justify-center gap-4 mt-6">
                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl flex items-center gap-3 shadow-lg">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center"><i className="fas fa-crown text-purple-400"></i></div>
                        <span className="text-[10px] font-black uppercase text-white">{t.rankLabel}</span>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl flex items-center gap-3 shadow-lg">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center"><i className="fas fa-passport text-emerald-400"></i></div>
                        <span className="text-[10px] font-black uppercase text-white">{t.visaLabel}</span>
                    </div>
                </div>
            )
        },
        {
            title: t.step7.title, subtitle: t.step7.subtitle, content: t.step7.content,
            icon: <div className="w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/40 border border-orange-400/30"><i className="fas fa-triangle-exclamation text-4xl text-white"></i></div>
        }
    ];

    const currentStep = steps[step];

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#020617] to-[#020617]"></div>
            
            <div className="w-full max-w-md flex flex-col items-center relative z-10 h-full max-h-[850px] justify-center">
                <div className="bg-slate-900/80 border border-white/10 p-8 rounded-[3rem] shadow-2xl backdrop-blur-2xl w-full flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out" style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
                    </div>

                    <div className="mt-4 mb-2 animate-slide-up" key={`icon-${step}`}>
                        {currentStep.icon}
                    </div>
                    
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center leading-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        {currentStep.title}
                    </h2>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mt-3 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        {currentStep.subtitle}
                    </p>
                    
                    <div className="w-full mt-8 p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] relative flex-1 min-h-[180px] flex flex-col justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="text-slate-300 text-sm font-medium leading-relaxed text-center space-y-3">
                            {currentStep.content.split('\n').map((paragraph: string, idx: number) => (
                                <p key={idx}>{paragraph}</p>
                            ))}
                        </div>
                        {currentStep.customContent && (
                            <div className="w-full animate-slide-up" style={{ animationDelay: '0.4s' }}>
                                {currentStep.customContent}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mt-8 mb-8">
                        {steps.map((_, i) => (
                            <button key={i} onClick={() => setStep(i)} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-purple-500' : 'w-2 bg-white/10 hover:bg-white/20'}`} aria-label={`Step ${i + 1}`}></button>
                        ))}
                    </div>

                    <div className="w-full flex gap-3">
                        {step > 0 && (
                            <button onClick={() => setStep(step - 1)} className="w-14 h-14 bg-white/5 text-slate-300 rounded-2xl flex items-center justify-center active:scale-95 transition-all border border-white/10 hover:bg-white/10 shrink-0">
                                <i className="fas fa-chevron-left"></i>
                            </button>
                        )}
                        <button
                            onClick={() => { if (step < steps.length - 1) setStep(step + 1); else onComplete(); }}
                            className="flex-1 h-14 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-white/10 active:scale-95 transition-all hover:bg-slate-100 flex items-center justify-center gap-2"
                        >
                            {step < steps.length - 1 ? (
                                <>{t.btnNext} <i className="fas fa-arrow-right ml-1"></i></>
                            ) : (
                                <><i className="fas fa-check text-green-600 mr-1 text-sm"></i> {t.btnDone}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
