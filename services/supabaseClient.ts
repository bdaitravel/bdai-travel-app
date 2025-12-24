
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
    console.error("⚠️ SUPABASE NO CONFIGURADO: No se guardarán las rutas.");
}

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
      isLoggedIn: true
    } as UserProfile;
  } catch (e) { return null; }
};

export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('tours_cache')
      .select('data')
      .eq('city', city.toLowerCase().trim())
      .eq('language', language)
      .maybeSingle();
    
    if (error) return null;
    return data ? (data.data as Tour[]) : null;
  } catch (e) { return null; }
};

export const getRecentCommunityCities = async (language: string): Promise<{city: string, country?: string}[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('tours_cache')
      .select('city')
      .eq('language', language)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error || !data) return [];
    const uniqueCities = Array.from(new Set(data.map((d: any) => d.city as string)));
    return uniqueCities.map((c: string) => ({ city: c.charAt(0).toUpperCase() + c.slice(1) }));
  } catch (e) { return []; }
};

export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  if (!supabase || tours.length === 0) return;
  try {
    await supabase.from('tours_cache').upsert({
      city: city.toLowerCase().trim(),
      language: language,
      data: tours,
      created_at: new Date().toISOString()
    }, { onConflict: 'city,language' });
    console.log(`✅ Cacheada en Supabase: ${city}`);
  } catch (e) {
    console.error("Error saving cache:", e);
  }
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
      visited_cities: user.visitedCities,
      completed_tours: user.completedTours,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (e) {}
};
