
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

/**
 * Translates a user's search query from any language into English for database matching.
 * Also returns the original for profiling.
 */
export const translateSearchQuery = async (input: string): Promise<{ english: string, detected: string }> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Identify the city/location in this query: "${input}". Translate the city name to English. 
            Return JSON object: { "english": "English Name", "detected": "Detected Language Code" }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        english: { type: Type.STRING },
                        detected: { type: Type.STRING }
                    },
                    required: ["english", "detected"]
                }
            }
        });
        return JSON.parse(response.text || '{"english": "' + input + '", "detected": "unknown"}');
    });
};

/**
 * Normalizes a city search query using Gemini.
 * Handles typos, nicknames (Donosti -> San Sebastián), and extracts country.
 */
export const normalizeCityWithAI = async (input: string): Promise<{ city: string, country: string, slug: string, isCorrection: boolean }> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Normalize this city search: "${input}". 
            1. Correct typos (e.g., "Vitoiro" -> "Vitoria").
            2. Resolve nicknames/local names (e.g., "Donosti" -> "San Sebastián").
            3. Identify the country.
            4. Create a slug format "city-country" (lowercase, no accents, hyphens for spaces).
            
            Return JSON: { "city": "Official Name", "country": "Country Name", "slug": "city-country", "isCorrection": true/false }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        city: { type: Type.STRING },
                        country: { type: Type.STRING },
                        slug: { type: Type.STRING },
                        isCorrection: { type: Type.BOOLEAN }
                    },
                    required: ["city", "country", "slug", "isCorrection"]
                }
            }
        });
        return JSON.parse(response.text || '{}');
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const stream = await ai.models.generateContentStream({
            model: 'gemini-3-pro-preview',
            contents: `As DAI, a female, sarcastic, funny, natural, and highly engaging AI guide, generate 3 unique and captivating tours for ${city}, ${country} in ${user.language}. Your tone should be elegant and witty, never robotic or boring. If the language is Spanish, use the es-ES accent.\n\n            STRICT RULES:\n            1. The FIRST tour MUST be marked as 'isEssential: true' and MUST HAVE EXACTLY 10 STOPS. DO NOT GENERATE FEWER.\n            2. Each stop description MUST exceed 450 words. Focus on engineering secrets and historical gossip, delivered with a touch of sarcasm and humor.\n            3. Each 'photoSpot' MUST be specific to the stop. NO REPETITIONS.\n            4. If the city is a small town, find 10 points of interest even if they are small details.\n            5. ALL CONTENT MUST BE IN ${user.language}.`,
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
                                        type: { type: Type.STRING },
                                        photoSpot: {
                                            type: Type.OBJECT,
                                            properties: {
                                                angle: { type: Type.STRING },
                                                milesReward: { type: Type.NUMBER },
                                                secretLocation: { type: Type.STRING }
                                            },
                                            required: ["angle", "milesReward", "secretLocation"]
                                        }
                                    },
                                    required: ["id", "name", "description", "latitude", "longitude", "photoSpot"]
                                }
                            }
                        },
                        required: ["id", "city", "title", "description", "stops"]
                    }
                }
            }
        });

        let fullText = '';
        for await (const chunk of stream) {
            fullText += chunk.text;
        }
        return JSON.parse(fullText || "[]");
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', // es-ES accent
    en: 'Zephyr', // Neutral English
    fr: 'Charon', // Neutral French
    de: 'Fenrir', // Neutral German
    it: 'Puck', // Neutral Italian
    pt: 'Charon', // Neutral Portuguese
    ja: 'Puck', // Neutral Japanese
    zh: 'Puck', // Neutral Chinese
    ro: 'Kore'  // Neutral Romanian
};

export const generateAudio = async (text: string, language: string, city: string): Promise<string> => {
    const cachedUrl = await getCachedAudio(text, language);
    if (cachedUrl) {
        const response = await fetch(cachedUrl);
        const buffer = await response.arrayBuffer();
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

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

    if (base64) {
        saveAudioToCache(text, language, base64, city).catch(err => console.error("Cache save failed", err));
    }

    return base64;
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
        const parts = response.candidates?.[0]?.content?.parts;
        const part = parts?.find(p => p.inlineData);
        return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
    });
};
