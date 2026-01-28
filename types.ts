
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt?: string;
}

export type TravelerRank = 'Turist' | 'Explorer' | 'Wanderer' | 'Globe-Trotter' | 'Legend';

export interface UserStats {
  photosTaken: number;
  guidesBought: number;
  sessionsStarted: number;
  referralsCount: number;
}

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  x?: string;
  facebook?: string;
  website?: string;
}

export interface HubIntel {
  id: string;
  type: 'festival' | 'curiosity' | 'gastro' | 'expat';
  title: string;
  location: string;
  description: string;
  details?: string;
  icon: string;
  color: string;
  savedAt?: string;
}

export interface UserProfile {
  id: string;
  isLoggedIn: boolean;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  avatar: string;
  email: string;
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
  birthday?: string;
  visitedCities: string[]; 
  completedTours: string[];
  savedIntel?: HubIntel[];
  stats: UserStats;
  badges: Badge[];
  socialLinks?: SocialLinks;
  passportNumber?: string;
  joinDate?: string; 
  profileCuriosity?: string;
  city?: string; 
  country?: string; 
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  username: string;
  avatar: string;
  miles: number;
  rank: number;
  isPublic: boolean;
}

export interface Stop {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type: 'historical' | 'food' | 'art' | 'nature' | 'photo' | 'culture' | 'architecture';
  visited: boolean;
  photoSpot?: {
    angle: string;
    bestTime?: string;
    instagramHook?: string;
    milesReward: number;
    secretLocation: string;
  };
}

export interface Tour {
  id: string;
  city: string;
  title: string;
  description: string;
  duration: string;
  distance: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  theme: string;
  isEssential?: boolean; 
  stops: Stop[];
}

export enum AppView {
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  CITY_DETAIL = 'CITY_DETAIL',
  TOUR_ACTIVE = 'TOUR_ACTIVE',
  PROFILE = 'PROFILE',
  SHOP = 'SHOP',
  LEADERBOARD = 'LEADERBOARD',
  TOOLS = 'TOOLS',
  ADMIN = 'ADMIN'
}

export const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'ca', name: 'Català' },
  { code: 'eu', name: 'Euskera' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
];

export const INTEREST_OPTIONS = [
  { id: 'history', label: { es: 'Historia', en: 'History', ca: 'Història', eu: 'Historia', fr: 'Histoire', de: 'Geschichte', ja: '歴史', zh: '历史', ar: 'تاريخ' }, icon: '🏛️' },
  { id: 'food', label: { es: 'Gastro', en: 'Food', ca: 'Gastro', eu: 'Gastro', fr: 'Gastro', de: 'Gastro', ja: 'グルメ', zh: '美食', ar: 'طعام' }, icon: '🍷' },
  { id: 'authentic_biz', label: { es: 'Negocios Auténticos', en: 'Authentic Biz', ca: 'Negocis Locals', eu: 'Negozio Autentikoak', fr: 'Boutiques Authentiques', de: 'Authentische Läden', ja: '地元の店', zh: '地道商家', ar: 'أعمال أصيلة' }, icon: '🏪' },
  { id: 'art', label: { es: 'Arte', en: 'Art', ca: 'Art', eu: 'Artea', fr: 'Art', de: 'Kunst', ja: 'アート', zh: '艺术', ar: 'فن' }, icon: '🎨' },
  { id: 'photo', label: { es: 'Foto', en: 'Photo', ca: 'Foto', eu: 'Argazki', fr: 'Photo', de: 'Foto', ja: '写真', zh: '摄影', ar: 'صورة' }, icon: '📸' },
  { id: 'nature', label: { es: 'Naturaleza', en: 'Nature', ca: 'Natura', eu: 'Natura', fr: 'Nature', de: 'Natur', ja: '自然', zh: '自然', ar: 'طبيعة' }, icon: '🌿' },
  { id: 'night', label: { es: 'Ocio Nocturno', en: 'Nightlife', ca: 'Nit', eu: 'Gaua', fr: 'Nuit', de: 'Nachtleben', ja: 'ナイトライフ', zh: '夜生活', ar: 'حياة ليلية' }, icon: '🌙' }
];

export const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Spooky",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Patches",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Coco"
];

export const RANK_THRESHOLDS: Record<TravelerRank, number> = {
  'Turist': 0,
  'Explorer': 1000,
  'Wanderer': 5000,
  'Globe-Trotter': 15000,
  'Legend': 50000
};

export const BADGE_DEFINITIONS: Badge[] = [
  { id: 'pioneer', name: 'Pioneer', icon: 'fa-shoe-prints', description: 'Realiza tu primera visita verificada con GPS.' },
  { id: 'city_hopper', name: 'City Hopper', icon: 'fa-map-location-dot', description: 'Has explorado 3 ciudades diferentes.' },
  { id: 'archivist', name: 'Archivist', icon: 'fa-box-archive', description: 'Has guardado 3 secretos en el Intel Hub.' },
  { id: 'photo_elite', name: 'Photo Elite', icon: 'fa-camera-retro', description: 'Has reclamado 5 Photo Spots épicos.' }
];
