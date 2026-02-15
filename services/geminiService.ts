import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
// Removed getCachedAudio and saveAudioToCache as they are not exported by supabaseClient.ts
import { supabase } from './supabaseClient';

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
        angle: { 
            type: Type.STRING, 
            description: "Expert photography advice: Technical settings (ISO, Aperture) and specific artistic framing for THIS stop." 
        },
        milesReward: { type: Type.NUMBER },
        secretLocation: { 
            type: Type.STRING, 
            description: "Precise description of a hidden spot or unique perspective to photograph this monument." 
        }
    },
    required: ["angle", "milesReward", "secretLocation"]
};

const STOP_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        description: { type: Type.STRING, description: "Detailed narrative of minimum 450 words including history, engineering and secrets." },
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
        duration: { type: Type.STRING },
        distance: { type: Type.STRING },
        difficulty: { type: Type.STRING },
        theme: { type: Type.STRING },
        isEssential: { type: Type.BOOLEAN },
        stops: {
            type: Type.ARRAY,
            items: STOP_SCHEMA,
            description: "List of stops for the tour. Essential tour MUST have exactly 10 stops."
        }
    },
    required: ["id", "city", "title", "description", "stops"]
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `As a Master Historian and National Geographic Photographer, generate 3 tours for ${city}, ${country} in ${user.language}.
            
            STRICT RULES:
            1. The FIRST tour MUST be marked as 'isEssential: true' and MUST HAVE EXACTLY 10 STOPS. DO NOT GENERATE FEWER.
            2. Each stop description MUST exceed 450 words. Focus on engineering secrets and historical gossip.
            3. Each 'photoSpot' MUST be specific to the stop. NO REPETITIONS.
            4. If the city is a small town, find 10 points of interest even if they are small details.
            5. ALL CONTENT MUST BE IN ${user.language}.`,
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

export const generateThematicTour = async (city: string, country: string, theme: string, user: UserProfile): Promise<Tour> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Generate ONE thematic tour for ${city}, ${country} with theme: "${theme}". 
            This tour MUST have at least 8 stops. Detailed descriptions in ${user.language}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: TOUR_SCHEMA
            }
        });
        return JSON.parse(response.text || "{}");
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Stella', de: 'Casper', it: 'Bella', pt: 'Stella', ja: 'Puck', zh: 'Puck', ro: 'Kore'
};

export const generateAudio = async (text: string, language: string, city: string): Promise<string> => {
    const voiceName = VOICE_MAP[language] || 'Kore';
    return handleAiCall(async () => {
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
};

export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate to ${targetLanguage}: ${JSON.stringify(tours)}. Keep technical photo advice.`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const standardizeCityName = async (input: string) => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        // Removed googleSearch tool as it's often incompatible with responseMimeType: "application/json" and parsing rules.
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Identify cities matching "${input}". Return JSON array.`,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
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
