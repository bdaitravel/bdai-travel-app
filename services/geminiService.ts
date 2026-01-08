
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedTours, saveToursToCache, getCachedAudio, saveAudioToCache } from './supabaseClient';

const LANGUAGE_MAP: Record<string, string> = {
    es: "Castellano de España (Acento de Madrid/Castilla, dicción clara, elegante y profesional, sin dejes latinos)",
    en: "British English (UK Standard)",
    ca: "Català (Barcelona/Catalunya)",
    eu: "Euskera (Batua)",
    fr: "Français de France"
};

export const cleanDescriptionText = (text: string): string => {
  return text
    .replace(/(\*\*|__)?(SECCIÓN NARRATIVA|EL SECRETO DE DAI|SECRETO DE DAI|TÁCTICA DE DAI|EL SECRETO|DETALLE ARQUITECTÓNICO|NARRATIVA|SECRETO|DETALLE|HISTORIA|CURIOSIDAD):?(\*\*|__)?/gi, '')
    .replace(/^(El )?Secreto de Dai:?/gi, '')
    .replace(/^De Dai:?/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\*+/g, '')
    .trim();
};

export const moderateContent = async (text: string): Promise<boolean> => {
  if (!text) return true;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evalúa si el siguiente mensaje para una comunidad de viajeros es seguro. No debe contener odio, insultos o contenido sexual. Responde solo con un JSON { "isSafe": boolean }. Mensaje: "${text}"`,
      config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || '{"isSafe": true}');
    return !!result.isSafe;
  } catch (error) {
    return true; 
  }
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[] | 'QUOTA'> => {
  const targetLanguage = LANGUAGE_MAP[userProfile.language] || LANGUAGE_MAP.es;
  const userInterests = userProfile.interests.length > 0 ? userProfile.interests.join(", ") : "Cultura general y secretos locales";
  
  const cached = await getCachedTours(cityInput, userProfile.language);
  if (cached && cached.length > 0) return cached;

  const prompt = `PERSONALIDAD: GUÍA DE "FREE TOUR" DE ÉLITE. Experto, carismático y sofisticado.
  CIUDAD/PUEBLO: ${cityInput}. 
  IDIOMA: ${targetLanguage}.
  PERFIL USUARIO: Interesado en [${userInterests}].
  
  TAREA: Crear 2 rutas a pie (10 paradas c/u).
  
  REGLAS DE RUTA (CRÍTICO):
  1. ORDEN GEOGRÁFICO LÓGICO: Las paradas deben formar un recorrido CONTINUO y SECUENCIAL. 
  2. NO VOLVER ATRÁS: El usuario debe caminar del punto A al B, del B al C, etc., sin cruzar la ciudad de forma caótica.
  3. CERCANÍA: Cada parada debe estar a menos de 10 minutos a pie de la anterior.
  
  REGLAS NARRATIVAS:
  1. NO uses etiquetas ("Secreto de Dai:", etc). Empieza directamente con la historia.
  2. Revela el CHISME HISTÓRICO con elegancia.
  3. Mínimo 800 palabras por parada para una experiencia inmersiva.
  
  ESTILO: 
  Ruta 1: "Lo Imprescindible y sus Sombras" (Centro histórico).
  Ruta 2: "El Lado Oculto" (Leyendas y rincones secretos).
  
  FORMATO: JSON puro respetando el esquema.`;

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
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: responseSchema }
    });
    
    const parsed = JSON.parse(response.text || "[]");
    const processed = parsed.map((t: any, idx: number) => ({
        ...t, 
        id: `tour_${idx}_${Date.now()}`, 
        city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}`, visited: false }))
    }));

    await saveToursToCache(cityInput, userProfile.language, processed);
    return processed;
  } catch (error: any) { return []; }
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  if (!text) return "";
  const cleanedText = cleanDescriptionText(text).substring(0, 4000);
  const cached = await getCachedAudio(cleanedText, language);
  if (cached) return cached;
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const voicePrompt = language === 'es' 
      ? `Actúa como un guía local de élite. Habla con un acento castellano impecable, cálido y envolvente. Narra esto como una confidencia entre amigos: ${cleanedText}`
      : cleanedText;

    const response: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: voicePrompt }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
      }
    });
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (base64) await saveAudioToCache(cleanedText, language, base64);
    return base64;
  } catch (e) { return ""; }
};
