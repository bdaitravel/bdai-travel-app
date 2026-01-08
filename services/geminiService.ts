
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
    .replace(/(\*\*|__)?(SECCIÓN NARRATIVA|EL SECRETO|DETALLE ARQUITECTÓNICO|NARRATIVA|SECRETO|DETALLE|HISTORIA|CURIOSIDAD):?(\*\*|__)?/gi, '')
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

  const prompt = `PERSONALIDAD: GUÍA DE "FREE TOUR" DE ÉLITE. Experto, carismático, buscador de propinas morales.
  CIUDAD/PUEBLO: ${cityInput}. 
  IDIOMA: ${targetLanguage}.
  PERFIL USUARIO: Interesado en [${userInterests}].
  
  TAREA: Crear 2 rutas a pie (10 paradas c/u) estilo 'Free Tour'.
  
  ESTRUCTURA 'FREE TOUR' MAGISTRAL:
  1. No recites fechas aburridas. Cuéntame el CHISME HISTÓRICO.
  2. "El Secreto de Dai": En cada parada, revela algo que el 99% de los turistas (y locales) pasan por alto. Un símbolo oculto, una tragedia olvidada o un detalle visual sorprendente.
  3. Adapta el tono a los intereses del usuario (${userInterests}).
  4. La narrativa debe ser larga y envolvente (mínimo 800 palabras por parada), como si estuvieras allí guiándome por el brazo.
  
  ESTILO: 
  Ruta 1: "Lo Imprescindible y sus Sombras" (Centro histórico con giros inesperados).
  Ruta 2: "El Lado Oculto" (Barrios menos conocidos, callejones con historia real, leyendas negras).
  
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
      ? `Actúa como Dai, guía local de élite de España. Habla con un acento castellano impecable, cálido y envolvente. Cuéntame este secreto como si estuviéramos tomando un café: ${cleanedText}`
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
