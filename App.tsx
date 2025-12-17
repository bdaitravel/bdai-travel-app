
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES, INTERESTS_LIST, TravelerRank, CityInfo } from './types';
import { generateToursForCity, generateAudio, generateStopDetails, getCityInfo } from './services/geminiService';
import { CityCard } from './components/CityCard';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { SchematicMap } from './components/SchematicMap';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Onboarding } from './components/Onboarding';
import { Shop } from './components/Shop'; 
import { BdaiLogo } from './components/BdaiLogo'; 
import { CurrencyConverter } from './components/CurrencyConverter'; // Import Converter

// --- AUDIO UTILS (PCM DECODER) ---
const base64ToUint8Array = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const pcmToAudioBuffer = (data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000) => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
};

// --- TRANSLATIONS DICTIONARY (FULL) ---
const TRANSLATIONS: any = {
  en: {
    login: "Login", register: "Register", signin: "Sign In", createAccount: "Start Adventure",
    name: "First Name", surname: "Last Name", email: "Email", password: "Password", birthDate: "Birth Date",
    invalidEmail: "Invalid email", passShort: "Password too short", nameReq: "Name fields required", dateReq: "Birth date required",
    welcome: "Hello,", whereTo: "Where are we going today?",
    explore: "Explore", passport: "Passport", shop: "Shop", connect: "Connect",
    myPassport: "My Passport", edit: "Edit", save: "Save", signOut: "Sign Out",
    ranking: "Ranking", shopComing: "Coming soon", baseCity: "Base City", bio: "Bio / Manifesto",
    surnameLabel: "Surname / Nom", givenNameLabel: "Given Names / Prénoms", dateIssue: "Date of Issue",
    avatarUrl: "Change Photo", share: "Share Achievements", visitedPlaces: "Visited Places",
    toursDone: "Tours Completed", miles: "Total Miles", shareText: "Check out my travel stats on Bdai!",
    nextLevel: "Next Level", aiMemory: "AI Trip Memory", generate: "Generate",
    culturePoints: "Culture", foodPoints: "Gastronomy", photoPoints: "Photography",
    username: "Username", usernameReq: "Username required", publicProfile: "Public Profile", rankingVisibility: "Visible in Global Ranking",
    privateProfile: "Private Profile",
    featuredRegion: "La Rioja Experience",
    spainDestinations: "Spain Highlights",
    topWorldDestinations: "World Top 5",
    worldDestinations: "Europe Classics",
    asiaDestinations: "Exotic Asia",
    americasDestinations: "The Americas",
    africaDestinations: "Magic Africa",
    searchPlaceholder: "Search any city (e.g. Kyoto, Lima)...",
    downloadOffline: "Download Offline",
    tools: "Travel Tools",
    cityIntel: "City Intel",
    loadingIntel: "AI Analyzing city data...",
    transportLabel: "Transport",
    bestTimeLabel: "Best Time",
    dishLabel: "Local Dish",
    costLabel: "Cost",
    heroTitle: "Discover the World",
    heroSubtitle: "Free Tours & Smart Travel",
    lingoLabel: "Speak Like a Local",
    aiPersonalizing: "Personalizing for you...",
    aiMatching: "Matching interests..."
  },
  es: {
    login: "Entrar", register: "Registrarse", signin: "Entrar", createAccount: "Empezar Aventura",
    name: "Nombre", surname: "Apellidos", email: "Email", password: "Contraseña", birthDate: "Fecha Nacimiento",
    invalidEmail: "Email inválido", passShort: "Contraseña muy corta", nameReq: "Nombre y apellidos requeridos", dateReq: "Fecha de nacimiento requerida",
    welcome: "Hola,", whereTo: "¿Dónde vamos hoy?",
    explore: "Explorar", passport: "Pasaporte", shop: "Tienda", connect: "Conectar",
    myPassport: "Mi Pasaporte", edit: "Editar", save: "Guardar", signOut: "Cerrar Sesión",
    ranking: "Ranking", shopComing: "Próximamente", baseCity: "Ciudad Base", bio: "Bio / Manifiesto",
    surnameLabel: "Apellidos / Nom", givenNameLabel: "Nombre / Prénoms", dateIssue: "Fecha Expedición",
    avatarUrl: "Cambiar Foto", share: "Compartir Hitos", visitedPlaces: "Sitios Visitados",
    toursDone: "Tours Completados", miles: "Millas BDAI", shareText: "¡Mira mis estadísticas de viaje en Bdai!",
    nextLevel: "Siguiente Nivel", aiMemory: "Memoria IA de Viaje", generate: "Generar",
    culturePoints: "Cultura", foodPoints: "Gastronomía", photoPoints: "Fotografía",
    username: "Usuario", usernameReq: "Usuario requerido", publicProfile: "Perfil Público", rankingVisibility: "Visible en Ranking Global",
    privateProfile: "Perfil Privado",
    featuredRegion: "La Rioja",
    spainDestinations: "Joyas de España",
    topWorldDestinations: "Top Mundial",
    worldDestinations: "Europa Clásica",
    asiaDestinations: "Asia Exótica",
    americasDestinations: "Las Américas",
    africaDestinations: "África Mágica",
    searchPlaceholder: "Busca cualquier ciudad (ej. Kyoto, Lima)...",
    downloadOffline: "Descargar Offline",
    tools: "Herramientas",
    cityIntel: "Info Práctica",
    loadingIntel: "IA Analizando ciudad...",
    transportLabel: "Transporte",
    bestTimeLabel: "Mejor Época",
    dishLabel: "Plato Típico",
    costLabel: "Coste",
    heroTitle: "Descubre el Mundo",
    heroSubtitle: "Free Tours y Viajes Inteligentes",
    lingoLabel: "Habla como un Local",
    aiPersonalizing: "Personalizando para ti...",
    aiMatching: "Cruzando intereses..."
  },
  ca: {
    login: "Entrar", register: "Registrar-se", signin: "Inicia sessió", createAccount: "Comença l'Aventura",
    name: "Nom", surname: "Cognoms", email: "Correu", password: "Contrasenya", birthDate: "Data Naixement",
    invalidEmail: "Correu invàlid", passShort: "Contrasenya curta", nameReq: "Camps requerits", dateReq: "Data requerida",
    welcome: "Hola,", whereTo: "On anem avui?",
    explore: "Explorar", passport: "Passaport", shop: "Botiga", connect: "Connectar",
    myPassport: "El Meu Passaport", edit: "Editar", save: "Desa", signOut: "Tanca Sessió",
    ranking: "Rànquing", shopComing: "Properament", baseCity: "Ciutat Base", bio: "Bio",
    surnameLabel: "Cognoms", givenNameLabel: "Nom", dateIssue: "Data Expedició",
    avatarUrl: "Canvia Foto", share: "Comparteix", visitedPlaces: "Llocs Visitats",
    toursDone: "Tours Fets", miles: "Milles BDAI", shareText: "Mira les meves estadístiques a Bdai!",
    nextLevel: "Següent Nivell", aiMemory: "Memòria IA", generate: "Generar",
    culturePoints: "Cultura", foodPoints: "Gastronomia", photoPoints: "Fotografia",
    username: "Usuari", usernameReq: "Usuari requerit", publicProfile: "Perfil Públic", rankingVisibility: "Visible al Rànquing",
    privateProfile: "Perfil Privat",
    featuredRegion: "La Rioja", spainDestinations: "Joies d'Espanya", topWorldDestinations: "Top Mundial",
    worldDestinations: "Europa Clàssica", asiaDestinations: "Àsia Exòtica", americasDestinations: "Amèrica", africaDestinations: "Àfrica Màgica",
    searchPlaceholder: "Cerca qualsevol ciutat...", downloadOffline: "Descarregar", tools: "Eines",
    cityIntel: "Info Pràctica", loadingIntel: "IA Analitzant...", transportLabel: "Transport", bestTimeLabel: "Millor Època",
    dishLabel: "Plat Típic", costLabel: "Cost", heroTitle: "Descobreix el Món", heroSubtitle: "Free Tours i Viatges Intel·ligents",
    lingoLabel: "Parla com un local", aiPersonalizing: "Personalitzant...", aiMatching: "Creuant interessos..."
  },
  eu: {
    login: "Sartu", register: "Erregistratu", signin: "Hasi saioa", createAccount: "Hasi Abentura",
    name: "Izena", surname: "Abizenak", email: "Emaila", password: "Pasahitza", birthDate: "Jaiotze data",
    invalidEmail: "Email okerra", passShort: "Pasahitz laburregia", nameReq: "Izena beharrezkoa", dateReq: "Data beharrezkoa",
    welcome: "Kaixo,", whereTo: "Nora goaz gaur?",
    explore: "Arakatu", passport: "Pasaportea", shop: "Denda", connect: "Konektatu",
    myPassport: "Nire Pasaportea", edit: "Editatu", save: "Gorde", signOut: "Saioa itxi",
    ranking: "Sailkapena", shopComing: "Laster", baseCity: "Oinarrizko Hiria", bio: "Bio",
    surnameLabel: "Abizenak", givenNameLabel: "Izena", dateIssue: "Jaulkipen Data",
    avatarUrl: "Aldatu Argazkia", share: "Partekatu", visitedPlaces: "Bisitatutako Lekuak",
    toursDone: "Egindako Tours", miles: "BDAI Milak", shareText: "Ikusi nire bidaiak Bdai-n!",
    nextLevel: "Hurrengo Maila", aiMemory: "IA Oroimena", generate: "Sortu",
    culturePoints: "Kultura", foodPoints: "Gastronomia", photoPoints: "Argazkilaritza",
    username: "Erabiltzailea", usernameReq: "Erabiltzailea beharrezkoa", publicProfile: "Profil Publikoa", rankingVisibility: "Ikusgai Sailkapenean",
    privateProfile: "Profil Pribatua",
    featuredRegion: "Errioxa", spainDestinations: "Espainiako Harribitxiak", topWorldDestinations: "Munduko Top",
    worldDestinations: "Europa Klasikoa", asiaDestinations: "Asia Exotikoa", americasDestinations: "Amerikak", africaDestinations: "Afrika Magikoa",
    searchPlaceholder: "Bilatu edozein hiri...", downloadOffline: "Deskargatu", tools: "Tresnak",
    cityIntel: "Info Praktikoa", loadingIntel: "IA Aztertzen...", transportLabel: "Garraioa", bestTimeLabel: "Garai Onena",
    dishLabel: "Plater Tipikoa", costLabel: "Kostua", heroTitle: "Mundua Ezagutu", heroSubtitle: "Doako Tours eta Bidaia Adimendunak",
    lingoLabel: "Tokiko Hizkera", aiPersonalizing: "Pertsonalizatzen...", aiMatching: "Interesak lotzen..."
  },
  fr: {
    login: "Connexion", register: "S'inscrire", signin: "Se connecter", createAccount: "Commencer",
    name: "Prénom", surname: "Nom", email: "Email", password: "Mot de passe", birthDate: "Date de naissance",
    invalidEmail: "Email invalide", passShort: "Mot de passe court", nameReq: "Nom requis", dateReq: "Date requise",
    welcome: "Bonjour,", whereTo: "Où allons-nous ?",
    explore: "Explorer", passport: "Passeport", shop: "Boutique", connect: "Connecter",
    myPassport: "Mon Passeport", edit: "Modifier", save: "Enregistrer", signOut: "Déconnexion",
    ranking: "Classement", shopComing: "Bientôt", baseCity: "Ville de base", bio: "Bio",
    surnameLabel: "Nom", givenNameLabel: "Prénoms", dateIssue: "Date d'émission",
    avatarUrl: "Changer photo", share: "Partager", visitedPlaces: "Lieux visités",
    toursDone: "Tours finis", miles: "Miles BDAI", shareText: "Regardez mes stats sur Bdai !",
    nextLevel: "Niveau suivant", aiMemory: "Mémoire IA", generate: "Générer",
    culturePoints: "Culture", foodPoints: "Gastronomie", photoPoints: "Photo",
    username: "Pseudo", usernameReq: "Pseudo requis", publicProfile: "Profil Public", rankingVisibility: "Visible au classement",
    privateProfile: "Profil Privé",
    featuredRegion: "La Rioja", spainDestinations: "Espagne", topWorldDestinations: "Top Monde",
    worldDestinations: "Europe", asiaDestinations: "Asie", americasDestinations: "Amériques", africaDestinations: "Afrique",
    searchPlaceholder: "Chercher une ville...", downloadOffline: "Télécharger", tools: "Outils",
    cityIntel: "Infos Ville", loadingIntel: "Analyse IA...", transportLabel: "Transport", bestTimeLabel: "Meilleur moment",
    dishLabel: "Plat local", costLabel: "Coût", heroTitle: "Découvrir le Monde", heroSubtitle: "Free Tours et Voyage Intelligent",
    lingoLabel: "Parler local", aiPersonalizing: "Personnalisation...", aiMatching: "Analyse intérêts..."
  },
  de: {
    login: "Anmelden", register: "Registrieren", signin: "Einloggen", createAccount: "Starten",
    name: "Vorname", surname: "Nachname", email: "E-Mail", password: "Passwort", birthDate: "Geburtsdatum",
    invalidEmail: "Ungültige E-Mail", passShort: "Passwort zu kurz", nameReq: "Name erforderlich", dateReq: "Datum erforderlich",
    welcome: "Hallo,", whereTo: "Wohin geht's?",
    explore: "Entdecken", passport: "Pass", shop: "Shop", connect: "Verbinden",
    myPassport: "Mein Pass", edit: "Bearbeiten", save: "Speichern", signOut: "Abmelden",
    ranking: "Rangliste", shopComing: "Bald verfügbar", baseCity: "Basisstadt", bio: "Bio",
    surnameLabel: "Nachname", givenNameLabel: "Vorname", dateIssue: "Ausstellungsdatum",
    avatarUrl: "Foto ändern", share: "Teilen", visitedPlaces: "Besuchte Orte",
    toursDone: "Touren", miles: "Meilen", shareText: "Sieh dir meine Reisen auf Bdai an!",
    nextLevel: "Nächstes Level", aiMemory: "KI-Speicher", generate: "Erstellen",
    culturePoints: "Kultur", foodPoints: "Essen", photoPoints: "Foto",
    username: "Benutzer", usernameReq: "Benutzer erforderlich", publicProfile: "Öffentlich", rankingVisibility: "Sichtbar",
    privateProfile: "Privat",
    featuredRegion: "La Rioja", spainDestinations: "Spanien", topWorldDestinations: "Welt Top",
    worldDestinations: "Europa", asiaDestinations: "Asien", americasDestinations: "Amerika", africaDestinations: "Afrika",
    searchPlaceholder: "Stadt suchen...", downloadOffline: "Download", tools: "Werkzeuge",
    cityIntel: "Stadt-Info", loadingIntel: "KI analysiert...", transportLabel: "Verkehr", bestTimeLabel: "Beste Zeit",
    dishLabel: "Gericht", costLabel: "Kosten", heroTitle: "Entdecke die Welt", heroSubtitle: "Kostenlose Touren & Intelligentes Reisen",
    lingoLabel: "Lokale Sprache", aiPersonalizing: "Personalisierung...", aiMatching: "Interessen..."
  },
  pt: {
    login: "Entrar", register: "Registar", signin: "Entrar", createAccount: "Começar",
    name: "Nome", surname: "Apelido", email: "Email", password: "Senha", birthDate: "Nascimento",
    invalidEmail: "Email inválido", passShort: "Senha curta", nameReq: "Nome necesario", dateReq: "Data necesaria",
    welcome: "Olá,", whereTo: "Para onde vamos?",
    explore: "Explorar", passport: "Passaporte", shop: "Loja", connect: "Conectar",
    myPassport: "Meu Passaporte", edit: "Editar", save: "Salvar", signOut: "Sair",
    ranking: "Ranking", shopComing: "Em breve", baseCity: "Cidade Base", bio: "Bio",
    surnameLabel: "Apelido", givenNameLabel: "Nome", dateIssue: "Data Emissão",
    avatarUrl: "Mudar Foto", share: "Partilhar", visitedPlaces: "Lugares Visitados",
    toursDone: "Tours", miles: "Milhas", shareText: "Vê as minhas viagens no Bdai!",
    nextLevel: "Próximo Nível", aiMemory: "Memória IA", generate: "Gerar",
    culturePoints: "Cultura", foodPoints: "Gastronomia", photoPoints: "Foto",
    username: "Utilizador", usernameReq: "Utilizador necesario", publicProfile: "Público", rankingVisibility: "Visível",
    privateProfile: "Privado",
    featuredRegion: "La Rioja", spainDestinations: "Espanha", topWorldDestinations: "Top Mundo",
    worldDestinations: "Europa", asiaDestinations: "Ásia", americasDestinations: "Américas", africaDestinations: "África",
    searchPlaceholder: "Procurar cidade...", downloadOffline: "Baixar", tools: "Ferramentas",
    cityIntel: "Info Cidade", loadingIntel: "IA Analisando...", transportLabel: "Transporte", bestTimeLabel: "Melhor Época",
    dishLabel: "Prato Local", costLabel: "Custo", heroTitle: "Descobre o Mundo", heroSubtitle: "Free Tours e Viagem Inteligente",
    lingoLabel: "Falar Local", aiPersonalizing: "Personalizando...", aiMatching: "Interesses..."
  },
  zh: {
    login: "登录", register: "注册", signin: "登录", createAccount: "开始冒险",
    name: "名字", surname: "姓氏", email: "邮箱", password: "密码", birthDate: "出生日期",
    invalidEmail: "无效邮箱", passShort: "密码太短", nameReq: "需要姓名", dateReq: "需要日期",
    welcome: "你好,", whereTo: "今天去哪里？",
    explore: "探索", passport: "护照", shop: "商店", connect: "连接",
    myPassport: "我的护照", edit: "编辑", save: "保存", signOut: "退出",
    ranking: "排名", shopComing: "即将推出", baseCity: "居住城市", bio: "简介",
    surnameLabel: "姓", givenNameLabel: "名", dateIssue: "签发日期",
    avatarUrl: "更改照片", share: "分享", visitedPlaces: "访问地点",
    toursDone: "完成旅程", miles: "里程", shareText: "查看我的Bdai旅行数据！",
    nextLevel: "下一级", aiMemory: "AI记忆", generate: "生成",
    culturePoints: "文化", foodPoints: "美食", photoPoints: "摄影",
    username: "用户名", usernameReq: "需要用户名", publicProfile: "公开", rankingVisibility: "可见",
    privateProfile: "私密",
    featuredRegion: "里奥哈", spainDestinations: "西班牙", topWorldDestinations: "世界精选",
    worldDestinations: "欧洲", asiaDestinations: "亚洲", americasDestinations: "美洲", africaDestinations: "非洲",
    searchPlaceholder: "搜索城市...", downloadOffline: "下载", tools: "工具",
    cityIntel: "城市信息", loadingIntel: "AI分析中...", transportLabel: "交通", bestTimeLabel: "最佳时间",
    dishLabel: "特色菜", costLabel: "费用", heroTitle: "探索世界", heroSubtitle: "免费游览 & 智能旅行",
    lingoLabel: "像本地人一样说话", aiPersonalizing: "个性化中...", aiMatching: "匹配兴趣..."
  },
  ja: {
    login: "ログイン", register: "登録", signin: "ログイン", createAccount: "冒険を始める",
    name: "名前", surname: "名字", email: "メール", password: "パスワード", birthDate: "生年月日",
    invalidEmail: "無効なメール", passShort: "パスワードが短すぎます", nameReq: "名前が必要です", dateReq: "日付が必要です",
    welcome: "こんにちは、", whereTo: "今日はどこへ？",
    explore: "探索", passport: "パスポート", shop: "ショップ", connect: "接続",
    myPassport: "マイパスポート", edit: "編集", save: "保存", signOut: "ログアウト",
    ranking: "ランキング", shopComing: "近日公開", baseCity: "拠点都市", bio: "自己紹介",
    surnameLabel: "姓", givenNameLabel: "名", dateIssue: "発行日",
    avatarUrl: "写真変更", share: "共有", visitedPlaces: "訪問地",
    toursDone: "完了ツアー", miles: "マイル", shareText: "Bdaiでの旅行記録を見て！",
    nextLevel: "次のレベル", aiMemory: "AIメモリー", generate: "生成",
    culturePoints: "文化", foodPoints: "美食", photoPoints: "写真",
    username: "ユーザー名", usernameReq: "必須", publicProfile: "公開", rankingVisibility: "表示",
    privateProfile: "非公開",
    featuredRegion: "ラ・リオハ", spainDestinations: "スペイン", topWorldDestinations: "世界トップ",
    worldDestinations: "ヨーロッパ", asiaDestinations: "アジア", americasDestinations: "アメリカ", africaDestinations: "アフリカ",
    searchPlaceholder: "都市を検索...", downloadOffline: "ダウンロード", tools: "ツール",
    cityIntel: "都市情報", loadingIntel: "AI分析中...", transportLabel: "交通", bestTimeLabel: "ベストシーズン",
    dishLabel: "名物料理", costLabel: "費用", heroTitle: "世界を発見", heroSubtitle: "無料ツアー ＆ スマートトラベル",
    lingoLabel: "地元の言葉", aiPersonalizing: "パーソナライズ中...", aiMatching: "興味を分析中..."
  },
  ar: {
    login: "دخول", register: "تسجيل", signin: "دخول", createAccount: "ابدأ المغامرة",
    name: "الاسم", surname: "اللقب", email: "البريد", password: "كلمة السر", birthDate: "تاريخ الميلاد",
    invalidEmail: "بريد غير صالح", passShort: "كلمة السر قصيرة", nameReq: "الاسم مطلوب", dateReq: "التاريخ مطلوب",
    welcome: "مرحباً،", whereTo: "إلى أين اليوم؟",
    explore: "استكشف", passport: "جواز السفر", shop: "المتجر", connect: "تواصل",
    myPassport: "جوازي", edit: "تعديل", save: "حفظ", signOut: "خروج",
    ranking: "الترتيب", shopComing: "قريباً", baseCity: "المدينة", bio: "نبذة",
    surnameLabel: "اللقب", givenNameLabel: "الاسم", dateIssue: "تاريخ الإصدار",
    avatarUrl: "تغيير الصورة", share: "مشاركة", visitedPlaces: "أماكن تمت زيارتها",
    toursDone: "جولات مكتملة", miles: "أميال", shareText: "شاهد إحصائيات سفري!",
    nextLevel: "المستوى التالي", aiMemory: "ذاكرة AI", generate: "توليد",
    culturePoints: "ثقافة", foodPoints: "طعام", photoPoints: "صور",
    username: "اسم المستخدم", usernameReq: "مطلوب", publicProfile: "عام", rankingVisibility: "مرئي",
    privateProfile: "خاص",
    featuredRegion: "لاريوخا", spainDestinations: "إسبانيا", topWorldDestinations: "الأفضل عالمياً",
    worldDestinations: "أوروبا", asiaDestinations: "آسيا", americasDestinations: "الأمريكيتان", africaDestinations: "أفريقيا",
    searchPlaceholder: "ابحث عن مدينة...", downloadOffline: "تحميل", tools: "أدوات",
    cityIntel: "معلومات المدينة", loadingIntel: "تحليل AI...", transportLabel: "نقل", bestTimeLabel: "أفضل وقت",
    dishLabel: "طبق محلي", costLabel: "تكلفة", heroTitle: "اكتشف العالم", heroSubtitle: "جولات مجانية وسفر ذكي",
    lingoLabel: "تحدث كالمحليين", aiPersonalizing: "تخصيص...", aiMatching: "مطابقة الاهتمامات..."
  }
};

