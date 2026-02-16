
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

// Load variables from process.env (mapped via Vite config)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== "" && supabaseAnonKey !== "");

/**
 * Safe initialization of the Supabase client.
 * If keys are missing, we export a proxy that prevents the app from white-screening 
 * on boot, allowing the UI to render and potentially show a configuration warning.
 */
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : new Proxy({}, {
      get: (target, prop) => {
        return () => {
          console.warn(`Supabase call to '${String(prop)}' ignored because Supabase is not configured.`);
          throw new Error("Supabase is not configured. Please check your SUPABASE_URL and SUPABASE_ANON_KEY environment variables.");
        };
      }
    }) as any;

// Genera un nombre de archivo único basado en el texto y el idioma
const generateHash = async (text: string, lang: string) => {
    const msgUint8 = new TextEncoder().encode(text + lang);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
};

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
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error || !data) return null;
    return { ...data, isLoggedIn: true };
  } catch (e) { return null; }
};

export const syncUserProfile = async (profile: UserProfile) => {
  if (!isSupabaseConfigured || !profile || !profile.email) return;
  try {
    await supabase.from('profiles').upsert({ 
        ...profile, 
        updated_at: new Date().toISOString() 
    }, { onConflict: 'email' });
  } catch (e) { console.error("Sync Error:", e); }
};

export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string, cityName: string} | null> => {
  if (!isSupabaseConfigured) return null;
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
  if (!isSupabaseConfigured) return;
  const nKey = normalizeKey(city, country);
  if (!nKey) return;
  try {
    await supabase.from('tours_cache').upsert({ city: nKey, language, data: tours }, { onConflict: 'city,language' });
  } catch (e) {}
};

export const getGlobalRanking = async () => {
  if (!isSupabaseConfigured) return [];
  try {
    const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
    return (data || []).map((d: any, i: number) => ({ ...d, rank: i + 1, name: d.username || 'Traveler' }));
  } catch (e) { return []; }
};

export const getCachedAudio = async (text: string, lang: string): Promise<string | null> => {
    if (!isSupabaseConfigured) return null;
    try {
        const hash = await generateHash(text, lang);
        const { data } = await supabase
            .from('audio_cache')
            .select('storage_path')
            .eq('text_hash', hash)
            .maybeSingle();

        if (data?.storage_path) {
            const { data: fileData } = await supabase.storage
                .from('audios')
                .download(data.storage_path);

            if (fileData) {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = (reader.result as string).split(',')[1];
                        resolve(base64);
                    };
                    reader.readAsDataURL(fileData);
                });
            }
        }
    } catch (e) { console.error("Cache Read Error", e); }
    return null;
};

export const saveAudioToCache = async (text: string, lang: string, base64: string, city: string) => {
    if (!isSupabaseConfigured) return;
    try {
        const hash = await generateHash(text, lang);
        const fileName = `${hash}.pcm`;
        const nCity = normalizeKey(city);
        const path = `${nCity}/${fileName}`;

        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/pcm' });

        const { error: uploadError } = await supabase.storage
            .from('audios')
            .upload(path, blob, { upsert: true, contentType: 'audio/pcm' });

        if (!uploadError) {
            await supabase.from('audio_cache').upsert({
                text_hash: hash,
                language: lang,
                city: nCity,
                storage_path: path,
                created_at: new Date().toISOString()
            }, { onConflict: 'text_hash' });
        }
    } catch (e) { console.error("Cache Write Error", e); }
};

export const getCommunityPosts = async (city: string) => {
    if (!isSupabaseConfigured) return [];
    const nKey = normalizeKey(city);
    try {
        const { data, error } = await supabase
            .from('community_posts')
            .select('*')
            .eq('city', nKey)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return (data || []).map(p => ({
            ...p,
            time: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        }));
    } catch (e) {
        console.error("Error fetching community posts:", e);
        return [];
    }
};

export const addCommunityPost = async (post: { city: string, userId: string, user: string, avatar: string, content: string, type: string }) => {
    if (!isSupabaseConfigured) return;
    const nKey = normalizeKey(post.city);
    try {
        const { error } = await supabase.from('community_posts').insert({
            ...post,
            city: nKey,
            created_at: new Date().toISOString()
        });
        if (error) throw error;
    } catch (e) {
        console.error("Error adding community post:", e);
        throw e;
    }
};

export const validateEmailFormat = (email: string) => { 
  return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/); 
};
