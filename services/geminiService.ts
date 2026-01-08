
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';

const LANGUAGE_RULES: Record<string, string> = {
    es: "IDIOMA: Español de ESPAÑA. TONO: Guía experto, culto y cercano.",
    en: "LANGUAGE: British English. TONE: Professional historian.",
    ca: "IDIOMA: Català normatiu. TONO: Acadèmic i profund.",
    eu: "IDIOMA: Euskara batua. TONO: Teknikoa eta sakona.",
    fr: "LANGUE: Français de France. TON: Expert local sophistiqué."
};

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/#/g, '').replace(/^- /g, '').replace(/^\d+\. /g, '').trim();
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
  const prompt = `ACTÚA COMO UN GUÍA MAESTRO PARA: ${cityInput}. 
  CREA UN TOUR DE 12 PARADAS LINEALES. 
  TRADUCCIÓN NATIVA: ${langRule}. 
  DENSIDAD TÉCNICA: 300 palabras por parada.`;

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
                properties: { angle: { type: Type.STRING }, bestTime: { type: Type.STRING }, instagramHook: { type: Type.STRING }, milesReward: { type: Type.NUMBER }, secretLocation: { type: Type.STRING } },
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
        model: 'gemini-3-pro-preview', 
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: responseSchema }
    });
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}`, visited: false }))
    }));
  } catch (error) { return []; }
};

/**
 * Genera una postal artística de la ciudad usando Gemini 2.5 Flash Image
 */
export const generateCityPostcard = async (city: string, userInterests: string[]): Promise<string | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `A cinematic, artistic travel postcard of ${city}. 
        Focus on these themes: ${userInterests.join(', ')}. 
        Style: Professional travel photography, vibrant colors, iconic landmarks in the background, high resolution. 
        No text on the image.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    } catch (e) {
        console.error("Image Gen Error:", e);
        return null;
    }
};

/**
 * Obtiene información en tiempo real usando Google Search Grounding
 */
export const getRealTimeCityNews = async (city: string, language: string = 'es'): Promise<{text: string, sources: any[]}> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `¿Qué eventos importantes, clima o noticias hay hoy en ${city}? Responde en ${language}.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
        });

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text || "", sources };
    } catch (e) {
        return { text: "No se pudo obtener información en tiempo real.", sources: [] };
    }
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: text.substring(0, 5000) }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } } 
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { return ""; }
};
