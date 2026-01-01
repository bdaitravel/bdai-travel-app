
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedTours, saveToursToCache, getCachedAudio, saveAudioToCache } from './supabaseClient';

const LANGUAGE_MAP: Record<string, string> = {
    es: "Spanish (Castellano de España, RAE Standard, ACENTUACIÓN PERFECTA)",
    en: "English (British)",
    ca: "Catalan (Català de Catalunya)",
    eu: "Basque (Euskara de Euskal Herria)",
    fr: "French (Français de France)"
};

export const cleanDescriptionText = (text: string): string => {
  return text
    .replace(/(\*\*|__)?(SECCIÓN NARRATIVA|EL SECRETO|DETALLE ARQUITECTÓNICO|NARRATIVA|SECRETO|DETALLE|HISTORIA|CURIOSIDAD):?(\*\*|__)?/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\*+/g, '')
    .trim();
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[] | 'QUOTA'> => {
  const targetLanguage = LANGUAGE_MAP[userProfile.language] || LANGUAGE_MAP.es;
  const cached = await getCachedTours(cityInput, userProfile.language);
  if (cached && cached.length > 0) return cached;

  const prompt = `ERES UN GUÍA LOCAL CULTO Y EXPERTO. CIUDAD/TEMA: ${cityInput}. IDIOMA: ${targetLanguage}.
  
  REGLAS DE ORO (INCUMPLIRLAS ES UN ERROR GRAVE):
  1. ORTOGRAFÍA: Debes escribir con corrección absoluta. ES OBLIGATORIO PONER TODAS LAS TILDES (ej. "está", "mañana", "música", "Gandía"). La falta de tildes es inadmisible.
  2. TOUR 1 (EL IMPRESCINDIBLE): El primer tour de la lista DEBE ser la ruta básica, típica y esencial. Los 15 puntos que cualquier turista debe ver (Torre Eiffel, Sagrada Familia, etc.).
  3. TOUR 2 (TEMÁTICO): Puede ser sobre secretos, cine o gastro.
  4. NARRATIVA: 200 palabras por parada. Estilo elegante y emocionante.
  5. INTERESES DEL USUARIO: ${userProfile.interests.join(", ")}.`;

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
        isEssential: idx === 0,
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

export const generateAudio = async (text: string, language: string = 'es', useFemaleVoice: boolean = true): Promise<string> => {
  if (!text) return "";
  const cleanedText = cleanDescriptionText(text);
  const finalAudioText = cleanedText.substring(0, 4000);
  const voiceKey = 'DAI_VOICE_V3';
  const cached = await getCachedAudio(finalAudioText, `${language}_${voiceKey}`);
  if (cached) return cached;
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const narrationPrompt = language === 'es' 
        ? `Eres "Dai", la guía inteligente. Usa una dicción perfecta y acento de España. Respeta escrupulosamente todas las tildes y signos de puntuación.
           TEXTO: ${finalAudioText}`
        : `You are "Dai", the smart guide of bdai. Narrate this with enthusiasm: ${finalAudioText}`;

    const audioResponse: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: narrationPrompt }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
            voiceConfig: { 
                prebuiltVoiceConfig: { voiceName: 'Kore' } 
            } 
        } 
      }
    });
    const base64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (base64) await saveAudioToCache(finalAudioText, `${language}_${voiceKey}`, base64);
    return base64;
  } catch (e: any) { return ""; }
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
    return JSON.parse(response.text || '{"isSafe": true}').isSafe;
  } catch (error) { return true; }
};
