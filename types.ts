
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt?: string;
}

export type TravelerRank = 'Turista' | 'Explorador' | 'Wanderer' | 'Globe-Trotter' | 'Leyenda del Viaje';

export interface UserProfile {
  id: string;
  isLoggedIn: boolean;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  language: string;
  miles: number;
  culturePoints: number;
  foodPoints: number;
  photoPoints: number;
  rank: TravelerRank;
  interests: string[];
  accessibility: 'standard' | 'wheelchair' | 'low_walking';
  isPublic: boolean;
  bio: string;
  age: number;
  city?: string;
  badges: Badge[];
  visitedCities: string[];
  completedTours: string[];
  passportNumber?: string;
  joinDate?: string;
}

// Added LeaderboardEntry for consistent use across components
export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  miles: number;
  badges?: Badge[];
  isPublic?: boolean;
  username?: string;
  city?: string;
}

// Updated CityInfo to include additional fields used in services/geminiService.ts
export interface CityInfo {
  transport: string;
  bestTime: string;
  localDish: string;
  costLevel: string;
  lingo: string[];
  apps: string[];
  securityLevel?: string;
  wifiSpots?: string[];
}

// Added PhotoShot interface for rich media information
export interface PhotoShot {
  angle: string;
  bestTime: string;
  instagramHook: string;
  milesReward: number;
}

// Updated Stop to include photoShot property
export interface Stop {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type: 'historical' | 'food' | 'art' | 'business_ad' | 'nature' | 'photo' | 'culture';
  visited: boolean;
  imageUrl?: string;
  curiosity?: string;
  isRichInfo?: boolean;
  photoShot?: PhotoShot;
}

// Updated Tour to include metadata fields
export interface Tour {
  id: string;
  city: string;
  title: string;
  description: string;
  duration: string;
  distance: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  theme: string;
  stops: Stop[];
  imageUrl?: string;
  isSponsored?: boolean;
  isRichDescription?: boolean;
  safetyTip?: string;
  wifiTip?: string;
}

export enum AppView {
  LOGIN = 'LOGIN',
  WELCOME = 'WELCOME',
  HOME = 'HOME',
  CITY_DETAIL = 'CITY_DETAIL',
  TOUR_ACTIVE = 'TOUR_ACTIVE',
  PROFILE = 'PROFILE',
  SHOP = 'SHOP',
  LEADERBOARD = 'LEADERBOARD',
  CONNECT = 'CONNECT',
}

export const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'ca', name: 'Català' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
];

