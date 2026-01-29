
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Normalización agresiva para coincidir con registros como 'puertoespana' o 'alain'
 */
export const normalizeKey = (text: string) => {
    if (!text) return "";
    return text.toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quita tildes
        .replace(/[^a-z0-9]/g, ""); // QUITA TODO lo que no sea letra o número (espacios, guiones, etc.)
};

/**
 * Busca un tour en la caché con máxima flexibilidad.
 */
export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string} | null> => {
  const nInput = normalizeKey(city);
  if (!nInput) return null;
  
  // 1. Intentamos match exacto de IDIOMA y CIUDAD (Sin caracteres especiales)
  const { data: exactMatch } = await supabase.from('tours_cache')
    .select('data, language')
    .ilike('city', nInput)
    .eq('language', language)
    .maybeSingle();

  if (exactMatch) return { data: exactMatch.data as Tour[], langFound: language };

  // 2. Si no hay match de idioma, buscamos la CIUDAD en cualquier idioma
  const { data: anyMatch } = await supabase.from('tours_cache')
    .select('data, language')
    .ilike('city', nInput)
    .limit(1)
    .maybeSingle();

  if (anyMatch) return { data: anyMatch.data as Tour[], langFound: anyMatch.language };

  // 3. Búsqueda por prefijo (por si acaso el nombre en la DB es más largo)
  const { data: prefixMatch } = await supabase.from('tours_cache')
    .select('data, language')
    .ilike('city', `${nInput}%`)
    .limit(1)
    .maybeSingle();

  if (prefixMatch) return { data: prefixMatch.data as Tour[], langFound: prefixMatch.language };

  return null;
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nKey = normalizeKey(city);
  await supabase.from('tours_cache').upsert({ 
    city: nKey, 
    language, 
    data: tours,
    updated_at: new Date().toISOString()
  }, { onConflict: 'city,language' });
};

export const getCachedAudio = async (key: string): Promise<string | null> => {
  try {
      const fileName = `${normalizeKey(key)}.txt`;
      const { data, error } = await supabase.storage.from('audios').download(fileName);
      if (error || !data) return null;
      return await data.text();
  } catch (e) { return null; }
};

export const saveAudioToCache = async (key: string, base64: string) => {
  if (!base64 || base64.length < 100) return;
  try {
      const fileName = `${normalizeKey(key)}.txt`;
      const blob = new Blob([base64], { type: 'text/plain' });
      await supabase.storage.from('audios').upload(fileName, blob, { upsert: true, contentType: 'text/plain' });
  } catch (e) { console.error(e); }
};

export const sendOtpEmail = async (email: string) => {
    return await supabase.auth.signInWithOtp({ email });
};

export const verifyOtpCode = async (email: string, token: string) => {
    return await supabase.auth.verifyOtp({ email, token, type: 'email' });
};

export const validateEmailFormat = (email: string) => {
  return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
  const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
  return (data || []).map((d, i) => ({ ...d, rank: i + 1, name: d.username } as any));
};

export const getCommunityPosts = async (city: string) => {
  const normCity = normalizeKey(city);
  const { data } = await supabase.from('community_posts').select('*').eq('city', normCity).order('created_at', { ascending: false });
  return (data || []).map(d => ({
      id: d.id, user: d.user_name || 'Explorer', avatar: d.avatar, content: d.content,
      time: d.created_at ? new Date(d.created_at).toLocaleDateString() : '...',
      likes: d.likes || 0, type: d.type || 'comment', status: d.status || 'approved', userId: d.user_id
  }));
};

export const addCommunityPost = async (post: any) => {
  await supabase.from('community_posts').insert({
    city: normalizeKey(post.city), user_id: post.userId, user_name: post.user, avatar: post.avatar,
    content: post.content, type: post.type || 'comment', status: 'approved'
  });
};

export const getUserProfileByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) return null;
  return data;
};

export const syncUserProfile = async (profile: UserProfile) => {
  if (!profile || profile.id === 'guest') return;
  await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatar: profile.avatar,
      miles: profile.miles,
      language: profile.language,
      rank: profile.rank,
      bio: profile.bio,
      interests: profile.interests,
      visitedCities: profile.visitedCities,
      completedTours: profile.completedTours,
      stats: profile.stats,
      badges: profile.badges,
      socialLinks: profile.socialLinks,
      city: profile.city,
      country: profile.country,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
};
