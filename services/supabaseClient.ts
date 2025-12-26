
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const generateTextHash = (text: string): string => {
    let hash = 0;
    // Normalización extrema para evitar duplicados por minúsculas o espacios
    const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (clean.length === 0) return "empty_v5";
    for (let i = 0; i < clean.length; i++) {
        const char = clean.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `v5_${Math.abs(hash).toString(36)}_${clean.length}`;
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', cleanEmail).maybeSingle();
    if (error || !data) return null;
    return {
      ...data, firstName: data.first_name, lastName: data.last_name,
      visitedCities: data.visited_cities || [], completedTours: data.completed_tours || [],
      interests: data.interests || [], isLoggedIn: true
    } as UserProfile;
  } catch (e) { return null; }
};

export const syncUserProfile = async (user: UserProfile) => {
  if (!user || !user.isLoggedIn || user.id === 'guest') return;
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, first_name: user.firstName, last_name: user.lastName,
      email: user.email.toLowerCase().trim(), username: user.username,
      miles: user.miles, rank: user.rank, language: user.language,
      avatar: user.avatar, interests: user.interests,
      visited_cities: user.visitedCities, completed_tours: user.completedTours,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });
    if (error) console.error("Supabase Sync Error:", error.message);
    else console.log("Profile Synced with Cloud");
  } catch (e) { console.error("Cloud Sync Failure:", e); }
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
    try {
        const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, username, avatar, miles, rank').order('miles', { ascending: false }).limit(20);
        if (error) return [];
        return data.map((d, index) => ({
            id: d.id, name: `${d.first_name} ${d.last_name}`, username: d.username,
            avatar: d.avatar, miles: d.miles, rank: index + 1, isPublic: true
        }));
    } catch (e) { return []; }
};

export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  try {
    const { data, error } = await supabase.from('tours_cache').select('data').eq('city', city.toLowerCase().trim()).eq('language', language).maybeSingle();
    return (error || !data) ? null : data.data as Tour[];
  } catch (e) { return null; }
};

export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  try {
    await supabase.from('tours_cache').upsert({
      city: city.toLowerCase().trim(), language, data: tours, created_at: new Date().toISOString()
    }, { onConflict: 'city,language' });
  } catch (e) { }
};

export const getCachedAudio = async (text: string, language: string): Promise<string | null> => {
  const hash = generateTextHash(text);
  try {
    const { data, error } = await supabase.from('audio_cache').select('base64').eq('text_hash', hash).eq('language', language).maybeSingle();
    if (data) console.log("Audio cache HIT for hash:", hash);
    return (error || !data) ? null : data.base64;
  } catch (e) { return null; }
};

export const saveAudioToCache = async (text: string, language: string, base64: string) => {
  if (!base64 || base64.length < 100) return;
  const hash = generateTextHash(text);
  try {
    const { data, error } = await supabase.from('audio_cache').upsert({
      text_hash: hash, language, base64, created_at: new Date().toISOString()
    }, { onConflict: 'text_hash,language' });
    console.log("Audio cache SAVED for hash:", hash);
  } catch (e) { }
};

// Fix: added explicit return type and String conversion to solve 'unknown' type inference error in TravelServices
export const getRecentCommunityCities = async (language: string): Promise<{ city: string }[]> => {
  try {
    const { data } = await supabase.from('tours_cache').select('city').eq('language', language).order('created_at', { ascending: false }).limit(10);
    if (!data) return [];
    // Ensuring city is a string to satisfy the type requirement in the UI
    return Array.from(new Set(data.map((d: any) => String(d.city)))).map(city => ({ city }));
  } catch (e) { return []; }
};

// Fix: added optional userId parameter to match the function signature used in CommunityBoard.tsx
export const getCommunityPosts = async (city: string, _userId?: string) => {
  try {
    const { data, error } = await supabase.from('community_posts').select('*').eq('city', city).order('created_at', { ascending: false });
    if (error) return [];
    return data.map(post => ({
      id: post.id, user: post.user_name, avatar: post.avatar_url, content: post.content,
      time: new Date(post.created_at).toLocaleDateString(), likes: post.likes || 0,
      type: post.type || 'comment', status: post.status || 'approved', userId: post.user_id
    }));
  } catch (e) { return []; }
};

export const addCommunityPost = async (post: any) => {
  try {
    await supabase.from('community_posts').insert({
      city: post.city, user_id: post.userId, user_name: post.user,
      avatar_url: post.avatar, content: post.content, type: post.type,
      status: 'pending', created_at: new Date().toISOString()
    });
  } catch (e) { }
};
