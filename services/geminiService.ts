
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, una GUÍA FEMENINA de élite. ACENTO: Castellano puro de Madrid, España. TONO: Profesional, culto y apasionado. REGLA: Lee TODO el texto proporcionado. IDIOMA: ESPAÑOL DE ESPAÑA.",
    en: "PERSONALITY: Dai, female elite guide. STYLE: Deep technical narrative. RULE: Speak the FULL text. RESPOND IN ENGLISH.",
    ca: "PERSONALITAT: Dai, guia femenina d'elit. ESTIL: Narrativa profunda. RESPON EN CATALÀ.",
    eu: "NORTASUNA: Dai, emakumezko gida aditua. ERANTZUN EUSKARAZ.",
    fr: "PERSONNALITÉ: Dai, guide féminine d'élite. RÉPONDEZ EN FRANÇAIS."
};

const AUDIO_SESSION_CACHE = new Map<string, string>();

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/#/g, '').replace(/\n\n/g, ' ').trim();
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
            contents: `Official city name for: "${input}". Return ONLY the name.`,
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
            contents: `Como guía mujer española, saluda brevemente al viajero en ${city}. 10 palabras.`,
            config: { temperature: 0.7 }
        });
        return response.text?.trim() || "";
    } catch (e) { return ""; }
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile, contextGreeting?: string, skipEssential: boolean = false): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `${langRule}
  MISIÓN: Crea 2 RUTAS MASTERCLASS COMPLETAS para ${cityInput}. 
  
  ESTRUCTURA:
  1. 2 Tours diferentes.
  2. 10 paradas por cada tour.
  3. Mínimo 300 palabras por parada.
  4. TIPOS: 'historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'.`;

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
        stops: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ['historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'] },
              photoSpot: {
                type: Type.OBJECT,
                properties: { 
                  angle: { type: Type.STRING }, 
                  milesReward: { type: Type.NUMBER }, 
                  secretLocation: { type: Type.STRING } 
                },
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
            maxOutputTokens: 15000, 
            temperature: 0.8
        }
    });
    
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, 
        id: `tour_${idx}_${Date.now()}`, 
        city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}_${Date.now()}`, visited: false }))
    }));
  } catch (error) { return []; }
};

export const generateAudio = async (text: string, language: string = 'es', city: string = 'global'): Promise<string> => {
  const cleanText = cleanDescriptionText(text);
  const textHash = generateHash(cleanText);
  // Clave de caché unificada para Supabase y memoria
  const cacheKey = normalizeKey(`bd_f_v2_${language}_${textHash}`);

  if (AUDIO_SESSION_CACHE.has(cacheKey)) return AUDIO_SESSION_CACHE.get(cacheKey)!;
  const cached = await getCachedAudio(cacheKey, language, city);
  if (cached) {
    AUDIO_SESSION_CACHE.set(cacheKey, cached); 
    return cached;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Instrucción reforzada para que NO corte el texto
    const voicePrompt = `Narración íntegra por MUJER GUÍA de Madrid, España. Voz femenina, profesional y con acento castellano. Lee TODO el texto a continuación sin omitir nada: ${cleanText}`;

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
      // Guardado asíncrono en Supabase
      saveAudioToCache(cacheKey, language, city, audioData).catch(console.error);
    }
    return audioData;
  } catch (e) { 
    console.error("TTS Generation Error:", e);
    return ""; 
  }
};

// Fix: Added moderateContent to handle community board post moderation
export const moderateContent = async (text: string): Promise<boolean> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Determine if the following text is safe for a public travel community board (no hate speech, toxicity, or explicit content): "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN }
          },
          required: ["isSafe"]
        }
      }
    });
    const parsed = JSON.parse(response.text || '{"isSafe": true}');
    return !!parsed.isSafe;
  } catch (e) {
    return true; // Graceful fallback
  }
};

// Fix: Added generateCityPostcard to create AI-generated postcards for cities
export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `A cinematic vertical postcard of ${city} highlighting ${interests.join(' and ')}. High resolution, travel aesthetic, artistic style, no text.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "9:16"
        }
      }
    });
    
    // Iterate through all parts to find the image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image generation failed:", e);
    return null;
  }
};
