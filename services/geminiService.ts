
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
  
  const globalCached = await getCachedTours(cityLower, userProfile.language);
  if (globalCached && globalCached.length > 0) {
      return globalCached;
  }
  
  if (userProfile.language === 'es') {
    const staticMatch = STATIC_TOURS.filter(t => t.city.toLowerCase() === cityLower);
    if (staticMatch.length > 0) return staticMatch;
  }
  
  const prompt = `
    ROLE: Local insider and photography expert for ${cityInput}.
    USER PROFILE: Traveler interested in ${interestsStr}.
    LANGUAGE: All output MUST be in ${targetLang}.
    TASK: Create 2 immersive walking tours for ${cityInput} with 8 stops each.
    
    SPECIAL REQUIREMENT: Each stop MUST have a "Secret Foto Spot".
    This is not a famous viewpoint, but a specific, hidden angle known only by locals. 
    (Example: "Behind the flower shop, there is a small alley with a perfect reflection of the cathedral in a puddle").
    
    STOP DESCRIPTION:
    - Language: ${targetLang}.
    - Length: Detailed narrative (6-8 sentences).
    - Tone: Poetic, professional guide.
    
    JSON STRUCTURE: Return exactly 2 tours.
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
                    milesReward: { type: Type.NUMBER },
                    secretLocation: { type: Type.STRING, description: "Detailed physical directions to the hidden spot" }
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
    return [];
  }
};

/**
 * GENERACIÓN DE AUDIO CON ESTILO RADIO ESPAÑOL
 */
export const generateAudio = async (text: string): Promise<string> => {
  if (!text) return "";
  
  // Instrucción de estilo para conseguir esa voz de radio "bonita" y con acento de España
  const radioStylePrefix = "Actúa como un locutor de radio profesional de España. Tu voz es profunda, cálida, elegante y muy enganchadora. Narra el siguiente texto con una entonación perfecta y acento de Madrid/Castellano: ";
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: radioStylePrefix + text.substring(0, 1000) }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
          voiceConfig: { 
            // 'Zephyr' es ideal para este tono narrativo y profesional
            prebuiltVoiceConfig: { voiceName: 'Zephyr' } 
          } 
        } 
      } 
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { 
    console.error("Audio generation failed:", e);
    return ""; 
  }
};
