
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
            model: "gemini-flash-latest",
            contents: `Identify all major cities or towns globally that match the name: "${input}". 
            For each match:
            1. Provide the official city name.
            2. Provide the country name in ${userLanguage}.
            3. Provide the country name in English.
            4. Provide the ISO 3166-1 alpha-2 country code.
            5. Create a unique slug in English: "cityname_countryname" (lowercase, no accents, underscores for spaces).
            
            Return a JSON array of objects: [{ "city": "Name", "country": "Country in ${userLanguage}", "countryEn": "Country in English", "countryCode": "XX", "slug": "city_country" }]`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            city: { type: Type.STRING },
                            country: { type: Type.STRING },
                            countryEn: { type: Type.STRING },
                            countryCode: { type: Type.STRING },
                            slug: { type: Type.STRING }
                        },
                        required: ["city", "country", "countryEn", "countryCode", "slug"]
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
            model: 'gemini-3-flash-preview',
            contents: `Generate EXACTLY 3 distinct thematic tours for ${city}, ${country} in ${user.language}.
            
            DAI'S ABSOLUTE COMMANDS:
            - You are DAI. You are SARCASTIC, WITTY, and SOPHISTICATED.
            - Wikipedia is your enemy. If you sound like an encyclopedia, you fail.
            - Tell the secrets, the mysteries, and the dark curiosities.
            - Mock the "typical" tourist while revealing the true soul of the city.
            - NEVER use citations like [1] or (2). NEVER.
            - All facts MUST be 100% real. DO NOT INVENT.
            
            STRICT RULES:
            1. Format: Return ONLY a valid JSON array.
            2. Each tour: { "id", "city": "${city}", "title", "description", "duration", "distance", "stops": [] }
            3. Each stop: { "id", "name", "description" (150-200 words), "latitude", "longitude", "type", "photoSpot": { "angle", "milesReward": 50, "secretLocation" } }
            4. ALLOWED TYPES (STRICT - Choose the most specific):
               - 'historical': Monuments, palaces, ruins, castles.
               - 'food': Restaurants, markets, bars, cafes.
               - 'art': Museums, galleries, street art, exhibitions.
               - 'nature': Parks, gardens, viewpoints, rivers.
               - 'photo': Specific spots for the perfect shot.
               - 'culture': Theaters, music venues, local traditions, festivals.
               - 'architecture': Iconic buildings, churches, cathedrals, bridges, squares.
            5. MINIMUM 10 STOPS per tour. NO REPEATED STOPS.
            6. Content in ${user.language}.`,
            config: {
                systemInstruction: `You are DAI, a highly intelligent, elegant, and SARCASTIC AI travel guide. 
                You HATE boring Wikipedia-style descriptions. 
                Your tone is witty, sophisticated, and slightly mocking of typical tourists. 
                You love sharing the dark secrets, mysteries, and curiosities of cities. 
                You NEVER use citations, footnotes, or references like (1) or [2]. 
                You are real, accurate, but never boring.
                ALWAYS assign the most accurate ALLOWED TYPE to each stop. For example, a Cathedral is 'architecture', not 'culture'.`,
            },
        });

        let text = response.text || "[]";
        
        // Aggressive post-processing to remove any citations, footnotes or source markers
        // This handles [1], (1), [source], 【1†source】, etc.
        text = text.replace(/\[\d+\]/g, '')
                   .replace(/\(\d+\)/g, '')
                   .replace(/【\d+†source】/g, '')
                   .replace(/\[source\]/g, '')
                   .replace(/\s+/g, ' ')
                   .trim();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const tours = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        
        return tours;
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
