
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';

const LANGUAGE_MAP: Record<string, string> = {
    es: "Castellano de ESPAÑA. Tono: Archivista Supremo, analítico, técnico y elegante. Evita clichés turísticos.",
    en: "British English (Oxford standard). Professional and technical tone.",
    ca: "Català. Tò acadèmic i tècnic.",
    eu: "Euskera. Tonu teknikoa eta sakona.",
    fr: "Français. Ton sophistiqué et technique."
};

export const cleanDescriptionText = (text: string): string => {
  return text.trim();
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[] | 'QUOTA'> => {
  const targetLanguage = LANGUAGE_MAP[userProfile.language] || LANGUAGE_MAP.es;
  
  const prompt = `ERES EL ARCHIVISTA SUPREMO DE BDAI. GENERA EL TOUR DEFINITIVO PARA: ${cityInput}.
  
  REQUISITOS DE CONTENIDO (MÁXIMA CALIDAD):
  1. TRAZADO LINEAL: Las paradas DEBEN formar una línea lógica de caminata (ej. Norte a Sur). Prohibido zigzag.
  2. DENSIDAD DE INFORMACIÓN: Cada parada debe tener una descripción de MÍNIMO 250 palabras.
  3. DATOS TÉCNICOS: Incluye detalles sobre arquitectura, ingeniería, geología local, materiales de construcción (sillar, granito, hierro) y secretos históricos validados.
  4. TONO: Profesional, profundo, analítico. No uses frases genéricas de guía de viajes. Queremos "inteligencia de campo".
  5. ESTRUCTURA: 12 paradas obligatorias.
  6. IDIOMA: ${targetLanguage}.
  7. NO USES ETIQUETAS: No añadas títulos como "SECRETO:", "DETALLE TÉCNICO:", etc. Integra la información de forma fluida en el texto.`;

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
              type: { type: Type.STRING, enum: ['historical', 'food', 'art', 'nature', 'photo', 'culture'] },
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
        config: { 
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            thinkingConfig: { thinkingBudget: 16000 }
        }
    });
    
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, 
        id: `tour_${idx}_${Date.now()}`, 
        city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}`, visited: false }))
    }));
  } catch (error: any) { return []; }
};

export const generateHubIntel = async (query: string, language: string): Promise<any> => {
    const prompt = `Analiza: ${query}. Dame inteligencia de campo.
    1. Un "Secreto de Arquitecto" (detalle técnico curioso).
    2. Una frase de supervivencia real.
    3. Un evento clave 2026.
    Idioma: ${LANGUAGE_MAP[language] || 'es'}.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            curiosities: { type: Type.ARRAY, items: { type: Type.STRING } },
            phrases: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT, 
                    properties: { original: { type: Type.STRING }, meaning: { type: Type.STRING }, context: { type: Type.STRING } },
                    required: ["original", "meaning", "context"]
                } 
            },
            events: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT, 
                    properties: { title: { type: Type.STRING }, date: { type: Type.STRING }, importance: { type: Type.STRING } },
                    required: ["title", "date", "importance"]
                }
            }
        },
        required: ["curiosities", "phrases", "events"]
    };

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) { return null; }
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  if (!text) return "";
  const cleanedText = cleanDescriptionText(text).substring(0, 5000);
  
  // Forzamos el acento peninsular mediante instrucción directa en el texto del TTS
  const accentInstruction = language === 'es' ? "Lee con acento de España, castellano puro: " : "";
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: `${accentInstruction}${cleanedText}` }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
          voiceConfig: { 
            // Cambiamos a Zephyr que tiene un perfil fonético más adecuado para Europa
            prebuiltVoiceConfig: { voiceName: 'Zephyr' } 
          } 
        } 
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { return ""; }
};

export const moderateContent = async (content: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Safe? "${content}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { isSafe: { type: Type.BOOLEAN } },
          required: ["isSafe"]
        }
      }
    });
    const parsed = JSON.parse(response.text || '{"isSafe": true}');
    return parsed.isSafe;
  } catch (e) { return true; }
};
