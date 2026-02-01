
export interface VisaStamp {
  city: string;
  country: string;
  date: string;
  color: string;
}

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
  historyPoints: number;
  naturePoints: number;
  artPoints: number;
  archPoints: number;
  rank: TravelerRank;
  interests: string[];
  accessibility: 'standard' | 'wheelchair' | 'low_walking';
  isPublic: boolean;
  bio: string;
  age: number;
  birthday?: string;
  visitedCities: string[]; 
  completedTours: string[];
  stamps: VisaStamp[];
  stats: UserStats;
  badges: Badge[];
  city?: string; 
  country?: string; 
  capturedMoments?: CapturedMoment[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  username: string;
  avatar: string;
  miles: number;
  rank: number;
}

export interface PhotoSpot {
  angle: string;
  milesReward: number;
  secretLocation: string;
}

export interface Stop {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type: 'historical' | 'food' | 'art' | 'nature' | 'photo' | 'culture' | 'architecture';
  visited: boolean;
  photoSpot?: PhotoSpot;
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
  stops: Stop[];
  isEssential?: boolean;
}

export interface HubIntel {
  id: string;
  type: string;
  title: string;
  location: string;
  description: string;
  icon: string;
  color: string;
  details?: string;
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
  { code: 'zh', name: '中文' },
  { code: 'ca', name: 'Català' },
  { code: 'eu', name: 'Euskara' },
  { code: 'ar', name: 'العربية' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'ru', name: 'Русский' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ko', name: '한국어' },
  { code: 'tr', name: 'Türkçe' }
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
