
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
  website?: string;
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
  password?: string;
  avatar: string; // Base64 or URL
  language: string;
  miles: number; // Total points
  
  // Specific Point Buckets
  culturePoints: number;
  foodPoints: number;
  photoPoints: number;
  
  rank: TravelerRank; // Calculated rank
  
  interests: string[];
  accessibility: 'standard' | 'wheelchair' | 'low_walking';
  isPublic: boolean;
  bio: string;
  age: number;
  country?: string;
  city?: string;
  badges: Badge[];
  profileCuriosity?: string;
  visitedCities: string[]; 
  completedTours: string[];
  socials?: SocialLinks;
  passportNumber?: string; // Visual flair for passport
  joinDate?: string;
}

export interface CityInfo {
  transport: string;
  bestTime: string;
  localDish: string;
  costLevel: string; 
  securityLevel: string; // Added field
  wifiSpots: string[];   // Added field
  lingo: string[]; // e.g. ["Hola - Hello", "Gracias - Thanks"]
  apps: string[]; // e.g. ["Uber", "Cabify"]
}

export interface Stop {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type: 'historical' | 'food' | 'art' | 'business_ad' | 'nature' | 'photo' | 'culture';
  visited: boolean;
  promo?: string;
  businessName?: string;
  imageUrl?: string; 
  audioUrl?: string; 
  curiosity?: string;
  photoTip?: string; // Short tip
  photoShot?: { // Extended photo info
    angle: string;
    bestTime: string;
    instagramHook: string;
    milesReward: number;
  };
  photoTipImageUrl?: string;
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
  audioIntroUrl?: string;
  isRichDescription?: boolean;
  // NEW FIELDS FOR PRACTICAL INFO
  safetyTip?: string;
  wifiTip?: string;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  description: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  type: 'digital_download' | 'physical';
  downloadUrl?: string;
  affiliateLink?: string;
}

export interface DataPlan {
  id: string;
  region: string;
  dataAmount: string;
  validity: string;
  price: number;
  provider: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  miles: number;
  rank: number;
  isPublic: boolean;
  age?: number;
  country?: string;
  city?: string;
  badges?: Badge[];
  bio?: string;
  socials?: SocialLinks;
}

export enum AppView {
  LOGIN = 'LOGIN', // Added Login View
  WELCOME = 'WELCOME', // Onboarding
  HOME = 'HOME',
  CITY_DETAIL = 'CITY_DETAIL',
  TOUR_ACTIVE = 'TOUR_ACTIVE',
  PROFILE = 'PROFILE',
  SHOP = 'SHOP',
  PARTNER = 'PARTNER', 
  LEADERBOARD = 'LEADERBOARD', 
  CONNECT = 'CONNECT',
}

// Optimized list of major languages
export const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'ca', name: 'Català' },
  { code: 'eu', name: 'Euskera' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ar', name: 'العربية' },
  { code: 'pt', name: 'Português' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
];

export const INTERESTS_LIST = [
  'History', 'Food & Drink', 'Art & Architecture', 'Nature', 'Shopping', 'Nightlife', 'Hidden Gems', 'Photography'
];

export type TranslationDictionary = {
  [key: string]: {
    [key: string]: string;
  };
};