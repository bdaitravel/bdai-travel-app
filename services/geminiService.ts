
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

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[] | 'QUOTA'> => {
  const targetLanguage = LANGUAGE_MAP[userProfile.language] || LANGUAGE_MAP.es;
  const cached = await getCachedTours(cityInput, userProfile.language);
  if (cached && cached.length > 0) return cached;

  const prompt = `HISTORIAN PERSONA. CITY: ${cityInput}. LANG: ${targetLanguage}.
  TASK: Create 2 premium tours (15 stops each). 
  RULES:
  - DESCRIPTION: Exactly 180-220 words per stop (Massive chronicles).
  - NO HEADERS: Fluid story only.
  - INTERESTS: ${userProfile.interests.join(", ")}.`;

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
              imgKeywords: { type: Type.STRING },
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
            required: ["name", "description", "latitude", "longitude", "type", "photoSpot", "imgKeywords"]
          }
        }
      },
      required: ["title", "description", "duration", "distance", "difficulty", "theme", "stops"]
    }
  };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: prompt,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
        }
    });
    
    const parsed = JSON.parse(response.text || "[]");
    const processed = parsed.map((t: any, idx: number) => ({
        ...t, 
        id: `tour_${idx}_${Date.now()}`, 
        city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({
            ...s,
            id: `s_${idx}_${sIdx}`,
            visited: false,
            imageUrl: `https://images.unsplash.com/photo-1543783232-261f9107558e?auto=format&fit=crop&w=1200&q=80&sig=${encodeURIComponent(s.imgKeywords || s.name)}`
        }))
    }));

    await saveToursToCache(cityInput, userProfile.language, processed);
    return processed;
  } catch (error: any) { 
    if (error.message?.toLowerCase().includes('quota') || error.message?.includes('429')) return 'QUOTA';
    return []; 
  }
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  if (!text) return "";
  const cleanText = text.substring(0, 1000);
  const cached = await getCachedAudio(cleanText, language);
  if (cached) return cached;
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const audioResponse: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: `Narrate clearly: ${cleanText}` }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } } 
      }
    });
    const base64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (base64) await saveAudioToCache(cleanText, language, base64);
    return base64;
  } catch (e: any) { 
    if (e.message?.toLowerCase().includes('quota')) return "QUOTA_EXHAUSTED";
    return ""; 
  }
};

export const moderateContent = async (text: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Is this travel post safe? "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { isSafe: { type: Type.BOOLEAN } },
          required: ["isSafe"]
        }
      }
    });
    const result = JSON.parse(response.text || '{"isSafe": true}');
    return result.isSafe;
  } catch (error) { return true; }
};
