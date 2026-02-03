
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

// CONFIGURACIÓN ORIGINAL - NO TOCAR PARA ASEGURAR OTP
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

// --- OPTIMIZACIÓN DE AUDIO (STREAMING URL) ---

const base64ToBlob = (base64: string, type: string = 'audio/mpeg') => {
  const binary = atob(base64.split(',')[1] || base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
};

export const getCachedAudio = async (key: string): Promise<string | null> => {
  const { data } = await supabase.from('audio_cache').select('file_path').eq('key', key).maybeSingle();
  if (data && data.file_path) {
    const { data: { publicUrl } } = supabase.storage.from('audios').getPublicUrl(data.file_path);
    return publicUrl;
  }
  return null;
};

export const saveAudioToCache = async (key: string, base64: string): Promise<string | null> => {
  const fileName = `${key}_${Date.now()}.mp3`;
  const blob = base64ToBlob(base64);

  const { data: uploadData } = await supabase.storage
    .from('audios')
    .upload(fileName, blob, { contentType: 'audio/mpeg', upsert: true });

  if (uploadData?.path) {
    await supabase.from('audio_cache').upsert({ 
      key, 
      file_path: uploadData.path,
      updated_at: new Date().toISOString() 
    });
    return supabase.storage.from('audios').getPublicUrl(uploadData.path).data.publicUrl;
  }
  return null;
};

// --- SERVICIOS DE DATOS ---

export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string, cityName: string} | null> => {
  const nInput = normalizeKey(city, country);
  if (!nInput) return null;
  const { data: exactMatch } = await supabase.from('tours_cache').select('data, language, city').eq('city', nInput).eq('language', language).maybeSingle();
  if (exactMatch && exactMatch.data) {
    return { data: exactMatch.data as Tour[], langFound: language, cityName: exactMatch.city };
  }
  return null; 
};

export const findCityInAnyLanguage = async (city: string, country: string): Promise<{data: Tour[], language: string} | null> => {
    const nInput = normalizeKey(city, country);
    if (!nInput) return null;
    const { data } = await supabase.from('tours_cache').select('data, language').eq('city', nInput).limit(1);
    if (data && data.length > 0) return { data: data[0].data as Tour[], language: data[0].language };
    return null;
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nKey = normalizeKey(city, country);
  if (!nKey) return;
  await supabase.from('tours_cache').upsert({ city: nKey, language, data: tours, updated_at: new Date().toISOString() }, { onConflict: 'city,language' });
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

export const clearAllToursCache = async () => {
    const { error } = await supabase.from('tours_cache').delete().neq('city', '___force_delete_all___');
    if (error) throw error;
};

export const purgeBrokenToursBatch = async (onProgress: (msg: string) => void): Promise<number> => {
    onProgress("Escaneando...");
    const { data, error } = await supabase.from('tours_cache').select('city, language, data');
    if (error) throw error;
    let deletedCount = 0;
    for (const row of (data || [])) {
        const tours = row.data as Tour[];
        const isBroken = !Array.isArray(tours) || tours.length === 0;
        if (isBroken) {
            await supabase.from('tours_cache').delete().eq('city', row.city).eq('language', row.language);
            deletedCount++;
        }
    }
    return deletedCount;
};

export const getCommunityPosts = async (city: string) => { return []; };
export const addCommunityPost = async (post: any) => { return { success: true }; };
