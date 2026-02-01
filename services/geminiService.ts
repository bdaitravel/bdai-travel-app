
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
        const isRateLimit = e.message?.includes('429') || e.status === 429;
        const isNetworkError = e instanceof TypeError && e.message?.includes('fetch');
        
        if ((isRateLimit || isNetworkError) && retries > 0) {
            console.warn(`AI Call failed (${e.message}). Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
            return handleAiCall(fn, retries - 1, delay * 2);
        }
        throw e;
    }
}

export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Identify this city: "${input}". Return JSON array of objects with keys: name (English), spanishName (Spanish), country (English). If unsure, return empty array. Only use valid cities.`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    const langRule = `RESPOND IN ${user.language.toUpperCase()}.`;
    
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    });
};

export const generateSmartCaption = async (base64: string, stop: Stop, language: string): Promise<string> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { data: base64.split(',')[1], mimeType: 'image/jpeg' } },
                    { text: `Analiza esta foto. Se supone que ha sido tomada en ${stop.name} (${stop.type}). 
                    Si la foto NO coincide con el lugar, responde exactamente: "ERROR_LOCATION". 
                    Si la foto coincide, genera un pie de foto brillante, ingenioso y cínico al estilo Dai en ${language}. MAX 15 palabras.` }
                ]
            }
        });
        const result = response.text || "Capturing the moment.";
        if (result.includes("ERROR_LOCATION")) throw new Error("Verification failed");
        return result;
    });
};

export const moderateContent = async (content: string): Promise<boolean> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze if this message is appropriate for a public travel board. It must be safe for all audiences and contain no hate speech or harassment. Return exactly "SAFE" or "TOXIC". Message: "${content}"`,
        });
        const result = response.text?.trim().toUpperCase();
        return result === "SAFE";
    });
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
