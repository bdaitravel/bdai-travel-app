import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

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

export const translateSearchQuery = async (input: string): Promise<{ english: string, detected: string }> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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

export const normalizeCityWithAI = async (input: string, userLanguage: string): Promise<any[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The user typed: "${input}" in language "${userLanguage}" and is looking for a city or town to visit.

RULES:
- Correct any typos (e.g. "florensia" → Florence, "barcelon" → Barcelona, "madri" → Madrid).
- Recognize city/town names in ANY language and translate to English internally.
  Examples: "Londres"=London UK, "Florencia"=Florence Italy, "Londra"=London UK, "Nueva York"=New York USA, "倫敦"=London UK, "لندن"=London UK
- If the name is ambiguous and could be multiple places, return ALL of them (up to 5).
  Example: "London" → London UK, London Ontario Canada, London Ohio USA
  Example: "Florence" → Florence Italy, Florence Alabama USA, Florence South Carolina USA
  Example: "Santiago" → Santiago Chile, Santiago de Compostela Spain
- Return between 1 and 5 results, most famous/relevant first.

For each result return:
- "cityEn": Official city name in ENGLISH ONLY. Never use accents or local language names.
- "cityLocal": City name translated to "${userLanguage}". If no translation exists, use English.
- "country": Country name in "${userLanguage}".
- "countryEn": Country name in ENGLISH ONLY (e.g. "Italy", "United Kingdom", "United States").
- "countryCode": 2-letter ISO country code in UPPERCASE (e.g. "IT", "GB", "US", "ES").

CRITICAL: cityEn and countryEn MUST always be in English. Never use Spanish, French, or any other language for these two fields.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            cityEn:      { type: Type.STRING },
                            cityLocal:   { type: Type.STRING },
                            country:     { type: Type.STRING },
                            countryEn:   { type: Type.STRING },
                            countryCode: { type: Type.STRING },
                        },
                        required: ["cityEn", "cityLocal", "country", "countryEn", "countryCode"]
                    }
                }
            }
        });

        const raw = JSON.parse(response.text || '[]');
        return raw.map((r: any) => ({
            city: r.cityEn,
            cityLocal: r.cityLocal || r.cityEn,
            country: r.country,
            countryEn: r.countryEn,
            countryCode: r.countryCode,
            // El slug siempre se genera desde inglés — nunca desde lo que escribió el usuario
            slug: normalizeKey(r.cityEn, r.countryEn),
            fullName: r.cityLocal || r.cityEn
        }));
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile, onProgress?: (tour: Tour) => void): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate EXACTLY 3 distinct thematic tours for ${city}, ${country} in ${user.language}.
            
            THEMES:
            1. "Hidden Gems & Dark Secrets"
            2. "Historical & Architectural Marvels"
            3. "Local Culture, Art & Food"
            
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
            1. Format: Return ONLY a valid JSON array containing exactly 3 tour objects.
            2. Tour object: { "id", "city": "${city}", "title", "description", "duration", "distance", "theme", "stops": [] }
            3. Each stop: { "id", "name", "description" (200-300 words), "latitude", "longitude", "type", "photoSpot": { "angle", "milesReward": 50, "secretLocation" } }
            5. DO NOT REPEAT ANY STOPS ACROSS THE 3 TOURS.
            6. Content in ${user.language}.`,
            config: {
                systemInstruction: `You are DAI, a highly intelligent, elegant, and SARCASTIC AI travel guide. 
                You HATE boring Wikipedia-style descriptions. 
                Your tone is witty, sophisticated, and slightly mocking of typical tourists. 
                You love sharing the dark secrets, mysteries, and curiosities of cities. 
                You NEVER use citations, footnotes, or references. 
                You are real, accurate, but never boring.
                CATEGORIZATION IS CRITICAL: A Cathedral or Church is ALWAYS 'architecture'. A Palace is ALWAYS 'historical'. NEVER use 'culture' for buildings.`,
                responseMimeType: "application/json"
                COORDINATES: Always provide real, accurate GPS coordinates for each stop. Each stop must be in a different location within the city. Never repeat coordinates.
            },
        });

        let text = response.text || "[]";
        text = text.replace(/\[\d+\]/g, '')
                   .replace(/\(\d+\)/g, '')
                   .replace(/【\d+†source】/g, '')
                   .replace(/\[source\]/g, '')
                   .replace(/\s+/g, ' ')
                   .trim();

        let tours: Tour[] = [];
        try {
            tours = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse tours JSON", e);
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) tours = JSON.parse(jsonMatch[0]);
        }
        
        if (Array.isArray(tours)) {
            tours.forEach(tour => { if (onProgress) onProgress(tour); });
            return tours.filter(t => t && t.stops && t.stops.length > 0);
        }
        
        return [];
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Charon', de: 'Fenrir', it: 'Puck', pt: 'Charon', ja: 'Puck', zh: 'Puck', ro: 'Kore'
};

export const generateDaiWelcome = async (user: UserProfile): Promise<string> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `As DAI, welcome a new user named ${user.firstName || 'Traveler'} in ${user.language}.
            Explain that they are currently rank "ZERO" (the bottom of the food chain) and they need to conquer the world by completing tours to reach "ZENITH".
            Be sarcastic, witty, and elegant. Keep it under 100 words.`,
        });
        return response.text || "Welcome to bdai.";
    });
};

export const generateAudio = async (text: string, language: string, city: string): Promise<Uint8Array | null> => {
    const cleanText = (text || "").trim();
    if (!cleanText) return null;

    const cachedUrl = await getCachedAudio(cleanText, language);
    if (cachedUrl) {
        try {
            const response = await fetch(cachedUrl);
            const buffer = await response.arrayBuffer();
            return new Uint8Array(buffer);
        } catch (e) {
            console.error("Error loading cached audio:", e);
        }
    }

    const voiceName = VOICE_MAP[language] || 'Kore';
    const base64 = await handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
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
        return bytes;
    }

    return null;
};

export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
            model: "gemini-2.5-flash",
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
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Say 'OK'",
        });
        if (response.text) return { ok: true, message: "API is responding" };
        return { ok: false, message: "Empty response" };
    } catch (e: any) {
        return { ok: false, message: e.message || "Error connecting to API" };
    }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: { parts: [{ text: `Postcard of ${city}` }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        const parts = response.candidates?.[0]?.content?.parts;
        const part = parts?.find((p: any) => p.inlineData);
        return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
    });
};