// --- INITIAL DATA ---
const INITIAL_USER: UserProfile = {
  id: 'u1', 
  isLoggedIn: false, 
  firstName: 'Alex', 
  lastName: 'Traveler', 
  name: 'Alex Traveler', 
  username: 'alextravels', 
  email: 'alex@bdai.com', 
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', 
  language: 'es', 
  miles: 1250, 
  rank: 'Explorador',
  culturePoints: 800,
  foodPoints: 300,
  photoPoints: 150,
  interests: ['History', 'Food & Drink'], 
  accessibility: 'standard', 
  isPublic: true, 
  bio: 'Exploring the world one story at a time.', 
  age: 28, 
  country: 'Spain', 
  city: 'Madrid', 
  passportNumber: 'bdai-8829-X',
  joinDate: 'Dec 2023',
  badges: [{ id: 'b1', name: 'Early Adopter', icon: 'fa-rocket', description: 'Joined the beta.' }], 
  visitedCities: ['Logroño', 'Madrid', 'Calahorra'], 
  completedTours: ['Logroño: The Laurel Path']
};

// --- GAMIFICATION LOGIC ---
const RANKS: { name: TravelerRank; minMiles: number; color: string }[] = [
    { name: 'Turista', minMiles: 0, color: 'text-slate-500' },
    { name: 'Explorador', minMiles: 1000, color: 'text-green-600' },
    { name: 'Wanderer', minMiles: 5000, color: 'text-blue-600' },
    { name: 'Globe-Trotter', minMiles: 15000, color: 'text-purple-600' },
    { name: 'Leyenda del Viaje', minMiles: 40000, color: 'text-amber-500' }
];

