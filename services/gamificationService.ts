/**
 * BDAI Gamification Service
 * - Alineado con types.ts (8 rangos + legacy aliases)
 * - Haversine para distancias reales
 * - Badges verificables
 * - Rutas personalizadas por interés
 */

import { UserProfile, Stop, TravelerRank, APP_BADGES, RANK_THRESHOLDS } from '../types';

// ─── RANGOS ───────────────────────────────────────────────────────────────────

export const RANKS = [
  { id: 'ZERO',     label: 'Zero',     minMiles: 0,     icon: '🌑', color: '#475569', description: 'El fondo del abismo. Bienvenido.' },
  { id: 'WANDERER', label: 'Wanderer', minMiles: 100,   icon: '🌒', color: '#6366f1', description: 'Al menos sales de casa.' },
  { id: 'EXPLORER', label: 'Explorer', minMiles: 500,   icon: '🌓', color: '#8b5cf6', description: 'Empiezas a descubrir el mundo.' },
  { id: 'NOMAD',    label: 'Nomad',    minMiles: 1500,  icon: '🌔', color: '#a855f7', description: 'La carretera es tu hogar.' },
  { id: 'VOYAGER',  label: 'Voyager',  minMiles: 4000,  icon: '🌕', color: '#d946ef', description: 'Los océanos no te detienen.' },
  { id: 'PIONEER',  label: 'Pioneer',  minMiles: 8000,  icon: '⭐', color: '#f59e0b', description: 'Abres caminos que otros seguirán.' },
  { id: 'LEGEND',   label: 'Legend',   minMiles: 15000, icon: '🌟', color: '#f97316', description: 'Tu nombre se escribe en los mapas.' },
  { id: 'ZENITH',   label: 'Zenith',   minMiles: 30000, icon: '👑', color: '#eab308', description: 'La cima. Pocos llegan aquí.' },
] as const;

// Maps legacy rank names to new equivalents
const LEGACY_MAP: Record<string, string> = {
  SCOUT: 'WANDERER',
  ROVER: 'NOMAD',
  TITAN: 'LEGEND',
};

export const normalizeLegacyRank = (rank: string): string => {
  return LEGACY_MAP[rank] || rank;
};

export const calculateTravelerRank = (miles: number): TravelerRank => {
  const sorted = [...RANKS].reverse();
  const found = sorted.find(r => miles >= r.minMiles);
  return (found?.id || 'ZERO') as TravelerRank;
};

export const getRankInfo = (rankId: string) => {
  const normalized = normalizeLegacyRank(rankId);
  return RANKS.find(r => r.id === normalized) || RANKS[0];
};

export const getNextRank = (miles: number) => {
  const currentId = calculateTravelerRank(miles);
  const currentIndex = RANKS.findIndex(r => r.id === currentId);
  return RANKS[currentIndex + 1] || null;
};

export const getRankProgress = (miles: number): number => {
  const currentId = calculateTravelerRank(miles);
  const currentRank = getRankInfo(currentId);
  const nextRank = getNextRank(miles);
  if (!nextRank) return 100;
  const range = nextRank.minMiles - currentRank.minMiles;
  const progress = miles - currentRank.minMiles;
  return Math.min(100, Math.round((progress / range) * 100));
};

// ─── INSIGNIAS ────────────────────────────────────────────────────────────────

export const checkBadges = (profile: UserProfile): string[] => {
  const existing = new Set<string>(
    (profile.badges || []).map((b: any) => typeof b === 'string' ? b : b.id)
  );

  const newBadges: string[] = [];

  const add = (id: string) => { if (!existing.has(id)) newBadges.push(id); };

  // Milestone badges
  if ((profile.completedTours?.length || 0) >= 1)  add('debutante');
  if ((profile.visitedCities?.length || 0)  >= 5)  add('city_5');
  if ((profile.visitedCities?.length || 0)  >= 15) add('city_15');
  if ((profile.miles || 0) >= 1000)                add('miles_1k');

  // Streak badges
  if ((profile.stats?.streakDays || 0) >= 3)  add('onfire');
  if ((profile.stats?.streakDays || 0) >= 7)  add('streak_7');

  // Category badges
  if ((profile.historyPoints || 0) >= 10)  add('historiador');
  if ((profile.foodPoints    || 0) >= 10)  add('foodie');
  if ((profile.culturePoints || 0) >= 10)  add('culture_master');
  if ((profile.naturePoints  || 0) >= 10)  add('nature_master');
  if ((profile.artPoints     || 0) >= 10)  add('art_master');
  if ((profile.archPoints    || 0) >= 10)  add('arch_master');
  if ((profile.photoPoints   || 0) >= 10)  add('photo_master');

  // Rank badges
  const rankBadgeMap: Record<string, string> = {
    ZERO: 'rank_zero', WANDERER: 'rank_wanderer', EXPLORER: 'rank_explorer',
    NOMAD: 'rank_nomad', VOYAGER: 'rank_voyager', PIONEER: 'rank_pioneer',
    LEGEND: 'rank_legend', ZENITH: 'rank_zenith',
    // legacy
    SCOUT: 'rank_wanderer', ROVER: 'rank_nomad', TITAN: 'rank_legend',
  };
  const rankBadge = rankBadgeMap[profile.rank];
  if (rankBadge) add(rankBadge);

  // Social badges
  if ((profile.stats?.referralsCount || 0) >= 3) add('referral_3');

  return [...Array.from(existing), ...newBadges];
};

