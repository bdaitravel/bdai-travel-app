
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

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `ABSOLUTE RULE: ALL TEXT CONTENT IN THE JSON MUST BE EXCLUSIVELY IN THE LANGUAGE CODE: ${user.language}.
            
            You are a UNESCO expert historian. Generate 3 tours for ${city}, ${country}.
            
            MASTERCLASS REQUIREMENTS:
            1. One tour must be 'Essential' with 10 stops.
            2. EACH STOP MUST HAVE A DESCRIPTION OF AT LEAST 450 WORDS.
            3. Style: Professional narrative, engineering secrets, and real historical gossip.
            4. Format: Strict JSON.
            5. TRANSLATION MANDATE: Translating "stop names", "titles", and "descriptions" into ${user.language} is MANDATORY. 
            WARNING: IF YOU USE ENGLISH OR SPANISH WORDS FOR A NON-ENGLISH/SPANISH OUTPUT, THE SYSTEM WILL CRASH.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
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
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        latitude: { type: Type.NUMBER },
                                        longitude: { type: Type.NUMBER },
                                        type: { type: Type.STRING }
                                    },
                                    required: ["id", "name", "description", "latitude", "longitude"]
                                }
                            }
                        },
                        required: ["id", "city", "title", "description", "stops"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Stella', de: 'Casper', it: 'Bella', pt: 'Stella', ja: 'Puck', zh: 'Puck', ro: 'Kore',
    ru: 'Kore', hi: 'Kore', ko: 'Puck', tr: 'Casper', pl: 'Stella', nl: 'Casper', ca: 'Kore', eu: 'Kore', vi: 'Puck', th: 'Puck'
};

export const generateAudio = async (text: string, language: string, city: string): Promise<string> => {
    const voiceName = VOICE_MAP[language] || 'Kore';
    const promptText = `Narrate this text in ${language} naturally. Professional voice: ${text}`;

    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: promptText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64 || "";
    });
};

export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `TRANSLATION MANDATE: Translate the following JSON object to language code: ${targetLanguage}. 
            KEEP THE JSON STRUCTURE IDENTICAL. DO NOT USE ENGLISH OR SPANISH IN THE TRANSLATED TEXT FIELDS.
            Input: ${JSON.stringify(tours)}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const moderateContent = async (text: string): Promise<boolean> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Moderate this text for community safety: "${text}". Return {"isSafe": boolean}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { isSafe: { type: Type.BOOLEAN } },
                    required: ["isSafe"]
                }
            }
        });
        const result = JSON.parse(response.text || '{"isSafe": false}');
        return result.isSafe;
    });
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Vertical cinematic postcard of ${city} inspired by: ${interests.join(', ')}. No text. High quality.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    });
};

export const standardizeCityName = async (input: string) => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Find cities matching: "${input}". JSON format.`,
            config: { 
                tools: [{ googleSearch: {} }], 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            spanishName: { type: Type.STRING },
                            country: { type: Type.STRING }
                        },
                        required: ["name", "spanishName", "country"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};
