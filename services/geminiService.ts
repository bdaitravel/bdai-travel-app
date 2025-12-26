
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedTours, saveToursToCache, getCachedAudio, saveAudioToCache } from './supabaseClient';

const LANGUAGE_MAP: Record<string, string> = {
    es: "Spanish (Spain)",
    en: "English (Global)",
    fr: "French (France)",
    eu: "Basque (Euskara)",
    ca: "Catalan"
};

/**
 * GENERACIÓN DE TOURS CON NARRATIVA FLUIDA Y RUTAS EXTENSAS
 */
export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const cityLower = cityInput.toLowerCase().trim();
  const targetLang = LANGUAGE_MAP[userProfile.language] || LANGUAGE_MAP.es;
  const interestsStr = userProfile.interests.join(", ") || "history, architecture and local secrets";
  
  const globalCached = await getCachedTours(cityLower, userProfile.language);
  if (globalCached && globalCached.length > 0) return globalCached;
  
  const prompt = `Actúa como un Historiador de Élite, un Novelista de Misterio y el Guía Local más experimentado de ${cityInput}. 
  Tu misión es diseñar un tour que sea una obra maestra del storytelling.
  
  INSTRUCCIONES CRÍTICAS DE CONTENIDO:
  1. LONGITUD: Cada parada debe tener un relato de entre 800 y 1000 palabras.
  2. ESTILO NARRATIVO: Prohibido usar etiquetas como [LA ATMÓSFERA], [HISTORIA] o similares. El relato debe ser FLUIDO y ORGÁNICO. 
     Debes entrelazar de forma magistral la descripción sensorial del lugar, su turbulenta historia política, los detalles arquitectónicos que nadie ve y las leyendas más oscuras en un solo texto continuo y literario.
  3. CANTIDAD DE PARADAS: Para ciudades grandes como ${cityInput}, debes generar obligatoriamente entre 8 y 10 paradas por ruta.
  4. DETALLES "INSIDER": No cuentes lo que sale en la primera página de Google. Cuenta lo que solo un catedrático o un viejo pescador del lugar sabría.
  5. IDIOMA: Escrito íntegramente en ${targetLang} con un léxico rico y evocador.
  
  CIUDAD: ${cityInput}. Crea 2 rutas distintas basadas en los intereses: ${interestsStr}.`;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING, description: "Introducción evocadora de la ruta (250 palabras)" },
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
              description: { type: Type.STRING, description: "Relato fluido de 1000 palabras sin encabezados de sección" },
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
                    secretLocation: { type: Type.STRING, description: "Indicación críptica para encontrar el spot perfecto" }
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
        model: "gemini-3-pro-preview", 
        contents: prompt,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            thinkingConfig: { thinkingBudget: 32768 },
            temperature: 0.8
        }
    });
    
    const parsed = JSON.parse(response.text || "[]");
    const processed = parsed.map((t: any, idx: number) => ({
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
  } catch (error) { 
    console.error("Error generating rich content:", error);
    return []; 
  }
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  if (!text) return "";
  // Sanitizar texto para una clave de caché consistente
  const cleanText = text.replace(/[*_#\[\]]/g, '').replace(/\s+/g, ' ').trim().substring(0, 5000);
  
  const cached = await getCachedAudio(cleanText, language);
  if (cached) return cached;
  
  const targetLangName = LANGUAGE_MAP[language] || LANGUAGE_MAP.es;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const audioResponse: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: `Lee este relato de forma envolvente, como un narrador de documentales históricos, en ${targetLangName}: ${cleanText}` }] }], 
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
