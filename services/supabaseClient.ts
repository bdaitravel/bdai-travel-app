import { createClient } from '@supabase/supabase-js';

import { Tour, UserProfile, LeaderboardEntry, TravelerRank, APP_BADGES, Badge, Stop } from '../types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ BDAI: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file.\n" +
    "Copy .env.example to .env and fill in the values."
  );
}



const originalConsoleError = console.error;
console.error = (...args) => {
    const msg = args[0];
    if (typeof msg === 'string' && (msg.includes('Refresh Token Not Found') || msg.includes('Invalid Refresh Token'))) return;
    if (msg && msg.message && (msg.message.includes('Refresh Token Not Found') || msg.message.includes('Invalid Refresh Token'))) return;
    originalConsoleError(...args);
};

export let supabase: any;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error("Critical Supabase Init Error:", e);
  const createMockQuery = () => {
    const query: any = {
      select: () => query,
      eq: () => query,
      ilike: () => query,
      order: () => query,
      limit: () => query,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
      then: (onfulfilled: any) => Promise.resolve({ data: [], error: null }).then(onfulfilled)
    };
    return query;
  };

  supabase = {
    auth: { 
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOtp: async () => ({ error: new Error("Supabase not initialized") }),
      verifyOtp: async () => ({ error: new Error("Supabase not initialized") }),
      signInWithOAuth: async () => ({ error: new Error("Supabase not initialized") }),
      signOut: async () => ({ error: null })
    },
    from: () => ({ 
        select: createMockQuery,
        upsert: async () => ({ error: "Supabase not initialized" }),
        delete: () => ({ eq: () => ({ eq: async () => ({}) }) })
    }),
    storage: { from: () => ({ upload: async () => ({ error: "Storage failure" }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }
  };
}

export { supabase };

const generateHash = async (text: string): Promise<string> => {
    const normalized = text.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[.,!?;:]/g, '')
        .trim();
    const msgUint8 = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};


export const normalizeKey = (city: string | undefined | null, country?: string): string => {
  const clean = (text: string) => text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s\-\/\\]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  const safeCity = clean(city || '');
  if (!safeCity) return '';
  
  const safeCountry = clean(country || '');
  if (!safeCountry || safeCountry === 'cache') return safeCity;
  if (safeCity.endsWith(`_${safeCountry}`)) return safeCity;
  
  return `${safeCity}_${safeCountry}`;
};

export const checkIfCityCached = async (city: string, slug: string): Promise<boolean> => {
  if (!slug) return false;
  try {
    const { data: d1 } = await supabase
      .from('tours_cache').select('city').eq('city', slug).limit(1);
    if (d1 && d1.length > 0) return true;

    const cityOnly = slug.split('_')[0];
    if (!cityOnly) return false;
    const { data: d2 } = await supabase
      .from('tours_cache').select('city')
      .ilike('city', `${cityOnly}%`).limit(1);
    return !!(d2 && d2.length > 0);
  } catch (e) { return false; }
};

export const searchCitiesInCache = async (query: string): Promise<any[]> => {
    if (!query || query.length < 2) return [];
    try {
        const { data, error } = await supabase
            .from('tours_cache')
            .select('city, language')
            .ilike('city', `%${query}%`)
            .limit(10);

        if (error) throw error;

        const seen = new Set();
        return (data || []).reduce((acc: any[], curr: any) => {
            if (!seen.has(curr.city)) {
                seen.add(curr.city);
                const parts = curr.city.split('_');
                const cityName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '';
                const countryName = parts.length > 1 ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "Cache";
                acc.push({
                    name: cityName,
                    country: countryName,
                    fullName: `${cityName}, ${countryName}`,
                    isCached: true,
                    slug: curr.city
                });
            }
            return acc;
        }, []);
    } catch (e) {
        return [];
    }
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').ilike('email', email).maybeSingle();
    if (error) {
      console.error("Error fetching profile from Supabase:", error);
      throw error;
    }
    if (!data) return null;
    return {
      id: data.id, email: data.email, username: data.username || email.split('@')[0],
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
      badges: data.badges || [], stamps: data.stamps || [], capturedMoments: data.captured_moments || []
    };
  } catch (e) { 
    console.error("Critical error in getUserProfileByEmail:", e);
    throw e; 
  }
};

export const calculateTravelerRank = (miles: number): TravelerRank => {
  if (miles <= 250) return 'ZERO';
  if (miles <= 1200) return 'SCOUT';
  if (miles <= 4000) return 'ROVER';
  if (miles <= 10000) return 'TITAN';
  return 'ZENITH';
};

