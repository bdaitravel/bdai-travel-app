import { UserProfile, APP_BADGES, Badge } from '../../types';
import { supabase } from './client';
import { calculateTravelerRank } from './rankingService';

// Comparte el mapeo snake_case → UserProfile entre la búsqueda por email (login con
// email/Apple/Google) y por id (login anónimo, que no tiene email).
const mapRowToProfile = (data: any, fallbackUsername: string): UserProfile => ({
    id: data.id, email: data.email || '', username: data.username || fallbackUsername,
    firstName: data.first_name || '', lastName: data.last_name || '',
    name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
    avatar: data.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    miles: data.miles || 0, language: data.language || 'es', rank: data.rank || 'Turist',
    isLoggedIn: true, culturePoints: data.culture_points || 0, foodPoints: data.food_points || 0,
    photoPoints: data.photo_points || 0, historyPoints: data.history_points || 0,
    naturePoints: data.nature_points || 0, artPoints: data.art_points || 0,
    archPoints: data.arch_points || 0, interests: data.interests || [],
    accessibility: data.accessibility || 'standard', isPublic: data.is_public ?? false,
    bio: data.bio || '', age: data.age || 25, birthday: data.birthday,
    city: data.city || '', country: data.country || '',
    stats: data.stats || { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0, streakDays: 1 },
    visitedCities: data.visited_cities || [], completedTours: data.completed_tours || [],
    badges: data.badges || [], stamps: data.stamps || [], capturedMoments: data.captured_moments || [],
    audioSpeed: data.audio_speed || 1.0,
    isAdmin: data.is_admin || false,
    gender: data.gender || 'unspecified',
    usernameLocked: data.username_locked || false,
    profileCompletedAt: data.profile_completed_at || undefined,
    isAnonymous: data.is_anonymous || false
});

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').ilike('email', email).maybeSingle();
        if (error) {
            console.error("Error fetching profile from Supabase:", error);
            throw error;
        }
        if (!data) return null;
        return mapRowToProfile(data, email.split('@')[0]);
    } catch (e) {
        console.error("Critical error in getUserProfileByEmail:", e);
        throw e;
    }
};

// Usada por el login anónimo (Guideline 5.1.1(v)): la sesión anónima de Supabase no tiene
// email, así que el perfil se busca/crea por el id de auth (igual que en el resto de tablas).
export const getUserProfileById = async (id: string): Promise<UserProfile | null> => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
        if (error) {
            console.error("Error fetching profile by id from Supabase:", error);
            throw error;
        }
        if (!data) return null;
        return mapRowToProfile(data, 'traveler');
    } catch (e) {
        console.error("Critical error in getUserProfileById:", e);
        throw e;
    }
};

export const checkBadges = (profile: UserProfile): Badge[] => {
    const earnedBadges = [...(profile.badges || [])];
    const badgeIds = new Set(earnedBadges.map(b => b.id));

    if (!badgeIds.has('debutante') && (profile.stats.photosTaken > 0 || profile.completedTours.length > 0)) {
        const b = APP_BADGES.find(x => x.id === 'debutante');
        if (b) earnedBadges.push({ ...b, earnedAt: new Date().toISOString() });
    }
    if (!badgeIds.has('onfire') && profile.stats.streakDays >= 3) {
        const b = APP_BADGES.find(x => x.id === 'onfire');
        if (b) earnedBadges.push({ ...b, earnedAt: new Date().toISOString() });
    }
    if (!badgeIds.has('historiador') && profile.historyPoints >= 10) {
        const b = APP_BADGES.find(x => x.id === 'historiador');
        if (b) earnedBadges.push({ ...b, earnedAt: new Date().toISOString() });
    }
    if (!badgeIds.has('foodie') && profile.foodPoints >= 10) {
        const b = APP_BADGES.find(x => x.id === 'foodie');
        if (b) earnedBadges.push({ ...b, earnedAt: new Date().toISOString() });
    }
    if (!badgeIds.has('culture_master') && profile.culturePoints >= 10) {
        const b = APP_BADGES.find(x => x.id === 'culture_master');
        if (b) earnedBadges.push({ ...b, earnedAt: new Date().toISOString() });
    }
    if (!badgeIds.has('nature_master') && profile.naturePoints >= 10) {
        const b = APP_BADGES.find(x => x.id === 'nature_master');
        if (b) earnedBadges.push({ ...b, earnedAt: new Date().toISOString() });
    }
    if (!badgeIds.has('art_master') && profile.artPoints >= 10) {
        const b = APP_BADGES.find(x => x.id === 'art_master');
        if (b) earnedBadges.push({ ...b, earnedAt: new Date().toISOString() });
    }
    if (!badgeIds.has('arch_master') && profile.archPoints >= 10) {
        const b = APP_BADGES.find(x => x.id === 'arch_master');
        if (b) earnedBadges.push({ ...b, earnedAt: new Date().toISOString() });
    }
    if (!badgeIds.has('photo_master') && profile.photoPoints >= 10) {
        const b = APP_BADGES.find(x => x.id === 'photo_master');
        if (b) earnedBadges.push({ ...b, earnedAt: new Date().toISOString() });
    }

    const currentRank = calculateTravelerRank(profile.miles);
    const rankBadgeId = `rank_${currentRank.toLowerCase()}`;
    if (!badgeIds.has(rankBadgeId)) {
        const b = APP_BADGES.find(x => x.id === rankBadgeId);
        if (b) earnedBadges.push({ ...b, earnedAt: new Date().toISOString() });
    }

    return earnedBadges;
};

