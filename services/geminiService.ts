
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedTours, saveToursToCache } from './supabaseClient';
import { STATIC_TOURS } from '../data/toursData';

const getClient = () => {
    const key = process.env.API_KEY;
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
};

const LANGUAGE_MAP: Record<string, string> = {
    es: "Spanish (Spain)",
    en: "English (Global)",
    fr: "French",
    eu: "Basque (Euskara)",
    ca: "Catalan"
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const cityLower = cityInput.toLowerCase().trim();
  const targetLang = LANGUAGE_MAP[userProfile.language] || LANGUAGE_MAP.es;
  const interestsStr = userProfile.interests.join(", ") || "culture and history";
  
  // 1. Intentar cargar de la caché global (Supabase)
  const globalCached = await getCachedTours(cityLower, userProfile.language);
  if (globalCached && globalCached.length > 0) {
      return globalCached;
  }
  
  // 2. Fallback ciudades estáticas (SOLO SI EL IDIOMA ES ESPAÑOL)
  if (userProfile.language === 'es') {
    const staticMatch = STATIC_TOURS.filter(t => t.city.toLowerCase() === cityLower);
    if (staticMatch.length > 0) return staticMatch;
  }
  
  // 3. Generación con IA (Obligatoria si no es español o no está en caché)
  const ai = getClient();
  if (!ai) return [];

  const prompt = `
    ROLE: Professional local guide for ${cityInput}.
    USER PROFILE: Passionate about ${interestsStr}.
    TASK: Create 2 immersive walking tours for ${cityInput} with exactly 8 stops each.
    CRITICAL: You MUST write everything in ${targetLang}. This includes titles, descriptions, and names.
    
    STYLE:
    - No bullet points.
    - Narrative storytelling.
    - Blend history with "insider tips" in the same paragraph.
    - Tone: Enthusiastic and knowledgeable.
  `;
  
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
                    milesReward: { type: Type.NUMBER } 
                },
                required: ["angle", "bestTime", "instagramHook", "milesReward"]
              }
            },
            required: ["name", "description", "latitude", "longitude", "type"]
          }
        }
      },
      required: ["title", "description", "duration", "distance", "difficulty", "theme", "stops"]
    }
  };

  try {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: responseSchema 
        }
    });
    
    const generatedTours = JSON.parse(response.text || "[]");
    const processed = generatedTours.map((t: any, idx: number) => ({
        ...t, 
        id: `gen_${idx}_${Date.now()}`,
        city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ 
            ...s, 
            id: `s_${idx}_${sIdx}`, 
            visited: false
        }))
    }));

    await saveToursToCache(cityInput, userProfile.language, processed);
    return processed;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return [];
  }
};

export const generateAudio = async (text: string): Promise<string> => {
  const ai = getClient(); 
  if (!ai || !text) return "";
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: text.substring(0, 1000) }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
      } 
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { return ""; }
};
