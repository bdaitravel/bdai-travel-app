
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

export class QuotaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QuotaError";
    }
}

const safeJsonParse = (text: string, fallback: any = null) => {
    if (!text) return fallback;
    
    // 1. Try direct parse
    try {
        return JSON.parse(text);
    } catch (e) {}

    // 2. Clean markdown and try again
    let cleanText = text.trim();
    cleanText = cleanText.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {}

    // 3. Extract by boundaries
    try {
        const startObj = cleanText.indexOf('{');
        const endObj = cleanText.lastIndexOf('}');
        const startArr = cleanText.indexOf('[');
        const endArr = cleanText.lastIndexOf(']');
        
        let start = -1;
        let end = -1;
        
        // Determine if we should look for an object or an array first
        if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
            start = startArr;
            end = endArr;
        } else if (startObj !== -1) {
            start = startObj;
            end = endObj;
        }
        
        if (start !== -1 && end !== -1 && end > start) {
            const extracted = cleanText.substring(start, end + 1);
            return JSON.parse(extracted);
        }
    } catch (e) {
        console.error("Aggressive JSON parse failed. Original text length:", text.length);
    }
    
    return fallback;
};

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
        return safeJsonParse(response.text || "", { english: input, detected: "unknown" });
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
        return safeJsonParse(response.text || "", []);
    });
};

export const generateSpeech = async (text: string, language: string, city: string): Promise<string | null> => {
    const cleanText = (text || "").trim().substring(0, 3000); // Truncate to avoid model limits
    if (!cleanText) return null;

    return handleAiCall(async () => {
        // Check cache first
        const cached = await getCachedAudio(cleanText, language);
        console.log("Audio cache check for text:", cleanText.substring(0, 30) + "...", "Result:", cached ? "FOUND" : "NOT FOUND");
        if (cached) return cached;

        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const voiceName = VOICE_MAP[language] || 'Kore';
        const prompt = language === 'es' 
            ? `Actúa como Dai, una guía de viajes de IA elegante, sarcástica y sofisticada con acento de España. Lee esto con ritmo natural y tono cautivador: ${cleanText}`
            : `Act as Dai, an elegant, sarcastic, and sophisticated AI travel guide. Read this with natural rhythm and a captivating tone: ${cleanText}`;

        try {
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
            
            const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            const base64 = part?.inlineData?.data;
            
            console.log("Gemini TTS response received. Base64 length:", base64?.length || 0);
            if (base64) {
                const dataUrl = `data:audio/mp3;base64,${base64}`;
                // Save to cache in background
                saveAudioToCache(cleanText, language, base64, city).catch(e => console.error("Cache save failed:", e));
                return dataUrl;
            }
            console.error("No audio data in response parts:", response.candidates?.[0]?.content?.parts);
            return null;
        } catch (ttsError) {
            console.error("TTS Generation Error:", ttsError);
            throw ttsError;
        }
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
            4. Each stop description: 300-450 words. Focus on history, curiosities, culture, and gastronomy.
            5. Assign a 'type' from this list ONLY: 'historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'.
            6. Each stop MUST have a 'photoSpot' object with 'angle', 'milesReward' (10-50), and 'secretLocation'.
            7. Format: Return ONLY a valid JSON array of tours. NO PREAMBLE, NO MARKDOWN, NO CODE BLOCKS.
            8. Each tour: { "id", "city", "title", "description", "duration", "distance", "stops": [] }
            9. Each stop: { "id", "name", "description", "latitude", "longitude", "type", "photoSpot" }
            10. ALL CONTENT IN ${user.language}.
            11. NO CITATIONS: Do not include any reference numbers like [1], (1), [2], etc.
            12. ORIGINAL CONTENT: Do not copy verbatim from Wikipedia; use a unique, engaging, and sophisticated tone.
            13. QUALITY: Each stop description must be at least 300 words long.`,
            config: {
                tools: [{ googleMaps: {} }],
            },
        });

        const text = response.text || "[]";
        return safeJsonParse(text, []);
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
            contents: `Translate to ${targetLanguage}: ${JSON.stringify(tours)}. Keep technical photo advice. Return ONLY the JSON array.`,
            config: { responseMimeType: "application/json" }
        });
        return safeJsonParse(response.text || "", []);
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
        return safeJsonParse(response.text || "", { isSafe: false }).isSafe;
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