export const checkBadges = (profile: UserProfile): Badge[] => {
  const earnedBadges = [...(profile.badges || [])];
  const badgeIds = new Set(earnedBadges.map(b => b.id));

  if (!badgeIds.has('debutante') && (profile.stats.photosTaken > 0 || profile.completedTours.length > 0)) {
     const b = APP_BADGES.find(x => x.id === 'debutante');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('onfire') && profile.stats.streakDays >= 3) {
     const b = APP_BADGES.find(x => x.id === 'onfire');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('historiador') && profile.historyPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'historiador');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('foodie') && profile.foodPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'foodie');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('culture_master') && profile.culturePoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'culture_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('nature_master') && profile.naturePoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'nature_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('art_master') && profile.artPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'art_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('arch_master') && profile.archPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'arch_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('photo_master') && profile.photoPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'photo_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  const currentRank = calculateTravelerRank(profile.miles);
  const rankBadgeId = `rank_${currentRank.toLowerCase()}`;
  if (!badgeIds.has(rankBadgeId)) {
     const b = APP_BADGES.find(x => x.id === rankBadgeId);
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
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

export const syncUserProfile = async (profile: UserProfile) => {
  if (!profile || !profile.email) return;
  try {
    const payload = {
      id: profile.id, email: profile.email, username: profile.username,
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
      updated_at: new Date().toISOString()
    };
    await supabase.from('profiles').upsert(payload, { onConflict: 'email' });
  } catch (e) { console.error("❌ Sync Error:", e); }
};

export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string, cityName: string} | null> => {
  const slug = normalizeKey(city, country);
  if (!slug) return null;
  try {
    const { data, error } = await supabase.from('tours_cache')
      .select('data, language, city')
      .eq('city', slug).eq('language', language.toLowerCase()).maybeSingle();
    if (!error && data?.data) return { data: data.data, langFound: language, cityName: data.city };

    const cityOnly = slug.split('_')[0];
    const { data: d2 } = await supabase.from('tours_cache')
      .select('data, language, city')
      .ilike('city', `${cityOnly}%`).eq('language', language.toLowerCase()).maybeSingle();
    if (d2?.data) return { data: d2.data, langFound: language, cityName: d2.city };
  } catch (e) { console.warn("Cache lookup failed", e); }
  return null;
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const slug = normalizeKey(city, country);
  if (!slug) return;
  try {
    // Extraer polylines de los tours para guardarlas en la columna dedicada (Opción B)
    // Esto evita tener que reescribir el blob 'data' completo (~30KB) en actualizaciones quirúrgicas
    const routePolylines: Record<string, string> = {};
    const cleanTours = tours.map(tour => {
      if (tour.routePolyline && tour.id) {
        routePolylines[tour.id] = tour.routePolyline;
      }
      // Guardamos la ruta también dentro del objeto tour para compatibilidad con lecturas directas
      return tour;
    });

    await supabase.from('tours_cache').upsert({ 
      city: slug, 
      language: language.toLowerCase(), 
      data: cleanTours,
      route_polylines: routePolylines
    }, { onConflict: 'city,language' });

    const savedCount = Object.keys(routePolylines).length;
    if (savedCount > 0) {
      console.log(`🗺️ Cache saved: ${savedCount}/${tours.length} polylines persisted for ${slug}`);
    }
  } catch (e) { console.error("❌ Error saving cache:", e); }
};

/**
 * Lee solo las polylines guardadas para una ciudad/idioma.
 * Operación qurúrgica: no lee el blob 'data' completo (~30KB).
 */
export const getRoutePolylines = async (citySlug: string, language: string): Promise<Record<string, string>> => {
  try {
    const { data, error } = await supabase
      .from('tours_cache')
      .select('route_polylines')
      .eq('city', citySlug)
      .eq('language', language.toLowerCase())
      .maybeSingle();
    if (error || !data?.route_polylines) return {};
    return data.route_polylines as Record<string, string>;
  } catch (e) {
    return {};
  }
};

/**
 * Actualiza la polyline de un único tour sin reescribir el blob 'data'.
 * Usar para persistir la polyline calculada en el cliente (estrategia fallback).
 */
export const updateRoutePolyline = async (
  citySlug: string,
  language: string,
  tourId: string,
  polyline: string
): Promise<boolean> => {
  try {
    // jsonb_set permite actualizar una clave dentro del objeto JSONB sin leer ni reescribir el resto
    const { error } = await supabase.rpc('upsert_tour_polyline', {
      p_city: citySlug,
      p_language: language.toLowerCase(),
      p_tour_id: tourId,
      p_polyline: polyline
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('⚠️ Could not persist polyline to cache (non-critical):', e);
    return false;
  }
};

export const getCachedAudio = async (text: string, lang: string): Promise<string | null> => {
    try {
        const hash = await generateHash(text);
        const { data, error } = await supabase.from('audio_cache').select('audio_url').eq('text_hash', hash).eq('language', lang.toLowerCase()).maybeSingle();
        if (error) throw error;
        return data?.audio_url || null;
    } catch (e) { return null; }
};


export const validateEmailFormat = (email: string) => { 
  return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); 
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, miles, avatar, country, badges, rank')
      .order('miles', { ascending: false })
      .limit(50);
    return (data || []).map((d: any, i: number) => ({ 
      ...d, 
      rank: i + 1, 
      name: d.username || 'Traveler',
      travelerRank: d.rank as TravelerRank
    }));
  } catch (e) { return []; }
};

export const updateTourStopLocation = async (citySlug: string, language: string, stopId: string, lat: number, lng: number) => {
  try {
    const { data: cached } = await supabase
      .from('tours_cache')
      .select('data')
      .eq('city', citySlug)
      .eq('language', language.toLowerCase())
      .maybeSingle();

    if (cached && cached.data) {
      const updatedData = cached.data.map((tour: Tour) => ({
        ...tour,
        stops: tour.stops.map((stop: Stop) => 
          stop.id === stopId ? { ...stop, latitude: lat, longitude: lng } : stop
        )
      }));

      await supabase.from('tours_cache').upsert({
        city: citySlug,
        language: language.toLowerCase(),
        data: updatedData
      }, { onConflict: 'city,language' });
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error updating stop location:", e);
    return false;
  }
};

export const getCommunityPosts = async (city: string) => { return []; };
export const addCommunityPost = async (post: any) => { return { success: true }; };
