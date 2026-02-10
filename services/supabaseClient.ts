
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const normalizeKey = (city: string | undefined | null) => {
    if (!city) return "";
    return city.toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/ñ/g, "n")              
        .replace(/[^a-z0-9]/g, "")       
        .trim();
};

/**
 * Busca en la base de datos extrayendo el país del primer tour para mostrarlo en el buscador.
 */
export const searchCitiesInCache = async (term: string) => {
    const nTerm = normalizeKey(term);
    if (!nTerm) return [];
    
    const { data } = await supabase.from('tours_cache')
        .select('city, language, data')
        .ilike('city', `${nTerm}%`);
    
    if (!data) return [];

    const results: any[] = [];
    const seen = new Set();

    data.forEach(row => {
        const tours = row.data as Tour[];
        const countryName = tours[0]?.country || "Archivo";
        const key = `${row.city}_${countryName}`;
        
        if (!seen.has(key)) {
            seen.add(key);
            results.push({
                name: row.city.charAt(0).toUpperCase() + row.city.slice(1),
                spanishName: row.city.charAt(0).toUpperCase() + row.city.slice(1),
                country: countryName,
                isCached: true
            });
        }
    });

    return results;
};

export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string, cityName: string} | null> => {
  const nCity = normalizeKey(city);
  if (!nCity) return null;

  const { data: exactMatch } = await supabase.from('tours_cache')
    .select('data, language, city')
    .eq('city', nCity)
    .eq('language', language)
    .maybeSingle();

  if (exactMatch && exactMatch.data) {
    return { data: exactMatch.data as Tour[], langFound: language, cityName: city };
  }

  const { data: anyMatch } = await supabase.from('tours_cache')
    .select('data, language, city')
    .eq('city', nCity)
    .limit(1)
    .maybeSingle();

  if (anyMatch && anyMatch.data) {
    return { data: anyMatch.data as Tour[], langFound: anyMatch.language, cityName: city };
  }

  return null; 
};

export const saveToursToCache = async (city: string, country: string, language: string, tours: Tour[]) => {
  const nCity = normalizeKey(city);
  if (!nCity) return;
  
  await supabase.from('tours_cache').upsert({ 
    city: nCity, 
    language, 
    data: tours 
  }, { onConflict: 'city,language' });
};

export const getUserProfileByEmail = async (email: string) => {
  const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
  if (!data) return null;
  return {
    ...data,
    id: data.id,
    isLoggedIn: true,
    firstName: data.first_name,
    lastName: data.last_name,
    username: data.username || 'explorer',
    avatar: data.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    miles: data.miles || 0,
    language: data.language || 'es'
  };
};

export const syncUserProfile = async (profile: UserProfile) => {
  if (!profile || profile.id === 'guest') return;
  await supabase.from('profiles').upsert({
    id: profile.id,
    email: profile.email,
    username: profile.username,
    first_name: profile.firstName,
    last_name: profile.lastName,
    miles: profile.miles,
    language: profile.language
  });
};

export const getGlobalRanking = async () => {
    const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
    return (data || []).map((d, i) => ({ ...d, rank: i + 1, name: d.username || 'Traveler' }));
};

export const validateEmailFormat = (email: string) => { return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); };
export const getCachedAudio = async (text: string, lang: string): Promise<string | null> => null;
export const saveAudioToCache = async (text: string, lang: string, base64: string, city: string): Promise<string> => base64;
export const getCommunityPosts = async (city: string) => [];
export const addCommunityPost = async (post: any) => ({ success: true });
