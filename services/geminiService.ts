
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor analítico de BDAI. Tu misión es generar TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, brillante, hiper-detallista, experto en ingeniería y anécdotas reales.
FOCO: 1. Ingeniería y Retos Técnicos. 2. Historia Oculta/Conspiraciones. 3. Salseo Humano Real.
DENSIDAD: Necesitamos descripciones ricas y técnicas (aprox 200-250 palabras por parada).
REGLA: Usa tipos: 'historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'.
`;

async function handleAiCall<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (e: any) {
        if ((e.message?.includes('429') || e.status === 429) && retries > 0) {
            console.warn(`Rate limit hit (429). Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
            return handleAiCall(fn, retries - 1, delay * 2);
        }
        throw e;
    }
}

export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    // Initializing GoogleGenAI with the required named parameter and environment API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Identify this city: "${input}". Return JSON array of objects with keys: name (English), spanishName (Spanish), country (English). If unsure, return empty array. Only use valid cities.`,
            config: { responseMimeType: "application/json" }
        });
        // Accessing the .text property directly as per guidelines.
        return JSON.parse(response.text || "[]");
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const langRule = `RESPOND IN ${user.language.toUpperCase()}.`;
    
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `${MASTERCLASS_INSTRUCTION} ${langRule} \n\n Generate 2 unique tours for ${city}, ${country}. Each tour must have exactly 10 stops. Output as JSON array of Tour objects. Ensure long, technical descriptions.`,
            config: { responseMimeType: "application/json" }
        });
        const tours = JSON.parse(response.text || "[]");
        return tours.map((t: any, i: number) => ({
            ...t,
            id: `tour_${city}_${i}_${Date.now()}`,
            city,
            stops: t.stops.map((s: any, j: number) => ({ ...s, id: `stop_${city}_${i}_${j}_${Date.now()}`, visited: false }))
        }));
    });
};

export const generateAudio = async (text: string, language: string): Promise<string | null> => {
    const cacheKey = `audio_${text.slice(0, 30)}_${language}`;
    const cached = await getCachedAudio(cacheKey);
    if (cached) return cached;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text.slice(0, 500) }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
            },
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        if (base64) await saveAudioToCache(cacheKey, base64);
        return base64;
    } catch (e) {
        console.error("TTS Error", e);
        return null;
    }
};

export const generateSmartCaption = async (base64: string, stop: Stop, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { data: base64.split(',')[1], mimeType: 'image/jpeg' } },
                    { text: `Based on this photo taken at ${stop.name} (${stop.type}), generate a smart, witty caption for a traveler's log in ${language}. MAX 15 words.` }
                ]
            }
        });
        return response.text || "Capturing the moment.";
    });
};

// Fix: Added moderateContent to filter community posts for safety
export const moderateContent = async (content: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze if this message is appropriate for a public travel board. It must be safe for all audiences and contain no hate speech or harassment. Return exactly "SAFE" or "TOXIC". Message: "${content}"`,
        });
        const result = response.text?.trim().toUpperCase();
        return result === "SAFE";
    });
};

// Fix: Added generateCityPostcard using the gemini-2.5-flash-image model
export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        text: `A cinematic, high-quality travel postcard for ${city} highlighting interests like ${interests.join(', ')}. Artistic, vibrant, and evocative of discovery.`,
                    },
                ],
            },
            config: {
                imageConfig: {
                    aspectRatio: "9:16",
                },
            },
        });
        
        // Iterate through all parts to find the image part as recommended.
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64EncodeString: string = part.inlineData.data;
                    return `data:image/png;base64,${base64EncodeString}`;
                }
            }
        }
        return null;
    });
};

// Fix: Added translateTours for massive translation in AdminPanel
export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Translate the following array of tour objects to ${targetLang}. Maintain the persona of "Dai" (technical, cynical, detailed). Return the result as a valid JSON array of Tour objects. Tours: ${JSON.stringify(tours)}`,
            config: {
                responseMimeType: "application/json"
            }
        });
        return JSON.parse(response.text || "[]");
    });
};
