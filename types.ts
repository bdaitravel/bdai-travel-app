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

// Expanded: ZERO → WANDERER → EXPLORER → NOMAD → VOYAGER → PIONEER → LEGEND → ZENITH
// Legacy aliases kept so old Supabase profiles don't break
export type TravelerRank =
  | 'ZERO' | 'WANDERER' | 'EXPLORER' | 'NOMAD'
  | 'VOYAGER' | 'PIONEER' | 'LEGEND' | 'ZENITH'
  | 'SCOUT' | 'ROVER' | 'TITAN'; // legacy

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
  { id: 'debutante',      name: 'PIONEER',      icon: 'fa-flag-checkered', description: 'badge_pioneer_desc',   category: 'milestone',    requiredPoints: 0 },
  { id: 'onfire',         name: 'STREAK',        icon: 'fa-fire',           description: 'badge_streak_desc',    category: 'streak',       requiredPoints: 0 },
  { id: 'historiador',    name: 'CHRONOS',       icon: 'fa-landmark',       description: 'badge_chronos_desc',   category: 'history',      requiredPoints: 10 },
  { id: 'foodie',         name: 'SAVOR',         icon: 'fa-utensils',       description: 'badge_savor_desc',     category: 'food',         requiredPoints: 10 },
  { id: 'culture_master', name: 'CULTURE GURU',  icon: 'fa-masks-theater',  description: 'badge_culture_desc',   category: 'culture',      requiredPoints: 10 },
  { id: 'nature_master',  name: 'EXPLORER',      icon: 'fa-leaf',           description: 'badge_nature_desc',    category: 'nature',       requiredPoints: 10 },
  { id: 'art_master',     name: 'CONNOISSEUR',   icon: 'fa-palette',        description: 'badge_art_desc',       category: 'art',          requiredPoints: 10 },
  { id: 'arch_master',    name: 'CRITIC',        icon: 'fa-archway',        description: 'badge_arch_desc',      category: 'architecture', requiredPoints: 10 },
  { id: 'photo_master',   name: 'VISIONARY',     icon: 'fa-camera',         description: 'badge_photo_desc',     category: 'photo',        requiredPoints: 10 },
  { id: 'rank_zero',      name: 'ZERO',          icon: 'fa-circle-dot',     description: 'badge_zero_desc',      category: 'rank',         requiredPoints: 0 },
  { id: 'rank_wanderer',  name: 'WANDERER',      icon: 'fa-compass',        description: 'badge_wanderer_desc',  category: 'rank',         requiredPoints: 0 },
  { id: 'rank_explorer',  name: 'EXPLORER',      icon: 'fa-map',            description: 'badge_explorer_desc',  category: 'rank',         requiredPoints: 0 },
  { id: 'rank_nomad',     name: 'NOMAD',         icon: 'fa-person-walking', description: 'badge_nomad_desc',     category: 'rank',         requiredPoints: 0 },
  { id: 'rank_voyager',   name: 'VOYAGER',       icon: 'fa-ship',           description: 'badge_voyager_desc',   category: 'rank',         requiredPoints: 0 },
  { id: 'rank_pioneer',   name: 'PIONEER',       icon: 'fa-flag',           description: 'badge_pioneer_r_desc', category: 'rank',         requiredPoints: 0 },
  { id: 'rank_legend',    name: 'LEGEND',        icon: 'fa-mountain',       description: 'badge_legend_desc',    category: 'rank',         requiredPoints: 0 },
  { id: 'rank_zenith',    name: 'ZENITH',        icon: 'fa-crown',          description: 'badge_zenith_desc',    category: 'rank',         requiredPoints: 0 },
  { id: 'city_5',         name: 'CITY HUNTER',   icon: 'fa-city',           description: 'badge_city5_desc',     category: 'milestone',    requiredPoints: 0 },
  { id: 'city_15',        name: 'GLOBETROTTER',  icon: 'fa-earth-americas', description: 'badge_city15_desc',    category: 'milestone',    requiredPoints: 0 },
  { id: 'miles_1k',       name: 'CENTURION',     icon: 'fa-medal',          description: 'badge_miles1k_desc',   category: 'milestone',    requiredPoints: 0 },
  { id: 'streak_7',       name: 'WEEK WARRIOR',  icon: 'fa-bolt',           description: 'badge_streak7_desc',   category: 'streak',       requiredPoints: 0 },
  { id: 'referral_3',     name: 'AMBASSADOR',    icon: 'fa-user-plus',      description: 'badge_ref3_desc',      category: 'social',       requiredPoints: 0 },
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
}

export enum AppView {
  LOGIN       = 'LOGIN',
  HOME        = 'HOME',
  CITY_DETAIL = 'CITY_DETAIL',
  TOUR_ACTIVE = 'TOUR_ACTIVE',
  PROFILE     = 'PROFILE',
  SHOP        = 'SHOP',
  LEADERBOARD = 'LEADERBOARD',
  TOOLS       = 'TOOLS',
  ADMIN       = 'ADMIN',
  COMMUNITY   = 'COMMUNITY',  // NEW
}

// All 20 languages — matches translations.ts exactly
export const LANGUAGES = [
  { code: 'es', name: 'Español',    flag: '🇪🇸' },
  { code: 'en', name: 'English',    flag: '🇬🇧' },
  { code: 'fr', name: 'Français',   flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch',    flag: '🇩🇪' },
  { code: 'it', name: 'Italiano',   flag: '🇮🇹' },
  { code: 'pt', name: 'Português',  flag: '🇵🇹' },
  { code: 'ro', name: 'Română',     flag: '🇷🇴' },
  { code: 'zh', name: '中文',        flag: '🇨🇳' },
  { code: 'ja', name: '日本語',      flag: '🇯🇵' },
  { code: 'ru', name: 'Русский',    flag: '🇷🇺' },
  { code: 'ar', name: 'العربية',    flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी',     flag: '🇮🇳' },
  { code: 'ko', name: '한국어',      flag: '🇰🇷' },
  { code: 'tr', name: 'Türkçe',     flag: '🇹🇷' },
  { code: 'pl', name: 'Polski',     flag: '🇵🇱' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'ca', name: 'Català',     flag: '🏴' },
  { code: 'eu', name: 'Euskera',    flag: '🏴' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ภาษาไทย',   flag: '🇹🇭' },
];

export const RANK_THRESHOLDS: Record<string, number> = {
  'ZERO':     0,
  'WANDERER': 100,
  'EXPLORER': 500,
  'NOMAD':    1500,
  'VOYAGER':  4000,
  'PIONEER':  8000,
  'LEGEND':   15000,
  'ZENITH':   30000,
  // Legacy
  'SCOUT': 100,
  'ROVER': 1500,
  'TITAN': 15000,
};

export const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=George",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Liam",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Kai",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
];
