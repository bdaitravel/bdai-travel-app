
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
  const { data: exactMatch } = await supabase.from('tours_cache').select('data, language, city').eq('city', nInput).eq('language', language).maybeSingle();
  if (exactMatch && exactMatch.data) {
    return { data: exactMatch.data as Tour[], langFound: language, cityName: exactMatch.city };
  }
  return null; 
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nKey = normalizeKey(city, country);
  if (!nKey) return;
  await supabase.from('tours_cache').upsert({ city: nKey, language, data: tours }, { onConflict: 'city,language' });
};

export const deleteCityCache = async (city: string, country: string) => {
    const nKey = normalizeKey(city, country);
    const { error } = await supabase.from('tours_cache').delete().eq('city', nKey);
    return !error;
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

// CACHÉ DE AUDIO REAL EN SUPABASE
export const getCachedAudio = async (text: string, lang: string): Promise<string | null> => {
    const hash = btoa(text.slice(0, 50) + lang).slice(0, 100);
    const { data } = await supabase.from('audio_cache').select('audio_base64').eq('id', hash).maybeSingle();
    return data?.audio_base64 || null;
};

export const saveAudioToCache = async (text: string, lang: string, base64: string, city: string): Promise<string> => {
    const hash = btoa(text.slice(0, 50) + lang).slice(0, 100);
    await supabase.from('audio_cache').upsert({ id: hash, text: text.slice(0, 100), language: lang, audio_base64: base64, city: city });
    return base64;
};

export const getCommunityPosts = async (city: string) => {
    const nKey = normalizeKey(city);
    const { data } = await supabase
        .from('community_posts')
        .select('*')
        .eq('city', nKey)
        .order('created_at', { ascending: false });
    
    return (data || []).map(post => ({
        id: post.id,
        user: post.user_name || 'Explorer',
        avatar: post.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        content: post.content,
        time: post.created_at ? new Date(post.created_at).toLocaleTimeString() : '',
        likes: post.likes || 0
    }));
};

export const addCommunityPost = async (post: { city: string, userId: string, user: string, avatar: string, content: string, type: string }) => {
    const nKey = normalizeKey(post.city);
    const { error } = await supabase.from('community_posts').insert({
        city: nKey,
        user_id: post.userId,
        user_name: post.user,
        avatar: post.avatar,
        content: post.content,
        type: post.type
    });
    return !error;
};
