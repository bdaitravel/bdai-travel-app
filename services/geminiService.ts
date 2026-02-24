
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
        console.error("AI Call Error:", errorMsg);
        
        if (errorMsg.includes("403") && errorMsg.includes("REFERRER_BLOCKED")) {
            const msg = "ERROR 403: Tu clave de API de Google tiene restricciones de dominio. Por favor, ve a Google Cloud Console y permite el dominio 'aistudio.google.com' o quita las restricciones de HTTP Referrer temporalmente.";
            // We don't alert here to avoid double alerts if called from UI that also catches
            throw new Error(msg);
        }

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
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
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
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
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

export const generateSpeech = async (text: string, language: string, city: string): Promise<string | null> => {
    const cleanText = (text || "").trim();
    if (!cleanText) return null;

    return handleAiCall(async () => {
        // Check cache first
        const cached = await getCachedAudio(cleanText, language);
        if (cached) return cached;

        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const voiceName = VOICE_MAP[language] || 'Kore';
        const prompt = language === 'es' 
            ? `Actúa como Dai, una guía elegante y sarcástica con acento de España. Di esto de forma divertida y natural: ${cleanText}`
            : `Act as Dai, an elegant and sarcastic guide. Say this in a natural and engaging tone: ${cleanText}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
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
        if (base64) {
            const dataUrl = `data:audio/mp3;base64,${base64}`;
            // Save to cache in background
            saveAudioToCache(cleanText, language, base64, city).catch(e => console.error("Cache save failed:", e));
            return dataUrl;
        }
        return null;
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        // Using gemini-2.5-flash for Google Maps Grounding support
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `As DAI, a highly intelligent and passionate AI travel guide, generate 3 to 4 distinct thematic tours for ${city}, ${country} in ${user.language}.
            
            STRICT RULES:
            1. Use the Google Maps tool to find the EXACT coordinates (latitude/longitude) for every stop.
            2. Major Cities: 3-4 tours. Medium: 2 tours. Small: 1-2 tours.
            3. MINIMUM 10 STOPS per tour. NO REPEATED STOPS.
            4. Each stop description: 310-400 words. Focus on history, curiosities, culture, and gastronomy.
            5. Assign a 'type' from this list ONLY: 'historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'.
            6. Each stop MUST have a 'photoSpot' object with 'angle', 'milesReward' (10-50), and 'secretLocation'.
            7. Format: Return ONLY a valid JSON array of tours.
            8. Each tour: { "id", "city", "title", "description", "duration", "distance", "stops": [] }
            9. Each stop: { "id", "name", "description", "latitude", "longitude", "type", "photoSpot" }
            10. ALL CONTENT IN ${user.language}.`,
            config: {
                tools: [{ googleMaps: {} }],
            },
        });

        const text = response.text || "[]";
        // Extract JSON if there's markdown wrapping
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Charon', de: 'Fenrir', it: 'Puck', pt: 'Charon', ja: 'Puck', zh: 'Puck', ro: 'Kore'
};

export const generateDaiWelcome = async (user: UserProfile): Promise<string> => {
    return handleAiCall(async () => {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `As DAI, welcome a new user named ${user.firstName || 'Traveler'} in ${user.language}.
            Explain that they are currently rank "ZERO" (the bottom of the food chain) and they need to conquer the world by completing tours to reach "ZENITH".
            Be sarcastic, witty, and elegant. Keep it under 100 words.`,
        });
        return response.text || "Welcome to bdai.";
    });
};

export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
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
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
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
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
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
