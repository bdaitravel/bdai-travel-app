
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Normaliza nombres de ciudades para evitar duplicados en la caché.
 * Convierte "Nueva York, USA" -> "nueva_york_usa"
 */
export const normalizeKey = (city: string | undefined | null, country?: string) => {
    if (!city) return "";
    let base = city.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    
    if (country) {
        let cBase = country.trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
        base = `${base}_${cBase}`;
    }
    return base;
};

export const validateEmailFormat = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getCachedTours = async (city: string, country: string, language: string): Promise<Tour[] | null> => {
  const nKey = normalizeKey(city, country);
  const { data, error } = await supabase
    .from('tours_cache')
    .select('data')
    .eq('city', nKey)
    .eq('language', language)
    .maybeSingle();
  
  if (error) return null;
  return data?.data as Tour[] || null;
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nKey = normalizeKey(city, country);
  const { error } = await supabase
    .from('tours_cache')
    .upsert({ 
        city: nKey, 
        language, 
        data: tours,
        updated_at: new Date().toISOString()
    }, { onConflict: 'city,language' });
  
  if (error) console.error("Supabase Cache Error:", error);
};

export const getUserProfileByEmail = async (email: string) => {
  const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
  if (!data) return null;
  return { ...data, firstName: data.first_name, lastName: data.last_name, isLoggedIn: true };
};

export const syncUserProfile = async (profile: UserProfile) => {
  if (profile.id === 'guest') return;
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

export const getGlobalRanking = async () => {
    const { data } = await supabase.from('profiles')
        .select('id, username, miles, avatar')
        .order('miles', { ascending: false })
        .limit(10);
    return (data || []).map((d, i) => ({ ...d, rank: i + 1, name: d.username }));
};

export const getCachedAudio = async (text: string, lang: string): Promise<string | null> => {
  const hash = btoa(unescape(encodeURIComponent(text.substring(0, 100) + lang))).substring(0, 20);
  const { data } = await supabase.from('audio_cache').select('base64').eq('text_hash', hash).maybeSingle();
  return data?.base64 || null;
};

export const saveAudioToCache = async (text: string, lang: string, base64: string, city: string): Promise<string> => {
  const hash = btoa(unescape(encodeURIComponent(text.substring(0, 100) + lang))).substring(0, 20);
  await supabase.from('audio_cache').upsert({ 
      text_hash: hash, 
      base64, 
      language: lang, 
      city: normalizeKey(city) 
  });
  return base64;
};

// Added getCommunityPosts function
export const getCommunityPosts = async (city: string) => {
  const { data } = await supabase
    .from('community_posts')
    .select('*')
    .eq('city', normalizeKey(city))
    .order('created_at', { ascending: false });
    
  return (data || []).map(p => ({
    ...p,
    user: p.user_name,
    time: new Date(p.created_at).toLocaleTimeString()
  }));
};

// Added addCommunityPost function
export const addCommunityPost = async (post: { city: string, userId: string, user: string, avatar: string, content: string, type: string }) => {
  const { error } = await supabase
    .from('community_posts')
    .insert({
      city: normalizeKey(post.city),
      user_id: post.userId,
      user_name: post.user,
      avatar: post.avatar,
      content: post.content,
      type: post.type,
      created_at: new Date().toISOString()
    });
  if (error) console.error("Supabase Post Error:", error);
};

// Added deleteCityFromCache function
export const deleteCityFromCache = async (city: string, language?: string) => {
  const nKey = normalizeKey(city);
  let query = supabase.from('tours_cache').delete().eq('city', nKey);
  if (language) query = query.eq('language', language);
  const { error } = await query;
  if (error) console.error("Supabase Delete Error:", error);
};