export const getNewBadges = (oldProfile: UserProfile, newProfile: UserProfile) => {
  const oldSet = new Set(
    (oldProfile.badges || []).map((b: any) => typeof b === 'string' ? b : b.id)
  );
  const newIds = checkBadges(newProfile);
  return APP_BADGES.filter(b => newIds.includes(b.id) && !oldSet.has(b.id));
};

// ─── DISTANCIAS (Haversine) ───────────────────────────────────────────────────

export const haversineDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export const getTourTotalDistance = (stops: Stop[]): string => {
  const valid = stops.filter(s => s.latitude !== 0 && s.longitude !== 0);
  let total = 0;
  for (let i = 0; i < valid.length - 1; i++) {
    total += haversineDistance(valid[i].latitude, valid[i].longitude, valid[i+1].latitude, valid[i+1].longitude);
  }
  return formatDistance(total);
};

export const getDistanceToStop = (userLat: number, userLng: number, stop: Stop): number => {
  if (!stop.latitude || !stop.longitude) return 0;
  return haversineDistance(userLat, userLng, stop.latitude, stop.longitude);
};

// ─── MILLAS ───────────────────────────────────────────────────────────────────

export const MILES_CONFIG = {
  STOP_VISITED:      10,
  STOP_PHOTO:        50,
  TOUR_COMPLETED:    200,
  CITY_FIRST_VISIT:  500,
  STREAK_BONUS:      100,
  REFERRAL:          1000,
};

export const calculateStopMiles = (stop: Stop, photoTaken = false): number => {
  let miles = MILES_CONFIG.STOP_VISITED;
  if (photoTaken) miles += stop.photoSpot?.milesReward || MILES_CONFIG.STOP_PHOTO;
  return miles;
};

// ─── RUTAS PERSONALIZADAS ─────────────────────────────────────────────────────

export type InterestCategory = 'historical' | 'food' | 'art' | 'nature' | 'architecture' | 'culture' | 'photo';

export const INTEREST_LABELS: Record<InterestCategory, { label: string; icon: string; color: string }> = {
  historical:   { label: 'Historia',     icon: 'fa-landmark',      color: '#FF3B30' },
  food:         { label: 'Gastronomía',  icon: 'fa-utensils',      color: '#FF9500' },
  art:          { label: 'Arte',         icon: 'fa-palette',       color: '#FF2D55' },
  nature:       { label: 'Naturaleza',   icon: 'fa-leaf',          color: '#34C759' },
  architecture: { label: 'Arquitectura', icon: 'fa-archway',       color: '#5856D6' },
  culture:      { label: 'Cultura',      icon: 'fa-masks-theater', color: '#AF52DE' },
  photo:        { label: 'Fotografía',   icon: 'fa-camera',        color: '#007AFF' },
};

export const personalizeStops = (stops: Stop[], interests: string[]): Stop[] => {
  if (!interests || interests.length === 0) return stops;
  const priority = stops.filter(s => interests.includes(s.type?.toLowerCase() || ''));
  const rest     = stops.filter(s => !interests.includes(s.type?.toLowerCase() || ''));
  return [...priority, ...rest];
};

export const buildPersonalizedThemes = (interests: string[]): string[] => {
  const themeMap: Record<string, string> = {
    historical:   'Dark History & Forgotten Secrets',
    food:         'Culinary Underground & Local Food Rituals',
    art:          'Street Art, Galleries & Creative Scenes',
    nature:       'Hidden Gardens, Parks & Natural Escapes',
    architecture: 'Architectural Marvels & Urban Design',
    culture:      'Music, Theater & Living Culture',
    photo:        "Photographer's Hidden Gems & Golden Hour Spots",
  };

  const fallbacks = [
    'The Classics with a Dark Twist (Historical & Architecture)',
    'Hidden Gems & Underground Culture',
    'Culinary Secrets & Local Art',
  ];

  if (!interests || interests.length === 0) return fallbacks;

  const themes = interests.slice(0, 3).map(i => themeMap[i]).filter(Boolean);
  while (themes.length < 3) {
    const f = fallbacks.find(fb => !themes.includes(fb));
    if (f) themes.push(f); else break;
  }
  return themes;
};
