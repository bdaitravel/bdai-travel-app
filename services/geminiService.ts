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

export const generateToursForCity = async (
    city: string,
    country: string,
    user: UserProfile,
    onTourGenerated?: (tour: Tour) => void
): Promise<Tour[]> => {
    const themes = [
        "The Classics with a Dark Twist (Historical and Architecture)",
        "Hidden Gems and Underground Culture",
        "Culinary Secrets and Local Art"
    ];

    const generateSingleTour = async (theme: string, index: number): Promise<Tour> => {
        return handleAiCall(async () => {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: MODEL_FAST,
                contents: "Generate EXACTLY 1 thematic tour for " + city + ", " + country + " in " + user.language + ". Theme: " + theme + ". You are DAI: sarcastic, witty, sophisticated. Wikipedia is your enemy. Tell secrets and dark curiosities. NEVER use citations. All facts must be real. CATEGORIES: architecture=churches/cathedrals/bridges/buildings, historical=palaces/castles/ruins/monuments, culture=theaters/music/festivals, food=restaurants/markets, art=museums/galleries, nature=parks/gardens, photo=scenic spots. Return ONLY a valid JSON object (not array). Format: { \"id\": \"tour_" + index + "\", \"city\": \"" + city + "\", \"title\": \"\", \"description\": \"\", \"duration\": \"\", \"distance\": \"\", \"stops\": [] }. Each stop: { \"id\": \"\", \"name\": \"\", \"description\": \"\" (150-200 words in " + user.language + "), \"latitude\": 0.0, \"longitude\": 0.0, \"type\": \"\", \"visited\": false, \"photoSpot\": { \"angle\": \"\", \"milesReward\": 50, \"secretLocation\": \"\" } }. MINIMUM 10 STOPS.",
                config: {
                    systemInstruction: "You are DAI, elegant and SARCASTIC AI travel guide. You HATE Wikipedia-style descriptions. You love dark secrets and city mysteries. NEVER use citations. Cathedral is ALWAYS architecture. Palace is ALWAYS historical.",
                },
            });

            let text = response.text || "{}";
            text = text.replace(/\[\d+\]/g, '').replace(/\(\d+\)/g, '').replace(/```json|```/g, '').trim();
            const match = text.match(/\{[\s\S]*\}/);
            const tour: Tour = JSON.parse(match ? match[0] : text);
            if (!tour.id) tour.id = "tour_" + index + "_" + Date.now();
            if (onTourGenerated) onTourGenerated(tour);
            return tour;
        });
    };

    const results = await Promise.allSettled(
        themes.map((theme, i) => generateSingleTour(theme, i))
    );

    const tours = results
        .filter((r): r is PromiseFulfilledResult<Tour> => r.status === 'fulfilled')
        .map(r => r.value);

    if (tours.length === 0) throw new Error("No se pudieron generar los tours. Intentalo de nuevo.");
    return tours;
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

export const generateAudio = async (text: string, language: string, city: string): Promise<{ buffer?: Uint8Array, url?: string } | null> => {
    const cleanText = (text || "").trim();
    if (!cleanText) return null;

    // Check Supabase cache first
    try {
        const cachedUrl = await getCachedAudio(cleanText, language);
        if (cachedUrl) return { url: cachedUrl };
    } catch (e) {
        console.warn("[Audio] Cache check failed:", e);
    }

    const voiceName = VOICE_MAP[language] || 'Kore';
    let base64 = "";
    try {
        base64 = await handleAiCall(async () => {
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
    } catch (e) {
        console.error("[Audio] Generation failed:", e);
        return null;
    }

    if (!base64) return null;

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

    try {
        await saveAudioToCache(cleanText, language, bytes, city);
    } catch (e) {
        console.error("[Audio] Cache save failed:", e);
    }

    return { buffer: bytes };
};

export const checkApiStatus = async (): Promise<{ ok: boolean, message: string }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: MODEL_FAST,
            contents: "Reply with just the word OK",
        });
        return response.text
            ? { ok: true, message: "API responding" }
            : { ok: false, message: "Empty response" };
    } catch (e: any) {
        return { ok: false, message: e.message || "API error" };
    }
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
