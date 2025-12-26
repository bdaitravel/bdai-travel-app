
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

const getAIClient = () => {
  // Directly using process.env.API_KEY as per coding guidelines
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const cityLower = cityInput.toLowerCase().trim();
  const targetLang = LANGUAGE_MAP[userProfile.language] || LANGUAGE_MAP.es;
  const interestsStr = (userProfile.interests || []).join(", ") || "history, culture and local secrets";
  
  const globalCached = await getCachedTours(cityLower, userProfile.language);
  if (globalCached && globalCached.length > 0) return globalCached;
  
  const prompt = `Actúa como un experto Guía de bdai para la ciudad de ${cityInput}. 
  Tu misión es diseñar un tour estilo "Free Tour" de alta calidad, dinámico y lleno de historias fascinantes.
  
  REQUISITOS DEL FREE TOUR:
  1. NARRATIVA: Relatos detallados (aprox 400-600 palabras por parada) que mezclen historia con leyendas y secretos locales.
  2. TONO: Cercano, apasionado y literario. 
  3. CANTIDAD: Genera 8 paradas icónicas.
  4. IDIOMA: Escribe íntegramente en ${targetLang}.
  
  CIUDAD: ${cityInput}. Basado en intereses: ${interestsStr}.`;

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
    const ai = getAIClient();
    // Using gemini-3-flash-preview for more stable JSON responses
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            temperature: 0.7
        }
    });
    
    const textOutput = response.text;
    const parsed = JSON.parse(textOutput || "[]");
    const processed = (parsed || []).map((t: any, idx: number) => ({
        ...t, 
        id: `gen_${idx}_${Date.now()}`, 
        city: cityInput,
        stops: (t.stops || []).map((s: any, sIdx: number) => ({ 
            ...s, 
            id: `s_${idx}_${sIdx}`, 
            visited: false
        }))
    }));

    await saveToursToCache(cityInput, userProfile.language, processed);
    return processed;
  } catch (error) { 
    console.error("AI Generation Error:", error);
    return []; 
  }
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  if (!text) return "";
  const cleanText = text.replace(/[*_#\[\]()<>]/g, '').trim().substring(0, 3000);
  
  const cached = await getCachedAudio(cleanText, language);
  if (cached) return cached;
  
  const targetLangName = LANGUAGE_MAP[language] || LANGUAGE_MAP.es;
  try {
    const ai = getAIClient();
    const audioResponse: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: `Narrador apasionado de bdai en ${targetLangName}: ${cleanText}` }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } 
        } 
      }
    });

    const base64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (base64) await saveAudioToCache(cleanText, language, base64);
    return base64;
  } catch (e: any) { 
    console.error("Gemini TTS Error:", e.message || e);
    return ""; 
  }
};
