
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedTours, saveToursToCache, getCachedAudio, saveAudioToCache } from './supabaseClient';

const LANGUAGE_MAP: Record<string, string> = {
    es: "Spanish (Castellano de España)",
    en: "English (British)",
    ca: "Catalan (Català de Catalunya)",
    eu: "Basque (Euskara de Euskal Herria)",
    fr: "French (Français de France)"
};

/**
 * Modera el contenido del usuario antes de publicarlo en la comunidad.
 * Devuelve true si el contenido es apto, false si es ofensivo.
 */
export const moderateContent = async (text: string): Promise<boolean> => {
    if (!text || text.length < 2) return false;
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analiza si el siguiente mensaje es apto para una comunidad de viajes. 
            Responde "SAFE" si el mensaje es respetuoso y útil. 
            Responde "UNSAFE" si contiene insultos, odio, spam agresivo o contenido inapropiado.
            MENSAJE: "${text}"`,
        });
        const result = response.text?.trim().toUpperCase();
        return result === "SAFE";
    } catch (e) {
        console.error("Moderation error, allowing by default:", e);
        return true; // Si falla la API, permitimos para no bloquear al usuario, pero logueamos
    }
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const cityLower = cityInput.toLowerCase().trim();
  
  const globalCached = await getCachedTours(cityLower, userProfile.language);
  if (globalCached && globalCached.length > 0) return globalCached;
  
  const targetLanguage = LANGUAGE_MAP[userProfile.language] || LANGUAGE_MAP.es;

  const prompt = `YOU ARE THE WORLD'S MOST EXPERT FREE TOUR GUIDE.
  Your task is to design exactly 4 DIFFERENT THEMATIC TOURS for: ${cityInput}.
  
  UNBREAKABLE RULES:
  - Valid for ANY city in the world.
  - 10 REAL STOPS per tour.
  - LANGUAGE: All content strictly in ${targetLanguage}.
  - Tailor to profile (Interests: ${userProfile.interests.join(", ")}).`;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        duration: { type: Type.STRING },
        distance: { type: Type.STRING },
        difficulty: { type: Type.STRING, enum: ["Easy", "Moderate", "Hard"] },
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
              type: { type: Type.STRING },
              photoSpot: {
                type: Type.OBJECT,
                properties: { 
                    angle: { type: Type.STRING }, 
                    bestTime: { type: Type.STRING }, 
                    instagramHook: { type: Type.STRING }, 
                    milesReward: { type: Type.NUMBER },
                    secretLocation: { type: Type.STRING }
                },
                required: ["angle", "bestTime", "instagramHook", "milesReward", "secretLocation"]
              }
            },
            required: ["name", "description", "latitude", "longitude", "type", "photoSpot"]
          }
        }
      },
      required: ["title", "description", "duration", "distance", "difficulty", "theme", "stops"]
    }
  };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: prompt,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            temperature: 0.8
        }
    });
    
    const parsed = JSON.parse(response.text || "[]");
    const processed = parsed.map((t: any, idx: number) => ({
        ...t, 
        id: `tour_${idx}_${Date.now()}`, 
        city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}`, visited: false }))
    }));

    await saveToursToCache(cityLower, userProfile.language, processed);
    return processed;
  } catch (error) { 
    console.error("Gemini Global Tour Error:", error);
    return []; 
  }
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  if (!text) return "";
  const cleanText = text.replace(/[*_#\[\]]/g, '').trim().substring(0, 3000);
  const cached = await getCachedAudio(cleanText, language);
  if (cached) return cached;
  
  const targetLanguage = LANGUAGE_MAP[language] || LANGUAGE_MAP.es;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const audioResponse: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: `Read with professional guide tone in ${targetLanguage}: ${cleanText}` }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } } 
      }
    });
    const base64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (base64) await saveAudioToCache(cleanText, language, base64);
    return base64;
  } catch (e) { return ""; }
};
