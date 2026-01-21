
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const normalizeKey = (text: string) => {
    if (!text) return "";
    return text.toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
};

export const validateEmailFormat = (email: string) => {
  return String(email)
    .toLowerCase()
    .trim()
    .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

export const sendOtpEmail = async (email: string) => {
    const emailClean = email.toLowerCase().trim();
    return await supabase.auth.signInWithOtp({
        email: emailClean,
        options: { shouldCreateUser: true }
    });
};

export const verifyOtpCode = async (email: string, token: string) => {
    const emailClean = email.toLowerCase().trim();
    const tokenClean = token.trim();
    
    const { data, error } = await supabase.auth.verifyOtp({
        email: emailClean, 
        token: tokenClean, 
        type: 'email'
    });

    if (error) {
        return await supabase.auth.verifyOtp({
            email: emailClean, 
            token: tokenClean, 
            type: 'signup'
        });
    }
    
    return { data, error: null };
};

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) return null;
  try {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
      if (error || !data) return null;
      return { 
          ...data, 
          firstName: data.first_name, 
          lastName: data.last_name, 
          isLoggedIn: true 
      } as any;
  } catch (e) { return null; }
};

export const syncUserProfile = async (user: UserProfile) => {
  if (!user || !user.id || user.id === 'guest') return;
  
  const emailClean = user.email ? user.email.toLowerCase().trim() : '';

  const payload = {
    id: user.id,
    email: emailClean,
    language: user.language || 'es',
    miles: user.miles || 0,
    username: user.username || 'traveler',
    avatar: user.avatar,
    first_name: user.firstName || '',
    last_name: user.lastName || '',
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('profiles').upsert(payload, { 
    onConflict: 'email' 
  });
  
  if (error) {
      console.error("Sync Profile Error:", error.message);
  }
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
  const { data } = await supabase.from('profiles').select('id, username, miles, avatar').order('miles', { ascending: false }).limit(10);
  return (data || []).map((d, i) => ({ ...d, rank: i + 1, name: d.username } as any));
};

export const getCachedTours = async (city: string, language: string): Promise<Tour[] | null> => {
  const normCity = normalizeKey(city);
  try {
      const { data, error } = await supabase.from('tours_cache').select('data').eq('city', normCity).eq('language', language).maybeSingle();
      if (error) return null;
      return data ? (data.data as Tour[]) : null;
  } catch (e) { return null; }
};

export const saveToursToCache = async (city: string, language: string, tours: Tour[]) => {
  if (!tours || tours.length === 0) return;
  const normCity = normalizeKey(city);
  
  try {
    await supabase.from('tours_cache').upsert({ 
        city: normCity, 
        language: language, 
        data: tours,
        updated_at: new Date().toISOString()
    }, { 
        onConflict: 'city,language' 
    });
  } catch (e) {}
};

export const getCachedAudio = async (key: string, language: string, city: string): Promise<string | null> => {
  try {
      const cleanKey = normalizeKey(key);
      const { data, error } = await supabase.from('audio_cache').select('base64').eq('text_hash', cleanKey).maybeSingle();
      if (error) return null;
      return data?.base64 || null;
  } catch (e) { return null; }
};

export const saveAudioToCache = async (key: string, language: string, city: string, base64: string) => {
  // Evitar guardar basura o audios vacíos
  if (!base64 || base64.length < 500) return;
  
  const cleanKey = normalizeKey(key);
  
  try {
      const payload = { 
          text_hash: cleanKey, 
          base64: base64, 
          language: language,
          city: normalizeKey(city)
      };

      // Al usar upsert con onConflict: 'text_hash', Supabase requiere que esa columna sea PRIMARY KEY
      const { error } = await supabase
          .from('audio_cache')
          .upsert(payload, { onConflict: 'text_hash' });

      if (error) {
          console.error(`❌ Error persistencia audio:`, error.message);
      } else {
          console.debug(`✅ Audio en la nube: ${cleanKey.substring(0, 10)}...`);
      }
  } catch (e) {
      console.error("❌ Fallo crítico saveAudio:", e);
  }
};

export const getCommunityPosts = async (city: string) => {
  const normCity = normalizeKey(city);
  try {
    const { data, error } = await supabase.from('community_posts').select('*').eq('city', normCity).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      user: d.user_name || 'Explorer',
      avatar: d.avatar,
      content: d.content,
      time: d.created_at ? new Date(d.created_at).toLocaleDateString() : '...',
      likes: d.likes || 0,
      type: d.type || 'comment',
      status: d.status || 'approved',
      userId: d.user_id
    }));
  } catch (e) { return []; }
};

export const addCommunityPost = async (post: any) => {
  try {
    const { error } = await supabase.from('community_posts').insert({
      city: normalizeKey(post.city),
      user_id: post.userId,
      user_name: post.user,
      avatar: post.avatar,
      content: post.content,
      type: post.type || 'comment',
      status: 'approved'
    });
    if (error) throw error;
  } catch (e) {}
};
