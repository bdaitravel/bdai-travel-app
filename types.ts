
export interface CapturedMoment {
  id: string;
  stopId: string;
  stopName: string;
  city: string;
  imageUrl: string;
  caption: string;
  timestamp: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  requiredPoints: number;
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
  historyPoints?: number;
  naturePoints?: number;
  artPoints?: number;
  archPoints?: number;
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
  capturedMoments?: CapturedMoment[];
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
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
  { code: 'ru', name: 'Русский' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'ca', name: 'Català' },
  { code: 'eu', name: 'Euskera' }
];

export const INTEREST_OPTIONS = [
  { id: 'history', label: { es: 'Historia', en: 'History', pt: 'História', it: 'Storia', ru: 'История', hi: 'इतिहास' }, icon: '🏛️' },
  { id: 'food', label: { es: 'Gastro', en: 'Food', pt: 'Gastro', it: 'Gastro', ru: 'Гастро', hi: 'खाना' }, icon: '🍷' },
  { id: 'art', label: { es: 'Arte', en: 'Art', pt: 'Arte', it: 'Arte', ru: 'Искусство', hi: 'कला' }, icon: '🎨' },
  { id: 'photo', label: { es: 'Foto', en: 'Photo', pt: 'Foto', it: 'Foto', ru: 'Фото', hi: 'फोटो' }, icon: '📸' }
];

export const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Spooky"
];

export const RANK_THRESHOLDS: Record<TravelerRank, number> = {
  'Turist': 0,
  'Explorer': 1000,
  'Wanderer': 5000,
  'Globe-Trotter': 15000,
  'Legend': 50000
};

export const BADGE_DEFINITIONS: Badge[] = [
  { id: 'pioneer', name: 'Pioneer', icon: 'fa-shoe-prints', description: 'Realiza tu primera visita verificada con GPS.', category: 'general', requiredPoints: 1 },
  { id: 'historian', name: 'Historiador', icon: 'fa-monument', description: 'Visita 20 paradas de categoría histórica.', category: 'historical', requiredPoints: 20 },
  { id: 'gourmet', name: 'Gourmet', icon: 'fa-utensils', description: 'Descubre 20 paradas de categoría gastronómica.', category: 'food', requiredPoints: 20 },
  { id: 'art_lover', name: 'Crítico de Arte', icon: 'fa-palette', description: 'Visita 20 paradas de categoría artística.', category: 'art', requiredPoints: 20 },
  { id: 'architect', name: 'Arquitecto', icon: 'fa-archway', description: 'Analiza 20 paradas de categoría arquitectura.', category: 'architecture', requiredPoints: 20 },
  { id: 'paparazzi', name: 'Paparazzi IA', icon: 'fa-camera-retro', description: 'Genera 20 momentos inteligentes con Dai.', category: 'photo', requiredPoints: 20 },
  { id: 'native', name: 'Local Hero', icon: 'fa-handshake', description: 'Visita 20 paradas de categoría cultura local.', category: 'culture', requiredPoints: 20 }
];
