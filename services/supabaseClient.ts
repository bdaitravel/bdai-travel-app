
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const normalizeKey = (text: string) => {
    if (!text) return "";
    return text.toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9]/g, "");     
};

// --- PERFILES ---
export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
  return (error || !data) ? null : { ...data, isLoggedIn: true } as any;
};

export const syncUserProfile = async (user: UserProfile) => {
  if (!user || !user.id || user.id === 'guest') return;
  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email.toLowerCase().trim(),
    language: user.language || 'es',
    miles: user.miles || 0,
    username: user.username || 'traveler',
    avatar: user.avatar,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
};

// --- TOURS (EN TABLA) ---
export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  const normCity = normalizeKey(city);
  // Usamos ilike con % para que si pones "Vitoria" encuentre "Vitoria-Gasteiz"
  const { data, error } = await supabase.from('tours_cache')
    .select('data')
    .ilike('city', `%${normCity}%`)
    .eq('language', language)
    .limit(1);
    
  return (error || !data || data.length === 0) ? null : (data[0].data as Tour[]);
};

export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  const normCity = normalizeKey(city);
  await supabase.from('tours_cache').upsert({ city: normCity, language, data: tours }, { onConflict: 'city,language' });
};

// --- AUDIOS (EN STORAGE - NO EN TABLA) ---
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

// --- AUTH ---
export const sendOtpEmail = async (email: string) => {
    return await supabase.auth.signInWithOtp({ email: email.toLowerCase().trim(), options: { shouldCreateUser: true } });
};

export const verifyOtpCode = async (email: string, token: string) => {
    return await supabase.auth.verifyOtp({ email: email.toLowerCase().trim(), token: token.trim(), type: 'email' });
};

export const validateEmailFormat = (email: string) => {
  return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

// --- RANKING & COMUNIDAD ---
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
