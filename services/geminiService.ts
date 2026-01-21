
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, analista forense de BIDAER. ESTILO: CÍNICO, DENSO, RAW. REGLA DE ORO DE TRADUCCIÓN: RESPONDE EXCLUSIVAMENTE EN ESPAÑOL DE ESPAÑA (CASTELLANO). Prohibido usar inglés u otros idiomas en nombres de paradas o descripciones.",
    en: "PERSONALITY: You are Dai, analyst for BIDAERS. Style: CYNICAL, DENSE, RAW. TRANSLATION RULE: RESPOND EXCLUSIVELY IN ENGLISH.",
    ca: "PERSONALITAT: Ets la Dai per a BIDAERS. Estil cínic i dens. REGLA DE TRADUCCIÓ: RESPON EXCLUSIVAMENT EN CATALÀ.",
    eu: "NORTASUNA: Dai zara BIDAERentzako. Estilo zinikoa eta sakona. ITZULPEN ARAUA: ERANTZUN BAKARRIK EUSKARAZ.",
    fr: "PERSONNALITÉ: Vous êtes Dai pour BIDAERS. Style cynique et dense. RÈGLE DE TRADUCTION: RÉPONDEZ EXCLUSIVEMENT EN FRANÇAIS."
};

const AUDIO_SESSION_CACHE = new Map<string, string>();

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/#/g, '').trim();
};

const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export const standardizeCityName = async (input: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Normalize this city name to its official name in Spanish: "${input}". Return ONLY the name.`,
            config: { temperature: 0 }
        });
        return response.text?.trim() || input;
    } catch (e) { return input; }
};

export const getGreetingContext = async (city: string, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are Dai. Technical greeting for a Bidaer in ${city}. Max 12 words. Respond ONLY in language: ${language}.`,
            config: { temperature: 0.7 }
        });
        return response.text?.trim() || "";
    } catch (e) { return ""; }
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile, contextGreeting?: string, skipEssential: boolean = false): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `${langRule}
  MISIÓN: Crea 3 TOURS ÚNICOS para ${cityInput}.
  REGLA DE ORO DE IDIOMA: TODO EL CONTENIDO (Títulos, Paradas, Descripciones) DEBE ESTAR AL 100% EN EL IDIOMA: ${userProfile.language}.
  REGLA DE DENSIDAD: MÍNIMO 300 PALABRAS POR PARADA. Sé técnico y forense.
  Devuelve un JSON ARRAY.`;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        duration: { type: Type.STRING },
        distance: { type: Type.STRING },
        theme: { type: Type.STRING },
        isEssential: { type: Type.BOOLEAN },
        stops: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              type: { type: Type.STRING },
              photoSpot: {
                type: Type.OBJECT,
                properties: { angle: { type: Type.STRING }, milesReward: { type: Type.NUMBER }, secretLocation: { type: Type.STRING } },
                required: ["angle", "milesReward", "secretLocation"]
              }
            },
            required: ["name", "description", "latitude", "longitude", "type", "photoSpot"]
          }
        }
      },
      required: ["title", "description", "duration", "distance", "theme", "stops"]
    }
  };

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            maxOutputTokens: 12000
        }
    });
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput,
        difficulty: 'Hard',
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_sIdx_${Date.now()}`, visited: false }))
    }));
  } catch (error) { return []; }
};

export const generateAudio = async (text: string, language: string = 'es', city: string = 'global'): Promise<string> => {
  const cleanText = cleanDescriptionText(text);
  const textHash = generateHash(cleanText);
  
  // USAMOS normalizeKey PARA ASEGURAR QUE NO HAYA ESPACIOS NI CARACTERES QUE ROMPAN LA URL
  const cacheKey = normalizeKey(`bdai_${language}_${textHash}`);

  if (AUDIO_SESSION_CACHE.has(cacheKey)) {
    return AUDIO_SESSION_CACHE.get(cacheKey)!;
  }

  const cached = await getCachedAudio(cacheKey, language, city);
  if (cached) {
    AUDIO_SESSION_CACHE.set(cacheKey, cached); 
    return cached;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const voicePrompt = language === 'es' 
        ? `Habla con acento de Madrid (España), voz de hombre maduro, clara y natural: ${cleanText}`
        : cleanText;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: voicePrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    
    if (audioData) {
      AUDIO_SESSION_CACHE.set(cacheKey, audioData);
      // Guardar en Supabase para que otros usuarios lo aprovechen
      await saveAudioToCache(cacheKey, language, city, audioData);
    }
    return audioData;
  } catch (e) { 
    console.error("Gemini TTS Error:", e);
    return ""; 
  }
};

export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze if this community post is safe and appropriate for a travel community board. Is it offensive, toxic, or spam? Answer ONLY with "SAFE" or "UNSAFE". Text: "${text}"`,
            config: { temperature: 0 }
        });
        const result = response.text?.trim().toUpperCase();
        return result === "SAFE";
    } catch (e) { return true; }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A stunning cinematic, artistic travel postcard of ${city} highlighting interests like ${interests.join(', ')}. Vibrant lighting, high resolution, 9:16 aspect ratio.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: "9:16" }
            }
        });

        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (part?.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        return null;
    } catch (e) { return null; }
};
