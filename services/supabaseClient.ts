
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const testDbConnection = async () => {
    try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
            console.error("⚠️ Error de conexión a Supabase:", error.message);
            return false;
        }
        return true;
    } catch (err) {
        return false;
    }
};

export const normalizeKey = (text: string) => {
    if (!text) return "";
    return text.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
};

export const validateEmailFormat = (email: string) => {
  return String(email).toLowerCase().trim().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

export const sendOtpEmail = async (email: string) => {
    return await supabase.auth.signInWithOtp({ email: email.toLowerCase().trim() });
};

export const verifyOtpCode = async (email: string, token: string) => {
    return await supabase.auth.verifyOtp({ email: email.toLowerCase().trim(), token: token.trim(), type: 'email' });
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
  if (error) {
      console.error("Error recuperando perfil:", error.message);
      return null;
  }
  return data as any;
};

export const syncUserProfile = async (user: UserProfile) => {
  if (!user || user.id === 'guest' || !user.email) return;

  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email.toLowerCase().trim(),
    language: user.language,
    miles: user.miles,
    username: user.username || 'traveler',
    avatar: user.avatar,
    updated_at: new Date().toISOString()
  }, { onConflict: 'email' });
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
  const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(20);
  return (data || []).map((d, i) => ({ ...d, rank: i + 1, name: d.username } as any));
};

export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  const normCity = normalizeKey(city);
  const rawCity = city.toLowerCase().trim();

  // INTENTO 1: Búsqueda con normalización agresiva
  let { data, error } = await supabase.from('tours_cache')
    .select('data')
    .eq('city', normCity)
    .eq('language', language)
    .maybeSingle();

  // INTENTO 2: Si no hay nada, intentamos búsqueda por nombre de ciudad más flexible
  if (!data) {
      console.log(`Buscando tour antiguo para: ${rawCity}`);
      const { data: dataRaw } = await supabase.from('tours_cache')
        .select('data')
        .ilike('city', `%${rawCity}%`)
        .eq('language', language)
        .limit(1)
        .maybeSingle();
      data = dataRaw;
  }

  return data ? (data.data as Tour[]) : null;
};

export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  const normCity = normalizeKey(city);
  await supabase.from('tours_cache').upsert({ city: normCity, language, data: tours });
};

export const getCachedAudio = async (key: string, language: string, city: string): Promise<string | null> => {
  const cleanKey = normalizeKey(key);
  const { data } = await supabase.from('audio_cache').select('base64').eq('id', cleanKey).maybeSingle();
  return data?.base64 || null;
};

export const saveAudioToCache = async (id: string, language: string, city: string, base64: string) => {
  if (!base64) return;
  const cleanKey = normalizeKey(id);
  await supabase.from('audio_cache').upsert({ id: cleanKey, base64: base64, language: language });
};

export const getCommunityPosts = async (city: string) => {
    const { data } = await supabase
        .from('community_posts')
        .select('*')
        .eq('city', city)
        .order('created_at', { ascending: false });
    return (data || []).map(post => ({
        ...post,
        time: post.created_at ? new Date(post.created_at).toLocaleDateString() : 'now'
    }));
};

export const addCommunityPost = async (postData: any) => {
    await supabase.from('community_posts').insert([{ ...postData, likes: 0, status: 'approved', created_at: new Date().toISOString() }]);
};