export const completeTourBonus = (profile: UserProfile, cityId: string): UserProfile => {
    const updatedCities = Array.from(new Set([...(profile.visitedCities || []), cityId]));
    const updatedProfile = {
        ...profile,
        miles: profile.miles + 50,
        visitedCities: updatedCities
    };
    updatedProfile.rank = calculateTravelerRank(updatedProfile.miles);
    updatedProfile.badges = checkBadges(updatedProfile);
    return updatedProfile;
};

// Construye el payload snake_case que espera `upsert_profile_rpc`.
// Compartido por `syncUserProfile` (creación inmediata) y `profileSyncQueue` (cola con retry).
export const buildProfilePayload = (profile: UserProfile) => ({
    // null (no '') para perfiles anónimos: varios usuarios anónimos con email='' chocarían
    // contra un índice único en esa columna. null no colisiona en Postgres.
    id: profile.id, email: profile.email || null, username: profile.username,
    first_name: profile.firstName, last_name: profile.lastName,
    name: profile.name || `${profile.firstName} ${profile.lastName}`.trim(),
    miles: profile.miles, language: profile.language, avatar: profile.avatar, rank: profile.rank,
    culture_points: profile.culturePoints, food_points: profile.foodPoints,
    photo_points: profile.photoPoints, history_points: profile.historyPoints,
    nature_points: profile.naturePoints, art_points: profile.artPoints,
    arch_points: profile.archPoints, interests: profile.interests,
    accessibility: profile.accessibility, is_public: profile.isPublic,
    bio: profile.bio, age: profile.age, birthday: profile.birthday,
    city: profile.city, country: profile.country, stats: profile.stats,
    visited_cities: profile.visitedCities, completed_tours: profile.completedTours,
    badges: profile.badges, stamps: profile.stamps, captured_moments: profile.capturedMoments,
    audio_speed: profile.audioSpeed || 1.0,
    gender: profile.gender && profile.gender !== 'unspecified' ? profile.gender : null,
    username_locked: profile.usernameLocked || false,
    profile_completed_at: profile.profileCompletedAt || null,
    is_anonymous: profile.isAnonymous || false,
    updated_at: new Date().toISOString()
});

// Username por defecto único garantizado (secuencia en Postgres, sin condición de carrera)
// para cualquier perfil nuevo, anónimo o real — evita la colisión que hoy sufre el fallback
// `email.split('@')[0]` (dos emails distintos con la misma parte local chocarían en el mismo
// username sin ningún aviso).
export const getNextGuestUsername = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('get_next_guest_username');
    if (error || !data) {
        console.error("Error obteniendo username por defecto:", error);
        // Fallback local si la RPC falla (offline en el primerísimo arranque, etc.):
        // no garantiza unicidad global, pero no bloquea el alta del perfil.
        return `traveler_${Math.floor(Math.random() * 1000000)}`;
    }
    return data as string;
};

export class UsernameTakenError extends Error {
    constructor() { super('USERNAME_TAKEN'); this.name = 'UsernameTakenError'; }
}

// Cambio de username explícito (desde ProfileModal): va por una RPC dedicada, no por
// `upsert_profile_rpc`/la cola de sync, porque necesita respuesta síncrona para poder avisar
// al usuario en el momento si alguien más se quedó con ese nombre entre medias (carrera real,
// aunque sea de milisegundos, en un campo con índice único).
export const setUsername = async (username: string): Promise<void> => {
    const { error } = await supabase.rpc('set_username_rpc', { p_username: username });
    if (error) {
        if (error.message?.includes('USERNAME_TAKEN')) throw new UsernameTakenError();
        throw error;
    }
};

// Sync inmediato y bloqueante — solo para la creación del perfil al primer login
// (el llamador necesita que la fila exista antes de continuar). Para cualquier otra
// actualización, usar `queueProfileSync` de `profileSyncQueue.ts` (con retry + cola offline).
export const syncUserProfile = async (profile: UserProfile) => {
    if (!profile || !profile.id) {
        console.error("❌ syncUserProfile: perfil sin id, no se puede sincronizar", profile);
        return;
    }
    const payload = buildProfilePayload(profile);
    const { error } = await supabase.rpc('upsert_profile_rpc', { p_payload: payload });
    if (error) {
        console.error("❌ Sync Error:", error);
        throw error;
    }
};