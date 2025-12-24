
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedTours, saveToursToCache } from './supabaseClient';
import { STATIC_TOURS } from '../data/toursData';

// Guideline: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LANGUAGE_MAP: Record<string, string> = {
    es: "Spanish (Spain)",
    en: "English (Global)",
    fr: "French",
    eu: "Basque (Euskara)",
    ca: "Catalan"
};

/**
 * GENERACIÓN DE TOURS PERSONALIZADOS
 * Crea una experiencia única para cualquier ciudad del mundo.
 */
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
  
  // 3. Generación con IA
  const prompt = `
    ROLE: Professional local guide for ${cityInput} with 20 years of experience.
    USER PROFILE: Traveler looking for an experience focused on ${interestsStr}.
    LANGUAGE: All output MUST be in ${targetLang}.
    TASK: Create 2 immersive walking tours for ${cityInput} with exactly 8 stops each.
    
    STOP DESCRIPTION GUIDELINES:
    - You MUST write everything in ${targetLang}.
    - LENGTH: Each stop description must be detailed (at least 6-8 complete sentences).
    - NARRATIVE STRUCTURE:
        1. BEGIN with a historical hook related to ${cityInput}.
        2. DESCRIBE an architectural or sensory detail.
        3. REVEAL a "Hidden Gem" or local secret.
        4. CONNECT the spot to the user's interest in ${interestsStr}.
    - TONE: Professional, poetic, and extremely immersive.
    
    JSON STRUCTURE: Return exactly 2 tours in an array.
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
  if (!text) return "";
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
