import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

// 1. Configuración Blindada (Vite + Vercel)
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjI0ODU3fQ.Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Utilidades de Validación y Perfil
export const validateEmailFormat = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const getUserProfileByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) console.error("Error fetching profile:", error);
  return data;
};

export const syncUserProfile = async (profile: UserProfile) => {
  const { error } = await supabase.from('profiles').upsert(profile);
  if (error) console.error("Error syncing profile:", error);
};

export const getGlobalRanking = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, avatar, miles, rank')
    .order('miles', { ascending: false })
    .limit(10);
  return data || [];
};

export const checkIfCityCached = async (city: string, country: string) => {
  const { data } = await supabase
    .from('tours_cache')
    .select('id')
    .ilike('city', city)
    .eq('country', country)
    .maybeSingle();
  return !!data;
};
