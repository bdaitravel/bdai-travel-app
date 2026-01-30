
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const normalizeKey = (city: string, country?: string) => {
    const raw = country ? `${city}_${country}` : city;
    return raw.toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9]/g, ""); 
};

export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string, cityName: string} | null> => {
  const nInput = normalizeKey(city, country);
  if (!nInput) return null;
  const { data: exactMatch } = await supabase.from('tours_cache').select('data, language, city').eq('city', nInput).eq('language', language).maybeSingle();
  if (exactMatch) return { data: exactMatch.data as Tour[], langFound: language, cityName: exactMatch.city };
  const { data: fuzzyMatch } = await supabase.from('tours_cache').select('data, language, city').ilike('city', `${nInput}%`).eq('language', language).limit(1).maybeSingle();
  if (fuzzyMatch) return { data: fuzzyMatch.data as Tour[], langFound: language, cityName: fuzzyMatch.city };
  const { data: anyMatch } = await supabase.from('tours_cache').select('data, language, city').eq('city', nInput).limit(1).maybeSingle();
  if (anyMatch) return { data: anyMatch.data as Tour[], langFound: anyMatch.language, cityName: anyMatch.city };
  return null;
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nKey = normalizeKey(city, country);
  await supabase.from('tours_cache').upsert({ city: nKey, language, data: tours, updated_at: new Date().toISOString() }, { onConflict: 'city,language' });
};

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

export const sendOtpEmail = async (email: string) => { return await supabase.auth.signInWithOtp({ email }); };
export const verifyOtpCode = async (email: string, token: string) => { return await supabase.auth.verifyOtp({ email, token, type: 'email' }); };
export const validateEmailFormat = (email: string) => { return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); };

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
  const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
  return (data || []).map((d, i) => ({ ...d, rank: i + 1, name: d.username || 'Traveler' } as any));
};

export const getCommunityPosts = async (city: string) => {
  const normCity = normalizeKey(city);
  const { data } = await supabase.from('community_posts').select('*').eq('city', normCity).order('created_at', { ascending: false });
  return (data || []).map(d => ({ id: d.id, user: d.user_name || 'Explorer', avatar: d.avatar, content: d.content, time: d.created_at ? new Date(d.created_at).toLocaleDateString() : '...', likes: d.likes || 0, type: d.type || 'comment', status: d.status || 'approved', userId: d.user_id }));
};

export const addCommunityPost = async (post: any) => { await supabase.from('community_posts').insert({ city: normalizeKey(post.city), user_id: post.userId, user_name: post.user, avatar: post.avatar, content: post.content, type: post.type || 'comment', status: 'approved' }); };

export const getUserProfileByEmail = async (email: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
  if (error) return null;
  if (!data) return null;

  // MAPEAMOS DE SNAKE_CASE (DB) A CAMELCASE (APP)
  return {
    id: data.id,
    email: data.email,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    avatar: data.avatar,
    miles: data.miles || 0,
    language: data.language || 'es',
    rank: data.rank || 'Turist',
    bio: data.bio || '',
    interests: data.interests || [],
    visitedCities: data.visited_cities || [],
    completedTours: data.completed_tours || [],
    stats: data.stats || {},
    badges: data.badges || [],
    culturePoints: data.culture_points || 0,
    foodPoints: data.food_points || 0,
    photoPoints: data.photo_points || 0,
    accessibility: data.accessibility || 'standard',
    isPublic: data.is_public || false,
    age: data.age || 25,
    birthday: data.birthday,
    passportNumber: data.passport_number,
    name: data.name
  };
};

export const syncUserProfile = async (profile: UserProfile) => {
  if (!profile || profile.id === 'guest' || !profile.isLoggedIn) return;
  
  // MAPEAMOS DE CAMELCASE (APP) A SNAKE_CASE (DB) PARA QUE SUPABASE LO ENTIENDA
  const payload = {
    id: profile.id,
    email: profile.email,
    username: profile.username || 'traveler',
    first_name: profile.firstName || '',
    last_name: profile.lastName || '',
    avatar: profile.avatar,
    miles: profile.miles || 0,
    language: profile.language || 'es',
    rank: profile.rank || 'Turist',
    bio: profile.bio || '',
    interests: profile.interests || [],
    visited_cities: profile.visitedCities || [],
    completed_tours: profile.completedTours || [],
    stats: profile.stats || {},
    badges: profile.badges || [],
    culture_points: profile.culturePoints || 0,
    food_points: profile.foodPoints || 0,
    photo_points: profile.photoPoints || 0,
    accessibility: profile.accessibility || 'standard',
    is_public: profile.isPublic || false,
    age: profile.age || 25,
    birthday: profile.birthday || '',
    passport_number: profile.passportNumber || '',
    name: profile.name || '',
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  
  if (error) {
    console.error("SYNC ERROR:", error.message);
  }
};
