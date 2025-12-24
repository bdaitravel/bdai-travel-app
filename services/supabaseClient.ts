
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const getUserProfile = async (id: string): Promise<UserProfile | null> => {
  if (!supabase || !id || id === 'guest') return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error || !data) return null;
    
    return {
      ...data,
      firstName: data.first_name,
      lastName: data.last_name,
      visitedCities: data.visited_cities || [],
      completedTours: data.completed_tours || [],
      culturePoints: data.culture_points || 0,
      foodPoints: data.food_points || 0,
      photoPoints: data.photo_points || 0,
      interests: data.interests || [],
      isLoggedIn: true
    } as UserProfile;
  } catch (e) { return null; }
};

export const syncUserProfile = async (user: UserProfile) => {
  if (!supabase || !user || !user.isLoggedIn || user.id === 'guest') return;
  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      username: user.username,
      miles: user.miles,
      rank: user.rank,
      language: user.language,
      avatar: user.avatar,
      bio: user.bio || '',
      interests: user.interests,
      culture_points: user.culturePoints,
      food_points: user.foodPoints,
      photo_points: user.photoPoints,
      visited_cities: user.visitedCities,
      completed_tours: user.completedTours,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (e) {
      console.error("Error sync user:", e);
  }
};

export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  if (!supabase) return null;
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
  if (!supabase || tours.length === 0) return;
  const cleanCity = city.toLowerCase().trim();
  try {
    await supabase.from('tours_cache').upsert({
      city: cleanCity,
      language: language,
      data: tours,
      created_at: new Date().toISOString()
    }, { onConflict: 'city,language' });
  } catch (e) {}
};

export const getRecentCommunityCities = async (language: string): Promise<{city: string}[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('tours_cache')
      .select('city')
      .eq('language', language)
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (error || !data) return [];
    return data.map((d: any) => ({ city: d.city }));
  } catch (e) { return []; }
};
