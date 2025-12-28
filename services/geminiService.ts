
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

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const cityLower = cityInput.toLowerCase().trim();
  
  const globalCached = await getCachedTours(cityLower, userProfile.language);
  if (globalCached && globalCached.length > 0) return globalCached;
  
  const targetLanguage = LANGUAGE_MAP[userProfile.language] || LANGUAGE_MAP.es;

  const prompt = `YOU ARE THE WORLD'S MOST EXPERT FREE TOUR GUIDE.
  Your task is to design exactly 4 DIFFERENT THEMATIC TOURS (e.g., Iconic History, Foodie Paradise, Night Pulse, Hidden Nature/Secrets) for the city: ${cityInput}.
  
  UNBREAKABLE RULES:
  - Valid for ANY city in the world.
  - Each tour MUST have exactly 10 REAL STOPS with high information density.
  - Be specific. Mention street names, history, and "insider" tips.
  - LANGUAGE: All content strictly in ${targetLanguage}.
  - Tailor to profile (Interests: ${userProfile.interests.join(", ")}).
  
  STOP FORMAT:
  - Real place name.
  - Description: 4 paragraphs (History, Legend/Mystery, AI Curiosities, Pro Tip).
  - Exact GPS coordinates.
  - Secret Photo Spot details.`;

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
