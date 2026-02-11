
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

// CONFIGURACIÓN ORIGINAL - NO TOCAR PARA ASEGURAR OTP
const supabaseUrl = process.env.SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

// Inicialización con control de errores silencioso
let supabase: any;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error("Critical Supabase Init Error:", e);
  // Fallback para evitar 'Script error' total, aunque la funcionalidad Supabase fallará graciosamente
  supabase = {
    auth: { getSession: async () => ({ data: { session: null } }), signInWithOtp: async () => ({ error: { message: "Servicio no disponible" } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }), order: () => ({ limit: async () => ({ data: [] }) }) }) })
  };
}

export { supabase };

// Generador de ID único coincidiendo con tu columna 'text_hash'
const generateAudioId = (text: string, lang: string) => {
  let hash = 0;
  const str = `${lang}_${text.substring(0, 150)}`; 
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(36)}`;
};

export const normalizeKey = (city: string | undefined | null, country?: string) => {
    const safeCity = (city || "").toString().trim();
    if (!safeCity) return "";
    const raw = country ? `${safeCity}_${country}` : safeCity;
    return raw.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9_]/g, ""); 
};

export const getCachedAudio = async (text: string, lang: string): Promise<string | null> => {
  const hash = generateAudioId(text, lang);
  try {
    const { data, error } = await supabase
      .from('audio_cache')
      .select('base64')
      .eq('text_hash', hash)
      .maybeSingle();
    
    if (error) console.error("Cache fetch error:", error);
    return data?.base64 || null;
  } catch (e) {
    return null;
  }
};

export const saveAudioToCache = async (text: string, lang: string, base64: string, city: string): Promise<string> => {
  const hash = generateAudioId(text, lang);
  // Fix: Validación de tipo para evitar split en nulos/indefinidos
  const safeBase64 = typeof base64 === 'string' ? base64 : "";
  const cleanBase64 = safeBase64.includes(',') ? safeBase64.split(',')[1] : safeBase64;
  
  try {
    const { error } = await supabase.from('audio_cache').upsert({ 
      text_hash: hash,
      base64: cleanBase64, 
      language: lang, 
      city: normalizeKey(city) 
    });

    if (error) console.error("Cache save error:", error);
  } catch (e) {}
  return cleanBase64;
};

export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string, cityName: string} | null> => {
  const nInput = normalizeKey(city, country);
  if (!nInput) return null;
  try {
    const { data: exactMatch } = await supabase.from('tours_cache').select('data, language, city').eq('city', nInput).eq('language', language).maybeSingle();
    if (exactMatch && exactMatch.data) {
      return { data: exactMatch.data as Tour[], langFound: language, cityName: exactMatch.city };
    }
  } catch (e) {}
  return null; 
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nKey = normalizeKey(city, country);
  if (!nKey) return;
  try {
    await supabase.from('tours_cache').upsert({ city: nKey, language, data: tours }, { onConflict: 'city,language' });
  } catch (e) {}
};

export const getUserProfileByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error || !data) return null;
    return {
      ...data,
      id: data.id,
      isLoggedIn: true,
      firstName: data.first_name,
      lastName: data.last_name,
      username: data.username || 'explorer',
      avatar: data.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
      miles: data.miles || 0,
      language: data.language || 'es'
    };
  } catch (e) {
    return null;
  }
};

export const syncUserProfile = async (profile: UserProfile) => {
  if (!profile || profile.id === 'guest') return;
  try {
    await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      username: profile.username,
      first_name: profile.firstName,
      last_name: profile.lastName,
      miles: profile.miles,
      language: profile.language
    });
  } catch (e) {}
};

export const validateEmailFormat = (email: string) => { return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); };

export const getGlobalRanking = async () => {
  try {
    const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
    return (data || []).map((d: any, i: number) => ({ ...d, rank: i + 1, name: d.username || 'Traveler' }));
  } catch (e) {
    return [];
  }
};

export const clearAllToursCache = async () => {
    try {
      await supabase.from('tours_cache').delete().neq('city', '___none___');
    } catch (e) {}
};

export const getCommunityPosts = async (city: string) => { return []; };
export const addCommunityPost = async (post: any) => { return { success: true }; };
