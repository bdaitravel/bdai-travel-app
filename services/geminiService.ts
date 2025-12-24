
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
    es: "Castellano (España)",
    en: "English (UK)",
    fr: "Français (Standard)",
    eu: "Euskara (Batua)",
    ca: "Català (Estàndard)"
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const cityLower = cityInput.toLowerCase().trim();
  const targetLang = LANGUAGE_MAP[userProfile.language] || LANGUAGE_MAP.es;
  const interestsStr = userProfile.interests.join(", ") || "cultura general";
  
  // 1. Intentar cargar de la caché global (Supabase) para ahorrar cuota
  try {
    const globalCached = await getCachedTours(cityInput, userProfile.language);
    if (globalCached && globalCached.length > 0) return globalCached;
  } catch (e) {
    console.warn("Cache error, proceeding to AI...");
  }
  
  // 2. Fallback inmediato si es una ciudad estática (para no gastar IA si no es necesario)
  const staticMatch = STATIC_TOURS.filter(t => t.city.toLowerCase() === cityLower);
  if (staticMatch.length > 0) return staticMatch;
  
  const ai = getClient();
  if (!ai) return [];

  const prompt = `
    ROL: Eres un guía experto local en ${cityInput}.
    PERFIL DEL USUARIO: Le apasiona: ${interestsStr}. Ajusta el tono y las paradas a estos intereses.
    TAREA: Crea 2 rutas épicas de exactamente 8 PARADAS cada una.
    IDIOMA: Redacta todo en ${targetLang}.

    ESTILO NARRATIVO:
    - Sin listas, sin "Tips", sin "Curiosidades" como etiquetas.
    - Storytelling fluido y envolvente.
    - Mezcla historia con consejos de local ("insider") en el mismo párrafo.
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
            visited: false, 
            imageUrl: `https://images.unsplash.com/photo-1543783232-260a990a1c0${(sIdx % 9) + 1}?auto=format&fit=crop&w=800&q=80` 
        }))
    }));

    // Guardar en caché para que otros no tengan que regenerar lo mismo
    await saveToursToCache(cityInput, userProfile.language, processed);
    return processed;
  } catch (error: any) {
    if (error.message?.includes('429') || error.status === 429) {
        throw new Error('QUOTA_EXCEEDED');
    }
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
