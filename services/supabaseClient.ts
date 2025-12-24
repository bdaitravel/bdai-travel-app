
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- GESTIÓN DE PERFIL ---
export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    if (error || !data) return null;
    
    return {
      ...data,
      firstName: data.first_name,
      lastName: data.last_name,
      visitedCities: data.visited_cities || [],
      completedTours: data.completed_tours || [],
      interests: data.interests || [],
      isLoggedIn: true
    } as UserProfile;
  } catch (e) { return null; }
};

export const syncUserProfile = async (user: UserProfile) => {
  if (!user || !user.isLoggedIn || user.id === 'guest') return;
  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email.toLowerCase(),
      username: user.username,
      miles: user.miles,
      rank: user.rank,
      language: user.language,
      avatar: user.avatar,
      interests: user.interests,
      visited_cities: user.visitedCities,
      completed_tours: user.completedTours,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });
  } catch (e) {
      console.error("Error syncing profile:", e);
  }
};

// --- RANKING (LEADERBOARD) ---
export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, username, avatar, miles, rank')
            .order('miles', { ascending: false })
            .limit(20);
        
        if (error) return [];
        return data.map((d, index) => ({
            id: d.id,
            name: `${d.first_name} ${d.last_name}`,
            username: d.username,
            avatar: d.avatar,
            miles: d.miles,
            rank: index + 1,
            isPublic: true
        }));
    } catch (e) { return []; }
};

// --- CACHÉ DE TOURS ---
export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  const cleanCity = city.toLowerCase().trim();
  try {
    const { data, error } = await supabase
      .from('tours_cache')
      .select('data')
      .eq('city', cleanCity)
      .eq('language', language)
      .maybeSingle();
    
    if (error || !data) return null;
    return data.data as Tour[];
  } catch (e) { return null; }
};

export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  const cleanCity = city.toLowerCase().trim();
  try {
    await supabase.from('tours_cache').upsert({
      city: cleanCity,
      language: language,
      data: tours,
      created_at: new Date().toISOString()
    }, { onConflict: 'city,language' });
  } catch (e) { }
};

// --- COMUNIDAD ---
export const getCommunityPosts = async (city: string) => {
    try {
        const { data, error } = await supabase
            .from('community_posts')
            .select('*')
            .eq('city', city)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data.map(d => ({
            id: d.id,
            user: d.user_name,
            avatar: d.user_avatar,
            content: d.content,
            time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            likes: d.likes,
            type: d.type
        }));
    } catch (e) { return []; }
};

export const addCommunityPost = async (post: any) => {
    try {
        await supabase.from('community_posts').insert({
            city: post.city,
            user_name: post.user,
            user_avatar: post.avatar,
            content: post.content,
            type: post.type
        });
    } catch (e) {}
};

export const getRecentCommunityCities = async (language: string): Promise<{city: string}[]> => {
  try {
    const { data, error } = await supabase
      .from('tours_cache')
      .select('city')
      .eq('language', language)
      .order('created_at', { ascending: false })
      .limit(8);
    
    if (error || !data) return [];
    const uniqueCities: string[] = Array.from(new Set(data.map((d: any) => String(d.city))));
    return uniqueCities.map((city: string) => ({ city }));
  } catch (e) { return []; }
};
