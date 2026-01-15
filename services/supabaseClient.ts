
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const normalizeKey = (text: string) => {
    if (!text) return "";
    return text.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");     
};

export const validateEmailFormat = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

export const sendOtpEmail = async (email: string) => {
    const emailClean = email.toLowerCase().trim();
    return await supabase.auth.signInWithOtp({
        email: emailClean,
        options: { shouldCreateUser: true }
    });
};

export const verifyOtpCode = async (email: string, token: string) => {
    const emailClean = email.toLowerCase().trim();
    const tokenClean = token.trim();
    
    // Verificación directa y única
    const { data, error } = await supabase.auth.verifyOtp({
        email: emailClean, 
        token: tokenClean, 
        type: 'email'
    });

    if (error) {
        // Re-intento rápido para registros nuevos
        return await supabase.auth.verifyOtp({
            email: emailClean, 
            token: tokenClean, 
            type: 'signup'
        });
    }
    
    return { data, error: null };
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) return null;
  try {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
      if (error || !data) return null;
      return { ...data, isLoggedIn: true } as any;
  } catch (e) { return null; }
};

export const syncUserProfile = async (user: UserProfile) => {
  if (!user || user.id === 'guest') return;
  // Ejecución asíncrona no bloqueante
  supabase.from('profiles').upsert({
    id: user.id,
    email: user.email.toLowerCase().trim(),
    language: user.language,
    miles: user.miles,
    updated_at: new Date().toISOString()
  }).then();
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
  const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
  return (data || []).map((d, i) => ({ ...d, rank: i + 1 } as any));
};

export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  const normCity = normalizeKey(city);
  try {
      const { data } = await supabase.from('tours_cache').select('data').eq('city', normCity).eq('language', language).maybeSingle();
      return data ? (data.data as Tour[]) : null;
  } catch (e) { return null; }
};

export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  const normCity = normalizeKey(city);
  supabase.from('tours_cache').upsert({ city: normCity, language, data: tours }).then();
};

export const getCachedAudio = async (key: string, language: string, city: string): Promise<string | null> => {
  try {
      const { data } = await supabase.from('audio_cache').select('base64').eq('id', key).maybeSingle();
      return data?.base64 || null;
  } catch (e) { return null; }
};

export const saveAudioToCache = async (key: string, language: string, city: string, base64: string) => {
  supabase.from('audio_cache').upsert({ id: key, language, base64, city: normalizeKey(city) }).then();
};

// Fix: Added missing getCommunityPosts function to retrieve posts from the city board
export const getCommunityPosts = async (city: string) => {
  try {
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .eq('city', city)
      .order('created_at', { ascending: false });
    
    return (data || []).map(post => ({
      ...post,
      // Map created_at to time string for UI if time property is missing
      time: post.time || (post.created_at ? new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now')
    }));
  } catch (e) {
    return [];
  }
};

// Fix: Added missing addCommunityPost function to allow users to post secrets and tips
export const addCommunityPost = async (post: any) => {
  try {
    return await supabase
      .from('community_posts')
      .insert([{
        ...post,
        likes: 0,
        status: 'approved',
        created_at: new Date().toISOString()
      }]);
  } catch (e) {
    console.error('Error adding community post:', e);
    return { error: e };
  }
};