export const TRANSLATIONS: Record<string, any> = {
  es: {
    login: "Entrar", register: "Registrarse", signin: "Entrar", createAccount: "Empezar Aventura",
    name: "Nombre", surname: "Apellidos", email: "Email", password: "Contraseña", birthDate: "Fecha Nacimiento",
    namePlaceholder: "Tu nombre", surnamePlaceholder: "Apellidos", emailPlaceholder: "correo@ejemplo.com",
    passPlaceholder: "Mín. 6 caracteres", userPlaceholder: "Usuario", datePlaceholder: "AAAA-MM-DD",
    welcome: "Hola,", traveler: "Viajero", whereTo: "¿A dónde vamos hoy?",
    explore: "Explorar", passport: "Pasaporte", shop: "Tienda", connect: "Conectar",
    ranking: "Ranking", searchPlaceholder: "Busca cualquier ciudad...",
    heroSubtitle: "Free Tours y Viajes Inteligentes",
    start: "Empezar", next: "Siguiente", prev: "Anterior", listen: "Escuchar", stop: "Parar",
    miles: "Millas", badges: "Insignias", cities: "Ciudades", photo: "Foto", food: "Comida", culture: "Cultura",
    baseCamp: "Campamento Base", manifesto: "Manifiesto", trophyCase: "Vitrinas de Trofeos",
    safetyIntel: "Seguridad", didYouKnow: "¿Sabías que...?", checkin: "Check-in",
    downloadLabel: "Descargar", offlineSub: "Ahorra datos explorando",
    loadingTours: "Generando tours personalizados...",
    transportLabel: "Transporte", bestTimeLabel: "Mejor Época",
    eSimStore: "Tienda eSIM", eSimSoon: "Próximamente",
    spainDestinations: "Joyas de España", gearUp: "Equípate",
    aiGenerated: "Generado por IA", exploreLabel: "Explorar",
    editPassport: "Editar Pasaporte", save: "Guardar", you: "Tú",
    signOut: "Cerrar Sesión", visitedPlaces: "Sitios Visitados", dateIssue: "Fecha Expedición",
    givenNameLabel: "Nombre", surnameLabel: "Apellidos", aiMemory: "Memoria de Viaje IA",
    share: "Compartir", nextLevel: "Siguiente Nivel", username: "Usuario",
    publicProfile: "Perfil Público", privateProfile: "Perfil Privado", rankingVisibility: "Visible en Ranking",
    invalidEmail: "Email inválido", passShort: "Contraseña corta", nameReq: "Nombre requerido",
    dateReq: "Fecha requerida", usernameReq: "Usuario requerido", topWorldDestinations: "Top Mundial",
    worldDestinations: "Europa", asiaDestinations: "Asia", americasDestinations: "Américas",
    africaDestinations: "África", cityIntel: "Info Ciudad", loadingIntel: "Analizando...",
    dishLabel: "Plato Típico", costLabel: "Coste", tools: "Herramientas", collected: "¡Verificado!",
    tooFar: "Lejos", lingoLabel: "Habla como un local", enrichStop: "Descubriendo secretos..."
  },
  en: {
    login: "Login", register: "Register", signin: "Sign In", createAccount: "Start Adventure",
    name: "First Name", surname: "Last Name", email: "Email", password: "Password", birthDate: "Birth Date",
    namePlaceholder: "First name", surnamePlaceholder: "Last name", emailPlaceholder: "email@example.com",
    passPlaceholder: "Min. 6 characters", userPlaceholder: "Username", datePlaceholder: "YYYY-MM-DD",
    welcome: "Hello,", traveler: "Traveler", whereTo: "Where are we going today?",
    explore: "Explore", passport: "Passport", shop: "Shop", connect: "Connect",
    ranking: "Ranking", searchPlaceholder: "Search any city...",
    heroSubtitle: "Free Tours & Smart Travel",
    start: "Start", next: "Next", prev: "Prev", listen: "Listen", stop: "Stop",
    miles: "Miles", badges: "Badges", cities: "Cities", photo: "Photo", food: "Food", culture: "Culture",
    baseCamp: "Base Camp", manifesto: "Manifesto", trophyCase: "Trophy Case",
    safetyIntel: "Safety", didYouKnow: "Did you know?", checkin: "Check-in",
    downloadLabel: "Download", offlineSub: "Save data while exploring",
    loadingTours: "Generating tours...",
    transportLabel: "Transport", bestTimeLabel: "Best Time",
    eSimStore: "eSIM Store", eSimSoon: "Coming soon",
    spainDestinations: "Spain Highlights", gearUp: "Gear up",
    aiGenerated: "AI Generated", exploreLabel: "Explore",
    editPassport: "Edit Passport", save: "Save", you: "You",
    signOut: "Sign Out", visitedPlaces: "Visited Places", dateIssue: "Date of Issue",
    givenNameLabel: "First Name", surnameLabel: "Last Name", aiMemory: "AI Trip Memory",
    share: "Share", nextLevel: "Next Level", username: "Username",
    publicProfile: "Public Profile", privateProfile: "Private Profile", rankingVisibility: "Show in Ranking",
    invalidEmail: "Invalid email", passShort: "Short password", nameReq: "Name required",
    dateReq: "Date required", usernameReq: "Username required", topWorldDestinations: "World Top",
    worldDestinations: "Europe", asiaDestinations: "Asia", americasDestinations: "Americas",
    africaDestinations: "Africa", cityIntel: "City Intel", loadingIntel: "Analyzing...",
    dishLabel: "Local Dish", costLabel: "Cost", tools: "Tools", collected: "Verified!",
    tooFar: "Too far", lingoLabel: "Local Lingo", enrichStop: "Uncovering secrets..."
  }
};
