
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
        
        if (errorMsg.includes("403") && errorMsg.includes("REFERRER_BLOCKED")) {
            throw new Error("ERROR 403: Tu clave de API de Google tiene restricciones de dominio. Por favor, ve a Google Cloud Console y permite el dominio 'aistudio.google.com' o quita las restricciones de HTTP Referrer temporalmente.");
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
    return handleAiCall(async () => {
        // Check cache first
        const cached = await getCachedAudio(text, language);
        if (cached) return cached;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Lee esto en ${language} con elegancia, ritmo natural y un toque de misterio, como si fueras una guía experta: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is elegant and sophisticated
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const audioUrl = await saveAudioToCache(text, language, base64Audio, city);
            return audioUrl || null;
        }
        return null;
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Using gemini-2.5-flash for Google Maps Grounding support
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `As DAI, a highly intelligent and passionate AI travel guide, generate 3 to 4 distinct thematic tours for ${city}, ${country} in ${user.language}.
            
            STRICT RULES:
            1. Use the Google Maps tool to find the EXACT coordinates (latitude/longitude) for every stop.
            2. Major Cities: 3-4 tours. Medium: 2 tours. Small: 1-2 tours.
            3. MINIMUM 10 STOPS per tour. NO REPEATED STOPS.
            4. Each stop description: 310-400 words. Focus on history, curiosities, culture, and gastronomy.
            5. Assign a 'type': 'historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'.
            6. ALL CONTENT IN ${user.language}.`,
            config: {
                tools: [{ googleMaps: {} }],
                // Note: responseMimeType and responseSchema are NOT allowed with googleMaps tool
            },
        });

        // Since we can't use responseSchema with googleMaps, we parse the text response
        // We'll ask for a specific format in the prompt to make parsing easier if needed, 
        // but usually, Gemini is good at following the requested structure.
        // For safety, I'll add a second pass or a very strict prompt instruction.
        
        // Let's refine the prompt to ensure it returns valid JSON even without the schema
        const refinedResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `As DAI, generate 3 to 4 distinct thematic tours for ${city}, ${country} in ${user.language}.
            
            STRICT RULES:
            1. Use Google Maps to verify EVERY location.
            2. Format: Return ONLY a valid JSON array of tours.
            3. Each tour: { "id", "city", "title", "description", "duration", "distance", "stops": [] }
            4. Each stop: { "id", "name", "description" (310-400 words), "latitude", "longitude", "type", "photoSpot": { "angle", "milesReward", "secretLocation" } }
            5. NO REPEATED STOPS. 10 stops per tour.
            6. Content in ${user.language}.`,
            config: {
                tools: [{ googleMaps: {} }]
            }
        });

        const text = refinedResponse.text || "[]";
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
    const cleanText = (text || "").trim();
    if (!cleanText) return "";

    const cachedUrl = await getCachedAudio(cleanText, language);
    if (cachedUrl) {
        try {
            const response = await fetch(cachedUrl);
            const buffer = await response.arrayBuffer();
            
            // Use a safer way to convert ArrayBuffer to base64 to avoid stack overflow
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        } catch (e) {
            console.error("Error loading cached audio:", e);
        }
    }

    const voiceName = VOICE_MAP[language] || 'Kore';
    const base64 = await handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Move personality instructions into the prompt for better stability with the TTS model
        const prompt = language === 'es' 
            ? `Actúa como Dai, una guía elegante y sarcástica con acento de España. Di esto de forma divertida y natural: ${cleanText}`
            : `Act as Dai, an elegant and sarcastic guide. Say this in a natural and engaging tone: ${cleanText}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
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
        saveAudioToCache(cleanText, language, base64, city).catch(err => console.error("Cache save failed", err));
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
