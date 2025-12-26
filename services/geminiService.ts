
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
    // 1. Prioridad: Caché de comunidad para ahorrar tokens y mejorar latencia
    const globalCached = await getCachedTours(cityLower, userProfile.language);
    if (globalCached && globalCached.length > 0) return globalCached;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 2. Prompt optimizado para narrativas largas y estilo "Free Tour" profesional
    const prompt = `Actúa como un Guía Turístico de Élite, especializado en la historia y secretos de ${cityInput}. 
    Crea 1 tour temático excepcional en idioma ${targetLang}.
    
    CRITERIOS DE CALIDAD:
    - Exactamente 5 paradas geográficamente lógicas.
    - LA DESCRIPCIÓN DE CADA PARADA DEBE TENER AL MENOS 300 PALABRAS. 
    - No resumas. Cuenta leyendas, anécdotas curiosas, arquitectura y secretos que solo un local sabría.
    - El estilo debe ser narrativo, como un guion de podcast inmersivo.
    - Incluye consejos de seguridad y wifi.
    - Genera un 'photoSpot' con un 'secretLocation' muy específico (ej: "un callejón detrás de la iglesia").
    
    JSON FORMAT ONLY.`;

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
          safetyTip: { type: Type.STRING },
          wifiTip: { type: Type.STRING },
          imageUrl: { type: Type.STRING },
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
                imageUrl: { type: Type.STRING },
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
    if (!textOutput) throw new Error("IA no respondió adecuadamente");
    
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

    // Guardamos en caché global para que otros usuarios se beneficien
    await saveToursToCache(cityInput, userProfile.language, processed);
    return processed;
  } catch (error) { 
    console.error("Error en GeminiService:", error);
    return []; 
  }
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  if (!text) return "";
  const cleanText = text.replace(/[*_#\[\]()<>]/g, '').trim().substring(0, 1500);
  
  try {
    const cached = await getCachedAudio(cleanText, language);
    if (cached) return cached;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const targetLangName = LANGUAGE_MAP[language] || LANGUAGE_MAP.es;
    
    const audioResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: `Actúa como un guía local narrando con pasión en ${targetLangName}: ${cleanText}` }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } 
        } 
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
