
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry, HubIntel } from '../types';

const supabaseUrl = "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const normalizeKey = (text: string) => {
    if (!text) return "";
    return text.toLowerCase().trim();
};

export const sendOtpEmail = async (email: string) => {
    return await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: { shouldCreateUser: true }
    });
};

export const verifyOtpCode = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(), token, type: 'signup',
    });
    if (error) return await supabase.auth.verifyOtp({ email: email.toLowerCase().trim(), token, type: 'magiclink' });
    return { data, error };
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (error || !data) return null;
    return {
      ...data, 
      firstName: data.first_name || '', 
      lastName: data.last_name || '',
      visitedCities: Array.isArray(data.visited_cities) ? data.visited_cities : [], 
      completedTours: Array.isArray(data.completed_tours) ? data.completed_tours : [],
      interests: Array.isArray(data.interests) ? data.interests : [], 
      badges: Array.isArray(data.badges) ? data.badges : [],
      savedIntel: Array.isArray(data.saved_intel) ? data.saved_intel : [],
      miles: data.miles || 0,
      isLoggedIn: true,
      joinDate: data.join_date || data.created_at || new Date().toLocaleDateString()
    } as UserProfile;
  } catch (e) { return null; }
};

export const syncUserProfile = async (user: UserProfile) => {
  if (!user || !user.isLoggedIn || user.id === 'guest') return;
  const payload: any = {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email.toLowerCase().trim(),
    username: user.username,
    miles: user.miles || 0,
    rank: user.rank || 'Turist',
    language: user.language || 'es',
    join_date: user.joinDate || new Date().toLocaleDateString(),
    saved_intel: user.savedIntel || [],
    updated_at: new Date().toISOString()
  };
  try {
    await supabase.from('profiles').upsert(payload, { onConflict: 'email' });
  } catch (e) { }
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
    try {
        const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, username, miles, rank').order('miles', { ascending: false }).limit(10);
        if (error) return [];
        return data.map((d, index) => ({
            id: d.id, name: `${d.first_name || ''} ${d.last_name || ''}`, username: d.username,
            avatar: '', miles: d.miles || 0, rank: index + 1, isPublic: true
        }));
    } catch (e) { return []; }
};

export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  const cleanCity = normalizeKey(city);
  try {
    const { data, error } = await supabase
      .from('tours_cache')
      .select('data')
      .ilike('city', `%${cleanCity}%`)
      .eq('language', language)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) return null;
    return data.data as Tour[];
  } catch (e) { return null; }
};

export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  const cleanCity = normalizeKey(city);
  try {
    await supabase.from('tours_cache').insert({
      city: cleanCity, 
      language, 
      data: tours, 
      created_at: new Date().toISOString()
    });
  } catch (e) { }
};

const generateSecureHash = (text: string, lang: string) => {
    const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    return `BDAI_V8_${lang}_${clean.length}_${clean.substring(0, 30)}`;
};

export const getCachedAudio = async (text: string, language: string): Promise<string | null> => {
  const hash = generateSecureHash(text, language);
  try {
    const { data, error } = await supabase.from('audio_cache').select('base64').eq('text_hash', hash).eq('language', language).maybeSingle();
    if (error || !data) return null;
    return data.base64;
  } catch (e) { return null; }
};

export const saveAudioToCache = async (text: string, language: string, base64: string) => {
  const hash = generateSecureHash(text, language);
  try {
    await supabase.from('audio_cache').upsert({
      text_hash: hash, language, base64, created_at: new Date().toISOString()
    }, { onConflict: 'text_hash,language' });
  } catch (e) { }
}

export const getCommunityPosts = async (city: string) => {
  const cleanCity = normalizeKey(city);
  try {
    const { data, error } = await supabase.from('community_posts').select('*').ilike('city', `%${cleanCity}%`).order('created_at', { ascending: false });
    if (error) return [];
    return data.map(post => ({
      id: post.id, user: post.user, content: post.content, time: post.created_at, likes: post.likes || 0, type: post.type || 'comment', userId: post.user_id
    }));
  } catch (e) { return []; }
};

export const addCommunityPost = async (postData: any) => {
  try {
    return await supabase.from('community_posts').insert({
      city: normalizeKey(postData.city), user_id: postData.userId, user: postData.user, content: postData.content, type: postData.type, created_at: new Date().toISOString()
    });
  } catch (e) { return { error: e }; }
};
