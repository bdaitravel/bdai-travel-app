import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry, TravelerRank, APP_BADGES, Badge, Stop } from '../types';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const supabaseUrl = (rawUrl && typeof rawUrl === 'string' && rawUrl.startsWith('http')) 
  ? rawUrl.trim() 
  : "https://slldavgsoxunkphqeamx.supabase.co";

const supabaseAnonKey = (rawKey && typeof rawKey === 'string' && rawKey.length > 20)
  ? rawKey.trim()
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

console.log("Initializing Supabase with URL:", supabaseUrl);

let supabase: any;
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
      // Support for async/await directly on the query
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

export const standardizeText = (text: string): string => {
    // Definitive Standardization Protocol:
    // 1. Remove AI citations/footnotes
    // 2. Normalize Unicode (NFC)
    // 3. Trim and collapse multiple spaces
    return text
        .replace(/\[\d+\]/g, '')
        .replace(/【\d+†source】/g, '')
        .normalize('NFC')
        .trim()
        .replace(/\s+/g, ' ');
};

export const generateHash = async (text: string): Promise<string> => {
    const standardized = standardizeText(text);
    const msgUint8 = new TextEncoder().encode(standardized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const addWavHeader = (pcmData: Uint8Array, sampleRate: number = 24000): Uint8Array => {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    view.setUint32(0, 0x52494646, false); // RIFF
    view.setUint32(4, 36 + pcmData.length, true); // File size
    view.setUint32(8, 0x57415645, false); // WAVE
    view.setUint32(12, 0x666d7420, false); // fmt 
    view.setUint16(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, 1, true); // NumChannels (Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    view.setUint32(36, 0x64617461, false); // data
    view.setUint32(40, pcmData.length, true); // Subchunk2Size
    
    const wav = new Uint8Array(44 + pcmData.length);
    wav.set(new Uint8Array(header), 0);
    wav.set(pcmData, 44);
    return wav;
};

const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

/**
 * Normalizes keys for database storage/retrieval.
 * Format: city-country (e.g., madrid-spain)
 */
export const normalizeKey = (city: string | undefined | null, country?: string) => {
    const clean = (text: string) => text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

    const safeCity = clean(city || ""); 
    if (!safeCity) return "";
    
    const safeCountry = country && country !== "Cache" ? clean(country) : "";
    
    if (safeCountry) {
        if (safeCity.includes(safeCountry)) return safeCity;
        return `${safeCity}_${safeCountry}`;
    }
    return safeCity;
};

/**
 * Checks if a city exists in cache using the new slug format.
 */
export const checkIfCityCached = async (city: string, countryOrSlug: string): Promise<boolean> => {
  const slug = (countryOrSlug.includes('_') && countryOrSlug === countryOrSlug.toLowerCase())
    ? countryOrSlug 
    : normalizeKey(city, countryOrSlug);
    
  if (!slug) return false;
  try {
    const { data, error } = await supabase
        .from('tours_cache')
        .select('city')
        .eq('city', slug)
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
        // Fuzzy search: ignore case and accents using ilike
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
                // Extract city and country from slug for display
                const parts = curr.city.split('_');
                const cityName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
                const countryName = parts.length > 1 ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "bdai";
                
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
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error) {
      console.error("Supabase Error (getUserProfileByEmail):", error);
      return null;
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

  // Historiador (History)
  if (!badgeIds.has('historiador') && profile.historyPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'historiador');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  // Foodie (Food)
  if (!badgeIds.has('foodie') && profile.foodPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'foodie');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  // Culture Guru
  if (!badgeIds.has('culture_master') && profile.culturePoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'culture_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  // Nature Explorer
  if (!badgeIds.has('nature_master') && profile.naturePoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'nature_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  // Art Connoisseur
  if (!badgeIds.has('art_master') && profile.artPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'art_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  // Architecture Critic
  if (!badgeIds.has('arch_master') && profile.archPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'arch_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  // Photo Visionary
  if (!badgeIds.has('photo_master') && profile.photoPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'photo_master');
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
  const slug = normalizeKey(city, country);
  
  if (!slug) return null;

  try {
    const { data, error } = await supabase.from('tours_cache')
        .select('data, language, city')
        .eq('city', slug)
        .eq('language', language.toLowerCase())
        .maybeSingle();
    
    if (!error && data && data.data) {
        return { data: data.data, langFound: language, cityName: data.city };
    }
  } catch (e) { console.warn("⚠️ Cache lookup failed", e); }
  return null; 
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const slug = normalizeKey(city, country);
  if (!slug) return;
  try {
    // Explicitly delete then insert to avoid upsert issues with unique constraints
    await supabase.from('tours_cache').delete().eq('city', slug).eq('language', language.toLowerCase());
    const { error } = await supabase.from('tours_cache').insert({ 
      city: slug, 
      language: language.toLowerCase(), 
      data: tours 
    });
    if (error) throw error;
  } catch (e) { console.error("❌ Error saving cache:", e); }
};

export const getCachedAudio = async (text: string, lang: string): Promise<string | null> => {
    try {
        const hash = await generateHash(text);
        const { data, error } = await supabase
            .from('audio_cache')
            .select('audio_url')
            .eq('text_hash', hash)
            .eq('language', lang.toLowerCase())
            .maybeSingle();

        if (error) return null;
        return data?.audio_url || null;
    } catch (e) { 
        return null; 
    }
};

export const saveAudioToCache = async (text: string, lang: string, audioData: Uint8Array, city: string): Promise<string> => {
    try {
        const hash = await generateHash(text);
        const langCode = lang.toLowerCase();
        // Definitive path: lang/hash.wav
        const fileName = `${langCode}/${hash}.wav`;
        
        // Add WAV header to raw PCM data from Gemini
        const wavData = addWavHeader(audioData);
        const audioBlob = new Blob([wavData.buffer as ArrayBuffer], { type: 'audio/wav' });
        
        const { error: uploadError } = await supabase.storage
            .from('audios')
            .upload(fileName, audioBlob, { 
                contentType: 'audio/wav', 
                cacheControl: '31536000', // 1 year cache
                upsert: true 
            });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('audios').getPublicUrl(fileName);
        
        const { error: dbError } = await supabase.from('audio_cache').upsert({ 
          text_hash: hash, 
          language: langCode, 
          city: city.toLowerCase(), 
          audio_url: publicUrl 
        }, { onConflict: 'text_hash,language' });

        if (dbError) throw dbError;
        
        return publicUrl;
    } catch (e) { 
        console.error("❌ Definitive Audio Cache Error:", e);
        return ""; 
    }
};

export const validateEmailFormat = (email: string) => { 
  return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); 
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, miles, avatar, country, badges, rank')
      .order('miles', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Supabase Error (getGlobalRanking):", error);
      return [];
    }
    
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