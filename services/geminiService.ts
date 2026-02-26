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
        const errorMsg = JSON.stringify(error);
        if (errorMsg.includes("429") || errorMsg.includes("QUOTA") || errorMsg.includes("LIMIT")) {
            if (retries > 0) {
                await new Promise(r => setTimeout(r, delay));
                return handleAiCall(fn, retries - 1, delay * 2);
            }
            throw new QuotaError("Límite de API alcanzado.");
        }
        throw error;
    }
};

export const translateSearchQuery = async (input: string): Promise<{ english: string, detected: string }> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash-latest",
            contents: `Identify city: "${input}". Return JSON: {"english": "City Name", "detected": "es"}`
        });
        return JSON.parse(response.text || '{"english": "' + input + '", "detected": "unknown"}');
    });
};

export const normalizeCityWithAI = async (input: string, userLanguage: string): Promise<any[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash-latest",
            contents: `Identify all cities matching "${input}". Return a JSON array: [{"city": "Name", "country": "Country", "countryCode": "XX", "slug": "city_country", "lat": 0.0, "lng": 0.0}]`
        });
        return JSON.parse(response.text || '[]');
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile, coords?: { lat: number, lng: number }, maxTours: number = 1): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash-latest',
            contents: `Eres DAI, una guía de viajes inteligente, sarcástica, elegante y algo elitista. 
            Tu misión es generar ${maxTours} tour para ${city}, ${country} en ${user.language}.

            REGLAS DE ORO:
            1. DATOS REALES: Prohibido inventar datos. Hechos históricos y culturales VERÍDICOS.
            2. NO WIKIPEDIA: Nada de textos genéricos ni referencias tipo (1).
            3. PERSONALIDAD: Sé ingeniosa, chismosa y cínica. Cuéntame el "lado B".
            4. EXTENSIÓN: Cada parada debe tener 350 palabras de alta calidad narrativa.
            
            FORMATO JSON: [{"id": 1, "city": "${city}", "title": "Tour", "description": "Resumen", "stops": [{"name": "Lugar Real", "description": "350 palabras", "latitude": 0, "longitude": 0, "type": "culture", "photoSpot": {"angle": "45deg", "milesReward": 100, "secretLocation": true}}]}]`
        });
        const text = response.text || "[]";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const tours = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
        return tours.map((t: any) => ({ ...t, city }));
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Charon', de: 'Fenrir', it: 'Puck', pt: 'Charon', ja: 'Puck', zh: 'Puck', ro: 'Kore'
};

export const generateSpeech = async (text: string, language: string, city: string): Promise<string> => {
    const cleanText = (text || "").trim();
    if (!cleanText) return "";
    const cached = await getCachedAudio(cleanText, language);
    if (cached) return cached;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = language === 'es' 
        ? `Actúa como Dai, guía elegante y sarcástica con acento de ESPAÑA (castellano): ${cleanText}`
        : `Act as Dai, elegant guide: ${cleanText}`;

    const response = await ai.models.generateContent({
        model: "gemini-1.5-flash-latest",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_MAP[language] || 'Kore' } }
            }
        }
    });
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (base64) saveAudioToCache(cleanText, language, base64, city).catch(() => {});
    return base64;
};

export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash-latest',
            contents: `Translate to ${targetLanguage}: ${JSON.stringify(tours)}`
        });
        return JSON.parse(response.text || "[]");
    });
};

export const generateDaiWelcome = async (user: UserProfile): Promise<string> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash-latest",
            contents: `Welcome ${user.firstName} to bdai in ${user.language}. Be sarcastic.`
        });
        return response.text || "Welcome.";
    });
};

export const moderateContent = async (text: string): Promise<boolean> => {
    return true;
};

export const generateCityPostcard = async (city: string, interests: string[] = []): Promise<string | null> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash-latest',
            contents: [{ parts: [{ text: `Postcard of ${city}` }] }]
        });
        const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
    });
};
