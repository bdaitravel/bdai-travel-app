
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Tour, UserProfile } from '../types';

// En el entorno de la plataforma, estas variables se inyectan automáticamente
const supabaseUrl = (process.env as any).SUPABASE_URL || '';
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Recupera el perfil del usuario por ID
 */
export const getUserProfile = async (id: string): Promise<UserProfile | null> => {
  if (!supabase || !id || id === 'guest') return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Supabase GetProfile Error:", error.message);
      return null;
    }
    if (!data) return null;
    
    return {
      ...data,
      firstName: data.first_name,
      lastName: data.last_name,
      visitedCities: data.visited_cities || [],
      completedTours: data.completed_tours || [],
      isLoggedIn: true
    } as UserProfile;
  } catch (e) {
    console.error("Supabase Profile Exception:", e);
    return null;
  }
};

/**
 * Busca un tour en el caché de Supabase.
 */
export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('tours_cache')
      .select('data')
      .eq('city', city.toLowerCase().trim())
      .eq('language', language)
      .maybeSingle();

    if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 es "no rows found", que es normal
          console.warn("Supabase Cache Select Error:", error.message);
        }
        return null;
    }
    return data ? (data.data as Tour[]) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Guarda los tours generados en el caché global de Supabase
 */
export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('tours_cache').upsert({
      city: city.toLowerCase().trim(),
      language: language,
      data: tours,
      created_at: new Date().toISOString()
    }, { onConflict: 'city,language' });
    
    if (error) {
      console.warn("Supabase Cache Save Error:", error.message);
    } else {
      console.log("Tour cached in Supabase successfully.");
    }
  } catch (e) {
    console.error("Error saving to Supabase cache:", e);
  }
};

/**
 * Sincroniza el perfil del usuario con la base de datos
 */
export const syncUserProfile = async (user: UserProfile) => {
  if (!supabase || !user || !user.isLoggedIn || user.id === 'guest') {
    console.log("Sync skipped: User not ready or Supabase not connected.");
    return;
  }

  try {
    const { error } = await supabase.from('profiles').upsert({
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
    
    if (error) {
      console.error("Supabase Sync Error:", error.message);
    } else {
      console.log("User synced to Supabase successfully.");
    }
  } catch (e) {
    console.error("Error syncing profile to Supabase:", e);
  }
};
