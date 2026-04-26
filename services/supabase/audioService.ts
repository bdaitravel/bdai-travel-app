import { supabase } from './client';

const generateHash = async (text: string): Promise<string> => {
    const normalized = text.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[.,!?;:]/g, '')
        .trim();
    const msgUint8 = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const getCachedAudio = async (text: string, lang: string): Promise<string | null> => {
    try {
        const hash = await generateHash(text);
        const { data, error } = await supabase.from('audio_cache').select('audio_url').eq('text_hash', hash).eq('language', lang.toLowerCase()).maybeSingle();
        if (error) throw error;
        return data?.audio_url || null;
    } catch (e) { return null; }
};