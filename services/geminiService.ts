
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
export const normalizeCityWithAI = async (input: string, userLanguage: string): Promise<any[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Identify all major cities or towns globally that match the name: "${input}". 
            For each match:
            1. Provide the official city name.
            2. Provide the country name in ${userLanguage}.
            3. Provide the ISO 3166-1 alpha-2 country code.
            4. Create a unique slug in English: "cityname_countryname" (lowercase, no accents, underscores for spaces).
            
            Return a JSON array of objects: [{ "city": "Name", "country": "Country in ${userLanguage}", "countryCode": "XX", "slug": "city_country" }]`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            city: { type: Type.STRING },
                            country: { type: Type.STRING },
                            countryCode: { type: Type.STRING },
                            slug: { type: Type.STRING }
                        },
                        required: ["city", "country", "countryCode", "slug"]
                    }
                }
            }
        });
        return JSON.parse(response.text || '[]');
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `As DAI, a highly intelligent, slightly sarcastic, and elegant AI travel guide, generate 1 or 2 tours for ${city}, ${country} in ${user.language}.
            
            DAI'S PERSONALITY:
            - You are sophisticated but you have a sharp, witty sense of humor.
            - You hate boring, generic travel guides.
            - You focus on engineering secrets, historical gossip, and "hidden gems".
            - Your tone is natural, engaging, and slightly provocative.
            
            STRICT RULES:
            1. If the location is small, generate 1 tour. If it's a major city, generate 2 tours.
            2. Each tour MUST HAVE EXACTLY 10 STOPS.
            3. Each stop description MUST exceed 400 words. Infuse it with DAI's personality.
            4. Each 'photoSpot' MUST be specific to the stop.
            5. ALL CONTENT MUST BE IN ${user.language}.`,
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
        return JSON.parse(response.text || "[]");
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Charon', de: 'Fenrir', it: 'Puck', pt: 'Charon', ja: 'Puck', zh: 'Puck', ro: 'Kore'
};

export const generateDaiWelcome = async (user: UserProfile): Promise<string> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `As DAI, welcome a new user named ${user.firstName || 'Traveler'} in ${user.language}.
            Explain that they are currently rank "ZERO" (the bottom of the food chain) and they need to conquer the world by completing tours to reach "ZENITH".
            Be sarcastic, witty, and elegant. Keep it under 100 words.`,
        });
        return response.text || "Welcome to bdai.";
    });
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
