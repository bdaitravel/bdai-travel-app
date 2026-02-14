
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

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

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      username: data.username || email.split('@')[0],
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      avatar: data.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
      miles: data.miles || 0,
      language: data.language || 'es',
      rank: data.rank || 'Turist',
      birthday: data.birthday || '1995-01-01',
      city: data.city || '',
      country: data.country || '',
      isLoggedIn: true,
      culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0,
      interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25,
      stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0, streakDays: 1 },
      visitedCities: [], completedTours: [], badges: [], stamps: []
    };
  } catch (e) {
    return null;
  }
};

export const syncUserProfile = async (profile: UserProfile) => {
  if (!profile || !profile.email) return;
  try {
    await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      username: profile.username,
      first_name: profile.firstName,
      last_name: profile.lastName,
      miles: profile.miles,
      language: profile.language,
      avatar: profile.avatar,
      birthday: profile.birthday,
      city: profile.city,
      country: profile.country
    }, { onConflict: 'email' });
  } catch (e) {
    console.error("Sync error", e);
  }
};

export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string, cityName: string} | null> => {
  const nInput = normalizeKey(city, country);
  try {
    const { data: exactMatch } = await supabase.from('tours_cache').select('data, language, city').eq('city', nInput).eq('language', language).maybeSingle();
    if (exactMatch && exactMatch.data) {
      return { data: exactMatch.data as Tour[], langFound: language, cityName: exactMatch.city };
    }
  } catch (e) {}
  return null; 
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nKey = normalizeKey(city, country);
  if (!nKey) return;
  try {
    await supabase.from('tours_cache').upsert({ city: nKey, language, data: tours }, { onConflict: 'city,language' });
  } catch (e) {}
};

export const getGlobalRanking = async () => {
  try {
    const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
    return (data || []).map((d: any, i: number) => ({ ...d, rank: i + 1, name: d.username || 'Traveler' }));
  } catch (e) { return []; }
};

export const getCachedAudio = async (text: string, lang: string) => {
    try {
        const key = `${lang}_${text.substring(0, 30).replace(/\s+/g, '_')}`;
        const { data } = await supabase.from('audio_cache').select('base64').eq('id', key).maybeSingle();
        return data?.base64 || null;
    } catch (e) { return null; }
};

export const saveAudioToCache = async (text: string, lang: string, base64: string, city: string) => {
    try {
        const key = `${lang}_${text.substring(0, 30).replace(/\s+/g, '_')}`;
        await supabase.from('audio_cache').upsert({ id: key, base64, city: normalizeKey(city) });
        return base64;
    } catch (e) { return base64; }
};

export const getCommunityPosts = async (city: string) => {
    try {
        const nCity = normalizeKey(city);
        const { data } = await supabase.from('community_posts').select('*').eq('city', nCity).order('created_at', { ascending: false });
        return (data || []).map((p: any) => ({
            id: p.id,
            user: p.user_name,
            avatar: p.avatar,
            content: p.content,
            time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            likes: p.likes || 0
        }));
    } catch (e) { return []; }
};

export const addCommunityPost = async (post: any) => {
    try {
        const { error } = await supabase.from('community_posts').insert({
            city: normalizeKey(post.city),
            user_id: post.userId,
            user_name: post.user,
            avatar: post.avatar,
            content: post.content,
            type: post.type || 'comment'
        });
        return { success: !error };
    } catch (e) { return { success: false }; }
};

export const validateEmailFormat = (email: string) => { 
  return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); 
};
