
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

const PHOTO_SPOT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        angle: { 
            type: Type.STRING, 
            description: "Expert photography advice: Technical settings (ISO, Aperture) and specific artistic framing for THIS stop." 
        },
        milesReward: { type: Type.NUMBER },
        secretLocation: { 
            type: Type.STRING, 
            description: "Precise description of a hidden spot or unique perspective to photograph this monument." 
        }
    },
    required: ["angle", "milesReward", "secretLocation"]
};

const STOP_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        description: { type: Type.STRING, description: "Detailed narrative of minimum 450 words including history, engineering and secrets." },
        latitude: { type: Type.NUMBER },
        longitude: { type: Type.NUMBER },
        type: { type: Type.STRING },
        photoSpot: PHOTO_SPOT_SCHEMA
    },
    required: ["id", "name", "description", "latitude", "longitude", "photoSpot"]
};

const TOUR_SCHEMA = {
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
            items: STOP_SCHEMA,
            description: "List of stops for the tour. Essential tour MUST have exactly 10 stops."
        }
    },
    required: ["id", "city", "title", "description", "stops"]
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const userPersonaContext = `The user is ${user.age} years old and interested in ${user.interests.join(', ') || 'general history and culture'}.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `As a charismatic, world-class "Free Tour" Guide with a passion for storytelling and deep knowledge in history and engineering, generate 3 unique tours for ${city}, ${country} in ${user.language}.
            
            ${userPersonaContext}

            STRICT RULES:
            1. PERSONA: Write like a vibrant local guide. Use an engaging, conversational, and slightly irreverent tone. Tell stories, not just facts.
            2. STRUCTURE: The FIRST tour MUST be marked as 'isEssential: true' and MUST HAVE EXACTLY 10 STOPS.
            3. CONTENT: Each stop description MUST exceed 450 words. Focus on engineering secrets, historical "salseo" (gossip), and hidden details that a normal tourist would miss.
            4. ADAPTATION: Tailor the narrative to the user's interests (${user.interests.join(', ')}) and age (${user.age}).
            5. PHOTOGRAPHY: Each 'photoSpot' MUST be specific, providing professional technical advice for the perfect shot.
            6. SMALL TOWNS: If the city is small, find 10 fascinating points of interest even if they are micro-details or local legends.
            7. LANGUAGE: ALL CONTENT MUST BE IN ${user.language}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: TOUR_SCHEMA
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const generateThematicTour = async (city: string, country: string, theme: string, user: UserProfile): Promise<Tour> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Generate ONE thematic "Free Tour" style adventure for ${city}, ${country} with theme: "${theme}". 
            Persona: Charismatic local expert. Minimum 8 stops. Detailed, story-driven descriptions in ${user.language}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: TOUR_SCHEMA
            }
        });
        return JSON.parse(response.text || "{}");
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Stella', de: 'Casper', it: 'Bella', pt: 'Stella', ja: 'Puck', zh: 'Puck', ro: 'Kore'
};

export const generateAudio = async (text: string, language: string, city: string): Promise<string> => {
    const voiceName = VOICE_MAP[language] || 'Kore';
    return handleAiCall(async () => {
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
};

export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following tours to ${targetLanguage}: ${JSON.stringify(tours)}. 
            Maintain the "Free Tour Guide" charismatic tone and technical photo advice.`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const standardizeCityName = async (input: string) => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Identify the most likely cities matching "${input}". Return a JSON array.`,
            config: { 
                tools: [{ googleSearch: {} }], 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            spanishName: { type: Type.STRING },
                            country: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const moderateContent = async (text: string): Promise<boolean> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze if this text is safe for a travel community: "${text}"`,
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
            contents: { parts: [{ text: `A vibrant, high-quality travel postcard of ${city} highlighting ${interests.join(', ') || 'landmarks'} in a cinematic style.` }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part ? `data:image/png;base64,${part.inlineData.data}` : null;
    });
};
