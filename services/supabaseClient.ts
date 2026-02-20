import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

// ARREGLO PARA VITE: Sustituimos process.env por import.meta.env
const getEnvVar = (name: string, fallback: string): string => {
  const env = (import.meta as any).env || {};
  let val = env[`VITE_${name}`] || env[name];
  
  if (val && typeof val === 'string') {
    val = val.trim();
    if (val.includes('supabase.com/dashboard/project/')) {
      const parts = val.split('/');
      const projectId = parts[parts.length - 1];
      if (projectId) return `https://${projectId}.supabase.co`;
    }
    if (val.startsWith('http')) {
      return val;
    }
  }
  return fallback;
};

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjI0ODU3fQ.Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

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

export const normalizeKey = (city: string | undefined | null, country?: string) => {
    const safeCity = (city || "").toString().split(',')[0].trim().toLowerCase();
    if (!safeCity) return "";
    const raw = (country && country !== "Cache") ? `${safeCity}_${country.toLowerCase().trim()}` : safeCity;
    return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, ""); 
};

export const checkIfCityCached = async (city: string, country: string): Promise<boolean> => {
  const pureCity = city.split(',')[0].trim().toLowerCase();
  try {
    const { data, error } = await supabase.from('tours_cache').select('city').ilike('city', `${pureCity}%`).limit(1);
    return !!(data && data.length > 0);
  } catch (e) { return false; }
};

export const searchCitiesInCache = async (query: string): Promise<any[]> => {
    if (!query || query.length < 2) return [];
    try {
        const { data, error } = await supabase.from('tours_cache').select('city, language').ilike('city', `%${query}%`).limit(10);
        if (error) throw error;
        const seen = new Set();
        return (data || []).reduce((acc: any[], curr: any) => {
            if (!seen.has(curr.city)) {
                seen.add(curr.city);
                acc.push({ name: curr.city, country: "Cache", isCached: true });
            }
            return acc;
        }, []);
    } catch (e) { return []; }
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error || !data) return null;
    return {
      ...data,
      isLoggedIn: true,
      rank: data.rank || 'ZERO', // Cambiado a tu sistema ZERO
      miles: data.miles || 0
    };
  } catch (e) { return null; }
};

export const syncUserProfile = async (profile: UserProfile) => {
  if (!profile || !profile.email) return;
  try {
    await supabase.from('profiles').upsert(profile, { onConflict: 'email' });
  } catch (e) { console.error("❌ Sync Error:", e); }
};

export const getCachedTours = async (city: string, country: string, language: string) => {
  const pureCity = city.split(',')[0].trim().toLowerCase();
  try {
    const { data, error } = await supabase.from('tours_cache').select('data, language, city').ilike('city', `${pureCity}%`).eq('language', language.toLowerCase()).limit(1);
    if (!error && data && data.length > 0) return { data: data[0].data, langFound: language, cityName: data[0].city };
  } catch (e) { console.warn("⚠️ Cache failed", e); }
  return null; 
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nKey = normalizeKey(city, country);
  try {
    await supabase.from('tours_cache').upsert({ city: nKey, language: language.toLowerCase(), data: tours }, { onConflict: 'city,language' });
  } catch (e) { console.error("❌ Cache Error:", e); }
};

export const getCachedAudio = async (text: string, lang: string) => {
    try {
        const hash = await generateHash(text);
        const { data } = await supabase.from('audio_cache').select('audio_url').eq('text_hash', hash).eq('language', lang.toLowerCase()).maybeSingle();
        return data?.audio_url || null;
    } catch (e) { return null; }
};

export const saveAudioToCache = async (text: string, lang: string, base64: string, city: string) => {
    try {
        const hash = await generateHash(text);
        const fileName = `${city.toLowerCase()}/${Date.now()}.mp3`;
        const audioBlob = base64ToBlob(base64, 'audio/mp3');
        await supabase.storage.from('audios').upload(fileName, audioBlob);
        const { data: { publicUrl } } = supabase.storage.from('audios').getPublicUrl(fileName);
        await supabase.from('audio_cache').upsert({ text_hash: hash, language: lang.toLowerCase(), audio_url: publicUrl });
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
