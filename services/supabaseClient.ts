
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
  
  const { data: exactMatch } = await supabase.from('tours_cache')
    .select('data, language, city')
    .eq('city', nInput)
    .eq('language', language)
    .maybeSingle();
    
  if (exactMatch) return { data: exactMatch.data as Tour[], langFound: language, cityName: exactMatch.city };
  
  const { data: anyMatch } = await supabase.from('tours_cache')
    .select('data, language, city')
    .eq('city', nInput)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (anyMatch) return { data: anyMatch.data as Tour[], langFound: anyMatch.language, cityName: anyMatch.city };
  
  return null;
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nKey = normalizeKey(city, country);
  await supabase.from('tours_cache').upsert({ city: nKey, language, data: tours, updated_at: new Date().toISOString() }, { onConflict: 'city,language' });
};

export const getCachedAudio = async (key: string): Promise<string | null> => {
  try {
      const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${safeKey}.txt`;
      const { data, error } = await supabase.storage.from('audios').download(fileName);
      if (error || !data) return null;
      return await data.text();
  } catch (e) { return null; }
};

export const saveAudioToCache = async (key: string, base64: string) => {
  if (!base64 || base64.length < 100) return;
  try {
      const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${safeKey}.txt`;
      const blob = new Blob([base64], { type: 'text/plain' });
      await supabase.storage.from('audios').upload(fileName, blob, { upsert: true, contentType: 'text/plain' });
  } catch (e) { console.error(e); }
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
  const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
  return (data || []).map((d, i) => ({ ...d, rank: i + 1, name: d.username || 'Traveler' } as any));
};

export const getUserProfileByEmail = async (email: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
  if (error) return null;
  if (!data) return null;

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
    stamps: data.stamps || [],
    stats: data.stats || {},
    badges: data.badges || [],
    culturePoints: data.culture_points || 0,
    foodPoints: data.food_points || 0,
    photoPoints: data.photo_points || 0,
    historyPoints: data.history_points || 0,
    naturePoints: data.nature_points || 0,
    artPoints: data.art_points || 0,
    archPoints: data.arch_points || 0,
    accessibility: data.accessibility || 'standard',
    isPublic: data.is_public || false,
    age: data.age || 25,
    birthday: data.birthday,
    city: data.city,
    country: data.country,
    name: data.name,
    capturedMoments: data.captured_moments || []
  };
};

export const syncUserProfile = async (profile: UserProfile): Promise<{success: boolean, error?: string}> => {
  if (!profile || profile.id === 'guest' || !profile.isLoggedIn) return { success: false, error: 'Not logged in' };
  
  const fullPayload = {
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
    stamps: profile.stamps || [],
    stats: profile.stats || {},
    badges: profile.badges || [],
    culture_points: profile.culturePoints || 0,
    food_points: profile.foodPoints || 0,
    photo_points: profile.photoPoints || 0,
    history_points: profile.historyPoints || 0,
    nature_points: profile.naturePoints || 0,
    art_points: profile.artPoints || 0,
    arch_points: profile.archPoints || 0,
    accessibility: profile.accessibility || 'standard',
    is_public: profile.isPublic || false,
    age: profile.age || 25,
    birthday: profile.birthday || '',
    city: profile.city || '',
    country: profile.country || '',
    name: profile.name || '',
    captured_moments: profile.capturedMoments || [],
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('profiles').upsert(fullPayload, { onConflict: 'id' });
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const validateEmailFormat = (email: string) => { return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); };

// Fix: Implement getCommunityPosts for city-specific traveler intelligence board
export const getCommunityPosts = async (city: string) => {
  const nCity = normalizeKey(city);
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('city', nCity)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching community posts:", error);
    return [];
  }
  
  return (data || []).map(post => ({
    id: post.id,
    user: post.user_name,
    avatar: post.avatar,
    content: post.content,
    time: new Date(post.created_at).toLocaleDateString(),
    likes: post.likes || 0
  }));
};

// Fix: Implement addCommunityPost to allow users to share secrets in the community board
export const addCommunityPost = async (post: any) => {
  const nCity = normalizeKey(post.city);
  const { error } = await supabase.from('community_posts').insert({
    city: nCity,
    user_id: post.userId,
    user_name: post.user,
    avatar: post.avatar,
    content: post.content,
    type: post.type,
    created_at: new Date().toISOString()
  });
  
  if (error) {
    console.error("Error adding community post:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};
