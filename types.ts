

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

export type TravelerRank = 'ZERO' | 'SCOUT' | 'ROVER' | 'TITAN' | 'ZENITH';

export interface UserStats {
  photosTaken: number;
  guidesBought: number;
  sessionsStarted: number;
  referralsCount: number;
  streakDays: number;
  lastActive?: string;
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
  capturedMoments: CapturedMoment[];
  isAdmin?: boolean;
}

export interface HubIntel {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  icon: string;
  color: string;
  details?: string;
}

export const APP_BADGES: Badge[] = [
  { id: 'debutante', name: 'PIONEER', icon: 'fa-flag-checkered', description: 'badge_pioneer_desc', category: 'milestone', requiredPoints: 0 },
  { id: 'onfire', name: 'STREAK', icon: 'fa-fire', description: 'badge_streak_desc', category: 'streak', requiredPoints: 0 },
  { id: 'historiador', name: 'CHRONOS', icon: 'fa-landmark', description: 'badge_chronos_desc', category: 'history', requiredPoints: 10 },
  { id: 'foodie', name: 'SAVOR', icon: 'fa-utensils', description: 'badge_savor_desc', category: 'food', requiredPoints: 10 },
  { id: 'culture_master', name: 'CULTURE GURU', icon: 'fa-masks-theater', description: 'badge_culture_desc', category: 'culture', requiredPoints: 10 },
  { id: 'nature_master', name: 'EXPLORER', icon: 'fa-leaf', description: 'badge_nature_desc', category: 'nature', requiredPoints: 10 },
  { id: 'art_master', name: 'CONNOISSEUR', icon: 'fa-palette', description: 'badge_art_desc', category: 'art', requiredPoints: 10 },
  { id: 'arch_master', name: 'CRITIC', icon: 'fa-archway', description: 'badge_arch_desc', category: 'architecture', requiredPoints: 10 },
  { id: 'photo_master', name: 'VISIONARY', icon: 'fa-camera', description: 'badge_photo_desc', category: 'photo', requiredPoints: 10 },
  { id: 'rank_zero', name: 'ZERO', icon: 'fa-circle-dot', description: 'badge_zero_desc', category: 'rank', requiredPoints: 0 },
  { id: 'rank_scout', name: 'SCOUT', icon: 'fa-compass', description: 'badge_scout_desc', category: 'rank', requiredPoints: 251 },
  { id: 'rank_rover', name: 'ROVER', icon: 'fa-person-walking', description: 'badge_rover_desc', category: 'rank', requiredPoints: 1201 },
  { id: 'rank_titan', name: 'TITAN', icon: 'fa-mountain', description: 'badge_titan_desc', category: 'rank', requiredPoints: 4001 },
  { id: 'rank_zenith', name: 'ZENITH', icon: 'fa-crown', description: 'badge_zenith_desc', category: 'rank', requiredPoints: 10001 }
];

export interface LeaderboardEntry {
  id: string;
  name: string;
  username: string;
  avatar: string;
  miles: number;
  rank: number;
  country?: string;
  badges?: Badge[];
  travelerRank?: TravelerRank;
}

export interface PhotoSpot {
  angle: string;
  milesReward: number;
  secretLocation: string;
}

export interface B2BPartner {
  name: string;
  discount: string;
  milesCost: number;
}

export interface Stop {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type: 'historical' | 'food' | 'art' | 'nature' | 'photo' | 'culture' | 'architecture';
  visited: boolean;
  coordinatesVerified?: boolean;
  photoSpot?: PhotoSpot;
  b2bPartner?: B2BPartner;
}

export interface Tour {
  id: string;
  city: string;
  country?: string;
  title: string;
  description: string;
  duration: string;
  distance: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  theme: string;
  stops: Stop[];
  isEssential?: boolean;
  routePolyline?: string;
}

export interface TourCache {
  city: string;
  language: string;
  data: Tour[];
  route_polylines?: Record<string, string>;
  updated_at?: string;
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
  { code: 'es', name: 'ES' }, { code: 'en', name: 'EN' }, { code: 'fr', name: 'FR' },
  { code: 'de', name: 'DE' }, { code: 'it', name: 'IT' }, { code: 'pt', name: 'PT' },
  { code: 'ro', name: 'RO' }, { code: 'zh', name: 'ZH' }, { code: 'ja', name: 'JA' },
  { code: 'ru', name: 'RU' }, { code: 'ar', name: 'AR' }, { code: 'hi', name: 'HI' },
  { code: 'ko', name: 'KO' }, { code: 'tr', name: 'TR' }, { code: 'pl', name: 'PL' },
  { code: 'nl', name: 'NL' }, { code: 'ca', name: 'CA' }, { code: 'eu', name: 'EU' },
  { code: 'vi', name: 'VI' }, { code: 'th', name: 'TH' }
];

export const RANK_THRESHOLDS: Record<TravelerRank, number> = {
  'ZERO': 0, 'SCOUT': 251, 'ROVER': 1201, 'TITAN': 4001, 'ZENITH': 10001
};

export const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=George",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Liam"
];
