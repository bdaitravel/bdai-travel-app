
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const audioMemoryCache = new Map<string, string>();
const CACHE_VERSION = "V7_CORE_SYNC"; 

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
      miles: data.miles || 0,
      isLoggedIn: true,
      joinDate: data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString()
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
    avatar: user.avatar,
    updated_at: new Date().toISOString()
  };
  try {
    await supabase.from('profiles').upsert(payload, { onConflict: 'email' });
  } catch (e) { }
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
    try {
        const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, username, avatar, miles, rank').order('miles', { ascending: false }).limit(10);
        if (error) return [];
        return data.map((d, index) => ({
            id: d.id, name: `${d.first_name || ''} ${d.last_name || ''}`, username: d.username,
            avatar: d.avatar, miles: d.miles || 0, rank: index + 1, isPublic: true
        }));
    } catch (e) { return []; }
};

export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  const cleanCity = normalizeKey(city);
  try {
    // Usamos 'ilike' para que busque "Logroño" dentro de "logroño, españa"
    // Y no filtramos por versión aquí para rescatar tus datos antiguos
    const { data, error } = await supabase
      .from('tours_cache')
      .select('data, city')
      .ilike('city', `%${cleanCity}%`)
      .eq('language', language)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) {
        console.info(`[Buda] CACHE MISS para ${cleanCity}`);
        return null;
    }
    
    console.info(`[Buda] CACHE HIT para ${data.city}`);
    return data.data as Tour[];
  } catch (e) { 
    return null; 
  }
};

export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  const cleanCity = normalizeKey(city);
  try {
    // Intentamos guardar con la estructura completa
    await supabase.from('tours_cache').insert({
      city: cleanCity, 
      language, 
      data: tours, 
      version: CACHE_VERSION,
      created_at: new Date().toISOString()
    });
    console.info(`[Buda] Nuevo caché guardado para ${cleanCity}`);
  } catch (e) { }
};

const generateSecureHash = (text: string, lang: string) => {
    const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    return `V7_${lang}_${clean.length}_${clean.substring(0, 20)}`;
};

export const getCachedAudio = async (text: string, language: string): Promise<string | null> => {
  const hash = generateSecureHash(text, language);
  if (audioMemoryCache.has(hash)) return audioMemoryCache.get(hash)!;
  try {
    const { data, error } = await supabase.from('audio_cache').select('base64').eq('text_hash', hash).eq('language', language).maybeSingle();
    if (error || !data) return null;
    audioMemoryCache.set(hash, data.base64);
    return data.base64;
  } catch (e) { return null; }
};

export const saveAudioToCache = async (text: string, language: string, base64: string) => {
  const hash = generateSecureHash(text, language);
  audioMemoryCache.set(hash, base64);
  try {
    await supabase.from('audio_cache').upsert({
      text_hash: hash, language, base64, created_at: new Date().toISOString()
    }, { onConflict: 'text_hash,language' });
  } catch (e) { }
}

export const getCommunityPosts = async (city: string) => {
  const cleanCity = normalizeKey(city);
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .ilike('city', `%${cleanCity}%`)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    
    return data.map(post => ({
      id: post.id,
      user: post.user,
      avatar: post.avatar,
      content: post.content,
      time: post.created_at ? new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      likes: post.likes || 0,
      type: post.type || 'comment',
      status: post.status || 'approved',
      userId: post.user_id
    }));
  } catch (e) {
    return [];
  }
};

export const addCommunityPost = async (postData: any) => {
  const cleanCity = normalizeKey(postData.city);
  try {
    const { error } = await supabase.from('community_posts').insert({
      city: cleanCity,
      user_id: postData.userId,
      user: postData.user,
      avatar: postData.avatar,
      content: postData.content,
      type: postData.type,
      created_at: new Date().toISOString(),
      status: 'approved'
    });
    return { error };
  } catch (e) {
    return { error: e };
  }
};
