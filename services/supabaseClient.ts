
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const normalizeKey = (city: string | undefined | null, country?: string) => {
    const safeCity = (city || "").toString().trim();
    if (!safeCity) return "";
    
    const raw = country ? `${safeCity}_${country}` : safeCity;
    return raw.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9_]/g, ""); 
};

export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string, cityName: string} | null> => {
  const nInput = normalizeKey(city, country);
  if (!nInput) return null;

  const { data: exactMatch } = await supabase.from('tours_cache')
    .select('data, language, city')
    .eq('city', nInput)
    .eq('language', language)
    .maybeSingle();
    
  if (exactMatch && exactMatch.data) {
    const tours = exactMatch.data as Tour[];
    if (Array.isArray(tours) && tours.length > 0) {
        return { data: tours, langFound: language, cityName: exactMatch.city };
    }
  }
  return null; 
};

/**
 * Busca si una ciudad existe en la base de datos en CUALQUIER idioma.
 * Útil para sincronizar traducciones rápidamente sin regenerar tours.
 */
export const findCityInAnyLanguage = async (city: string, country: string): Promise<{data: Tour[], language: string} | null> => {
    const nInput = normalizeKey(city, country);
    if (!nInput) return null;

    // Buscamos cualquier idioma que tenga datos
    const { data } = await supabase.from('tours_cache')
        .select('data, language')
        .eq('city', nInput)
        .limit(1);
    
    if (data && data.length > 0) {
        return { data: data[0].data as Tour[], language: data[0].language };
    }
    return null;
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nKey = normalizeKey(city, country);
  if (!nKey) return;
  await supabase.from('tours_cache').upsert({ city: nKey, language, data: tours, updated_at: new Date().toISOString() }, { onConflict: 'city,language' });
};

export const getCachedAudio = async (key: string): Promise<string | null> => {
  const { data } = await supabase.from('audio_cache').select('base64').eq('key', key).maybeSingle();
  return data ? (data as any).base64 : null;
};

export const saveAudioToCache = async (key: string, base64: string) => {
  await supabase.from('audio_cache').upsert({ key, base64, updated_at: new Date().toISOString() });
};

export const clearAllToursCache = async () => {
    const { error } = await supabase.from('tours_cache').delete().neq('language', 'none');
    if (error) throw error;
};

export const purgeBrokenToursBatch = async (onProgress: (msg: string) => void) => {
    let totalBroken = 0;
    const batchSize = 100;
    let offset = 0;
    let hasMore = true;

    onProgress("Iniciando escaneo...");

    while (hasMore) {
        const { data, error } = await supabase
            .from('tours_cache')
            .select('city, language, data')
            .range(offset, offset + batchSize - 1);

        if (error || !data || data.length === 0) {
            hasMore = false;
            break;
        }

        const toDelete: {city: string, language: string}[] = [];
        data.forEach((row: any) => {
            const tours = row.data as Tour[];
            const isBroken = !tours || !Array.isArray(tours) || tours.length === 0 || tours.some(t => !t.stops || t.stops.length === 0);
            if (isBroken) toDelete.push({ city: row.city, language: row.language });
        });

        if (toDelete.length > 0) {
            for (const item of toDelete) {
                await supabase.from('tours_cache').delete().eq('city', item.city).eq('language', item.language);
                totalBroken++;
            }
            onProgress(`Bloque ${offset}: Eliminados ${toDelete.length}.`);
        }

        offset += batchSize;
        if (data.length < batchSize) hasMore = false;
    }
    return totalBroken;
};

export const getUserProfileByEmail = async (email: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
  if (error || !data) return null;

  return {
    ...data,
    id: data.id,
    isLoggedIn: true,
    firstName: data.first_name,
    lastName: data.last_name,
    visitedCities: data.visited_cities || [],
    completedTours: data.completed_tours || [],
    culturePoints: data.culture_points || 0,
    foodPoints: data.food_points || 0,
    photoPoints: data.photo_points || 0,
    historyPoints: data.history_points || 0,
    naturePoints: data.nature_points || 0,
    artPoints: data.art_points || 0,
    archPoints: data.arch_points || 0,
    language: data.language || 'es'
  };
};

export const syncUserProfile = async (profile: UserProfile) => {
  if (!profile || profile.id === 'guest') return;
  await supabase.from('profiles').upsert({
    id: profile.id,
    email: profile.email,
    username: profile.username,
    first_name: profile.firstName,
    last_name: profile.lastName,
    miles: profile.miles,
    language: profile.language,
    updated_at: new Date().toISOString()
  });
};

export const validateEmailFormat = (email: string) => { return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); };
export const getGlobalRanking = async () => {
    const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
    return (data || []).map((d, i) => ({ ...d, rank: i + 1, name: d.username } as any));
};
export const getCommunityPosts = async (city: string) => { return []; };
export const addCommunityPost = async (post: any) => { return { success: true }; };
