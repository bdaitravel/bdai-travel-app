
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt?: string;
  countryCode?: string;
}

export type TravelerRank = 'Turista' | 'Explorador' | 'Wanderer' | 'Globe-Trotter' | 'Leyenda';
export type TravelerType = 'Backpacker' | 'Luxury' | 'Cultural' | 'Foodie' | 'Digital Nomad' | 'Party' | 'Business';
export type WalkLevel = 'Lazy' | 'Standard' | 'Marathoner';

export interface UserProfile {
  id: string;
  isLoggedIn: boolean;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  avatar: string;
  language: string;
  gender: 'M' | 'F' | 'Other';
  travelerType: TravelerType;
  walkLevel: WalkLevel;
  age: number;
  miles: number;
  culturePoints: number;
  foodPoints: number;
  photoPoints: number;
  countryPoints: number;
  rank: TravelerRank;
  visitedCities: string[]; 
  visitedCountries: string[];
  badges: Badge[];
  joinDate: string;
  isPublic: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  miles: number;
  countryPoints: number;
  travelerType: TravelerType;
  gender: 'M' | 'F' | 'Other';
  country: string;
}

export interface Stop {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type: 'historical' | 'food' | 'art' | 'nature' | 'photo' | 'culture';
  visited: boolean;
  curiosity?: string;
  wifiInfo?: string;
  securityNote?: string;
  photoTip?: string;
  authenticFoodTip?: string;
  openingHours?: string;
}

export interface Tour {
  id: string;
  city: string;
  countryCode?: string;
  title: string;
  description: string;
  duration: string;
  distance: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  theme: 'History' | 'Food' | 'Art' | 'Nature' | 'Secrets' | string;
  stops: Stop[];
  recommendedDays?: number;
  transportTip?: string;
  localVibe?: string;
  imageUrl?: string;
  weatherAdvice?: string;
  intent?: string;
}

export enum AppView {
  LOGIN = 'LOGIN',
  HOME = 'HOME',
  CITY_DETAIL = 'CITY_DETAIL',
  TOUR_ACTIVE = 'TOUR_ACTIVE',
  PROFILE = 'PROFILE',
  SHOP = 'SHOP',
  LEADERBOARD = 'LEADERBOARD',
  UTILITIES = 'UTILITIES'
}

export const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'ca', name: 'Català' },
  { code: 'eu', name: 'Euskera' },
  { code: 'fr', name: 'Français' }
];
