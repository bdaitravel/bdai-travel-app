
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

// CONFIGURACIÓN ORIGINAL - NO TOCAR PARA ASEGURAR OTP
const supabaseUrl = process.env.SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generador de ID único coincidiendo con tu columna 'text_hash'
const generateAudioId = (text: string, lang: string) => {
  let hash = 0;
  const str = `${lang}_${text.substring(0, 150)}`; // Más largo para evitar colisiones
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

// --- OPTIMIZACIÓN DE AUDIO USANDO 'text_hash' (COMO EN TU CAPTURA) ---

export const getCachedAudio = async (text: string, lang: string): Promise<string | null> => {
  const hash = generateAudioId(text, lang);
  const { data, error } = await supabase
    .from('audio_cache')
    .select('base64')
    .eq('text_hash', hash) // Corregido a text_hash
    .maybeSingle();
  
  if (error) console.error("Cache fetch error:", error);
  return data?.base64 || null;
};

export const saveAudioToCache = async (text: string, lang: string, base64: string, city: string): Promise<string> => {
  const hash = generateAudioId(text, lang);
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  
  const { error } = await supabase.from('audio_cache').upsert({ 
    text_hash: hash, // Corregido a text_hash
    base64: cleanBase64, 
    language: lang, 
    city: normalizeKey(city) 
  });

  if (error) console.error("Cache save error:", error);
  return cleanBase64;
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
  await supabase.from('tours_cache').upsert({ city: nKey, language, data: tours }, { onConflict: 'city,language' });
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
    username: data.username || 'explorer',
    avatar: data.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    miles: data.miles || 0,
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
    language: profile.language
  });
};

export const validateEmailFormat = (email: string) => { return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); };

export const getGlobalRanking = async () => {
    const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
    return (data || []).map((d, i) => ({ ...d, rank: i + 1, name: d.username || 'Traveler' }));
};

export const clearAllToursCache = async () => {
    await supabase.from('tours_cache').delete().neq('city', '___none___');
};

export const getCommunityPosts = async (city: string) => { return []; };
export const addCommunityPost = async (post: any) => { return { success: true }; };
