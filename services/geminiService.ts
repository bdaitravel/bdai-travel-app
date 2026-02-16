
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

export class QuotaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QuotaError";
    }
}

const handleAiCall = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const errorMsg = typeof error === 'string' ? error : JSON.stringify(error);
        if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return handleAiCall(fn, retries - 1, delay * 2);
            }
            throw new QuotaError("Límite excedido. Por favor, usa tu clave API.");
        }
        throw error;
    }
};

const PHOTO_SPOT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        angle: { type: Type.STRING },
        milesReward: { type: Type.NUMBER },
        secretLocation: { type: Type.STRING }
    },
    required: ["angle", "milesReward", "secretLocation"]
};

const STOP_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        latitude: { type: Type.NUMBER },
        longitude: { type: Type.NUMBER },
        type: { type: Type.STRING },
        photoSpot: PHOTO_SPOT_SCHEMA
    },
    required: ["id", "name", "description", "latitude", "longitude", "photoSpot"]
};

const TOUR_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        city: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        stops: { type: Type.ARRAY, items: STOP_SCHEMA }
    },
    required: ["id", "city", "title", "description", "stops"]
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Generate 3 tours for ${city}, ${country} in ${user.language}. The first must be essential with 10 stops.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: TOUR_SCHEMA }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Charon', de: 'Fenrir', it: 'Puck', pt: 'Charon', ja: 'Puck', zh: 'Puck', ro: 'Kore'
};

export const generateAudio = async (text: string, language: string, city: string): Promise<string> => {
    // 1. PRIMERO: ¿Está ya en el caché de Supabase?
    const cached = await getCachedAudio(text, language);
    if (cached) return cached;

    // 2. SI NO: Generar con IA
    const voiceName = VOICE_MAP[language] || 'Kore';
    const base64 = await handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    });

    // 3. GUARDAR: En el caché para la próxima vez
    if (base64) {
        await saveAudioToCache(text, language, base64, city);
    }
    
    return base64;
};

export const standardizeCityName = async (input: string, lang: string) => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Identify cities matching "${input}". Language: ${lang}.`,
            config: { 
                tools: [{ googleSearch: {} }], 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            localizedName: { type: Type.STRING },
                            spanishName: { type: Type.STRING },
                            country: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const moderateContent = async (text: string): Promise<boolean> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Is this text safe? "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { isSafe: { type: Type.BOOLEAN } }
                }
            }
        });
        return JSON.parse(response.text || '{"isSafe": false}').isSafe;
    });
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Postcard of ${city}` }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part ? `data:image/png;base64,${part.inlineData.data}` : null;
    });
};

// Added missing translateToursBatch function
export const translateToursBatch = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Translate the following JSON list of tours into ${targetLang}. 
            Maintain the exact same structure and IDs. 
            Translate the 'title', 'description', and the 'name' and 'description' of each stop.
            Tours: ${JSON.stringify(tours)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: TOUR_SCHEMA
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};
