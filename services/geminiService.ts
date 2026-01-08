
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';

const LANGUAGE_RULES: Record<string, string> = {
    es: "IDIOMA: Español de ESPAÑA. Usa distinción 'z/c' y 's'. TONO: Guía experto de Free Tour, técnico y culto.",
    en: "LANGUAGE: British English. TONE: Professional urban planner and historian.",
    ca: "IDIOMA: Català normatiu. TONO: Acadèmic, profund i tècnic. PROHIBIT usar castellà o anglès.",
    eu: "IDIOMA: Euskara batua. TONO: Teknikoa eta sakona. PROHIBIT erabili gaztelania edo ingelesa.",
    fr: "LANGUE: Français de France. TON: Expert local, sophistiqué et technique."
};

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text
        .replace(/\*\*/g, '')
        .replace(/###/g, '')
        .replace(/#/g, '')
        .replace(/^- /g, '')
        .replace(/^\d+\. /g, '')
        .trim();
};

export const moderateContent = async (text: string): Promise<boolean> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Moderate this: "${text}"`,
            config: { systemInstruction: "Reply ONLY with SAFE or UNSAFE." }
        });
        return response.text?.trim().toUpperCase() === 'SAFE';
    } catch (e) { return true; }
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[] | 'QUOTA'> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  
  const prompt = `ACTÚA COMO UN ALGORITMO DE URBANISMO DE PRECISIÓN MILITAR Y GUÍA MAESTRO PARA: ${cityInput}.
  
  REGLAS DE TRAZADO GEOGRÁFICO (PARA EVITAR VUELTAS ABSURDAS):
  1. VECTOR LINEAL: Las 12 paradas DEBEN avanzar siempre hacia adelante en un vector geográfico claro (ej: alejándose del punto de inicio).
  2. PROHIBIDO RETROCEDER: La Parada N+1 nunca puede estar más cerca del punto de inicio que la Parada N. 
  3. COHERENCIA PEATONAL: La distancia entre paradas consecutivas debe ser de entre 100m y 400m máximo. Verifica coordenadas reales.
  4. SIN SALTOS ERRÁTICOS: No cruces la ciudad de punta a punta. Elige un barrio y explótalo linealmente.
  
  REGLAS DE CONTENIDO:
  1. TRADUCCIÓN NATIVA: Escribe TODO el JSON directamente en: ${langRule}.
  2. DENSIDAD TÉCNICA EXTREMA (500 PALABRAS): Cada parada debe tener una descripción técnica profunda (500 palabras). Analiza ingeniería, historia cruda y materiales.
  
  ESTRUCTURA: Devuelve un array de 1 objeto Tour con sus 12 stops.`;

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
            thinkingConfig: { thinkingBudget: 32000 }
        }
    });
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}`, visited: false }))
    }));
  } catch (error: any) { return []; }
};

export const generateHubIntel = async (city: string, language: string = 'es'): Promise<any> => {
    const langRule = LANGUAGE_RULES[language] || LANGUAGE_RULES.es;
    const prompt = `ACTÚA COMO AGENTE DE INTELIGENCIA LOCAL. Genera datos profundos para: ${city}.
    TODO EL CONTENIDO EN: ${langRule}. Proporciona curiosidades técnicas y frases de jerga real.`;

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
            }
        },
        required: ["curiosities", "phrases"]
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
  const cleanedText = text.trim().substring(0, 5000);
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: cleanedText }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } } 
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { return ""; }
};
