
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, UserProfile } from '../types';
import { getCachedTours, saveToursToCache, getCachedAudio, saveAudioToCache } from './supabaseClient';

const LANGUAGE_MAP: Record<string, string> = {
    es: "Español (España)",
    en: "English (US)",
    sw: "Swahili (East Africa)",
    fr: "Français",
    ca: "Català"
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const cityLower = cityInput.toLowerCase().trim();
  const targetLang = LANGUAGE_MAP[userProfile.language] || LANGUAGE_MAP.es;
  
  try {
    const globalCached = await getCachedTours(cityLower, userProfile.language);
    if (globalCached && globalCached.length > 0) return globalCached;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Actúa como un guía historiador y experto local para ${cityInput}. 
    Crea 1 tour de ALTA CALIDAD en ${targetLang}.
    
    ESTRUCTURA OBLIGATORIA:
    - 5 paradas significativas.
    - Descripción de cada parada: MÍNIMO 300 PALABRAS. Estilo podcast, inmersivo, narrando leyendas y secretos.
    - JSON Output.`;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          duration: { type: Type.STRING },
          distance: { type: Type.STRING },
          difficulty: { type: Type.STRING },
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

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            temperature: 0.8
        }
    });
    
    const textOutput = response.text;
    if (!textOutput) throw new Error("AI Error");
    
    const parsed = JSON.parse(textOutput);
    const processed = (parsed || []).map((t: any, idx: number) => ({
        ...t, 
        id: `gen_${idx}_${Date.now()}`, 
        city: cityInput,
        stops: (t.stops || []).map((s: any, sIdx: number) => ({ 
            ...s, 
            id: `s_${idx}_${sIdx}_${Date.now()}`, 
            visited: false
        }))
    }));

    await saveToursToCache(cityInput, userProfile.language, processed);
    return processed;
  } catch (error) { 
    console.error("Gemini Error:", error);
    return []; 
  }
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  if (!text) return "";
  const cleanText = text.replace(/[*_#\[\]()<>]/g, '').trim().substring(0, 1000);
  
  try {
    const cached = await getCachedAudio(cleanText, language);
    if (cached) return cached;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const targetLangName = LANGUAGE_MAP[language] || LANGUAGE_MAP.es;
    
    const audioResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: `Voz de guía apasionado en ${targetLangName}: ${cleanText}` }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } } 
      }
    });

    const base64 = audioResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data || "";
    if (base64) {
      await saveAudioToCache(cleanText, language, base64);
    }
    return base64;
  } catch (e) { 
    console.error("Audio Error:", e);
    return ""; 
  }
};
