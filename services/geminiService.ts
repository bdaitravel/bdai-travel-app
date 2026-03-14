import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

export class QuotaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QuotaError";
    }
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

const MODEL_FAST = "gemini-2.0-flash";
const MODEL_TTS  = "gemini-2.5-flash-preview-tts";
const MODEL_IMG  = "gemini-2.0-flash-exp";

const handleAiCall = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const errorMsg = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
        if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return handleAiCall(fn, retries - 1, delay * 2);
            }
            throw new QuotaError("Servicio de IA temporalmente saturado. Por favor, intentalo de nuevo.");
        }
        throw error;
    }
};

export const translateSearchQuery = async (input: string): Promise<{ english: string, detected: string }> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: "Identify the city/location in: \"" + input + "\". Return JSON: { \"english\": \"English city name\", \"detected\": \"language code\" }",
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
        return JSON.parse(response.text || "{\"english\": \"" + input + "\", \"detected\": \"unknown\"}");
    });
};

export const normalizeCityWithAI = async (input: string, userLanguage: string): Promise<any[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: "Find all cities globally matching: \"" + input + "\". For each: official city name, country in " + userLanguage + ", country in English, ISO alpha-2 code, slug city_country (lowercase, no accents). Return JSON array: [{ \"city\": \"\", \"country\": \"\", \"countryEn\": \"\", \"countryCode\": \"\", \"slug\": \"\" }]",
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
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: "Generate EXACTLY 3 distinct thematic tours for " + city + ", " + country + " in " + user.language + ". You are DAI: sarcastic, witty, sophisticated. Wikipedia is your enemy. Tell secrets and dark curiosities. NEVER use citations. All facts must be real. CATEGORIES: architecture=churches/cathedrals/bridges/buildings, historical=palaces/castles/ruins/monuments, culture=theaters/music/festivals, food=restaurants/markets, art=museums/galleries, nature=parks/gardens, photo=scenic spots. Return ONLY a valid JSON array. Each tour: { \"id\", \"city\": \"" + city + "\", \"title\", \"description\", \"duration\", \"distance\", \"stops\": [] }. Each stop: { \"id\", \"name\", \"description\" (150-200 words in " + user.language + "), \"latitude\", \"longitude\", \"type\", \"photoSpot\": { \"angle\", \"milesReward\": 50, \"secretLocation\" } }. MINIMUM 10 STOPS per tour.",
            config: {
                systemInstruction: "You are DAI, elegant and SARCASTIC AI travel guide. You HATE Wikipedia-style descriptions. You love dark secrets and city mysteries. NEVER use citations. Cathedral is ALWAYS architecture. Palace is ALWAYS historical.",
            },
        });

        let text = response.text || "[]";
        text = text.replace(/\[\d+\]/g, '').replace(/\(\d+\)/g, '').replace(/\s+/g, ' ').trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Charon', de: 'Fenrir', it: 'Puck', pt: 'Charon',
    ro: 'Kore', zh: 'Puck', ja: 'Puck', ru: 'Fenrir', ar: 'Kore', hi: 'Leda',
    ko: 'Puck', tr: 'Fenrir', pl: 'Charon', nl: 'Zephyr', ca: 'Kore', eu: 'Kore',
    vi: 'Leda', th: 'Leda'
};

export const generateDaiWelcome = async (user: UserProfile): Promise<string> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: "As DAI, welcome " + (user.firstName || 'Traveler') + " in " + user.language + ". They start at rank ZERO, must reach ZENITH. Be sarcastic and witty. Under 100 words.",
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
            const res = await fetch(cachedUrl);
            const buffer = await res.arrayBuffer();
            return new Uint8Array(buffer);
        } catch (e) {
            console.error("Error loading cached audio:", e);
        }
    }

    const voiceName = VOICE_MAP[language] || 'Kore';
    const base64 = await handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        const prompt = (language === 'es' || language === 'ca' || language === 'eu')
            ? "Actua como Dai, guia elegante y sarcastica. Di esto de forma divertida: " + cleanText
            : "Act as Dai, elegant sarcastic guide. Say this naturally: " + cleanText;

        const response = await ai.models.generateContent({
            model: MODEL_TTS,
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
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: "Translate to " + targetLanguage + ": " + JSON.stringify(tours) + ". Keep technical photo advice.",
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const moderateContent = async (text: string): Promise<boolean> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: "Is this text safe for a travel app? \"" + text + "\"",
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
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_IMG,
            contents: { parts: [{ text: "Travel postcard of " + city + ", cinematic, dark moody aesthetic" }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        const parts = response.candidates?.[0]?.content?.parts;
        const part = parts?.find((p: any) => p.inlineData);
        return part?.inlineData ? "data:image/png;base64," + part.inlineData.data : null;
    });
};
