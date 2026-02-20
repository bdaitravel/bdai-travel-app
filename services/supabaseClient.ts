import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

// 1. Configuración Blindada (Vite + Vercel)
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjI0ODU3fQ.Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Funciones de Usuario y Ranking
export const validateEmailFormat = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getUserProfileByEmail = async (email: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
  return data;
};

export const syncUserProfile = async (profile: UserProfile) => {
  await supabase.from('profiles').upsert(profile);
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
  const { data } = await supabase.from('profiles').select('id, username, name, avatar, miles, rank').order('miles', { ascending: false }).limit(10);
  return (data || []) as LeaderboardEntry[];
};

// 3. Gestión de Cache (Para Admin y Gemini)
export const checkIfCityCached = async (city: string, country: string) => {
  const { data } = await supabase.from('tours_cache').select('id').ilike('city', city).eq('country', country).maybeSingle();
  return !!data;
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: any[]) => {
  await supabase.from('tours_cache').upsert({ city: city.toLowerCase(), country, language: language.toLowerCase(), data: tours }, { onConflict: 'city,language' });
};

// 4. Audio y Comunidad (Para que no den error)
export const getCachedAudio = async (text: string, lang: string) => {
  const { data } = await supabase.from('audio_cache').select('url').eq('text', text).eq('language', lang).maybeSingle();
  return data?.url;
};

export const saveAudioToCache = async (text: string, lang: string, url: string) => {
  await supabase.from('audio_cache').upsert({ text, language: lang, url });
};

export const getCommunityPosts = async () => {
  const { data } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const addCommunityPost = async (post: any) => {
  await supabase.from('community_posts').insert(post);
};