const calculateRank = (miles: number): TravelerRank => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (miles >= RANKS[i].minMiles) return RANKS[i].name;
    }
    return 'Turista';
};

const getNextRank = (currentRank: TravelerRank) => {
    const idx = RANKS.findIndex(r => r.name === currentRank);
    return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
};


// SEPARATE DATA SETS FOR LAYOUT - ROADMAP ALIGNED (UPDATED IMAGES)
const SPAIN_CITIES = [
  { name: 'Barcelona', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80', desc: 'Sagrada Familia y Gaudí.' },
  { name: 'Madrid', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80', desc: 'Gran Vía y Secretos.' },
  { name: 'Sevilla', image: 'https://images.unsplash.com/photo-1621590393529-6330364e9766?auto=format&fit=crop&w=800&q=80', desc: 'Plaza de España y Color.' },
  { name: 'Granada', image: 'https://images.unsplash.com/photo-1620663436028-2f831c28b792?auto=format&fit=crop&w=800&q=80', desc: 'La Alhambra Eterna.' },
  { name: 'Valencia', image: 'https://images.unsplash.com/photo-1571216686313-20293946ca35?auto=format&fit=crop&w=800&q=80', desc: 'Artes, Ciencias y Paella.' },
  { name: 'Bilbao', image: 'https://images.unsplash.com/photo-1598522338072-4d43177727e4?auto=format&fit=crop&w=800&q=80', desc: 'Guggenheim y Pinchos.' },
  { name: 'Málaga', image: 'https://images.unsplash.com/photo-1563728736634-192661334c9c?auto=format&fit=crop&w=800&q=80', desc: 'Costa del Sol y Picasso.' },
  { name: 'San Sebastián', image: 'https://images.unsplash.com/photo-1573220464670-68e4c734e764?auto=format&fit=crop&w=800&q=80', desc: 'La Concha y Gastronomía.' },
  { name: 'Santiago', image: 'https://images.unsplash.com/photo-1588697960177-33a7637841cc?auto=format&fit=crop&w=800&q=80', desc: 'Catedral y Peregrinos.' },
  { name: 'Cádiz', image: 'https://images.unsplash.com/photo-1596032274476-7472bd4337d1?auto=format&fit=crop&w=800&q=80', desc: 'La Tacita de Plata.' },
  { name: 'Toledo', image: 'https://images.unsplash.com/photo-1563820464670-68e4c734e764?auto=format&fit=crop&w=800&q=80', desc: 'Ciudad Imperial.' },
];

const WORLD_CITIES = [
  { name: 'Miami', image: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&w=800&q=80', desc: 'South Beach & Art Deco.' },
  { name: 'Milán', image: 'https://images.unsplash.com/photo-1517438421733-875dfd869482?auto=format&fit=crop&w=800&q=80', desc: 'Moda y Duomo.' },
  { name: 'Sydney', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80', desc: 'Opera House.' },
  { name: 'Kuala Lumpur', image: 'https://images.unsplash.com/photo-1602492652796-7c9d69a40347?auto=format&fit=crop&w=800&q=80', desc: 'Petronas Towers.' },
  { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', desc: 'Times Square & Dreams.' },
  { name: 'Tokyo', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80', desc: 'Shibuya & Neon.' },
  { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', desc: 'Eiffel & Amour.' },
  { name: 'Roma', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80', desc: 'Coliseo Eterno.' },
  { name: 'Bali', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', desc: 'Templos y Arrozales.' },
];

const EUROPE_CITIES = [
  { name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', desc: 'Big Ben & History.' },
  { name: 'Berlin', image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=80', desc: 'Brandenburgo.' },
  { name: 'Lisboa', image: 'https://images.unsplash.com/photo-1558102824-9b24f506294f?auto=format&fit=crop&w=800&q=80', desc: 'Tranvía 28 & Luz.' },
  { name: 'Amsterdam', image: 'https://images.unsplash.com/photo-1512470876302-6a084e5480f3?auto=format&fit=crop&w=800&q=80', desc: 'Canals & Bikes.' },
  { name: 'Prague', image: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=800&q=80', desc: 'Charles Bridge.' },
  { name: 'Estambul', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80', desc: 'Santa Sofía.' },
  { name: 'Viena', image: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=800&q=80', desc: 'Palacios Imperiales.' },
];

const ASIA_CITIES = [
  { name: 'Bangkok', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80', desc: 'Wat Arun & Chaos.' },
  { name: 'Kyoto', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80', desc: 'Fushimi Inari.' },
  { name: 'Seoul', image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80', desc: 'Gyeongbokgung.' },
  { name: 'Shanghai', image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9?auto=format&fit=crop&w=800&q=80', desc: 'The Bund.' },
  { name: 'Singapore', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80', desc: 'Marina Bay Sands.' },
  { name: 'Hong Kong', image: 'https://images.unsplash.com/photo-1506318137071-a8bcbf90d179?auto=format&fit=crop&w=800&q=80', desc: 'Victoria Peak.' },
  { name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea904ac66de?auto=format&fit=crop&w=800&q=80', desc: 'Burj Khalifa.' },
];

const AMERICAS_CITIES = [
  { name: 'Buenos Aires', image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=800&q=80', desc: 'Obelisco & Tango.' },
  { name: 'Mexico City', image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=800&q=80', desc: 'Zócalo & Bellas Artes.' },
  { name: 'Rio de Janeiro', image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80', desc: 'Cristo & Copacabana.' },
  { name: 'La Habana', image: 'https://images.unsplash.com/photo-1503424886307-b090341d25d1?auto=format&fit=crop&w=800&q=80', desc: 'Capitolio & Clásicos.' },
  { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', desc: 'Manhattan Skyline.' },
  { name: 'Cusco', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&w=800&q=80', desc: 'Puerta a Machu Picchu.' },
  { name: 'Cartagena', image: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?auto=format&fit=crop&w=800&q=80', desc: 'Murallas & Color.' },
  { name: 'San Francisco', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80', desc: 'Golden Gate Bridge.' },
];

const AFRICA_CITIES = [
  { name: 'Cairo', image: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80', desc: 'Giza Pyramids.' },
  { name: 'Marrakech', image: 'https://images.unsplash.com/photo-1597211684694-8f2382996141?auto=format&fit=crop&w=800&q=80', desc: 'Jemaa el-Fnaa.' },
  { name: 'Cape Town', image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=800&q=80', desc: 'Table Mountain View.' },
  { name: 'Zanzibar', image: 'https://images.unsplash.com/photo-1586861635167-e5223aeb4227?auto=format&fit=crop&w=800&q=80', desc: 'Stone Town & Blue.' },
  { name: 'Casablanca', image: 'https://images.unsplash.com/photo-1576675466969-38eeae4b41f6?auto=format&fit=crop&w=800&q=80', desc: 'Hassan II Mosque.' },
  { name: 'Nairobi', image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=800&q=80', desc: 'City & Savanna.' },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { id: 'u2', name: 'Sarah J.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', miles: 5400, rank: 2, isPublic: true },
    { id: 'u3', name: 'Mike T.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', miles: 4200, rank: 3, isPublic: true },
    { id: 'u4', name: 'Elena R.', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9', miles: 3800, rank: 4, isPublic: true },
];

// Helper Component for Horizontal Scroll with Arrows
const SectionRow = ({ title, markerColor, children }: { title: string, markerColor: string, children?: React.ReactNode }) => {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (offset: number) => {
        if (rowRef.current) {
            rowRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        }
    };

    return (
        <div className="px-6 mb-8 relative group">
            <div className="flex items-center gap-2 mb-4">
                <div className={`w-1 h-6 ${markerColor} rounded-full`}></div>
                <h3 className="font-heading font-bold text-xl text-slate-800">{title}</h3>
            </div>
            
            <div className="relative -mx-6 px-6"> 
                {/* Left Arrow */}
                <button 
                    onClick={() => scroll(-280)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-slate-800 border border-slate-100 hover:bg-white hover:scale-110 active:scale-95 transition-all hidden group-hover:flex"
                    aria-label="Scroll left"
                >
                    <i className="fas fa-chevron-left text-sm"></i>
                </button>

                {/* Content Container */}
                <div ref={rowRef} className="overflow-x-auto no-scrollbar flex gap-4 pb-4 snap-x snap-mandatory">
                     {children}
                </div>

                {/* Right Arrow */}
                <button 
                    onClick={() => scroll(280)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-slate-800 border border-slate-100 hover:bg-white hover:scale-110 active:scale-95 transition-all hidden group-hover:flex"
                    aria-label="Scroll right"
                >
                    <i className="fas fa-chevron-right text-sm"></i>
                </button>
            </div>
        </div>
    );
};

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [tours, setTours] = useState<Tour[]>([]);
  const [cityInfo, setCityInfo] = useState<CityInfo | null>(null);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isLoadingTours, setIsLoadingTours] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [selectedLeaderboardUser, setSelectedLeaderboardUser] = useState<LeaderboardEntry | null>(null);
  const [showAiMemory, setShowAiMemory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      username: '',
      birthDate: '',
      isPublic: true
  });
  const [authError, setAuthError] = useState('');

  const [isEditingPassport, setIsEditingPassport] = useState(false);
  const [passportForm, setPassportForm] = useState({
      firstName: '',
      lastName: '',
      username: '',
      city: '',
      bio: '',
      avatar: '',
      isPublic: user.isPublic
  });

  const t = (key: string) => {
      // Robust fallback logic
      const dict = TRANSLATIONS[user.language] || TRANSLATIONS['en'];
      return dict[key] || TRANSLATIONS['en'][key] || key;
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn("GPS Error", err),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
     const newRank = calculateRank(user.miles);
     if (newRank !== user.rank) {
         setUser(prev => ({ ...prev, rank: newRank }));
     }
  }, [user.miles]);

  // --- HANDLERS ---
  const handleAuthSubmit = () => {
      setAuthError('');
      if (!authForm.email || !authForm.email.includes('@')) { setAuthError(t('invalidEmail')); return; }
      if (!authForm.password || authForm.password.length < 4) { setAuthError(t('passShort')); return; }

      if (authMode === 'register') {
          if (!authForm.firstName || !authForm.lastName) { setAuthError(t('nameReq')); return; }
          if (!authForm.username) { setAuthError(t('usernameReq')); return; }
          if (!authForm.birthDate) { setAuthError(t('dateReq')); return; }

          setUser({
              ...INITIAL_USER,
              isLoggedIn: true,
              firstName: authForm.firstName,
              lastName: authForm.lastName,
              name: `${authForm.firstName} ${authForm.lastName}`,
              username: authForm.username,
              email: authForm.email,
              isPublic: authForm.isPublic,
              joinDate: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
              language: user.language
          });
      } else {
          setUser({ ...user, isLoggedIn: true });
      }
      setView(AppView.WELCOME);
  };

  const handleCitySelect = async (city: string) => {
    setSelectedCity(city);
    setIsLoadingTours(true);
    setCityInfo(null);
    setView(AppView.CITY_DETAIL);
    
    try {
        const [generatedTours, generatedInfo] = await Promise.all([
            // Pass user interests to personalization engine
            generateToursForCity(city, user.language, user.interests),
            getCityInfo(city, user.language)
        ]);
        setTours(generatedTours);
        setCityInfo(generatedInfo);
    } catch (e) { 
        console.error(e); 
    } finally { 
        setIsLoadingTours(false); 
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
          handleCitySelect(searchQuery);
          setSearchQuery('');
      }
  };

  const handleTourSelect = (tour: Tour) => {
      setActiveTour(tour);
      setCurrentStopIndex(0);
      setView(AppView.TOUR_ACTIVE);
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
    }
    if (audioPlayingId === id) {
        setAudioPlayingId(null);
        return;
    }
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    setAudioLoadingId(id);
    
    try {
        const base64Audio = await generateAudio(text);
        if (!base64Audio) throw new Error("No audio returned");
        const pcmBytes = base64ToUint8Array(base64Audio);
        const audioBuffer = pcmToAudioBuffer(pcmBytes, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setAudioPlayingId(null);
            audioSourceRef.current = null;
        };
        source.start(0);
        audioSourceRef.current = source;
        setAudioPlayingId(id);
    } catch (e) { 
        console.error("Audio playback failed", e);
        alert("Audio playback failed. The model might be busy.");
    } finally { 
        setAudioLoadingId(null); 
    }
  };

  const handleCheckIn = (stopId: string, baseMiles: number, stopType: string) => {
      if (!activeTour) return;
      const updatedStops = activeTour.stops.map(s => s.id === stopId ? { ...s, visited: true } : s);
      setActiveTour({ ...activeTour, stops: updatedStops });
      let foodBonus = 0; let photoBonus = 0; let cultureBonus = 0;
      if (stopType === 'food') foodBonus = 50;
      if (stopType === 'photo') photoBonus = 100;
      if (stopType === 'historical' || stopType === 'art') cultureBonus = 50;

      setUser(prev => ({
          ...prev,
          miles: prev.miles + baseMiles,
          foodPoints: prev.foodPoints + foodBonus,
          photoPoints: prev.photoPoints + photoBonus,
          culturePoints: prev.culturePoints + cultureBonus,
          visitedCities: !prev.visitedCities.includes(activeTour.city) ? [...prev.visitedCities, activeTour.city] : prev.visitedCities
      }));
  };

  const handleEnrichStop = async (stopId: string) => {
      if (!activeTour) return;
      const stopIndex = activeTour.stops.findIndex(s => s.id === stopId);
      if (stopIndex === -1) return;
      const stop = activeTour.stops[stopIndex];
      if (!stop.isRichInfo) {
          const richData = await generateStopDetails(stop.name, activeTour.city, user.language);
          const newStops = [...activeTour.stops];
          newStops[stopIndex] = { ...stop, ...richData, isRichInfo: true };
          setActiveTour({ ...activeTour, stops: newStops });
      }
  };

  const startEditingPassport = () => {
      setPassportForm({
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          city: user.city || '',
          bio: user.bio,
          avatar: user.avatar,
          isPublic: user.isPublic
      });
      setIsEditingPassport(true);
  };

  const savePassport = () => {
      setUser({
          ...user,
          firstName: passportForm.firstName,
          lastName: passportForm.lastName,
          name: `${passportForm.firstName} ${passportForm.lastName}`,
          username: passportForm.username,
          city: passportForm.city,
          bio: passportForm.bio,
          avatar: passportForm.avatar || user.avatar,
          isPublic: passportForm.isPublic
      });
      setIsEditingPassport(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              setPassportForm(prev => ({ ...prev, avatar: result }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleShare = (platform: 'whatsapp' | 'twitter' | 'instagram' | 'copy') => {
      const shareText = `${t('shareText')} 🌍 ${user.visitedCities.length} Cities | Rank: ${user.rank} | ${user.miles} Miles! #bdai`;
      const url = window.location.href;
      if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + url)}`);
      else if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`);
      else if (platform === 'instagram') { alert("Instagram content copied!"); navigator.clipboard.writeText(shareText); window.open('https://www.instagram.com/'); }
      else { if (navigator.share) navigator.share({ title: 'Bdai Passport', text: shareText, url }).catch(console.error); else alert('Copied: ' + shareText); }
  };

  const handleOfflineDownload = () => {
      alert("Tour downloaded for offline use! You can now access this guide without data.");
  };

  // --- VIEWS ---
  const renderLogin = () => (
      <div className="h-screen w-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-900 z-0">
             <img 
               src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1080&q=80" 
               className="w-full h-full object-cover opacity-80" 
               alt="Traveler looking at horizon"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80"></div>
          </div>

          <div className="relative z-10 w-full max-w-sm">
              <div className="flex flex-col items-center justify-center mb-10">
                  <div className="w-40 h-40 flex items-center justify-center mb-4 drop-shadow-2xl">
                      <BdaiLogo className="w-full h-full text-white" />
                  </div>
                  <h1 className="text-6xl font-heading font-black text-white text-center tracking-tighter lowercase drop-shadow-lg mb-2">bdai</h1>
                  <p className="text-white text-sm font-bold tracking-widest uppercase opacity-90 text-center">{t('heroSubtitle')}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl overflow-hidden">
                   <div className="flex justify-end mb-4">
                       <select 
                           value={user.language} 
                           onChange={(e) => setUser({...user, language: e.target.value})}
                           className="bg-black/30 text-white text-xs font-bold py-1 px-3 rounded-full outline-none cursor-pointer hover:bg-black/50 transition border border-white/10"
                       >
                           {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                       </select>
                   </div>

                   <div className="flex bg-black/20 rounded-xl p-1 mb-6 border border-white/5">
                       <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}>{t('login')}</button>
                       <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${authMode === 'register' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}>{t('register')}</button>
                   </div>
                   <div className="space-y-4">
                       {authMode === 'register' && (
                           <>
                               <div className="grid grid-cols-2 gap-3">
                                   <div className="space-y-1"><label className="text-slate-200 text-[10px] font-bold uppercase tracking-widest ml-1">{t('name')}</label><input type="text" value={authForm.firstName} onChange={(e) => setAuthForm({...authForm, firstName: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-white/50 transition-colors placeholder-white/30"/></div>
                                   <div className="space-y-1"><label className="text-slate-200 text-[10px] font-bold uppercase tracking-widest ml-1">{t('surname')}</label><input type="text" value={authForm.lastName} onChange={(e) => setAuthForm({...authForm, lastName: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-white/50 transition-colors placeholder-white/30"/></div>
                                </div>
                                <div className="space-y-1"><label className="text-slate-200 text-[10px] font-bold uppercase tracking-widest ml-1">{t('username')}</label><input type="text" value={authForm.username} onChange={(e) => setAuthForm({...authForm, username: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-white/50 transition-colors placeholder-white/30" placeholder="@"/></div>
                           </>
                       )}
                       <div className="space-y-1"><label className="text-slate-200 text-[10px] font-bold uppercase tracking-widest ml-1">{t('email')}</label><input type="email" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-white/50 transition-colors placeholder-white/30"/></div>
                       {authMode === 'register' && (
                           <>
                               <div className="space-y-1"><label className="text-slate-200 text-[10px] font-bold uppercase tracking-widest ml-1">{t('birthDate')}</label><input type="date" value={authForm.birthDate} onChange={(e) => setAuthForm({...authForm, birthDate: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-white/50 transition-colors"/></div>
                               <div className="flex items-center gap-3 pt-2">
                                   <div onClick={() => setAuthForm({...authForm, isPublic: !authForm.isPublic})} className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${authForm.isPublic ? 'bg-green-500' : 'bg-slate-600'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${authForm.isPublic ? 'translate-x-4' : 'translate-x-0'}`}></div></div>
                                   <span className="text-slate-200 text-xs font-bold">{t('rankingVisibility')}</span>
                               </div>
                           </>
                       )}
                       <div className="space-y-1"><label className="text-slate-200 text-[10px] font-bold uppercase tracking-widest ml-1">{t('password')}</label><input type="password" value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-white/50 transition-colors placeholder-white/30"/></div>
                       {authError && <p className="text-red-400 text-xs text-center font-bold mt-2 bg-red-900/50 py-1 rounded">{authError}</p>}
                       <button onClick={handleAuthSubmit} className="w-full py-3.5 mt-2 bg-white text-slate-900 rounded-xl font-black hover:bg-slate-100 transition-all active:scale-95 text-sm uppercase tracking-wide shadow-lg">
                           {authMode === 'login' ? t('signin') : t('createAccount')}
                       </button>
                   </div>
              </div>
          </div>
      </div>
  );

  const renderPassport = () => {
    // ... Reusing logic ...
    const nextRank = getNextRank(user.rank);
    const progress = nextRank ? Math.min(100, (user.miles / nextRank.minMiles) * 100) : 100;
    return (
      <div className="p-6 pb-24 h-full flex flex-col bg-slate-50 overflow-y-auto no-scrollbar relative pt-safe">
          {showAiMemory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAiMemory(false)}></div>
                  <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up">
                      <div className="flex justify-between items-center mb-4"><h3 className="font-heading font-bold text-xl">{t('aiMemory')}</h3><button onClick={() => setShowAiMemory(false)}><i className="fas fa-times"></i></button></div>
                      <div className="aspect-[4/5] bg-slate-100 rounded-xl mb-4 relative overflow-hidden flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-300">
                          <i className="fas fa-magic text-4xl mb-3 text-purple-400 animate-pulse"></i>
                          <p className="text-sm font-bold text-slate-500">Generating Trip Collage...</p>
                          <p className="text-xs mt-2">Combining {user.visitedCities.length} cities and {user.photoPoints / 100} photos.</p>
                      </div>
                      <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg">{t('share')}</button>
                  </div>
              </div>
          )}
          {/* ... existing passport UI ... */}
          <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-heading font-bold text-slate-800">{t('myPassport')}</h2>{!isEditingPassport ? (<button onClick={startEditingPassport} className="text-purple-600 font-bold text-sm bg-purple-50 px-3 py-1 rounded-lg"><i className="fas fa-edit mr-1"></i> {t('edit')}</button>) : (<button onClick={savePassport} className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-lg"><i className="fas fa-check mr-1"></i> {t('save')}</button>)}</div>
          <div className="bg-[#1a365d] rounded-2xl shadow-2xl overflow-hidden text-white relative flex-shrink-0 flex flex-col border-l-[12px] border-[#0f2240] min-h-[580px]">
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '12px 12px'}}></div>
               <div className="p-6 border-b border-white/10 flex justify-between items-center relative z-10">
                   <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20"><i className="fas fa-globe-americas"></i></div><span className="font-heading font-bold tracking-widest text-lg">BDAI APP</span></div>
                   <div className="text-right"><span className="block font-mono text-xs opacity-60 tracking-wider">RANK</span><span className="font-bold text-yellow-400 text-sm">{user.rank.toUpperCase()}</span></div>
               </div>
               <div className="p-6 flex flex-col gap-6 relative z-10">
                   <div className="flex gap-6">
                       <div className="flex-shrink-0 relative group">
                           <img src={isEditingPassport ? passportForm.avatar : user.avatar} className="w-28 h-28 rounded-md border-2 border-white/30 shadow-inner bg-slate-700 object-cover grayscale opacity-90" />
                           {isEditingPassport && (<div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md cursor-pointer" onClick={() => fileInputRef.current?.click()}><i className="fas fa-camera text-white text-xl"></i><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload}/></div>)}
                       </div>
                       <div className="space-y-3 flex-1 overflow-hidden">
                           <div><label className="block text-[8px] uppercase opacity-50 tracking-widest">{t('surnameLabel')}</label>{isEditingPassport ? (<input className="text-black w-full text-sm p-1 rounded font-mono" value={passportForm.lastName} onChange={e => setPassportForm({...passportForm, lastName: e.target.value})} />) : (<p className="font-mono text-lg font-bold truncate">{user.lastName.toUpperCase()}</p>)}</div>
                           <div><label className="block text-[8px] uppercase opacity-50 tracking-widest">{t('givenNameLabel')}</label>{isEditingPassport ? (<input className="text-black w-full text-sm p-1 rounded font-mono" value={passportForm.firstName} onChange={e => setPassportForm({...passportForm, firstName: e.target.value})} />) : (<p className="font-mono text-lg font-bold truncate">{user.firstName.toUpperCase()}</p>)}</div>
                       </div>
                   </div>
                   <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                       <div className="flex justify-between items-end mb-2"><label className="text-[9px] uppercase opacity-60 tracking-widest">{t('miles')}</label><p className="font-mono text-2xl font-bold text-yellow-400 leading-none">{user.miles.toLocaleString()}</p></div>
                       <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1"><div className="h-full bg-gradient-to-r from-yellow-400 to-amber-600" style={{ width: `${progress}%` }}></div></div>
                       <p className="text-[8px] text-right opacity-60">{nextRank ? `${t('nextLevel')}: ${nextRank.name} (${nextRank.minMiles - user.miles} to go)` : 'Max Level Reached!'}</p>
                       <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
                           <div className="text-center"><i className="fas fa-camera text-pink-400 text-xs mb-1"></i><p className="text-xs font-bold">{user.photoPoints}</p></div>
                           <div className="text-center border-l border-white/10"><i className="fas fa-utensils text-orange-400 text-xs mb-1"></i><p className="text-xs font-bold">{user.foodPoints}</p></div>
                           <div className="text-center border-l border-white/10"><i className="fas fa-landmark text-blue-400 text-xs mb-1"></i><p className="text-xs font-bold">{user.culturePoints}</p></div>
                       </div>
                   </div>
                   <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                        {isEditingPassport ? (
                            <div className="space-y-3">
                                <div><label className="block text-[8px] uppercase opacity-50 tracking-widest mb-1">{t('username')}</label><input className="text-black w-full text-xs p-1 rounded font-mono" value={passportForm.username} onChange={e => setPassportForm({...passportForm, username: e.target.value})} placeholder="@" /></div>
                                <div className="flex items-center justify-between"><span className="text-[10px] uppercase opacity-70 font-bold">{passportForm.isPublic ? t('publicProfile') : t('privateProfile')}</span><div onClick={() => setPassportForm({...passportForm, isPublic: !passportForm.isPublic})} className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${passportForm.isPublic ? 'bg-green-400' : 'bg-slate-600'}`}><div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${passportForm.isPublic ? 'translate-x-4' : 'translate-x-0'}`}></div></div></div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center"><div><label className="block text-[8px] uppercase opacity-50 tracking-widest">{t('username')}</label><p className="font-mono text-sm font-bold">@{user.username}</p></div><div className={`px-2 py-1 rounded text-[9px] font-bold border uppercase tracking-wide flex items-center gap-1 ${user.isPublic ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}><i className={`fas ${user.isPublic ? 'fa-globe' : 'fa-lock'}`}></i>{user.isPublic ? 'Public' : 'Private'}</div></div>
                        )}
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div><label className="block text-[8px] uppercase opacity-50 tracking-widest">{t('baseCity')}</label>{isEditingPassport ? (<input className="text-black w-full text-xs p-1 rounded font-mono" value={passportForm.city} onChange={e => setPassportForm({...passportForm, city: e.target.value})} />) : (<p className="font-mono font-bold text-sm">{user.city?.toUpperCase() || 'WORLD'}</p>)}</div>
                       <div><label className="block text-[8px] uppercase opacity-50 tracking-widest">{t('dateIssue')}</label><p className="font-mono font-bold text-sm">{user.joinDate}</p></div>
                   </div>
                   <div><label className="block text-[8px] uppercase opacity-50 tracking-widest">{t('bio')}</label>{isEditingPassport ? (<input className="text-black w-full text-xs p-1 rounded font-mono" value={passportForm.bio} onChange={e => setPassportForm({...passportForm, bio: e.target.value})} />) : (<p className="font-mono font-bold text-sm italic opacity-80 truncate">{user.bio}</p>)}</div>
               </div>
               <div className="flex-1 bg-white/5 p-6 relative z-10 overflow-hidden mt-2">
                   <div className="flex justify-between items-center mb-3"><label className="block text-[8px] uppercase opacity-50 tracking-widest">{t('visitedPlaces')}</label><button onClick={() => setShowAiMemory(true)} className="text-[9px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-white font-bold transition"><i className="fas fa-magic mr-1"></i> {t('generate')}</button></div>
                   <div className="flex flex-wrap gap-4 content-start">
                       {user.visitedCities.map((city, i) => (<div key={i} className="w-14 h-14 rounded-full border border-green-400/30 text-green-400 flex items-center justify-center transform rotate-[-12deg] opacity-70 hover:opacity-100 hover:scale-110 transition cursor-help relative bg-slate-900/50" title={`Visited ${city}`}><div className="text-center"><span className="block text-[7px] font-bold uppercase">{city.substring(0,3)}</span><i className="fas fa-stamp text-[10px]"></i></div></div>))}
                       {user.completedTours.map((tourName, i) => (<div key={`t-${i}`} className="w-14 h-14 rounded-full border border-yellow-400/30 text-yellow-400 flex items-center justify-center transform rotate-[5deg] opacity-70 hover:opacity-100 hover:scale-110 transition cursor-help relative bg-slate-900/50" title={`Tour: ${tourName}`}><div className="text-center"><i className="fas fa-hiking text-[10px] mb-1"></i><span className="block text-[6px] font-bold uppercase leading-none px-1 overflow-hidden h-3">{tourName.substring(0,5)}</span></div></div>))}
                   </div>
               </div>
               <div className="p-4 bg-white text-slate-900 font-mono text-[10px] tracking-[2px] leading-tight break-all uppercase border-t-2 border-yellow-400 relative z-10">P&lt;ESP{user.lastName.toUpperCase()}&lt;&lt;{user.firstName.toUpperCase()}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br/>{user.passportNumber}&lt;4ESP9401014M2812315&lt;&lt;&lt;&lt;&lt;{user.miles}</div>
          </div>
          <div className="mt-6"><h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3 text-center">{t('share')}</h3><div className="flex gap-3 justify-center"><button onClick={() => handleShare('whatsapp')} className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition"><i className="fab fa-whatsapp text-2xl"></i></button><button onClick={() => handleShare('instagram')} className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition"><i className="fab fa-instagram text-2xl"></i></button><button onClick={() => handleShare('twitter')} className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:scale-110 transition"><i className="fab fa-x-twitter text-xl"></i></button><button onClick={() => handleShare('copy')} className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shadow-lg hover:scale-110 transition"><i className="fas fa-share-alt text-xl"></i></button></div></div>
          <button onClick={() => {setUser({...user, isLoggedIn: false}); setView(AppView.LOGIN);}} className="mt-8 text-red-500 font-bold text-sm text-center hover:bg-red-50 py-3 rounded-xl transition w-full border border-red-100">{t('signOut')}</button>
      </div>
  );
  };

  const renderHome = () => (
    <div className="space-y-8 pb-24 pt-safe">
        {/* ... header ... */}
        <header className="flex justify-between items-center px-6 pt-6">
             <div className="flex items-center gap-2">
                 <div className="w-10 h-10"><BdaiLogo className="w-full h-full" /></div>
                 <span className="font-heading font-bold text-xl tracking-tight text-slate-900 lowercase">bdai app</span>
             </div>
             <div className="flex items-center gap-3">
                 <div className="relative group">
                     <select value={user.language} onChange={(e) => setUser({...user, language: e.target.value})} className="appearance-none bg-white pl-4 pr-8 py-2 rounded-full shadow-sm border border-slate-100 text-xs font-bold text-slate-700 outline-none focus:border-purple-300 hover:border-purple-200 transition-all cursor-pointer uppercase tracking-wider">
                         {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.code}</option>)}
                     </select>
                     <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none"><i className="fas fa-chevron-down text-[10px] text-slate-400 group-hover:text-purple-500 transition-colors"></i></div>
                 </div>
                 <button onClick={() => setView(AppView.PROFILE)} className="relative group"><img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover transition-transform group-active:scale-95" alt="Profile" /></button>
             </div>
        </header>

        <div className="px-6">
            <h1 className="text-4xl font-heading font-bold text-slate-900 leading-tight mb-2">{t('welcome')} <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">{user.firstName}.</span></h1>
            <p className="text-slate-500 font-medium mb-6">{t('whereTo')}</p>
            <form onSubmit={handleSearchSubmit} className="relative group z-30">
                <i className="fas fa-search absolute left-4 top-3.5 text-slate-400 group-focus-within:text-purple-600 transition-colors"></i>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('searchPlaceholder')} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-sm focus:shadow-lg transition-all"/>
            </form>
            <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
                {user.interests.map(interest => (
                    <span key={interest} className="px-2 py-1 bg-purple-50 text-purple-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-purple-100">
                        {interest}
                    </span>
                ))}
            </div>
        </div>

        {/* --- GLOBAL SECTIONS REORDERED --- */}
        
        {/* 1. SPAIN (Revised List) */}
        <SectionRow title={t('spainDestinations') || 'Spain'} markerColor="bg-yellow-400">
            {SPAIN_CITIES.map((city) => (<div key={city.name} onClick={() => handleCitySelect(city.name)} className="w-60 flex-shrink-0 group cursor-pointer snap-center"><CityCard name={city.name} image={city.image} description={city.desc} onClick={() => handleCitySelect(city.name)}/></div>))}
        </SectionRow>

        {/* 2. WORLD TOP */}
        <SectionRow title={t('topWorldDestinations') || 'World Top'} markerColor="bg-gradient-to-r from-purple-500 to-pink-500">
            {WORLD_CITIES.map((city) => (<div key={city.name} onClick={() => handleCitySelect(city.name)} className="w-60 flex-shrink-0 group cursor-pointer snap-center"><CityCard name={city.name} image={city.image} description={city.desc} onClick={() => handleCitySelect(city.name)}/></div>))}
        </SectionRow>

        {/* 3. EUROPE */}
        <SectionRow title={t('worldDestinations') || 'Europe'} markerColor="bg-blue-600">
            {EUROPE_CITIES.map((city) => (<div key={city.name} onClick={() => handleCitySelect(city.name)} className="w-60 flex-shrink-0 group cursor-pointer snap-center"><CityCard name={city.name} image={city.image} description={city.desc} onClick={() => handleCitySelect(city.name)}/></div>))}
        </SectionRow>

        {/* 4. ASIA */}
        <SectionRow title={t('asiaDestinations') || 'Asia'} markerColor="bg-purple-600">
            {ASIA_CITIES.map((city) => (<div key={city.name} onClick={() => handleCitySelect(city.name)} className="w-60 flex-shrink-0 group cursor-pointer snap-center"><CityCard name={city.name} image={city.image} description={city.desc} onClick={() => handleCitySelect(city.name)}/></div>))}
        </SectionRow>

        {/* 5. AMERICAS */}
        <SectionRow title={t('americasDestinations') || 'Americas'} markerColor="bg-green-600">
            {AMERICAS_CITIES.map((city) => (<div key={city.name} onClick={() => handleCitySelect(city.name)} className="w-60 flex-shrink-0 group cursor-pointer snap-center"><CityCard name={city.name} image={city.image} description={city.desc} onClick={() => handleCitySelect(city.name)}/></div>))}
        </SectionRow>

        {/* 6. AFRICA */}
        <SectionRow title={t('africaDestinations') || 'Africa'} markerColor="bg-orange-600">
            {AFRICA_CITIES.map((city) => (<div key={city.name} onClick={() => handleCitySelect(city.name)} className="w-60 flex-shrink-0 group cursor-pointer snap-center"><CityCard name={city.name} image={city.image} description={city.desc} onClick={() => handleCitySelect(city.name)}/></div>))}
        </SectionRow>

        {/* Action Cards */}
        <div className="px-6 grid grid-cols-2 gap-4">
            <div onClick={() => setView(AppView.LEADERBOARD)} className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 cursor-pointer hover:scale-[1.02] transition"><i className="fas fa-trophy text-2xl text-yellow-600 mb-2"></i><h3 className="font-bold text-slate-800">{t('ranking')}</h3><p className="text-xs text-slate-500">{user.miles} miles</p></div>
            <div onClick={() => setView(AppView.SHOP)} className="bg-purple-50 p-4 rounded-2xl border border-purple-100 cursor-pointer hover:scale-[1.02] transition"><i className="fas fa-shopping-bag text-2xl text-purple-600 mb-2"></i><h3 className="font-bold text-slate-800">{t('shop')}</h3><p className="text-xs text-slate-500">Gear up</p></div>
        </div>
    </div>
  );

  // --- RENDER MAIN SWITCH ---
  useEffect(() => {
      // Cleanup Audio
      return () => {
          if (audioContextRef.current) {
              audioContextRef.current.close();
          }
      };
  }, []);

  if (view === AppView.LOGIN) return renderLogin();
  if (view === AppView.WELCOME) return <Onboarding key={user.language} onComplete={() => setView(AppView.HOME)} language={user.language} />;
  
  if (view === AppView.TOUR_ACTIVE && activeTour) {
      return (
          <div className="h-screen w-full flex flex-col bg-white">
              <div className="h-[45vh] w-full relative">
                  <SchematicMap stops={activeTour.stops} currentStopIndex={currentStopIndex} userLocation={userLocation} />
                  <button onClick={() => setView(AppView.CITY_DETAIL)} className="absolute top-4 left-4 z-[400] w-10 h-10 bg-white text-slate-900 rounded-full shadow-lg flex items-center justify-center"><i className="fas fa-times"></i></button>
              </div>
              <div className="flex-1 relative z-10 -mt-6 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden">
                  <ActiveTourCard 
                      tour={activeTour}
                      currentStopIndex={currentStopIndex}
                      onNext={() => { if (currentStopIndex < activeTour.stops.length - 1) setCurrentStopIndex(prev => prev + 1); else { alert("Tour Completed!"); setView(AppView.HOME); } }}
                      onPrev={() => { if (currentStopIndex > 0) setCurrentStopIndex(prev => prev - 1); }}
                      language={user.language}
                      onPlayAudio={handlePlayAudio}
                      audioPlayingId={audioPlayingId}
                      audioLoadingId={audioLoadingId}
                      onCheckIn={handleCheckIn}
                      userLocation={userLocation}
                      onEnrichStop={handleEnrichStop}
                      t={t}
                  />
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col shadow-2xl relative overflow-hidden font-sans">
      {selectedLeaderboardUser && <ProfileModal user={selectedLeaderboardUser} onClose={() => setSelectedLeaderboardUser(null)} isOwnProfile={false} />}
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-0">
          {view === AppView.HOME && renderHome()}
          {view === AppView.CITY_DETAIL && (
            <div className="h-full flex flex-col pb-24">
                <div className="px-6 pt-6 pb-4 bg-white sticky top-0 z-20 flex items-center gap-4 border-b border-slate-100 shadow-sm pt-safe">
                    <button onClick={() => setView(AppView.HOME)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><i className="fas fa-arrow-left"></i></button>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedCity}</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-lg"><div className="flex items-center gap-3"><i className="fas fa-cloud-download-alt text-xl text-green-400"></i><div><p className="font-bold text-sm">Offline Mode</p><p className="text-[10px] text-slate-400">Save data while exploring.</p></div></div><button onClick={handleOfflineDownload} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition">{t('downloadOffline') || "Download"}</button></div>
                    
                    <div>
                        <h3 className="font-bold font-heading text-lg text-slate-800 mb-3 flex items-center gap-2"><i className="fas fa-info-circle text-purple-500"></i> {t('cityIntel') || "City Intel"}</h3>
                        {cityInfo ? (
                            <div className="space-y-4 animate-slide-up">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-between h-full">
                                        <i className="fas fa-bus text-blue-500 mb-2 text-xl"></i>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{t('transportLabel')}</p>
                                            <p className="text-xs font-bold text-slate-800 leading-tight mt-1 mb-2">{cityInfo.transport}</p>
                                            {/* Transport Apps */}
                                            {cityInfo.apps && cityInfo.apps.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {cityInfo.apps.map(app => (
                                                        <span key={app} className="text-[8px] bg-white border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded font-bold">{app}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col justify-between h-full"><i className="fas fa-calendar-day text-orange-500 mb-2 text-xl"></i><div><p className="text-[10px] font-bold text-slate-400 uppercase">{t('bestTimeLabel')}</p><p className="text-xs font-bold text-slate-800 leading-tight mt-1">{cityInfo.bestTime}</p></div></div>
                                    <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 flex flex-col justify-between h-full"><i className="fas fa-utensils text-pink-500 mb-2 text-xl"></i><div><p className="text-[10px] font-bold text-slate-400 uppercase">{t('dishLabel')}</p><p className="text-xs font-bold text-slate-800 leading-tight mt-1">{cityInfo.localDish}</p></div></div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col justify-between h-full"><i className="fas fa-wallet text-green-500 mb-2 text-xl"></i><div><p className="text-[10px] font-bold text-slate-400 uppercase">{t('costLabel')}</p><p className="text-xs font-bold text-slate-800 leading-tight mt-1">{cityInfo.costLevel}</p></div></div>
                                </div>
                                
                                {/* Local Lingo Card */}
                                {cityInfo.lingo && cityInfo.lingo.length > 0 && (
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <i className="fas fa-comment-dots text-indigo-500 text-lg"></i>
                                            <h4 className="font-bold text-sm text-indigo-900">{t('lingoLabel') || "Local Lingo"}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {cityInfo.lingo.map((phrase, idx) => (
                                                <div key={idx} className="bg-white p-2 rounded-lg text-xs font-medium text-slate-700 shadow-sm border border-indigo-50">
                                                    💬 {phrase}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 animate-pulse">
                                {[
                                    {icon: 'fa-bus', color: 'text-slate-300'},
                                    {icon: 'fa-calendar-day', color: 'text-slate-300'},
                                    {icon: 'fa-utensils', color: 'text-slate-300'},
                                    {icon: 'fa-wallet', color: 'text-slate-300'}
                                ].map((item, i) => (
                                    <div key={i} className="h-28 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                                        <i className={`fas ${item.icon} ${item.color} text-xl`}></i>
                                        <div className="space-y-2 relative z-10">
                                            <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                                            <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                                        </div>
                                        {i === 0 && <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-20"><p className="text-[10px] font-bold text-purple-600 animate-pulse">{t('loadingIntel')}</p></div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {isLoadingTours ? (
                        <div className="text-center py-20 space-y-4 animate-fade-in">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <i className="fas fa-compass text-2xl text-purple-600 animate-pulse"></i>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-heading font-bold text-slate-800">{t('aiPersonalizing')}</h3>
                                <p className="text-sm text-slate-500">{t('aiMatching')} <span className="font-bold text-purple-600">{user.interests.join(', ')}</span></p>
                            </div>
                        </div>
                    ) : tours.map(tour => (<div key={tour.id} className="h-[450px]"><TourCard tour={tour} onSelect={handleTourSelect} onPlayAudio={() => handlePlayAudio(tour.id, tour.description)} isPlayingAudio={audioPlayingId === tour.id} isAudioLoading={audioLoadingId === tour.id} isFavorite={false} onToggleFavorite={() => {}} /></div>))}
                </div>
            </div>
          )}
          {view === AppView.PROFILE && <div className="p-6 pb-24 h-full flex flex-col bg-slate-50 overflow-y-auto no-scrollbar relative pt-safe">{renderPassport()}</div>}
          {view === AppView.LEADERBOARD && <Leaderboard currentUser={{...user, rank: 0}} entries={MOCK_LEADERBOARD} onUserClick={setSelectedLeaderboardUser} language={user.language} />}
          {view === AppView.SHOP && <Shop user={user} />}
          {view === AppView.CONNECT && <div className="p-6 pb-24 space-y-6 pt-safe"><h2 className="text-2xl font-bold font-heading">{t('tools') || "Travel Tools"}</h2><CurrencyConverter /><div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 text-center opacity-60"><i className="fas fa-wifi text-4xl text-purple-300 mb-2"></i><h3 className="font-bold text-purple-800">eSIM Store</h3><p className="text-xs text-purple-600">Coming soon</p></div></div>}
      </div>
      {view !== AppView.TOUR_ACTIVE && view !== AppView.CITY_DETAIL && (
          <div className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center relative z-20 shadow-lg pb-safe">
              <NavButton icon="fa-compass" label={t('explore')} isActive={view === AppView.HOME} onClick={() => setView(AppView.HOME)} />
              <NavButton icon="fa-passport" label={t('passport')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
              <NavButton icon="fa-shopping-bag" label={t('shop')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
              <NavButton icon="fa-wifi" label={t('connect')} isActive={view === AppView.CONNECT} onClick={() => setView(AppView.CONNECT)} />
          </div>
      )}
    </div>
  );
}

const NavButton = ({ icon, label, isActive, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 w-16 transition-colors ${isActive ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}>
        <i className={`fas ${icon} text-lg ${isActive ? 'animate-bounce' : ''}`}></i>
        <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
    </button>
);
