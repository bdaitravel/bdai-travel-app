
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

let supabase: any;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error("Critical Supabase Init Error:", e);
  supabase = {
    auth: { getSession: async () => ({ data: { session: null } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }), upsert: async () => ({}) })
  };
}

export { supabase };

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
      isLoggedIn: true,
      culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0,
      interests: [], accessibility: 'standard', isPublic: false, bio: data.bio || '', age: data.age || 25,
      birthday: data.birthday || '', city: data.city || '', country: data.country || '',
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
      bio: profile.bio,
      city: profile.city,
      country: profile.country,
      birthday: profile.birthday,
      age: profile.age
    }, { onConflict: 'email' });
  } catch (e) {
    console.error("Sync error", e);
  }
};

export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string, cityName: string} | null> => {
  const nInput = normalizeKey(city, country);
  if (!nInput) return null;
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

export const validateEmailFormat = (email: string) => { 
  return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); 
};

export const getGlobalRanking = async () => {
  try {
    const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
    return (data || []).map((d: any, i: number) => ({ ...d, rank: i + 1, name: d.username || 'Traveler' }));
  } catch (e) {
    return [];
  }
};
export const getCommunityPosts = async (city: string) => { return []; };
export const addCommunityPost = async (post: any) => { return { success: true }; };
