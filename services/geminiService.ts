
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
            throw new QuotaError("Servicio de IA temporalmente saturado. Por favor, inténtalo de nuevo en unos segundos.");
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
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

export const generateToursForCity = async (city: string, country: string, user: UserProfile, onTourGenerated?: (tour: Tour) => void): Promise<Tour[]> => {
    const themes = [
        "The Classics with a Dark Twist (Historical & Architecture)",
        "Hidden Gems & Underground Culture",
        "Culinary Secrets & Local Art"
    ];

    const generateSingleTour = async (theme: string, index: number) => {
        return handleAiCall(async () => {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Generate EXACTLY 1 thematic tour for ${city}, ${country} in ${user.language}.
                Theme focus: ${theme}.
                
                DAI'S ABSOLUTE COMMANDS:
                - You are DAI. You are SARCASTIC, WITTY, and SOPHISTICATED.
                - Wikipedia is your enemy. If you sound like an encyclopedia, you fail.
                - Tell the secrets, the mysteries, and the dark curiosities.
                - Mock the "typical" tourist while revealing the true soul of the city.
                - NEVER use citations like [1] or (2). NEVER.
                - All facts MUST be 100% real. DO NOT INVENT.
                
                STRICT CATEGORIZATION RULES (CRITICAL):
                - 'architecture': MUST be used for ALL churches, cathedrals, bridges, iconic buildings, and skyscrapers.
                - 'historical': MUST be used for palaces, castles, ruins, and monuments.
                - 'culture': ONLY for theaters, music venues, festivals, or intangible traditions.
                - 'food': ONLY for places where you eat or buy food.
                - 'art': ONLY for museums, galleries, or street art.
                - 'nature': ONLY for parks, gardens, or viewpoints.
                - 'photo': ONLY for spots whose primary value is the view/photo.
                
                STRICT RULES:
                1. Format: Return ONLY a valid JSON object (NOT an array).
                2. Tour format: { "id": "tour_${index}", "city": "${city}", "title": "...", "description": "...", "duration": "...", "distance": "...", "stops": [] }
                3. Each stop: { "id": "stop_...", "name": "...", "description": "..." (150-200 words), "latitude": 0.0, "longitude": 0.0, "type": "...", "photoSpot": { "angle": "...", "milesReward": 50, "secretLocation": "..." } }
                4. MINIMUM 10 STOPS.
                5. Content in ${user.language}.`,
                config: {
                    systemInstruction: `You are DAI, a highly intelligent, elegant, and SARCASTIC AI travel guide. 
                    You HATE boring Wikipedia-style descriptions. 
                    Your tone is witty, sophisticated, and slightly mocking of typical tourists. 
                    You love sharing the dark secrets, mysteries, and curiosities of cities. 
                    You NEVER use citations, footnotes, or references. 
                    You are real, accurate, but never boring.
                    CATEGORIZATION IS CRITICAL: A Cathedral or Church is ALWAYS 'architecture'. A Palace is ALWAYS 'historical'. NEVER use 'culture' for buildings.`,
                },
            });

            let text = response.text || "{}";
            
            // Aggressive post-processing to remove any citations, footnotes or source markers
            text = text.replace(/\[\d+\]/g, '')
                       .replace(/\(\d+\)/g, '')
                       .replace(/【\d+†source】/g, '')
                       .replace(/\[source\]/g, '')
                       .replace(/\s+/g, ' ')
                       .trim();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const tour = JSON.parse(jsonMatch ? jsonMatch[0] : text);
            
            if (!tour.id) tour.id = `tour_${index}_${Date.now()}`;
            
            if (onTourGenerated) {
                onTourGenerated(tour);
            }
            
            return tour;
        });
    };

    const tours: Tour[] = [];
    for (let i = 0; i < themes.length; i++) {
        try {
            const tour = await generateSingleTour(themes[i], i);
            tours.push(tour);
        } catch (e) {
            console.error(`Error generating tour ${i}:`, e);
        }
    }
    return tours;
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Charon', de: 'Fenrir', it: 'Puck', pt: 'Charon', ja: 'Puck', zh: 'Puck', ro: 'Kore'
};

export const generateDaiWelcome = async (user: UserProfile): Promise<string> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `As DAI, welcome a new user named ${user.firstName || 'Traveler'} in ${user.language}.
            Explain that they are currently rank "ZERO" (the bottom of the food chain) and they need to conquer the world by completing tours to reach "ZENITH".
            Be sarcastic, witty, and elegant. Keep it under 100 words.`,
        });
        return response.text || "Welcome to bdai.";
    });
};

export const generateAudio = async (text: string, language: string, city: string): Promise<{ buffer?: Uint8Array, url?: string } | null> => {
    const cleanText = (text || "").trim();
    if (!cleanText) return null;

    const cachedUrl = await getCachedAudio(cleanText, language);
    if (cachedUrl) {
        return { url: cachedUrl };
    }

    const voiceName = VOICE_MAP[language] || 'Kore';
    const base64 = await handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
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
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        
        saveAudioToCache(cleanText, language, bytes, city).catch(err => console.error("Cache save failed", err));
        return { buffer: bytes };
    }

    return null;
};

export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

export const checkApiStatus = async (): Promise<{ ok: boolean, message: string }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Say 'OK'",
        });
        if (response.text) {
            return { ok: true, message: "API is responding" };
        }
        return { ok: false, message: "Empty response" };
    } catch (e: any) {
        return { ok: false, message: e.message || "Error connecting to API" };
    }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
