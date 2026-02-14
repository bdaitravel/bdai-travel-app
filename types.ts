
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
  type?: string;
  visited?: boolean;
  photoSpot?: PhotoSpot;
}

export interface VisaStamp {
  city: string;
  country: string;
  date: string;
  color: string;
}

export interface UserStats {
  photosTaken: number;
  guidesBought: number;
  sessionsStarted: number;
  referralsCount: number;
  streakDays: number;
}

export interface UserProfile {
  id?: string;
  username: string;
  email: string;
  miles: number;
  isLoggedIn: boolean;
  avatar: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  birthday?: string;
  city?: string;
  country?: string;
  language: string;
  rank?: string;
  stats: UserStats;
  stamps?: VisaStamp[];
  completedTours?: string[];
  age?: number;
  culturePoints?: number;
  foodPoints?: number;
  photoPoints?: number;
  historyPoints?: number;
  naturePoints?: number;
  artPoints?: number;
  archPoints?: number;
  interests?: string[];
  accessibility?: string;
  isPublic?: boolean;
  bio?: string;
  visitedCities?: string[];
  badges?: string[];
}

export interface Tour {
  id: string;
  city: string;
  title: string;
  description: string;
  stops: Stop[];
  duration?: string;
  distance?: string;
  difficulty?: string;
  theme?: string;
  isEssential?: boolean;
  country?: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  name: string;
  miles: number;
  avatar: string;
  rank: number;
}

export interface HubIntel {
  id: string;
  title: string;
  type: string;
  location: string;
  description: string;
  details?: string;
  icon: string;
  color: string;
}

export enum AppView {
  LOGIN = 'LOGIN',
  EXPLORE = 'EXPLORE',
  HUB = 'HUB',
  SHOP = 'SHOP',
  RANKING = 'RANKING',
  PASSPORT = 'PASSPORT',
  TOUR_DETAIL = 'TOUR_DETAIL'
}

export const LANGUAGES = [
  { code: 'es', name: 'ES' },
  { code: 'en', name: 'EN' },
  { code: 'it', name: 'IT' },
  { code: 'fr', name: 'FR' },
  { code: 'de', name: 'DE' },
  { code: 'pt', name: 'PT' }
];

export const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna'
];
