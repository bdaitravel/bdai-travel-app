
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt?: string;
}

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
  avatar: string;
  language: string;
  miles: number;
  rank: TravelerRank;
  interests: string[];
  accessibility: 'standard' | 'wheelchair' | 'low_walking';
  isPublic: boolean;
  bio: string;
  age: number;
  badges: Badge[];
  visitedCities: string[]; 
  completedTours: string[];
  stats: UserStats;
  personalPhotos: string[]; // Álbum de fotos del viajero
  passportNumber?: string;
  joinDate?: string;
  city?: string;
  country?: string;
}

export type TravelerRank = 'Turist' | 'Explorer' | 'Wanderer' | 'Globe-Trotter' | 'Legend';

// Added LeaderboardEntry interface to fix module export errors in App.tsx, Leaderboard.tsx and supabaseClient.ts
export interface LeaderboardEntry {
  id: string;
  name: string;
  username: string;
  avatar: string;
  miles: number;
  rank: number | string;
  isPublic: boolean;
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
  // Added isRichInfo to fix "Object literal may only specify known properties" error in toursData.ts
  isRichInfo?: boolean;
  photoSpot?: {
    angle: string;
    bestTime: string;
    instagramHook: string;
    milesReward: number;
    secretLocation?: string;
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
  isSponsored: boolean;
  stops: Stop[];
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
  TOOLS = 'TOOLS',
  COMMUNITY = 'COMMUNITY'
}

export const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'ca', name: 'Català' },
  { code: 'fr', name: 'Français' },
];
