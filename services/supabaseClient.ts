import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry, TravelerRank, APP_BADGES, Badge } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

let supabase: any;
try {
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    throw new Error("Invalid supabaseUrl: Must start with http/https");
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error("Critical Supabase Init Error:", e);
  supabase = {
    auth: { getSession: async () => ({ data: { session: null } }) },
    from: () => ({ 
        select: () => ({ 
          eq: () => ({ maybeSingle: async () => ({ data: null }), limit: async () => ({ data: [] }) }), 
          ilike: () => ({ eq: () => ({ limit: async () => ({ data: [] }) }), limit: async () => ({ data: [] }) }) 
        }), 
        upsert: async () => ({ error: "Supabase not initialized" }),
        delete: () => ({ eq: () => ({ eq: async () => ({}) }) })
    }),
    storage: { from: () => ({ upload: async () => ({ error: "Storage failure" }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) }
  };
}

export { supabase };

const generateHash = async (text: string): Promise<string> => {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
};

/**
 * Normalizes keys for database storage/retrieval.
 * Splits by comma (handling Nominatim output) and converts to lowercase.
 */
export const normalizeKey = (city: string | undefined | null, country?: string) => {
    const safeCity = (city || "").toString().split(',')[0].trim().toLowerCase();
    if (!safeCity) return "";
    
    const raw = (country && country !== "Cache") ? `${safeCity}_${country.toLowerCase().trim()}` : safeCity;
    return raw.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9_]/g, ""); 
};

/**
 * Checks if a city exists in cache using loose matching.
 */
export const checkIfCityCached = async (city: string, country: string): Promise<boolean> => {
  const pureCity = city.split(',')[0].trim().toLowerCase();
  try {
    const { data, error } = await supabase
        .from('tours_cache')
        .select('city')
        .ilike('city', `${pureCity}%`)
        .limit(1);
    if (error) return false;
    return (data && data.length > 0);
  } catch (e) {
    return false;
  }
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
                acc.push({
                    name: curr.city,
                    localizedName: curr.city,
                    spanishName: curr.city,
                    country: "Cache",
                    isCached: true
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
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error || !data) return null;
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
  } catch (e) { return null; }
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

  // Debutante
  if (!badgeIds.has('debutante') && (profile.stats.photosTaken > 0 || profile.completedTours.length > 0)) {
     const b = APP_BADGES.find(x => x.id === 'debutante');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  // On Fire
  if (!badgeIds.has('onfire') && profile.stats.streakDays >= 3) {
     const b = APP_BADGES.find(x => x.id === 'onfire');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  // Historiador
  if (!badgeIds.has('historiador') && profile.historyPoints >= 5) {
     const b = APP_BADGES.find(x => x.id === 'historiador');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  // Foodie
  if (!badgeIds.has('foodie') && profile.foodPoints >= 5) {
     const b = APP_BADGES.find(x => x.id === 'foodie');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  // Rank Badges
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
    
    // Recalcular rango y badges
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

/**
 * Aggressively searches for cached tours.
 * 1. Exact match for City_Country.
 * 2. Case-insensitive match for City Name only using ilike.
 */
export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string, cityName: string} | null> => {
  const nInput = normalizeKey(city, country);
  const pureCity = city.split(',')[0].trim().toLowerCase();
  
  if (!pureCity) return null;

  try {
    // Attempt 1: Exact normalized match
    const { data: exact, error: err1 } = await supabase.from('tours_cache')
        .select('data, language, city')
        .eq('city', nInput)
        .eq('language', language.toLowerCase())
        .maybeSingle();
    if (!err1 && exact && exact.data) return { data: exact.data, langFound: language, cityName: exact.city };

    // Attempt 2: Loose match by city prefix using ilike (Fixes Nominatim format issues)
    const { data: loose, error: err2 } = await supabase.from('tours_cache')
        .select('data, language, city')
        .ilike('city', `${pureCity}%`)
        .eq('language', language.toLowerCase())
        .limit(1);
    if (!err2 && loose && loose.length > 0 && loose[0].data) {
        return { data: loose[0].data, langFound: language, cityName: loose[0].city };
    }
  } catch (e) { console.warn("⚠️ Cache lookup failed", e); }
  return null; 
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nKey = normalizeKey(city, country);
  if (!nKey) return;
  try {
    await supabase.from('tours_cache').upsert({ 
      city: nKey, 
      language: language.toLowerCase(), 
      data: tours 
    }, { onConflict: 'city,language' });
  } catch (e) { console.error("❌ Error saving cache:", e); }
};

export const getCachedAudio = async (text: string, lang: string): Promise<string | null> => {
    try {
        const hash = await generateHash(text);
        const { data, error } = await supabase.from('audio_cache').select('audio_url').eq('text_hash', hash).eq('language', lang.toLowerCase()).maybeSingle();
        if (error) throw error;
        return data?.audio_url || null;
    } catch (e) { return null; }
};

export const saveAudioToCache = async (text: string, lang: string, base64: string, city: string): Promise<string> => {
    try {
        const hash = await generateHash(text);
        const sanitizedCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
        const fileName = `${sanitizedCity}/${lang.toLowerCase()}/${Date.now()}.mp3`;
        const audioBlob = base64ToBlob(base64, 'audio/mp3');
        const { error: uploadError } = await supabase.storage.from('audios').upload(fileName, audioBlob, { contentType: 'audio/mp3', cacheControl: '3600' });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('audios').getPublicUrl(fileName);
        await supabase.from('audio_cache').upsert({ 
          text_hash: hash, 
          language: lang.toLowerCase(), 
          city: city, 
          audio_url: publicUrl 
        }, { onConflict: 'text_hash,language' });
        return publicUrl;
    } catch (e) { return ""; }
};

export const validateEmailFormat = (email: string) => { 
  return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); 
};

export const getGlobalRanking = async () => {
  try {
    const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
    return (data || []).map((d: any, i: number) => ({ ...d, rank: i + 1, name: d.username || 'Traveler' }));
  } catch (e) { return []; }
};

export const getCommunityPosts = async (city: string) => { return []; };
export const addCommunityPost = async (post: any) => { return { success: true }; };