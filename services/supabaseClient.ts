
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

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
      id: data.id,
      email: data.email,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Traveler',
      username: data.username || 'traveler',
      avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username || 'Explorer'}`,
      language: data.language || 'es',
      miles: data.miles || 0,
      rank: data.rank || 'Turist',
      culturePoints: data.culture_points || 0,
      foodPoints: data.food_points || 0,
      photoPoints: data.photo_points || 0,
      interests: Array.isArray(data.interests) ? data.interests : [],
      accessibility: data.accessibility || 'standard',
      isPublic: data.is_public ?? false,
      bio: data.bio || '',
      age: data.age || 25,
      birthday: data.birthday || '',
      visitedCities: Array.isArray(data.visited_cities) ? data.visited_cities : [],
      completedTours: Array.isArray(data.completed_tours) ? data.completed_tours : [],
      savedIntel: Array.isArray(data.saved_intel) ? data.saved_intel : [],
      stats: data.stats || { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 },
      badges: Array.isArray(data.badges) ? data.badges : [],
      socialLinks: {}, 
      joinDate: data.join_date || data.created_at || new Date().toLocaleDateString(),
      passportNumber: data.passport_number || `XP-${data.id.substring(0,4).toUpperCase()}-BDAI`,
      isLoggedIn: true
    } as UserProfile;
  } catch (e) { return null; }
};

export const syncUserProfile = async (user: UserProfile) => {
  if (!user || !user.isLoggedIn || user.id === 'guest') return;
  
  const payload: any = {
    id: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name || `${user.firstName} ${user.lastName}`.trim(),
    first_name: user.firstName,
    last_name: user.lastName,
    username: user.username,
    avatar: user.avatar,
    language: user.language || 'es',
    miles: user.miles || 0,
    rank: user.rank || 'Turist',
    culture_points: user.culturePoints || 0,
    food_points: user.foodPoints || 0,
    photo_points: user.photoPoints || 0,
    interests: user.interests || [],
    accessibility: user.accessibility || 'standard',
    is_public: user.isPublic,
    bio: user.bio,
    age: user.age,
    birthday: user.birthday,
    visited_cities: user.visitedCities || [],
    completed_tours: user.completedTours || [],
    saved_intel: user.savedIntel || [],
    stats: user.stats,
    badges: user.badges || [],
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) console.warn("Supabase Sync Warning:", error.message);
  } catch (e) { 
    console.error("Critical Sync Error:", e);
  }
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
    try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, miles, rank, avatar, name')
          .order('miles', { ascending: false })
          .limit(10);
        
        if (error) return [];
        return data.map((d, index) => ({
            id: d.id, 
            name: d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username, 
            username: d.username,
            avatar: d.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.username}`, 
            miles: d.miles || 0, 
            rank: index + 1, 
            isPublic: true
        }));
    } catch (e) { return []; }
};

export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  const cleanCity = normalizeKey(city);
  try {
    const { data, error } = await supabase
      .from('tours_cache')
      .select('data')
      .ilike('city', cleanCity)
      .eq('language', language)
      .maybeSingle();
    
    if (error || !data) return null;
    return data.data as Tour[];
  } catch (e) { return null; }
};

export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  const cleanCity = normalizeKey(city);
  try {
    await supabase.from('tours_cache').upsert({
      city: cleanCity, 
      language, 
      data: tours, 
      created_at: new Date().toISOString()
    }, { onConflict: 'city,language' });
  } catch (e) { 
      console.error("Cache Save Error:", e);
  }
};

const generateSecureHash = (text: string, lang: string) => {
    const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    return `${lang}_${clean.length}_${clean.substring(0, 50)}`;
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
  } catch (e) { 
      console.error("Audio Cache Save Error:", e);
  }
}

export const getCommunityPosts = async (city: string) => {
  const cleanCity = normalizeKey(city);
  try {
    const { data, error } = await supabase.from('community_posts').select('*').ilike('city', cleanCity).order('created_at', { ascending: false });
    if (error) return [];
    return data.map(post => ({
      id: post.id, user: post.user, content: post.content, time: new Date(post.created_at).toLocaleTimeString(), likes: post.likes || 0, type: post.type || 'comment', userId: post.user_id, avatar: post.avatar
    }));
  } catch (e) { return []; }
};

export const addCommunityPost = async (postData: any) => {
  try {
    return await supabase.from('community_posts').insert({
      city: normalizeKey(postData.city), user_id: postData.userId, user: postData.user, avatar: postData.avatar, content: postData.content, type: postData.type, created_at: new Date().toISOString()
    });
  } catch (e) { return { error: e }; }
};
