
import { createClient } from '@supabase/supabase-js';
import { Tour, UserProfile, LeaderboardEntry } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || "https://slldavgsoxunkphqeamx.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const normalizeKey = (city: string | undefined | null, country?: string) => {
    const safeCity = (city || "").toString().trim();
    if (!safeCity) return "";
    const raw = country ? `${safeCity}_${country}` : safeCity;
    return raw.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9_]/g, ""); 
};

// --- STORAGE LOGIC ---

const base64ToBlob = (base64: string, type: string = 'audio/mpeg') => {
  const binary = atob(base64.split(',')[1] || base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
};

export const getCachedAudio = async (key: string): Promise<string | null> => {
  const { data } = await supabase.from('audio_cache').select('file_path, base64').eq('key', key).maybeSingle();
  
  if (data && data.file_path) {
    const { data: fileData, error } = await supabase.storage.from('audios').download(data.file_path);
    if (!error && fileData) {
      // Si es un .txt antiguo (Base64 puro), leemos el texto directamente
      if (data.file_path.endsWith('.txt')) {
        const text = await fileData.text();
        return text.trim(); 
      }
      // Si es un .mp3 (Binario), lo convertimos a un formato que el reproductor entienda rápido
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(fileData);
      });
    }
  }
  // Fallback por si el archivo no está en storage pero sí en la base de datos (registros muy viejos)
  return (data && data.base64 && data.base64.length > 200) ? data.base64 : null;
};

export const saveAudioToCache = async (key: string, base64: string) => {
  // Guardamos como MP3 binario: ocupa menos y carga más rápido
  const fileName = `${key}_${Date.now()}.mp3`;
  const blob = base64ToBlob(base64);

  const { data: uploadData } = await supabase.storage
    .from('audios')
    .upload(fileName, blob, { contentType: 'audio/mpeg', upsert: true });

  await supabase.from('audio_cache').upsert({ 
    key, 
    file_path: uploadData?.path || null,
    base64: base64.substring(0, 100), // Solo una referencia corta en la tabla
    updated_at: new Date().toISOString() 
  });
};

// --- REST OF SERVICES ---

export const getCachedTours = async (city: string, country: string, language: string): Promise<{data: Tour[], langFound: string, cityName: