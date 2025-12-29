


export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt?: string;
}

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  x?: string;
  linkedin?: string;
  facebook?: string;
  website?: string;
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
  email: string;
  password?: string;
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
  country?: string;
  city?: string;
  badges: Badge[];
  profileCuriosity?: string; // Nuevo: Dato curioso generado
  visitedCities: string[]; 
  completedTours: string[];
  stats: UserStats;
  socials?: SocialLinks;
  passportNumber?: string;
  joinDate?: string; // Fecha de expedición
}

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
  // Fix: renamed imageKeywords to imgKeywords to match usage in components/TourCard.tsx and services/geminiService.ts
  imgKeywords?: string;
  photoSpot?: {
    angle: string;
    bestTime: string;
    instagramHook: string;
    milesReward: number;
    secretLocation?: string;
  };
  isRichInfo?: boolean; 
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
  isSponsored: boolean;
  stops: Stop[];
  imageUrl?: string; 
  cityImageUrl?: string; 
  transportApps?: string[];
  publicTransport?: string;
  safetyTip?: string;
  wifiTip?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  miles: number;
  rank: number;
  isPublic: boolean;
  badges?: Badge[];
  socials?: SocialLinks;
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
  TOOLS = 'TOOLS'
}

export const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'ca', name: 'Català' },
  { code: 'eu', name: 'Euskera' },
  { code: 'fr', name: 'Français' },
];
