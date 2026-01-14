
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const normalizeKey = (text: string) => {
    if (!text) return "";
    return text.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");     
};

/**
 * Genera un hash único incluyendo la ciudad y el idioma para evitar regresiones y colisiones.
 */
const generateTextHash = (text: string, language: string, city: string) => {
    const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const normCity = normalizeKey(city) || "global";
    if (cleanText.length === 0) return `${normCity}_${language}_empty`;
    
    // Llave sólida: ciudad_idioma_longitud_inicio_fin
    const textPart = `len${cleanText.length}_${cleanText.substring(0, 15)}_${cleanText.slice(-15)}`;
    return `${normCity}_${language}_${textPart}`;
};

export const sendOtpEmail = async (email: string) => {
    const emailClean = email.toLowerCase().trim();
    return await supabase.auth.signInWithOtp({
        email: emailClean,
        options: { 
            shouldCreateUser: true,
            emailRedirectTo: window.location.origin
        }
    });
};

export const verifyOtpCode = async (email: string, token: string) => {
    const emailClean = email.toLowerCase().trim();
    const tokenClean = token.trim();
    
    let result = await supabase.auth.verifyOtp({
        email: emailClean, 
        token: tokenClean, 
        type: 'magiclink'
    });

    if (result.error) {
        result = await supabase.auth.verifyOtp({
            email: emailClean, token: tokenClean, type: 'email'
        });
    }

    if (result.error) {
        result = await supabase.auth.verifyOtp({
            email: emailClean, token: tokenClean, type: 'signup'
        });
    }

    return result;
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (error || !data) return null;
    return { ...data, id: data.id, language: data.language || 'es', miles: data.miles || 0, isLoggedIn: true } as any;
  } catch (e) { return null; }
};

export const syncUserProfile = async (user: UserProfile) => {
  if (!user || !user.isLoggedIn || user.id === 'guest') return;
  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email.toLowerCase().trim(),
      language: user.language,
      miles: user.miles,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (e) { console.error("Sync Error:", e); }
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
    try {
        const { data, error } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
        if (error) return [];
        return data.map((d, i) => ({ ...d, rank: i + 1, isPublic: true } as any));
    } catch (e) { return []; }
};

export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  try {
    const normCity = normalizeKey(city);
    const { data } = await supabase.from('tours_cache').select('data').eq('city', normCity).eq('language', language).maybeSingle();
    return data ? (data.data as Tour[]) : null;
  } catch (e) { return null; }
};

export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  if (!tours || tours.length === 0) return;
  try {
    const normCity = normalizeKey(city);
    await supabase.from('tours_cache').upsert({
      city: normCity, language: language, data: tours, created_at: new Date().toISOString()
    }, { onConflict: 'city,language' });
  } catch (e) { console.error("Cache Save Error:", e); }
};

export const getCachedAudio = async (text: string, language: string, city: string): Promise<string | null> => {
  const hash = generateTextHash(text, language, city);
  try {
    const { data } = await supabase.from('audio_cache').select('base64').eq('text_hash', hash).eq('language', language).maybeSingle();
    return data?.base64 || null;
  } catch (e) { return null; }
};

export const saveAudioToCache = async (text: string, language: string, city: string, base64: string) => {
  const hash = generateTextHash(text, language, city);
  try {
    await supabase.from('audio_cache').upsert({ text_hash: hash, language, base64, created_at: new Date().toISOString() }, { onConflict: 'text_hash,language' });
  } catch (e) { console.error("Audio Save Error:", e); }
};

export const getCommunityPosts = async (city: string) => {
  try {
    const normCity = normalizeKey(city);
    const { data, error } = await supabase.from('community_posts').select('*').eq('city', normCity).order('created_at', { ascending: false });
    return error ? [] : data.map(p => ({ ...p, time: new Date(p.created_at).toLocaleTimeString() }));
  } catch (e) { return []; }
};

export const addCommunityPost = async (postData: any) => {
  try {
    const normCity = normalizeKey(postData.city);
    return await supabase.from('community_posts').insert({
      city: normCity, user_id: postData.userId, user: postData.user, avatar: postData.avatar, content: postData.content, created_at: new Date().toISOString()
    });
  } catch (e) { return { error: e }; }
};
